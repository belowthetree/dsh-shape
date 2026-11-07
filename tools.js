/**
 * Shape development tools. This plugin is mounted only by the Shape Studio
 * agent preset, so its tools remain invisible to every other preset.
 */

import { mkdir, readFile, readdir, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

export const name = 'dsh-shape-tools'
export const inject = ['tools']

const SHAPE_ID = /^[a-z0-9][a-z0-9-]*$/
const VERSION_RANGE = /^[\^~]?\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/
const BUNDLED_ROOT = fileURLToPath(new URL('./shapes/', import.meta.url))
const PACKAGE_ROOT = fileURLToPath(new URL('./', import.meta.url))
const REFERENCE_ROOT = fileURLToPath(new URL('./skills/shape-development/reference/', import.meta.url))
const SPEC_TOPICS = [
  'overview',
  'manifest',
  'capabilities',
  'client',
  'slots',
  'views',
  'lifecycle',
  'testing',
  'plugin',
]
const CAPABILITY_FILE = path.join(
  process.env.DSH_HOME ?? path.join(homedir(), '.dsh'),
  'dsh-shape',
  'capabilities.json',
)
const CLIENT_CODE_LIMIT = 16000

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
 * List regular files in a directory.
 * @param dir - directory to read.
 * @returns sorted file names, or an empty list when absent.
 */
async function listFiles(dir) {
  try {
    const entries = await readdir(dir, { withFileTypes: true })
    return entries.filter(entry => entry.isFile()).map(entry => entry.name).sort()
  } catch {
    return []
  }
}

/**
 * Inspect one shape directory without relying on the dsh-shape host scanner.
 * @param dir - shape directory.
 * @param origin - source root label.
 * @returns compact metadata and validation messages.
 */
async function inspectShape(dir, origin) {
  const id = path.basename(dir)
  const manifest = await readManifest(dir)
  if (typeof manifest === 'string') {
    return { id, origin, valid: false, errors: [manifest], warnings: [], views: [], slots: [], tools: [] }
  }
  const files = await readdir(dir, { withFileTypes: true }).catch(() => [])
  const subdirs = new Set(files.filter(entry => entry.isDirectory()).map(entry => entry.name))
  const views = await listFiles(path.join(dir, 'views'))
  const slots = await listFiles(path.join(dir, 'slots'))
  const tools = await listFiles(path.join(dir, 'tools'))
  const client = await listFiles(path.join(dir, 'client'))
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
    origin,
    valid: errors.length === 0,
    errors,
    warnings,
    views,
    slots,
    tools,
    ...(typeof manifest.title === 'string' ? { title: manifest.title } : {}),
    ...(typeof manifest.version === 'string' ? { version: manifest.version } : {}),
    ...(Array.isArray(shape?.requires) ? { requirements: shape.requires } : {}),
    ...(client.includes('index.js') ? { clientEntry: 'client/index.js' } : {}),
  }
}

/**
 * List shape directories from user and bundled roots.
 * @param roots - source roots in precedence order.
 * @returns shape metadata.
 */
async function listShapes(roots) {
  const shapes = []
  const seen = new Set()
  for (const source of roots) {
    let entries
    try {
      entries = await readdir(source.dir, { withFileTypes: true })
    } catch {
      continue
    }
    for (const entry of entries) {
      if (!entry.isDirectory() || entry.name.startsWith('.') || seen.has(entry.name)) continue
      seen.add(entry.name)
      shapes.push(await inspectShape(path.join(source.dir, entry.name), source.origin))
    }
  }
  return shapes.sort((left, right) => left.id.localeCompare(right.id))
}

/**
 * Find one shape directory.
 * @param id - shape id.
 * @param roots - source roots in precedence order.
 * @returns directory and origin, or undefined.
 */
async function findShape(id, roots) {
  for (const source of roots) {
    const dir = path.join(source.dir, id)
    try {
      await stat(path.join(dir, 'package.json'))
      return { dir, origin: source.origin }
    } catch {
      // A missing candidate falls through to the next root.
    }
  }
  return undefined
}

