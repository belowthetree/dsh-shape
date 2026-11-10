/**
 * Host plugin entry: discover shapes, keep their enable state, and mount the
 * `/dsh-shape` routes on the Web server.
 * @module @belowthetree/dsh-shape/host/plugin
 */
import { mkdir, rm } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { isInsideRoot, readRoot } from './shapes.js'
import { API, CLIENT, ROUTE, VIEW, json, readJsonBody, serveClient, serveView } from './http.js'
import { serveData } from './data.js'
import { serveFiles } from './files.js'
import { serveShell } from './shell.js'
import { dshHome, readCapabilityCatalog, readCapabilityMirror, readEnabledState, writeCapabilityMirror, writeEnabledState } from './state.js'
/** Plugin name shown in the Loader. */
export const name = '@belowthetree/dsh-shape'
/** The shape browser mounts beside the Web server. */
export const inject = ['webServer']
/**
 * Mount the shape browser and scan folder-based shapes at boot.
 * @param ctx - host context carrying `webServer`.
 * @param config - optional user shape root.
 */
export async function apply(ctx, config = {}) {
  const bundledDir = fileURLToPath(new URL('../../shapes/', import.meta.url))
  const userDir = config.dir === undefined
    ? path.join(dshHome(), 'dsh-shape', 'shapes')
    : path.resolve(config.dir)
  const stateDir = path.join(dshHome(), 'dsh-shape')
  const stateFile = path.join(stateDir, 'state.json')
  const capabilityFile = path.join(stateDir, 'capabilities.json')
  let capabilityCatalog = await readCapabilityMirror(capabilityFile)
  const enabledById = await readEnabledState(stateFile)
  const saveEnabled = async () => {
    await writeEnabledState(stateFile, enabledById)
  }
  try {
    await mkdir(userDir, { recursive: true })
  }
  catch {
    // A missing user directory is not fatal; bundled shapes still load.
  }
  let shapes = []
  /** Signature of every module URL a loaded page may have imported. */
  const clientRevision = () => shapes
    .map(shape => `${shape.id}[${shape.enabled === false ? 'off' : 'on'}](${shape.clientFiles.join('|')})`)
    .join('\n')
  let revision = clientRevision()
  const refresh = async () => {
    const bundled = await readRoot(bundledDir, 'bundled')
    const user = await readRoot(userDir, 'user')
    const byId = new Map(bundled.map(shape => [shape.id, shape]))
    for (const shape of user)
      byId.set(shape.id, shape)
    shapes = [...byId.values()]
      .map(shape => ({ ...shape, enabled: enabledById.get(shape.id) !== false }))
      .sort((left, right) => left.id.localeCompare(right.id))
    const next = clientRevision()
    const changed = next !== revision
    revision = next
    return { shapes, revision, changed }
  }
  const snapshot = () => ({
    ok: true,
    shapes,
    roots: { bundled: bundledDir, user: userDir },
  })
  const handler = async (req, res) => {
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
      let body
      try {
        body = await readJsonBody(req)
      }
      catch {
        json(res, 400, { ok: false, error: { code: 'bad-request', message: 'invalid JSON body' } })
        return
      }
      const record = typeof body === 'object' && body !== null && !Array.isArray(body)
        ? body
        : undefined
      try {
        const catalog = readCapabilityCatalog(record?.capabilities)
        await writeCapabilityMirror(capabilityFile, catalog)
        capabilityCatalog = catalog
        json(res, 200, { ok: true, capabilities: capabilityCatalog })
      }
      catch (cause) {
        json(res, 400, {
          ok: false,
          error: { code: 'invalid-capabilities', message: cause instanceof Error ? cause.message : String(cause) },
        })
      }
      return
    }
    if (req.method === 'POST' && url.pathname === `${API}/refresh`) {
      const result = await refresh()
      json(res, 200, { ...snapshot(), revision: result.revision, changed: result.changed })
      return
    }
    if (req.method === 'POST' && url.pathname === `${API}/toggle`) {
      let body
      try {
        body = await readJsonBody(req)
      }
      catch {
        json(res, 400, { ok: false, error: { code: 'bad-request', message: 'invalid JSON body' } })
        return
      }
      const record = typeof body === 'object' && body !== null && !Array.isArray(body)
        ? body
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
      }
      catch (cause) {
        if (previous === undefined)
          enabledById.delete(id)
        else
          enabledById.set(id, previous)
        json(res, 500, {
          ok: false,
          error: { code: 'state-write-failed', message: cause instanceof Error ? cause.message : String(cause) },
        })
        return
      }
      shapes = shapes.map(candidate => candidate.id === id ? { ...candidate, enabled } : candidate)
      // The page re-imported every shape in place from the snapshot above, so this
      // flag is already live: leaving `revision` behind made the next refresh report
      // `changed: true` and reload the whole Harness for a state it already had.
      revision = clientRevision()
      json(res, 200, snapshot())
      return
    }
    if (req.method === 'POST' && url.pathname === `${API}/delete`) {
      let body
      try {
        body = await readJsonBody(req)
      }
      catch {
        json(res, 400, { ok: false, error: { code: 'bad-request', message: 'invalid JSON body' } })
        return
      }
      const record = typeof body === 'object' && body !== null && !Array.isArray(body)
        ? body
        : undefined
      const id = record?.id
      if (typeof id !== 'string') {
        json(res, 400, { ok: false, error: { code: 'bad-request', message: 'id is required' } })
        return
      }
      const shape = shapes.find(candidate => candidate.id === id)
      if (shape === undefined) {
        json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown shape' } })
        return
      }
      if (!isInsideRoot(bundledDir, shape.dir) && !isInsideRoot(userDir, shape.dir)) {
        json(res, 409, {
          ok: false,
          error: { code: 'outside-roots', message: 'shape directory is outside the shape roots' },
        })
        return
      }
      try {
        await rm(shape.dir, { recursive: true, force: true })
      }
      catch (cause) {
        json(res, 500, {
          ok: false,
          error: { code: 'delete-failed', message: cause instanceof Error ? cause.message : String(cause) },
        })
        return
      }
      if (enabledById.delete(id)) {
        try {
          await saveEnabled()
        }
        catch {
          // The folder is already gone; a stale enable flag is harmless.
        }
      }
      await refresh()
      json(res, 200, snapshot())
      return
    }
    if (req.method === 'POST' && url.pathname === `${API}/data`) {
      await serveData(req, res, shapes)
      return
    }
    if ((req.method === 'GET' || req.method === 'POST') && url.pathname === `${API}/files`) {
      await serveFiles(req, res)
      return
    }
    if (url.pathname === `${API}/shell`) {
      // The `shell` service is optional: a host that does not mount one answers
      // 501 from the route instead of failing to load this plugin.
      await serveShell(req, res, () => ctx.get('shell'))
      return
    }
    if (req.method === 'GET' && url.pathname.startsWith(`${VIEW}/`)) {
      await serveView(url, res, shapes)
      return
    }
    if (req.method === 'GET' && url.pathname.startsWith(`${CLIENT}/`)) {
      await serveClient(url, res, shapes)
      return
    }
    json(res, 404, { ok: false, error: { code: 'not-found', message: 'unknown dsh-shape route' } })
  }
  await refresh()
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: ROUTE,
    handler,
  }), 'dsh-shape: shape browser route')
}
