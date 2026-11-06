/**
 * dsh-shape Host half: discover folder-based shape packages and expose their
 * public artifacts to the Web client.
 *
 * A shape is a directory with a `package.json` plus optional `views/`,
 * `slots/`, and `tools/` subdirectories. This first version discovers and
 * lists those artifacts; it does not execute shape code.
 * @module @deepseek-ai/dsh-shape
 */

import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-host-webserver'

/** Plugin name shown in the Loader. */
export const name = 'dsh-shape'

/** The shape browser mounts beside the Web server. */
export const inject = ['webServer']

/** Optional Host configuration. */
export interface Config {
  /** Directory holding user shape folders. Defaults to `$DSH_HOME/dsh-shape/shapes`. */
  dir?: string
}

/** One capability required by a shape. */
export interface ShapeRequirement {
  /** Providing plugin package name. */
  plugin: string
  /** Capability name within that plugin. */
  capability: string
  /** Semver range for the provider's contract version. */
  version: string
  /** Missing capabilities do not block startup when true. */
  optional?: boolean
}

/** One capability provider mirrored from the Client registry for tools. */
export interface ShapeCapabilityCatalogEntry {
  /** Providing plugin package name. */
  plugin: string
  /** Capability name within that plugin. */
  capability: string
  /** Contract version. */
  version: string
  /** What the capability API is for. */
  description?: string
  /** How to call the API. */
  usage?: string
  /** Function names on the capability API. */
  methods: string[]
  /** Non-function API fields with their runtime types. */
  fields: string[]
}

/** One discovered shape package. */
export interface ShapeEntry {  /** Stable shape id, from `package.json` `id` or `name`. */
  id: string
  /** Human title. */
  title: string
  /** One-line description. */
  description: string
  /** Package version, when declared. */
  version: string
  /** Whether the folder came from the package or the user directory. */
  origin: 'bundled' | 'user'
  /** Absolute folder path. */
  dir: string
  /** Shape Client module ABI version. */
  shapeApiVersion: number
  /** Capability requirements from `package.json` `shape.requires`. */
  requirements: ShapeRequirement[]
  /** Files under `views/`, relative to that directory. */
  views: string[]
  /** Files under `client/`, relative to that directory. */
  clientFiles: string[]
  /** Shape Client entry below `client/`, when present. */
  clientEntry?: string
  /** Files under `slots/`, relative to that directory. */
  slots: string[]
  /** Parsed slot descriptors from `slots/*.json`. */
  slotData: ShapeSlotDescriptor[]
  /** Files under `tools/`, relative to that directory. */
  tools: string[]
  /** Declared input fields, passed through for future execution. */
  input: unknown
  /** Declared output mode. */
  output: string
  /** False when the package manifest is missing or invalid. */
  valid: boolean
  /** Whether this shape's interfaces and logic are enabled. */
  enabled: boolean
  /** Why the package is invalid, when it is. */
  error?: string
}

interface Manifest {
  id?: unknown
  name?: unknown
  title?: unknown
  description?: unknown
  version?: unknown
  input?: unknown
  output?: unknown
  shape?: unknown
}

/** One parsed slot descriptor contributed by a shape. */
export interface ShapeSlotDescriptor {
  /** Declared slot name. */
  slot: string
  /** Card title. */
  title?: string
  /** Card body. */
  text?: string
  /** Button label. */
  button?: string
  /** Text shown after the button is pressed. */
  greeting?: string
}

const ROUTE = '/dsh-shape'
const API = `${ROUTE}/api`
const VIEW = `${ROUTE}/view`
const CLIENT = `${ROUTE}/client`

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.htm': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
}

/**
 * List files below one directory, relative to it and using `/` separators.
 * Missing directories are an empty list.
 * @param dir - directory to walk.
 * @returns sorted relative file paths.
 */