/**
 * Read one existing shape's public interface and attached files.
 * @param id - shape id.
 * @param roots - source roots in precedence order.
 * @returns manifest, slot descriptors, client entry, and file inventory.
 */
async function inspectShapeInterface(id, roots) {
  const found = await findShape(id, roots)
  if (found === undefined) throw new Error(`shape not found: ${id}`)
  const manifest = await readManifest(found.dir)
  if (typeof manifest === 'string') throw new Error(`invalid ${id}/package.json: ${manifest}`)
  const metadata = await inspectShape(found.dir, found.origin)
  const warnings = [...(metadata.warnings ?? [])]
  const slots = []
  for (const file of (metadata.slots ?? []).filter(name => name.endsWith('.json'))) {
    try {
      const parsed = JSON.parse(await readFile(path.join(found.dir, 'slots', file), 'utf8'))
      if (Array.isArray(parsed)) slots.push(...parsed)
      else slots.push(parsed)
    } catch (cause) {
      warnings.push(`cannot read slots/${file}: ${cause instanceof Error ? cause.message : String(cause)}`)
    }
  }

  let client
  if (metadata.clientEntry !== undefined) {
    try {
      let code = await readFile(path.join(found.dir, metadata.clientEntry), 'utf8')
      let truncated = false
      if (code.length > CLIENT_CODE_LIMIT) {
        code = code.slice(0, CLIENT_CODE_LIMIT)
        truncated = true
      }
      client = { entry: metadata.clientEntry, code, ...(truncated ? { truncated } : {}) }
    } catch (cause) {
      warnings.push(`cannot read client/${metadata.clientEntry}: ${cause instanceof Error ? cause.message : String(cause)}`)
    }
  }

  return {
    id,
    origin: found.origin,
    dir: found.dir,
    ...(metadata.clientEntry === undefined ? {} : { clientEntry: metadata.clientEntry }),
    manifest,
    interface: {
      apiVersion: typeof manifest.shape?.apiVersion === 'number' ? manifest.shape.apiVersion : 0,
      requirements: metadata.requirements ?? [],
      views: metadata.views ?? [],
      slots,
      tools: metadata.tools ?? [],
      ...(client === undefined ? {} : { client }),
    },
    valid: metadata.valid,
    errors: metadata.errors ?? [],
    warnings,
  }
}

/**
 * Read one shape specification topic.
 * @param topic - reference file name without extension.
 * @returns markdown text.
 */
async function readSpec(topic) {
  if (!SPEC_TOPICS.includes(topic)) throw new Error(`unknown shape spec topic: ${topic}`)
  return readFile(path.join(REFERENCE_ROOT, `${topic}.md`), 'utf8')
}

/**
 * Read the Client capability catalog mirrored to disk.
 * @returns available capability providers.
 */
async function readCapabilityCatalog() {
  try {
    const value = JSON.parse(await readFile(CAPABILITY_FILE, 'utf8'))
    if (!Array.isArray(value)) return []
    return value.filter(entry => (
      typeof entry === 'object' && entry !== null
      && typeof entry.plugin === 'string'
      && typeof entry.capability === 'string'
      && typeof entry.version === 'string'
      && Array.isArray(entry.methods)
      && Array.isArray(entry.fields)
    ))
  } catch {
    return []
  }
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
    type: 'module',
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
  if (args.withActions === true) {
    await writeFile(path.join(dir, 'actions.js'), `/** DOM-free actions and their tests; run them with shape_test. */

export const actions = {
  /**
   * Return its input unchanged.
   * @param input - caller-provided value.
   * @returns the same value.
   */
  echo(input) {
    return input
  },
}

export const tests = {
  'echo returns its input': ({ actions, assert }) => {
    assert.equal(actions.echo('ok'), 'ok')
  },
}
`)
    files.push('actions.js')
  }
  return { path: dir, files }
}

/**
 * Validate a shape directory.
 * @param id - shape id.
 * @param roots - source roots in precedence order.
 * @returns validation result.
 */
