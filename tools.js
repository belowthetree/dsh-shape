/**
 * Shape development tools. This plugin is mounted only by the Shape Studio
 * agent preset, so its tools remain invisible to every other preset.
 */

import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'

export const name = 'dsh-shape-tools'
export const inject = ['tools']

const SHAPE_ID = /^[a-z0-9][a-z0-9-]*$/
const VERSION_RANGE = /^[\^~]?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/

/**
 * Resolve the writable shape directory.
 * @param config - optional plugin config with a `dir` override.
 * @returns absolute shape root.
 */
function shapeRoot(config) {
  if (typeof config?.dir === 'string' && config.dir.trim() !== '') return path.resolve(config.dir)
  return path.join(process.env.DSH_HOME ?? path.join(homedir(), '.dsh'), 'dsh-shape', 'shapes')
}

/**
 * Read a shape package manifest.
 * @param dir - shape directory.
 * @returns parsed package.json, or an Error string.
 */
async function readManifest(dir) {
  try {
    return JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
  } catch (cause) {
    return cause instanceof Error ? cause.message : String(cause)
  }
}

/**
 * Inspect one shape directory without relying on the dsh-shape host scanner.
 * @param dir - shape directory.
 * @returns compact metadata and validation messages.
 */
async function inspectShape(dir) {
  const id = path.basename(dir)
  const manifest = await readManifest(dir)
  if (typeof manifest === 'string') return { id, valid: false, errors: [manifest], warnings: [] }
  const files = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const subdirs = new Set(files.filter(entry => entry.isDirectory()).map(entry => entry.name))
  const shape = manifest.shape
  const errors = []
  const warnings = []
  if (manifest.name !== id) errors.push(`package name should be "${id}"`)
  if (typeof manifest.title !== 'string' || manifest.title.trim() === '') warnings.push('missing title')
  if (shape === null || typeof shape !== 'object' || Array.isArray(shape)) {
    errors.push('missing shape object')
  } else {
    if (shape.apiVersion !== 1) errors.push('shape.apiVersion must be 1')
    if (shape.requires !== undefined && !Array.isArray(shape.requires)) errors.push('shape.requires must be an array')
    for (const requirement of shape.requires ?? []) {
      if (typeof requirement?.plugin !== 'string' || requirement.plugin === '') errors.push('requirement plugin is required')
      if (typeof requirement?.capability !== 'string' || requirement.capability === '') errors.push('requirement capability is required')
      if (typeof requirement?.version !== 'string' || !VERSION_RANGE.test(requirement.version)) {
        errors.push(`requirement version is not a semver range: ${String(requirement?.version)}`)
      }
    }
  }
  if (!subdirs.has('views')) warnings.push('no views/ directory')
  if (!subdirs.has('slots')) warnings.push('no slots/ directory')
  return {
    id,
    valid: errors.length === 0,
    errors,
    warnings,
    ...(typeof manifest.title === 'string' ? { title: manifest.title } : {}),
    ...(typeof manifest.version === 'string' ? { version: manifest.version } : {}),
    ...(Array.isArray(shape?.requires) ? { requirements: shape.requires } : {}),
    ...(subdirs.has('client') ? { clientEntry: 'client/index.js' } : {}),
  }
}

/**
 * List shape directories.
 * @param root - shape root.
 * @returns shape metadata.
 */
async function listShapes(root) {
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    return []
  }
  const shapes = []
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    shapes.push(await inspectShape(path.join(root, entry.name)))
  }
  return shapes.sort((left, right) => left.id.localeCompare(right.id))
}

/**
 * Build a minimal shape package.
 * @param args - validated tool arguments.
 * @param root - shape root.
 * @returns created path and file list.
 */
