/**
 * HTTP plumbing for the shape browser: route prefixes, JSON replies, and the
 * static routes that serve a shape's views and client modules.
 * @module @belowthetree/dsh-shape/host/http
 */
import { readFile } from 'node:fs/promises'
import path from 'node:path'
/** Prefix every route in this package hangs off. */
export const ROUTE = '/dsh-shape'
/** JSON API root. */
export const API = `${ROUTE}/api`
/** Shape view files. */
export const VIEW = `${ROUTE}/view`
/** Shape client modules. */
export const CLIENT = `${ROUTE}/client`
/** Content type per served extension. */
const CONTENT_TYPES = {
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
 * Write one JSON response.
 * @param res - server response.
 * @param status - HTTP status.
 * @param body - JSON body.
 */
export function json(res, status, body) {
  const text = JSON.stringify(body)
  res.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    'content-length': Buffer.byteLength(text),
  })
  res.end(text)
}
/**
 * Read a JSON request body.
 * @param req - incoming request.
 * @param limit - largest body accepted, in bytes.
 * @returns the parsed value.
 */
export async function readJsonBody(req, limit = 32_768) {
  const chunks = []
  let size = 0
  for await (const chunk of req) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.byteLength
    if (size > limit)
      throw new Error('request body too large')
    chunks.push(buffer)
  }
  if (size === 0)
    throw new Error('empty request body')
  return JSON.parse(Buffer.concat(chunks).toString('utf8'))
}
/**
 * Serve one file from a shape's `views/` directory.
 * @param url - request URL under `/dsh-shape/view/`.
 * @param res - server response.
 * @param shapes - current shape list.
 */
export async function serveView(url, res, shapes) {
  const rest = url.pathname.slice(`${VIEW}/`.length)
  const separator = rest.indexOf('/')
  if (separator === -1) {
    res.writeHead(308, { location: `${url.pathname}/` })
    res.end()
    return
  }
  let id
  try {
    id = decodeURIComponent(rest.slice(0, separator))
  }
  catch {
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
  }
  catch {
    json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown view' } })
    return
  }
  if (requested === '' || requested.endsWith('/'))
    requested += 'index.html'
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
  let body
  try {
    body = await readFile(path.join(shape.dir, 'views', entry))
  }
  catch {
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
/**
 * Serve one module from a shape's `client/` directory.
 * @param url - request URL under `/dsh-shape/client/`.
 * @param res - server response.
 * @param shapes - current shape list.
 */
export async function serveClient(url, res, shapes) {
  const rest = url.pathname.slice(`${CLIENT}/`.length)
  const separator = rest.indexOf('/')
  if (separator === -1) {
    json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown client module' } })
    return
  }
  let id
  try {
    id = decodeURIComponent(rest.slice(0, separator))
  }
  catch {
    json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown shape' } })
    return
  }
  const shape = shapes.find(candidate => candidate.id === id && candidate.valid && candidate.enabled)
  if (shape === undefined || shape.clientFiles.length === 0) {
    json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown shape' } })
    return
  }
  let requested
  try {
    requested = decodeURIComponent(rest.slice(separator + 1))
  }
  catch {
    json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown client module' } })
    return
  }
  const normalized = path.posix.normalize(requested)
  if (normalized.startsWith('..') || normalized.startsWith('/') || normalized.includes('\\') || normalized.includes('\0')
    || !shape.clientFiles.includes(normalized)) {
    json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown client module' } })
    return
  }
  let body
  try {
    body = await readFile(path.join(shape.dir, 'client', normalized))
  }
  catch {
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