async function validate(id, roots) {
  if (!SHAPE_ID.test(id)) throw new Error('shape id must be lowercase letters, digits, and hyphens')
  const found = await findShape(id, roots)
  if (found === undefined) throw new Error(`shape not found: ${id}`)
  const result = await inspectShape(found.dir, found.origin)
  return {
    valid: result.valid,
    errors: result.errors ?? [],
    warnings: result.warnings ?? [],
    requirements: result.requirements ?? [],
  }
}

/** Assertions available to shape tests. */
const TEST_ASSERT = {
  /**
   * Fail when the value is falsy.
   * @param value - value under test.
   * @param message - failure message.
   */
  ok(value, message = 'expected a truthy value') {
    if (!value) throw new Error(message)
  },
  /**
   * Fail when the values differ under `Object.is`.
   * @param actual - produced value.
   * @param expected - expected value.
   * @param message - failure message.
   */
  equal(actual, expected, message) {
    if (!Object.is(actual, expected)) {
      throw new Error(message ?? `expected ${JSON.stringify(expected)}, received ${JSON.stringify(actual)}`)
    }
  },
  /**
   * Fail when the JSON projections differ.
   * @param actual - produced value.
   * @param expected - expected value.
   * @param message - failure message.
   */
  deepEqual(actual, expected, message) {
    const left = JSON.stringify(actual)
    const right = JSON.stringify(expected)
    if (left !== right) throw new Error(message ?? `expected ${right}, received ${left}`)
  },
}

/**
 * Read one failure as text.
 * @param cause - thrown value.
 * @returns message text.
 */
function messageOf(cause) {
  return cause instanceof Error ? cause.message : String(cause)
}

/**
 * Run the tests a shape exports from its actions module.
 * @param id - shape id.
 * @param roots - source roots in precedence order.
 * @returns test results.
 */
async function testShape(id, roots) {
  if (!SHAPE_ID.test(id)) throw new Error('shape id must be lowercase letters, digits, and hyphens')
  const found = await findShape(id, roots)
  if (found === undefined) throw new Error(`shape not found: ${id}`)
  const file = path.join(found.dir, 'actions.js')
  try {
    await stat(file)
  } catch {
    return { ok: true, shape: id, note: 'no actions.js; nothing to test', results: [] }
  }

  let module
  try {
    module = await import(`${pathToFileURL(file).href}?v=${String(Date.now())}`)
  } catch (cause) {
    return { ok: false, shape: id, file, note: `import failed: ${messageOf(cause)}`, results: [] }
  }

  const actions = typeof module.actions === 'object' && module.actions !== null ? module.actions : {}
  const tests = typeof module.tests === 'object' && module.tests !== null ? module.tests : {}
  const names = Object.keys(tests)
  if (names.length === 0) {
    return { ok: true, shape: id, file, note: 'actions.js exports no tests', results: [] }
  }

  const results = []
  for (const name of names) {
    if (typeof tests[name] !== 'function') {
      results.push({ name, ok: false, error: 'test is not a function' })
      continue
    }
    try {
      await tests[name]({ actions, assert: TEST_ASSERT })
      results.push({ name, ok: true })
    } catch (cause) {
      results.push({ name, ok: false, error: messageOf(cause) })
    }
  }
  return { ok: results.every(result => result.ok), shape: id, file, results }
}

/**
 * Register the shape development tool set.
 * @param ctx - preset-scoped Host context.
 * @param config - optional `dir` override.
 */