async function scaffold(args, root) {
  if (!SHAPE_ID.test(args.id)) throw new Error('shape id must be lowercase letters, digits, and hyphens')
  const dir = path.join(root, args.id)
  try {
    await stat(dir)
    throw new Error(`shape already exists: ${args.id}`)
  } catch (cause) {
    if (cause instanceof Error && cause.message.startsWith('shape already exists')) throw cause
  }
  await mkdir(path.join(dir, 'views'), { recursive: true })
  await mkdir(path.join(dir, 'slots'), { recursive: true })
  const manifest = {
    name: args.id,
    version: '0.1.0',
    title: args.title,
    description: args.description,
    output: 'text',
    shape: {
      apiVersion: 1,
      requires: [{ plugin: 'dsh-shape', capability: 'core', version: '^1.0.0' }],
    },
  }
  const files = ['package.json', 'views/index.html', 'slots/chat-card.json']
  await writeFile(path.join(dir, 'package.json'), `${JSON.stringify(manifest, null, 2)}\n`)
  await writeFile(path.join(dir, 'views', 'index.html'), `<!doctype html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>${args.title}</title></head>
<body><h1>${args.title}</h1><p>${args.description}</p></body>
</html>
`)
  await writeFile(path.join(dir, 'slots', 'chat-card.json'), `${JSON.stringify({
    slot: 'conversation.input.dock',
    title: args.title,
    text: args.description,
    button: '开始',
    greeting: args.title,
  }, null, 2)}\n`)
  if (args.withClient === true) {
    await mkdir(path.join(dir, 'client'), { recursive: true })
    await writeFile(path.join(dir, 'client', 'index.js'), `export function activate(api) {
  console.info('shape activated:', api.shape.id)
}
`)
    files.push('client/index.js')
  }
  return { path: dir, files }
}

/**
 * Validate a shape directory.
 * @param id - shape id.
 * @param root - shape root.
 * @returns validation result.
 */
async function validate(id, root) {
  if (!SHAPE_ID.test(id)) throw new Error('shape id must be lowercase letters, digits, and hyphens')
  const result = await inspectShape(path.join(root, id))
  return {
    valid: result.valid,
    errors: result.errors ?? [],
    warnings: result.warnings ?? [],
    requirements: result.requirements ?? [],
  }
}

/**
 * Register the shape development tool set.
 * @param ctx - preset-scoped Host context.
 * @param config - optional `dir` override.
 */
export function apply(ctx, config) {
  const root = shapeRoot(config)

  ctx.effect(() => ctx.tools.register({
    name: 'shape_list',
    description: 'List dsh-shape shapes, their capability requirements, and validation warnings.',
    parameters: { type: 'object', additionalProperties: false, properties: {} },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['root', 'shapes'],
        properties: {
          root: { type: 'string' },
          shapes: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'valid', 'errors', 'warnings'],
              properties: {
                id: { type: 'string' },
                title: { type: 'string' },
                version: { type: 'string' },
                valid: { type: 'boolean' },
                errors: { type: 'array', items: { type: 'string' } },
                warnings: { type: 'array', items: { type: 'string' } },
                requirements: { type: 'array', items: { type: 'object', additionalProperties: true } },
                clientEntry: { type: 'string' },
              },
            },
          },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.shapes.length === 0
          ? `No shapes in ${value.root}.`
          : `${value.shapes.length} shape(s) in ${value.root}:\n${value.shapes.map(shape => `- ${shape.id}${shape.valid ? '' : ' (invalid)'}${shape.errors.length ? `: ${shape.errors.join('; ')}` : ''}`).join('\n')}`,
      }],
    },
    async execute() {
      return { root, shapes: await listShapes(root) }
    },
  }), 'dsh-shape: shape_list tool')

  ctx.effect(() => ctx.tools.register({
    name: 'shape_scaffold',
    description: 'Create a new folder-based dsh-shape shape with package.json, a view, and a chat card. Does not overwrite existing shapes.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['id', 'title', 'description'],
      properties: {
        id: { type: 'string', description: 'Kebab-case shape id; becomes the folder and package name.' },
        title: { type: 'string', description: 'Display title.' },
        description: { type: 'string', description: 'Short user-facing description.' },
        withClient: { type: 'boolean', description: 'Also create client/index.js for activation logic.' },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['path', 'files'],
        properties: {
          path: { type: 'string' },
          files: { type: 'array', items: { type: 'string' } },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `Created ${value.path}\n${value.files.map(file => `- ${file}`).join('\n')}`,
      }],
    },
    async execute(args) {
      return scaffold(args, root)
    },
  }), 'dsh-shape: shape_scaffold tool')

  ctx.effect(() => ctx.tools.register({
    name: 'shape_validate',
    description: 'Validate a shape manifest, capability requirements, and required views/slots directories.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Shape id to validate.' },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['valid', 'errors', 'warnings', 'requirements'],
        properties: {
          valid: { type: 'boolean' },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
          requirements: { type: 'array', items: { type: 'object', additionalProperties: true } },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.valid
          ? `Shape is valid.${value.warnings.length ? ` Warnings: ${value.warnings.join('; ')}` : ''}`
          : `Shape is invalid:\n${value.errors.map(error => `- ${error}`).join('\n')}`,
      }],
    },
    async execute(args) {
      return validate(args.id, root)
    },
  }), 'dsh-shape: shape_validate tool')
}