async function listFiles(dir: string): Promise<string[]> {
  let entries
  try {
    entries = await readdir(dir, { withFileTypes: true })
  } catch {
    return []
  }

  const files: string[] = []
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue
    if (entry.isDirectory()) {
      for (const child of await listFiles(path.join(dir, entry.name))) {
        files.push(path.posix.join(entry.name, child))
      }
    } else if (entry.isFile()) {
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
function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined
}

/**
 * Parse slot descriptors below one shape's `slots/` directory.
 * @param dir - the shape's slots directory.
 * @param files - already listed relative files.
 * @returns valid descriptors; malformed files are ignored.
 */
async function readSlotData(dir: string, files: string[]): Promise<ShapeSlotDescriptor[]> {
  const descriptors: ShapeSlotDescriptor[] = []
  for (const file of files) {
    if (!file.toLowerCase().endsWith('.json')) continue
    let parsed: unknown
    try {
      parsed = JSON.parse(await readFile(path.join(dir, file), 'utf8'))
    } catch {
      continue
    }
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) continue
    const record = parsed as Record<string, unknown>
    if (typeof record.slot !== 'string' || record.slot.trim().length === 0) continue
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

/**
 * Parse a shape's optional `shape` manifest object.
 * @param manifest - raw package manifest.
 * @returns validated ABI and requirements, or a configuration error.
 */
function readShapeConfig(manifest: Manifest): {
  apiVersion: number
  requirements: ShapeRequirement[]
  error?: string
} {
  if (manifest.shape === undefined) return { apiVersion: 1, requirements: [] }
  if (typeof manifest.shape !== 'object' || manifest.shape === null || Array.isArray(manifest.shape)) {
    return { apiVersion: 1, requirements: [], error: 'shape must be an object' }
  }
  const config = manifest.shape as Record<string, unknown>
  const apiVersion = config.apiVersion ?? 1
  if (typeof apiVersion !== 'number' || !Number.isInteger(apiVersion) || apiVersion < 1) {
    return { apiVersion: 1, requirements: [], error: 'shape.apiVersion must be a positive integer' }
  }
  const rawRequires = config.requires ?? []
  if (!Array.isArray(rawRequires)) {
    return { apiVersion, requirements: [], error: 'shape.requires must be an array' }
  }

  const requirements: ShapeRequirement[] = []
  for (const entry of rawRequires) {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) {
      return { apiVersion, requirements: [], error: 'each shape requirement must be an object' }
    }
    const record = entry as Record<string, unknown>
    const plugin = record.plugin
    const capability = record.capability
    const version = record.version
    const optional = record.optional
    if (typeof plugin !== 'string' || plugin.trim().length === 0
      || typeof capability !== 'string' || capability.trim().length === 0
      || typeof version !== 'string' || version.trim().length === 0
      || (optional !== undefined && typeof optional !== 'boolean')) {
      return { apiVersion, requirements: [], error: 'requirement needs plugin, capability, version, and optional boolean' }
    }
    requirements.push({
      plugin: plugin.trim(),
      capability: capability.trim(),
      version: version.trim(),
      ...(optional === true ? { optional: true } : {}),
    })
  }
  return { apiVersion, requirements }
}

/**
 * Read one shape folder.
 * @param dir - the shape folder.
 * @param origin - which root discovered it.
 * @returns the public entry, including errors instead of throwing.
 */
async function readShape(dir: string, origin: ShapeEntry['origin']): Promise<ShapeEntry> {
  const fallbackId = path.basename(dir)
  let manifest: Manifest = {}
  let error: string | undefined
  try {
    manifest = JSON.parse(await readFile(path.join(dir, 'package.json'), 'utf8')) as Manifest
  } catch (cause) {
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
async function readRoot(root: string, origin: ShapeEntry['origin']): Promise<ShapeEntry[]> {
  let entries
  try {
    entries = await readdir(root, { withFileTypes: true })
  } catch {
    return []
  }

  const shapes: ShapeEntry[] = []
  for (const entry of entries) {
    if (!entry.isDirectory() || entry.name.startsWith('.')) continue
    shapes.push(await readShape(path.join(root, entry.name), origin))
  }
  return shapes
}

/**
 * Write one JSON response.
 * @param res - server response.
 * @param status - HTTP status.
 * @param body - JSON body.
 */
function json(res: ServerResponse, status: number, body: unknown): void {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(text),
  })
  res.end(text)
}

/**
 * Validate a Client capability catalog payload.
 * @param value - decoded JSON value.
 * @returns validated entries.
 */
function readCapabilityCatalog(value: unknown): ShapeCapabilityCatalogEntry[] {
  if (!Array.isArray(value) || value.length > 256) throw new Error('capabilities must be an array')
  return value.map((entry) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry)) throw new Error('invalid capability entry')
    const record = entry as Record<string, unknown>
    const plugin = record.plugin
    const capability = record.capability
    const version = record.version
    const description = record.description
    const usage = record.usage
    const methods = record.methods
    const fields = record.fields
    if (typeof plugin !== 'string' || plugin.length === 0 || plugin.length > 200) throw new Error('invalid capability plugin')
    if (typeof capability !== 'string' || capability.length === 0 || capability.length > 200) throw new Error('invalid capability name')
    if (typeof version !== 'string' || version.length === 0 || version.length > 100) throw new Error('invalid capability version')
    if (description !== undefined && (typeof description !== 'string' || description.length > 2000)) throw new Error('invalid capability description')
    if (usage !== undefined && (typeof usage !== 'string' || usage.length > 8000)) throw new Error('invalid capability usage')
    if (!Array.isArray(methods) || methods.some(item => typeof item !== 'string' || item.length > 200)) throw new Error('invalid capability methods')
    if (!Array.isArray(fields) || fields.some(item => typeof item !== 'string' || item.length > 300)) throw new Error('invalid capability fields')
    return {
      plugin,
      capability,
      version,
      ...(typeof description === 'string' ? { description } : {}),
      ...(typeof usage === 'string' ? { usage } : {}),
      methods,
      fields,
    }
  })
}