export function apply(ctx, config) {
  const root = shapeRoot(config)
  const roots = [
    { dir: root, origin: 'user' },
    { dir: BUNDLED_ROOT, origin: 'bundled' },
  ]

  ctx.effect(() => ctx.tools.register({
    name: 'shape_list',
    description: 'List user and bundled dsh-shape shapes with their origin, capability requirements, and file inventory.',
    parameters: { type: 'object', additionalProperties: false, properties: {} },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['root', 'bundledRoot', 'shapes'],
        properties: {
          root: { type: 'string' },
          bundledRoot: { type: 'string' },
          shapes: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['id', 'origin', 'valid', 'errors', 'warnings', 'views', 'slots', 'tools'],
              properties: {
                id: { type: 'string' },
                origin: { type: 'string', enum: ['user', 'bundled'] },
                title: { type: 'string' },
                version: { type: 'string' },
                valid: { type: 'boolean' },
                errors: { type: 'array', items: { type: 'string' } },
                warnings: { type: 'array', items: { type: 'string' } },
                requirements: { type: 'array', items: { type: 'object', additionalProperties: true } },
                views: { type: 'array', items: { type: 'string' } },
                slots: { type: 'array', items: { type: 'string' } },
                tools: { type: 'array', items: { type: 'string' } },
                clientEntry: { type: 'string' },
              },
            },
          },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.shapes.length === 0
          ? `No shapes in ${value.root} or ${value.bundledRoot}.`
          : `${value.shapes.length} shape(s):\n${value.shapes.map(shape => `- ${shape.id} [${shape.origin}]${shape.valid ? '' : ' (invalid)'}${shape.clientEntry ? ' client' : ''}${shape.errors.length ? `: ${shape.errors.join('; ')}` : ''}`).join('\n')}`,
      }],
    },
    async execute() {
      return { root, bundledRoot: BUNDLED_ROOT, shapes: await listShapes(roots) }
    },
  }), 'dsh-shape: shape_list tool')

  ctx.effect(() => ctx.tools.register({
    name: 'shape_capabilities',
    description: 'List capability providers available to shapes, with contract versions and API method names.',
    parameters: { type: 'object', additionalProperties: false, properties: {} },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['capabilities'],
        properties: {
          capabilities: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['plugin', 'capability', 'version', 'methods', 'fields'],
              properties: {
                plugin: { type: 'string' },
                capability: { type: 'string' },
                version: { type: 'string' },
                description: { type: 'string' },
                usage: { type: 'string' },
                methods: { type: 'array', items: { type: 'string' } },
                fields: { type: 'array', items: { type: 'string' } },
              },
            },
          },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: value.capabilities.length === 0
          ? 'No capability catalog is available. The dsh-shape Client publishes it after startup; restart DSH if this is a fresh install.'
          : `Available shape capabilities:\n${value.capabilities.map(entry => [
            `- ${entry.plugin}#${entry.capability} v${entry.version}`,
            ...(entry.description === undefined ? [] : [`  purpose: ${entry.description}`]),
            ...(entry.usage === undefined ? [] : [`  usage: ${entry.usage}`]),
            ...(entry.methods.length === 0 ? [] : [`  methods: ${entry.methods.join(', ')}`]),
            ...(entry.fields.length === 0 ? [] : [`  fields: ${entry.fields.join(', ')}`]),
          ].join('\n')).join('\n')}`,
      }],
    },
    async execute() {
      return { capabilities: await readCapabilityCatalog() }
    },
  }), 'dsh-shape: shape_capabilities tool')

  ctx.effect(() => ctx.tools.register({
    name: 'shape_spec',
    description: 'Read the bundled dsh-shape specification for one topic: manifest, client API, slots, views, capabilities, lifecycle, testing, or extension plugins.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      properties: {
        topic: { type: 'string', enum: SPEC_TOPICS, description: 'Specification topic; defaults to overview.' },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['topic', 'topics', 'markdown', 'packageRoot', 'referenceRoot'],
        properties: {
          topic: { type: 'string' },
          topics: { type: 'array', items: { type: 'string' } },
          markdown: { type: 'string' },
          packageRoot: { type: 'string' },
          referenceRoot: { type: 'string' },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: `${value.markdown}\n\n---\nReference: ${value.referenceRoot}\nPackage: ${value.packageRoot}`,
      }],
    },
    async execute(args) {
      const topic = typeof args.topic === 'string' ? args.topic : 'overview'
      return {
        topic,
        topics: SPEC_TOPICS,
        markdown: await readSpec(topic),
        packageRoot: PACKAGE_ROOT,
        referenceRoot: REFERENCE_ROOT,
      }
    },
  }), 'dsh-shape: shape_spec tool')

  ctx.effect(() => ctx.tools.register({
    name: 'shape_inspect',
    description: 'Read an existing shape interface: manifest, capability requirements, slot descriptors, client code, and the views/slots/tools inventory.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Shape id to inspect.' },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'origin', 'dir', 'manifest', 'interface', 'valid', 'errors', 'warnings'],
        properties: {
          id: { type: 'string' },
          origin: { type: 'string', enum: ['user', 'bundled'] },
          dir: { type: 'string' },
          clientEntry: { type: 'string' },
          manifest: { type: 'object', additionalProperties: true },
          interface: {
            type: 'object',
            additionalProperties: false,
            required: ['apiVersion', 'requirements', 'views', 'slots', 'tools'],
            properties: {
              apiVersion: { type: 'integer' },
              requirements: { type: 'array', items: { type: 'object', additionalProperties: true } },
              views: { type: 'array', items: { type: 'string' } },
              slots: { type: 'array', items: { type: 'object', additionalProperties: true } },
              tools: { type: 'array', items: { type: 'string' } },
              client: {
                type: 'object',
                additionalProperties: false,
                required: ['entry', 'code'],
                properties: {
                  entry: { type: 'string' },
                  code: { type: 'string' },
                  truncated: { type: 'boolean' },
                },
              },
            },
          },
          valid: { type: 'boolean' },
          errors: { type: 'array', items: { type: 'string' } },
          warnings: { type: 'array', items: { type: 'string' } },
        },
      },
      render: (_args, value) => [{
        type: 'text',
        text: JSON.stringify({
          id: value.id,
          origin: value.origin,
          dir: value.dir,
          clientEntry: value.clientEntry ?? null,
          valid: value.valid,
          errors: value.errors,
          warnings: value.warnings,
          manifest: value.manifest,
          interface: value.interface,
        }, null, 2),
      }],
    },
    async execute(args) {
      return inspectShapeInterface(args.id, roots)
    },
  }), 'dsh-shape: shape_inspect tool')

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
        withActions: { type: 'boolean', description: 'Also create actions.js with a DOM-free action and one test for shape_test.' },
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
      return validate(args.id, roots)
    },
  }), 'dsh-shape: shape_validate tool')

  ctx.effect(() => ctx.tools.register({
    name: 'shape_test',
    description: 'Run the tests a shape exports from actions.js. The module exports `actions` (DOM-free functions) and optional `tests` (name → function receiving { actions, assert }); use assert.ok, assert.equal, or assert.deepEqual.',
    parameters: {
      type: 'object',
      additionalProperties: false,
      required: ['id'],
      properties: {
        id: { type: 'string', description: 'Shape id whose actions.js to test.' },
      },
    },
    output: {
      schema: {
        type: 'object',
        additionalProperties: false,
        required: ['ok', 'shape', 'results'],
        properties: {
          ok: { type: 'boolean' },
          shape: { type: 'string' },
          file: { type: 'string' },
          note: { type: 'string' },
          results: {
            type: 'array',
            items: {
              type: 'object',
              additionalProperties: false,
              required: ['name', 'ok'],
              properties: {
                name: { type: 'string' },
                ok: { type: 'boolean' },
                error: { type: 'string' },
              },
            },
          },
        },
      },
      render: (_args, value) => {
        const passed = value.results.filter(result => result.ok).length
        const text = value.results.length === 0
          ? `${value.shape}: ${value.note ?? 'no tests'}`
          : `${value.ok ? 'passed' : 'failed'} (${String(passed)}/${String(value.results.length)})\n${value.results.map(result => `- ${result.ok ? '✓' : '✗'} ${result.name}${result.error === undefined ? '' : `: ${result.error}`}`).join('\n')}`
        return [{ type: 'text', text }]
      },
    },
    async execute(args) {
      return testShape(args.id, roots)
    },
  }), 'dsh-shape: shape_test tool')
}
