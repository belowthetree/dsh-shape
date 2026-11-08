/**
 * Persistent host state: the enable/disable map and the capability mirror the
 * running client writes back, both kept under `$DSH_HOME/dsh-shape`.
 * @module @belowthetree/dsh-shape/host/state
 */
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import path from 'node:path'
/**
 * Resolve `$DSH_HOME`, falling back to `~/.dsh`.
 * @returns absolute home directory for DSH state.
 */
export function dshHome() {
  return process.env.DSH_HOME ?? path.join(homedir(), '.dsh')
}
/**
 * Read the version of this installed package.
 * @returns the version string, or null when package.json is unreadable.
 */
export async function readOwnVersion() {
  try {
    const value = JSON.parse(await readFile(new URL('../../package.json', import.meta.url), 'utf8'))
    return typeof value?.version === 'string' ? value.version : null
  }
  catch {
    return null
  }
}
/**
 * Validate a Client capability catalog payload.
 * @param value - decoded JSON value.
 * @returns validated entries.
 */
export function readCapabilityCatalog(value) {
  if (!Array.isArray(value) || value.length > 256)
    throw new Error('capabilities must be an array')
  return value.map((entry) => {
    if (typeof entry !== 'object' || entry === null || Array.isArray(entry))
      throw new Error('invalid capability entry')
    const record = entry
    const plugin = record.plugin
    const capability = record.capability
    const version = record.version
    const description = record.description
    const usage = record.usage
    const methods = record.methods
    const fields = record.fields
    if (typeof plugin !== 'string' || plugin.length === 0 || plugin.length > 200)
      throw new Error('invalid capability plugin')
    if (typeof capability !== 'string' || capability.length === 0 || capability.length > 200)
      throw new Error('invalid capability name')
    if (typeof version !== 'string' || version.length === 0 || version.length > 100)
      throw new Error('invalid capability version')
    if (description !== undefined && (typeof description !== 'string' || description.length > 2000))
      throw new Error('invalid capability description')
    if (usage !== undefined && (typeof usage !== 'string' || usage.length > 8000))
      throw new Error('invalid capability usage')
    if (!Array.isArray(methods) || methods.some(item => typeof item !== 'string' || item.length > 200))
      throw new Error('invalid capability methods')
    if (!Array.isArray(fields) || fields.some(item => typeof item !== 'string' || item.length > 300))
      throw new Error('invalid capability fields')
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
 * Read the capability mirror, tolerating an absent or stale file.
 * @param file - absolute path of `capabilities.json`.
 * @returns the catalog, or an empty list.
 */
export async function readCapabilityMirror(file) {
  try {
    const saved = JSON.parse(await readFile(file, 'utf8'))
    // Older builds wrote a bare array; current ones write the versioned mirror.
    return readCapabilityCatalog(Array.isArray(saved) ? saved : saved?.capabilities)
  }
  catch {
    // The Client refreshes the mirror after startup; absent or stale content is non-fatal.
    return []
  }
}
/**
 * Write the capability mirror in its versioned form.
 * @param file - absolute path of `capabilities.json`.
 * @param catalog - entries to persist.
 */
export async function writeCapabilityMirror(file, catalog) {
  await mkdir(path.dirname(file), { recursive: true })
  await writeFile(file, `${JSON.stringify({
    packageVersion: await readOwnVersion(),
    syncedAt: new Date().toISOString(),
    capabilities: catalog,
  }, null, 2)}\n`, 'utf8')
}
/**
 * Read the enable/disable map, tolerating a missing or malformed file.
 * @param file - absolute path of `state.json`.
 * @returns shape id to enabled flag; an empty map enables every shape.
 */
export async function readEnabledState(file) {
  const enabledById = new Map()
  try {
    const saved = JSON.parse(await readFile(file, 'utf8'))
    if (typeof saved === 'object' && saved !== null && !Array.isArray(saved)) {
      for (const [id, enabled] of Object.entries(saved)) {
        if (typeof enabled === 'boolean')
          enabledById.set(id, enabled)
      }
    }
  }
  catch {
    // Missing or malformed state starts with every shape enabled.
  }
  return enabledById
}
/**
 * Persist the enable/disable map with sorted keys.
 * @param file - absolute path of `state.json`.
 * @param enabledById - current flags.
 */
export async function writeEnabledState(file, enabledById) {
  await mkdir(path.dirname(file), { recursive: true })
  const state = Object.fromEntries([...enabledById.entries()].sort(([left], [right]) => left.localeCompare(right)))
  await writeFile(file, `${JSON.stringify(state, null, 2)}\n`, 'utf8')
}
