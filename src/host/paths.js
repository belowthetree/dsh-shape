/**
 * Path and reply helpers shared by the routes that let a shape touch a
 * workspace: containment checks for relative paths and their real locations.
 * @module @belowthetree/dsh-shape/host/paths
 */
import { realpath } from 'node:fs/promises'
import path from 'node:path'
import { json } from './http.js'

/**
 * Resolve a workspace-relative path and prove it stays inside the root.
 * @param root - absolute workspace directory.
 * @param relative - caller-supplied relative path.
 * @returns the absolute target, or null when the path escapes the root.
 */
export function resolveInside(root, relative) {
  if (typeof relative !== 'string' || relative.includes('\0'))
    return null
  const normalized = relative.replaceAll('\\', '/')
  if (normalized.startsWith('/') || /^[A-Za-z]:/.test(normalized))
    return null
  const target = path.resolve(root, normalized)
  const rel = path.relative(root, target)
  if (rel === '')
    return target
  if (rel.startsWith('..') || path.isAbsolute(rel))
    return null
  return target
}

/**
 * Check the real location of a target (or its nearest existing ancestor).
 * @param realRoot - real path of the workspace root.
 * @param target - absolute target path.
 * @param allowMissing - walk up when the target itself does not exist yet.
 * @returns true when the real location is the root or below it.
 */
export async function realInside(realRoot, target, allowMissing) {
  let current = target
  for (let depth = 0; depth < 64; depth += 1) {
    try {
      const real = await realpath(current)
      const rel = path.relative(realRoot, real)
      return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel))
    }
    catch {
      if (!allowMissing)
        return false
      const parent = path.dirname(current)
      if (parent === current)
        return false
      current = parent
    }
  }
  return false
}

/**
 * Send one structured failure.
 * @param res - server response.
 * @param status - HTTP status.
 * @param code - stable error code.
 * @param message - human-readable message.
 */
export function fail(res, status, code, message) {
  json(res, status, { ok: false, error: { code, message } })
}
