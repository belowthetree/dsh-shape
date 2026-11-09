/**
 * Shape discovery: read shape folders under a root and parse their manifests.
 * @module @belowthetree/dsh-shape/host/shapes
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
/**
 * List files below one directory, relative to it and using `/` separators.
 * Missing directories are an empty list.
 * @param dir - directory to walk.
 * @returns sorted relative file paths.
 */
async function listFiles(dir) {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  }
  catch {
    return []
  }
  const files = []
  for (const entry of entries) {
    if (entry.name.startsWith('.'))
      continue
    if (entry.isDirectory()) {
      for (const child of await listFiles(path.join(dir, entry.name))) {
        files.push(path.posix.join(entry.name, child))
      }
    }
    else if (entry.isFile()) {
      files.push(entry.name)
    }
  }
  return files.sort()
}
/**
 * Read one optional string field from a slot descriptor.
 * @param value - raw JSON value.
 * @returns the string, or undefined.
 */
function optionalString(value) {
  return typeof value === 'string' ? value : undefined
}
/**
 * Parse slot descriptors below one shape's `slots/` directory.
 * @param dir - the shape's slots directory.
 * @param files - already listed relative files.
 * @returns valid descriptors; malformed files are ignored.
 */
async function readSlotData(dir, files) {
  const descriptors = []
  for (const file of files) {
    if (!file.toLowerCase().endsWith('.json'))
      continue
    let parsed
    try {
      parsed = JSON.parse(await readFile(path.join(dir, file), 'utf8'))
    }
    catch {
      continue
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed))
      continue
    const record = parsed
    if (typeof record.slot !== 'string' || record.slot.trim().length === 0)
      continue
    const title = optionalString(record.title)
    const text = optionalString(record.text)
    const button = optionalString(record.button)
    const greeting = optionalString(record.greeting)
    descriptors.push({
      slot: record.slot.trim(),
      ...(title === undefined ? {} : { title }),
      ...(text === undefined ? {} : { text }),
      ...(button === undefined ? {} : { button }),
      ...(greeting === undefined ? {} : { greeting }),
    })
  }
  return descriptors
}
/** Kinds a shape may declare; `shape` is the default surface contributor. */
const SHAPE_KINDS = ['shape', 'workbench']

/**
 * Parse a shape's optional `shape` manifest object.
 * @param manifest - raw package manifest.
 * @returns validated ABI, kind, and requirements, or a configuration error.
 */
function readShapeConfig(manifest) {
  if (manifest.shape === undefined)
    return { apiVersion: 1, kind: 'shape', requirements: [] }
  if (typeof manifest.shape !== 'object' || manifest.shape === null || Array.isArray(manifest.shape)) {
    return { apiVersion: 1, kind: 'shape', requirements: [], error: 'shape must be an object' }
  }
  const config = manifest.shape
  const apiVersion = config.apiVersion ?? 1
  if (typeof apiVersion !== 'number' || !Number.isInteger(apiVersion) || apiVersion < 1) {
    return { apiVersion: 1, kind: 'shape', requirements: [], error: 'shape.apiVersion must be a positive integer' }
  }
  const kind = config.kind ?? 'shape'
  if (typeof kind !== 'string' || !SHAPE_KINDS.includes(kind)) {
    return { apiVersion, kind: 'shape', requirements: [], error: 'shape.kind must be "shape" or "workbench"' }
  }
  const rawRequires = config.requires ?? []
  if (!Array.isArray(rawRequires)) {
    return { apiVersion, kind, requirements: [], error: 'shape.requires must be an array' }
  }
  const requirements = []
  for (const entry of rawRequires) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return { apiVersion, kind, requirements: [], error: 'each shape requirement must be an object' }
    }
    const record = entry
    const plugin = record.plugin
    const capability = record.capability
    const version = record.version
    const optional = record.optional
    if (typeof plugin !== 'string' || plugin.trim().length === 0
      || typeof capability !== 'string' || capability.trim().length === 0
      || typeof version !== 'string' || version.trim().length === 0
      || (optional !== undefined && typeof optional !== 'boolean')) {
      return { apiVersion, kind, requirements: [], error: 'requirement needs plugin, capability, version, and optional boolean' }
    }
    requirements.push({
      plugin: plugin.trim(),
      capability: capability.trim(),
      version: version.trim(),
      ...(optional === true ? { optional: true } : {}),
    })
  }
  return { apiVersion, kind, requirements }
}
/**
 * Read one shape folder.
 * @param dir - the shape folder.
 * @param origin - which root discovered it.
 * @returns the public entry, including errors instead of throwing.
 */
async function readShape(dir, origin) {
  const fallbackId = path.basename(dir)
  let manifest = {}
  let error
  try {
    manifest = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8'))
  }
  catch (cause) {
    error = cause instanceof Error ? cause.message : String(cause)
  }
  const rawId = typeof manifest.id === 'string' ? manifest.id : manifest.name
  const id = typeof rawId === 'string' && rawId.trim().length > 0 ? rawId.trim() : fallbackId
  const title = typeof manifest.title === 'string' && manifest.title.trim().length > 0 ? manifest.title.trim() : id
  const description = typeof manifest.description === 'string' ? manifest.description : ''
  const version = typeof manifest.version === 'string' ? manifest.version : '0.0.0'
  const output = typeof manifest.output === 'string' ? manifest.output : 'text'
  const shapeConfig = readShapeConfig(manifest)
  const valid = error === undefined && shapeConfig.error === undefined && typeof rawId === 'string' && rawId.trim().length > 0
  const slots = await listFiles(path.join(dir, 'slots'))
  const slotData = await readSlotData(path.join(dir, 'slots'), slots)
  const clientFiles = await listFiles(path.join(dir, 'client'))
  const clientEntry = clientFiles.includes('index.js') ? 'index.js' : undefined
  return {
    id,
    title,
    description,
    version,
    origin,
    dir,
    shapeApiVersion: shapeConfig.apiVersion,
    kind: shapeConfig.kind,
    requirements: shapeConfig.requirements,
    views: await listFiles(path.join(dir, 'views')),
    clientFiles,
    ...(clientEntry === undefined ? {} : { clientEntry }),
    slots,
    slotData,
    tools: await listFiles(path.join(dir, 'tools')),
    input: manifest.input ?? [],
    output,
    valid,
    enabled: true,
    ...(error !== undefined ? { error } : shapeConfig.error !== undefined ? { error: shapeConfig.error } : {}),
  }
}
/**
 * Read every shape folder below one root.
 * @param root - directory containing shape folders.
 * @param origin - which root this is.
 * @returns discovered entries.
 */
async function readRoot(root, origin) {
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  }
  catch {
    return []
  }
  const shapes = []
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.'))
      continue
    shapes.push(await readShape(path.join(root, entry.name), origin))
  }
  return shapes
}
/**
 * Check whether a shape directory sits directly below one shape root.
 * @param root - shape root directory.
 * @param target - shape directory resolved by the scan.
 * @returns true when `target` is strictly inside `root`.
 */
function isInsideRoot(root, target) {
  const relative = path.relative(path.resolve(root), path.resolve(target))
  return relative !== '' && !relative.startsWith('..') && !path.isAbsolute(relative)
}
export { isInsideRoot, readRoot }
