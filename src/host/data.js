/**
 * The `/api/data` route: per-shape JSON storage under `<shape>/data/`.
 * @module @belowthetree/dsh-shape/host/data
 */
import { mkdir, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { json, readJsonBody } from './http.js'
/** Storage keys a shape may use; the pattern also rules out path traversal. */
const DATA_KEY = /^[a-z0-9][a-z0-9._-]{0,63}$/
/** Largest single stored value, in bytes. */
const DATA_LIMIT = 256 * 1024
/** Request body ceiling for the data route, leaving room for JSON framing. */
const DATA_BODY_LIMIT = 8 * 1024 * 1024
/**
 * Serve one storage request: `keys`, `get`, `set`, or `remove`.
 * @param req - incoming request carrying `{ id, op, key?, value? }`.
 * @param res - server response.
 * @param shapes - current shape list.
 */
export async function serveData(req, res, shapes) {
  let body
  try {
    body = await readJsonBody(req, DATA_BODY_LIMIT)
  }
  catch {
    json(res, 400, { ok: false, error: { code: 'bad-request', message: 'invalid JSON body' } })
    return
  }
  const record = typeof body === 'object' && body !== null && !Array.isArray(body)
    ? body
    : undefined
  const id = record?.id
  const op = record?.op
  const key = record?.key
  if (typeof id !== 'string' || typeof op !== 'string') {
    json(res, 400, { ok: false, error: { code: 'bad-request', message: 'id and op are required' } })
    return
  }
  const shape = shapes.find(candidate => candidate.id === id)
  if (shape === undefined) {
    json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown shape' } })
    return
  }
  if (op !== 'keys' && (typeof key !== 'string' || !DATA_KEY.test(key))) {
    json(res, 400, {
      ok: false,
      error: { code: 'bad-request', message: 'key must match [a-z0-9][a-z0-9._-]{0,63}' },
    })
    return
  }
  const dataKey = typeof key === 'string' ? key : ''
  const dataDir = path.join(shape.dir, 'data')
  try {
    if (op === 'keys') {
      const names = await readdir(dataDir).catch(() => [])
      const keys = names.filter(name => name.endsWith('.json')).map(name => name.slice(0, -5)).sort()
      json(res, 200, { ok: true, keys })
      return
    }
    const file = path.join(dataDir, `${dataKey}.json`)
    if (op === 'get') {
      let value = null
      try {
        value = JSON.parse(await readFile(file, 'utf8'))
      }
      catch {
        // An absent or malformed value reads as null.
      }
      json(res, 200, { ok: true, value })
      return
    }
    if (shape.origin !== 'user') {
      json(res, 403, { ok: false, error: { code: 'read-only', message: 'bundled shape data is read-only' } })
      return
    }
    if (op === 'remove') {
      await rm(file, { force: true })
      json(res, 200, { ok: true })
      return
    }
    if (op === 'set') {
      const text = JSON.stringify(record?.value ?? null)
      if (Buffer.byteLength(text) > DATA_LIMIT) {
        json(res, 413, { ok: false, error: { code: 'too-large', message: `value exceeds ${DATA_LIMIT} bytes` } })
        return
      }
      await mkdir(dataDir, { recursive: true })
      await writeFile(file, `${text}\n`, 'utf8')
      json(res, 200, { ok: true })
      return
    }
    json(res, 400, { ok: false, error: { code: 'bad-request', message: `unknown op: ${op}` } })
  }
  catch (cause) {
    json(res, 500, {
      ok: false,
      error: { code: 'data-failed', message: cause instanceof Error ? cause.message : String(cause) },
    })
  }
}