/**
 * Read a small JSON request body.
 * @param req - incoming request.
 * @returns the parsed value.
 */
async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array)
    size += buffer.byteLength
    if (size > 32_768) throw new Error('request body too large')
    chunks.push(buffer)
  }
  if (size === 0) throw new Error('empty request body')
  return JSON.parse(Buffer.concat(chunks).toString('utf8')) as unknown
}

/**
 * Mount the shape browser and scan folder-based shapes at boot.
 * @param ctx - host context carrying `webServer`.
 * @param config - optional user shape root.
 */
export async function apply(ctx: Context, config: Config = {}): Promise<void> {
  const bundledDir = fileURLToPath(new URL('./shapes/', import.meta.url))
  const userDir = config.dir === undefined
    ? path.join(process.env.DSH_HOME ?? path.join(homedir(), '.dsh'), 'dsh-shape', 'shapes')
    : path.resolve(config.dir)

  const stateDir = path.join(process.env.DSH_HOME ?? path.join(homedir(), '.dsh'), 'dsh-shape')
  const stateFile = path.join(stateDir, 'state.json')
  const capabilityFile = path.join(stateDir, 'capabilities.json')
  let capabilityCatalog: ShapeCapabilityCatalogEntry[] = []
  try {
    capabilityCatalog = readCapabilityCatalog(JSON.parse(await readFile(capabilityFile, 'utf8')) as unknown)
  } catch {
    // The Client refreshes the mirror after startup; absent or stale content is non-fatal.
  }
  const enabledById = new Map<string, boolean>()
  try {
    const saved = JSON.parse(await readFile(stateFile, 'utf8')) as unknown
    if (typeof saved === 'object' && saved !== null && !Array.isArray(saved)) {
      for (const [id, enabled] of Object.entries(saved)) {
        if (typeof enabled === 'boolean') enabledById.set(id, enabled)
      }
    }
  } catch {
    // Missing or malformed state starts with every shape enabled.
  }

  const saveEnabled = async (): Promise<void> => {
    await mkdir(stateDir, { recursive: true })
    const state = Object.fromEntries([...enabledById.entries()].sort(([left], [right]) => left.localeCompare(right)))
    await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
  }

  try {
    await mkdir(userDir, { recursive: true })
  } catch {
    // A missing user directory is not fatal; bundled shapes still load.
  }

  let shapes: ShapeEntry[] = []

  const refresh = async (): Promise<ShapeEntry[]> => {
    const bundled = await readRoot(bundledDir, 'bundled')
    const user = await readRoot(userDir, 'user')
    const byId = new Map(bundled.map(shape => [shape.id, shape]))
    for (const shape of user) byId.set(shape.id, shape)
    shapes = [...byId.values()]
      .map(shape => ({ ...shape, enabled: enabledById.get(shape.id) !== false }))
      .sort((left, right) => left.id.localeCompare(right.id))
    return shapes
  }

  const snapshot = (): unknown => ({
    ok: true,
    shapes,
    roots: { bundled: bundledDir, user: userDir },
  })

  const serveView = async (url: URL, res: ServerResponse): Promise<void> => {
    const rest = url.pathname.slice(`${VIEW}/`.length)
    const separator = rest.indexOf('/')
    if (separator === -1) {
      res.writeHead(308, { location: `${url.pathname}/` })
      res.end()
      return
    }

    let id: string
    try {
      id = decodeURIComponent(rest.slice(0, separator))
    } catch {
      json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown shape' } })
      return
    }

    const shape = shapes.find(candidate => candidate.id === id && candidate.valid && candidate.enabled)
    if (shape === undefined) {
      json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown shape' } })
      return
    }

    let requested = rest.slice(separator + 1)
    try {
      requested = decodeURIComponent(requested)
    } catch {
      json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown view' } })
      return
    }
    if (requested === '' || requested.endsWith('/')) requested += 'index.html'

    const normalized = path.posix.normalize(requested)
    if (normalized.startsWith('..') || normalized.startsWith('/') || normalized.includes('\\') || normalized.includes('\0')) {
      json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown view' } })
      return
    }

    let entry = shape.views.includes(normalized) ? normalized : undefined
    if (entry === undefined && normalized === 'index.html') {
      entry = shape.views.find(file => !file.includes('/') && /\.html?$/i.test(file))
    }
    if (entry === undefined) {
      json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown view' } })
      return
    }

    let body: Buffer
    try {
      body = await readFile(path.join(shape.dir, 'views', entry))
    } catch {
      json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown view' } })
      return
    }

    res.writeHead(200, {
      'content-type': CONTENT_TYPES[path.extname(entry).toLowerCase()] ?? 'application/octet-stream',
      'content-length': body.byteLength,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    })
    res.end(body)
  }

  const serveClient = async (url: URL, res: ServerResponse): Promise<void> => {
    const rest = url.pathname.slice(`${CLIENT}/`.length)
    const separator = rest.indexOf('/')
    if (separator === -1) {
      json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown client module' } })
      return
    }

    let id: string
    try {
      id = decodeURIComponent(rest.slice(0, separator))
    } catch {
      json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown shape' } })
      return
    }

    const shape = shapes.find(candidate => candidate.id === id && candidate.valid && candidate.enabled)
    if (shape === undefined || shape.clientFiles.length === 0) {
      json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown shape' } })
      return
    }

    let requested: string
    try {
      requested = decodeURIComponent(rest.slice(separator + 1))
    } catch {
      json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown client module' } })
      return
    }
    const normalized = path.posix.normalize(requested)
    if (normalized.startsWith('..') || normalized.startsWith('/') || normalized.includes('\\') || normalized.includes('\0')
      || !shape.clientFiles.includes(normalized)) {
      json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown client module' } })
      return
    }

    let body: Buffer
    try {
      body = await readFile(path.join(shape.dir, 'client', normalized))
    } catch {
      json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown client module' } })
      return
    }

    res.writeHead(200, {
      'content-type': CONTENT_TYPES[path.extname(normalized).toLowerCase()] ?? 'text/javascript; charset=utf-8',
      'content-length': body.byteLength,
      'cache-control': 'no-store',
      'x-content-type-options': 'nosniff',
    })
    res.end(body)
  }

  const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', 'http://dsh.invalid')
    if (req.method === 'GET' && url.pathname === `${API}/shapes`) {
      json(res, 200, snapshot())
      return
    }
    if (req.method === 'GET' && url.pathname === `${API}/health`) {
      json(res, 200, { ok: true, count: shapes.length, capabilities: capabilityCatalog.length, roots: { bundled: bundledDir, user: userDir } })
      return
    }
    if (req.method === 'GET' && url.pathname === `${API}/capabilities`) {
      json(res, 200, { ok: true, capabilities: capabilityCatalog })
      return
    }
    if (req.method === 'POST' && url.pathname === `${API}/capabilities`) {
      let body: unknown
      try {
        body = await readJsonBody(req)
      } catch {
        json(res, 400, { ok: false, error: { code: 'bad-request', message: 'invalid JSON body' } })
        return
      }
      const record = typeof body === 'object' && body !== null && !Array.isArray(body)
        ? body as Record<string, unknown>
        : undefined
      try {
        const catalog = readCapabilityCatalog(record?.capabilities)
        await mkdir(stateDir, { recursive: true })
        await writeFile(capabilityFile, `${JSON.stringify(catalog, null, 2)}\n`, 'utf8')
        capabilityCatalog = catalog
        json(res, 200, { ok: true, capabilities: capabilityCatalog })
      } catch (cause) {
        json(res, 400, {
          ok: false,
          error: { code: 'invalid-capabilities', message: cause instanceof Error ? cause.message : String(cause) },
        })
      }
      return
    }
    if (req.method === 'POST' && url.pathname === `${API}/refresh`) {
      await refresh()
      json(res, 200, snapshot())
      return
    }
    if (req.method === 'POST' && url.pathname === `${API}/toggle`) {
      let body: unknown
      try {
        body = await readJsonBody(req)
      } catch {
        json(res, 400, { ok: false, error: { code: 'bad-request', message: 'invalid JSON body' } })
        return
      }
      const record = typeof body === 'object' && body !== null && !Array.isArray(body)
        ? body as Record<string, unknown>
        : undefined
      const id = record?.id
      const enabled = record?.enabled
      if (typeof id !== 'string' || typeof enabled !== 'boolean') {
        json(res, 400, { ok: false, error: { code: 'bad-request', message: 'id and enabled are required' } })
        return
      }
      const shape = shapes.find(candidate => candidate.id === id)
      if (shape === undefined) {
        json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown shape' } })
        return
      }
      const previous = enabledById.get(id)
      enabledById.set(id, enabled)
      try {
        await saveEnabled()
      } catch (cause) {
        if (previous === undefined) enabledById.delete(id)
        else enabledById.set(id, previous)
        json(res, 500, {
          ok: false,
          error: { code: 'state-write-failed', message: cause instanceof Error ? cause.message : String(cause) },
        })
        return
      }
      shapes = shapes.map(candidate => candidate.id === id ? { ...candidate, enabled } : candidate)
      json(res, 200, snapshot())
      return
    }
    if (req.method === 'GET' && url.pathname.startsWith(`${VIEW}/`)) {
      await serveView(url, res)
      return
    }
    if (req.method === 'GET' && url.pathname.startsWith(`${CLIENT}/`)) {
      await serveClient(url, res)
      return
    }
    json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown dsh-shape route' } })
  }

  await refresh()
  ctx.effect(
    () => ctx.webServer.register({
      kind: 'prefix',
      path: ROUTE,
      handler,
    }),
    'dsh-shape: shape browser route',
  )
}
