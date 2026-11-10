/**
 * The `/api/files` route: read, write, and list files inside one workspace.
 * @module @belowthetree/dsh-shape/host/files
 */
import { appendFile, mkdir, readFile, readdir, realpath, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { json, readJsonBody } from './http.js'
import { fail, realInside, resolveInside } from './paths.js'

/** Largest file a read may return, in bytes. */
const READ_LIMIT = 1024 * 1024
/** Largest text a write may accept, in bytes. */
const WRITE_LIMIT = 1024 * 1024
/** Request body ceiling, leaving room for JSON framing. */
const BODY_LIMIT = 4 * 1024 * 1024
/** Entries one list request may return. */
const ENTRY_LIMIT = 2000

/**
 * Serve one files request: `read`, `write`, or `list`.
 * @param req - incoming request carrying `{ root, op, path, content? }`.
 * @param res - server response.
 */
export async function serveFiles(req, res) {
  let record
  if (req.method === 'GET') {
    const url = new URL(req.url ?? '/', 'http://dsh.invalid')
    const number = (value) => {
      if (value === null || value === '') return undefined
      const parsed = Number(value)
      return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined
    }
    record = {
      op: url.searchParams.get('op') ?? '',
      root: url.searchParams.get('root') ?? '',
      path: url.searchParams.get('path') ?? '.',
      offset: number(url.searchParams.get('offset')),
      limit: number(url.searchParams.get('limit')),
      unit: url.searchParams.get('unit') ?? undefined,
    }
    if (record.op !== 'read' && record.op !== 'list') {
      fail(res, 405, 'method-not-allowed', 'GET supports read and list only')
      return
    }
  }
  else if (req.method === 'POST') {
    let body
    try {
      body = await readJsonBody(req, BODY_LIMIT)
    }
    catch {
      fail(res, 400, 'bad-request', 'invalid JSON body')
      return
    }
    record = typeof body === 'object' && body !== null && !Array.isArray(body) ? body : undefined
  }
  else {
    fail(res, 405, 'method-not-allowed', 'GET or POST is required')
    return
  }
  const op = record?.op
  const root = record?.root
  const relative = record?.path ?? '.'
  if (typeof op !== 'string' || typeof root !== 'string' || !path.isAbsolute(root)) {
    fail(res, 400, 'bad-request', 'op and an absolute root are required')
    return
  }
  if (typeof relative !== 'string') {
    fail(res, 400, 'bad-request', 'path must be a string')
    return
  }
  const resolvedRoot = path.resolve(root)
  let rootStat
  try {
    rootStat = await stat(resolvedRoot)
  }
  catch {
    fail(res, 404, 'not-found', 'workspace root does not exist')
    return
  }
  if (!rootStat.isDirectory()) {
    fail(res, 400, 'bad-request', 'workspace root is not a directory')
    return
  }
  let realRoot
  try {
    realRoot = await realpath(resolvedRoot)
  }
  catch {
    fail(res, 404, 'not-found', 'workspace root does not exist')
    return
  }
  const target = resolveInside(resolvedRoot, relative)
  if (target === null) {
    fail(res, 400, 'bad-request', 'path must stay inside the workspace')
    return
  }
  try {
    if (op === 'read') {
      let info
      try {
        info = await stat(target)
      }
      catch {
        fail(res, 404, 'not-found', 'file does not exist')
        return
      }
      if (!await realInside(realRoot, target, false)) {
        fail(res, 400, 'bad-request', 'path must stay inside the workspace')
        return
      }
      if (!info.isFile()) {
        fail(res, 400, 'bad-request', 'path is not a file')
        return
      }
      if (info.size > READ_LIMIT) {
        fail(res, 413, 'too-large', `file exceeds ${READ_LIMIT} bytes`)
        return
      }
      const content = await readFile(target, 'utf8')
      const offset = Number.isInteger(record?.offset) && record.offset >= 0 ? record.offset : 0
      const limit = Number.isInteger(record?.limit) && record.limit >= 0 ? record.limit : null
      const unit = record?.unit === 'byte' ? 'byte' : 'line'
      let sliced = content
      if (offset > 0 || limit !== null) {
        if (unit === 'byte') {
          const buffer = Buffer.from(content, 'utf8')
          sliced = buffer.subarray(offset, limit === null ? undefined : offset + limit).toString('utf8')
        }
        else {
          const lines = content.split('\n')
          sliced = lines.slice(offset, limit === null ? undefined : offset + limit).join('\n')
        }
      }
      json(res, 200, {
        ok: true,
        content: sliced,
        bytes: Buffer.byteLength(sliced, 'utf8'),
        total: info.size,
        unit,
        offset,
        limit,
      })
      return
    }
    if (op === 'write') {
      const content = record?.content
      if (typeof content !== 'string') {
        fail(res, 400, 'bad-request', 'content must be a string')
        return
      }
      const bytes = Buffer.byteLength(content, 'utf8')
      if (bytes > WRITE_LIMIT) {
        fail(res, 413, 'too-large', `content exceeds ${WRITE_LIMIT} bytes`)
        return
      }
      if (!await realInside(realRoot, path.dirname(target), true)) {
        fail(res, 400, 'bad-request', 'path must stay inside the workspace')
        return
      }
      const mode = record?.mode === 'append' ? 'append' : 'replace'
      let currentSize = 0
      try {
        const info = await stat(target)
        if (info.isDirectory()) {
          fail(res, 400, 'bad-request', 'path is a directory')
          return
        }
        currentSize = info.size
      }
      catch {
        // The file does not exist yet; the write creates it.
      }
      const total = mode === 'append' ? currentSize + bytes : bytes
      if (total > WRITE_LIMIT) {
        fail(res, 413, 'too-large', `resulting file would exceed ${WRITE_LIMIT} bytes`)
        return
      }
      await mkdir(path.dirname(target), { recursive: true })
      if (mode === 'append') await appendFile(target, content, 'utf8')
      else await writeFile(target, content, 'utf8')
      json(res, 200, { ok: true, bytes, total, mode })
      return
    }
    if (op === 'replace') {
      const search = record?.search
      const replacement = record?.replacement
      if (typeof search !== 'string' || search === '') {
        fail(res, 400, 'bad-request', 'search must be a non-empty string')
        return
      }
      if (typeof replacement !== 'string') {
        fail(res, 400, 'bad-request', 'replacement must be a string')
        return
      }
      const limit = Number.isInteger(record?.limit) && record.limit >= 0 ? record.limit : 1
      let info
      try {
        info = await stat(target)
      }
      catch {
        fail(res, 404, 'not-found', 'file does not exist')
        return
      }
      if (!await realInside(realRoot, target, false)) {
        fail(res, 400, 'bad-request', 'path must stay inside the workspace')
        return
      }
      if (!info.isFile()) {
        fail(res, 400, 'bad-request', 'path is not a file')
        return
      }
      if (info.size > READ_LIMIT) {
        fail(res, 413, 'too-large', `file exceeds ${READ_LIMIT} bytes`)
        return
      }
      const content = await readFile(target, 'utf8')
      let replaced = 0
      let next
      if (limit === 0) {
        const parts = content.split(search)
        replaced = parts.length - 1
        next = parts.join(replacement)
      }
      else {
        let index = 0
        let output = ''
        while (replaced < limit) {
          const at = content.indexOf(search, index)
          if (at === -1) break
          output += content.slice(index, at) + replacement
          index = at + search.length
          replaced += 1
        }
        next = output + content.slice(index)
      }
      if (replaced === 0) {
        json(res, 200, { ok: true, replaced: 0, bytes: info.size })
        return
      }
      const nextBytes = Buffer.byteLength(next, 'utf8')
      if (nextBytes > WRITE_LIMIT) {
        fail(res, 413, 'too-large', `resulting file would exceed ${WRITE_LIMIT} bytes`)
        return
      }
      await writeFile(target, next, 'utf8')
      json(res, 200, { ok: true, replaced, bytes: nextBytes })
      return
    }
    if (op === 'list') {
      let info
      try {
        info = await stat(target)
      }
      catch {
        fail(res, 404, 'not-found', 'directory does not exist')
        return
      }
      if (!await realInside(realRoot, target, false)) {
        fail(res, 400, 'bad-request', 'path must stay inside the workspace')
        return
      }
      if (!info.isDirectory()) {
        fail(res, 400, 'bad-request', 'path is not a directory')
        return
      }
      const dirents = await readdir(target, { withFileTypes: true })
      dirents.sort((left, right) => {
        if (left.isDirectory() !== right.isDirectory())
          return left.isDirectory() ? -1 : 1
        return left.name.localeCompare(right.name)
      })
      const entries = []
      for (const dirent of dirents.slice(0, ENTRY_LIMIT)) {
        const entry = {
          name: dirent.name,
          type: dirent.isDirectory() ? 'directory' : dirent.isFile() ? 'file' : 'other',
        }
        if (dirent.isFile()) {
          try {
            entry.size = (await stat(path.join(target, dirent.name))).size
          }
          catch {
            // A file disappearing between readdir and stat still lists by name.
          }
        }
        entries.push(entry)
      }
      json(res, 200, { ok: true, entries, truncated: dirents.length > ENTRY_LIMIT })
      return
    }
    fail(res, 400, 'bad-request', `unknown op: ${op}`)
  }
  catch (cause) {
    fail(res, 500, 'files-failed', cause instanceof Error ? cause.message : String(cause))
  }
}
