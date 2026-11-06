/**
 * dsh-shape Host half: discover folder-based shape packages and expose their
 * public artifacts to the Web client.
 *
 * A shape is a directory with a `package.json` plus optional `views/`,
 * `slots/`, and `tools/` subdirectories. This first version discovers and
 * lists those artifacts; it does not execute shape code.
 * @module @deepseek-ai/dsh-shape
 */

import { mkdir, readFile, readdir } from 'node:fs/promises'
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

/** One discovered shape package. */
export interface ShapeEntry {
  /** Stable shape id, from `package.json` `id` or `name`. */
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
  /** Files under `views/`, relative to that directory. */
  views: string[]
  /** Files under `slots/`, relative to that directory. */
  slots: string[]
  /** Files under `tools/`, relative to that directory. */
  tools: string[]
  /** Declared input fields, passed through for future execution. */
  input: unknown
  /** Declared output mode. */
  output: string
  /** False when the package manifest is missing or invalid. */
  valid: boolean
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
}

const ROUTE = '/dsh-shape'
const API = `${ROUTE}/api`

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
  const valid = error === undefined && typeof rawId === 'string' && rawId.trim().length > 0

  return {
    id,
    title,
    description,
    version,
    origin,
    dir,
    views: await listFiles(path.join(dir, 'views')),
    slots: await listFiles(path.join(dir, 'slots')),
    tools: await listFiles(path.join(dir, 'tools')),
    input: manifest.input ?? [],
    output,
    valid,
    ...(error === undefined ? {} : { error }),
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
 * Mount the shape browser and scan folder-based shapes at boot.
 * @param ctx - host context carrying `webServer`.
 * @param config - optional user shape root.
 */
export async function apply(ctx: Context, config: Config = {}): Promise<void> {
  const bundledDir = fileURLToPath(new URL('./shapes/', import.meta.url))
  const userDir = config.dir === undefined
    ? path.join(process.env.DSH_HOME ?? path.join(homedir(), '.dsh'), 'dsh-shape', 'shapes')
    : path.resolve(config.dir)

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
    shapes = [...byId.values()].sort((left, right) => left.id.localeCompare(right.id))
    return shapes
  }

  const snapshot = (): unknown => ({
    ok: true,
    shapes,
    roots: { bundled: bundledDir, user: userDir },
  })

  const handler = async (req: IncomingMessage, res: ServerResponse): Promise<void> => {
    const url = new URL(req.url ?? '/', 'http://dsh.invalid')
    if (req.method === 'GET' && url.pathname === `${API}/shapes`) {
      json(res, 200, snapshot())
      return
    }
    if (req.method === 'GET' && url.pathname === `${API}/health`) {
      json(res, 200, { ok: true, count: shapes.length, roots: { bundled: bundledDir, user: userDir } })
      return
    }
    if (req.method === 'POST' && url.pathname === `${API}/refresh`) {
      await refresh()
      json(res, 200, snapshot())
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
