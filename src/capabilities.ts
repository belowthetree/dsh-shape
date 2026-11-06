/** Versioned capabilities that shape plugins can discover and depend on. */

import { satisfies, valid, validRange } from 'semver'

/** Shape Client module ABI supported by this dsh-shape build. */
export const SHAPE_API_VERSION = 1

/**
 * Check whether a shape module ABI can run here.
 * @param version - declared shape apiVersion; absent defaults to 1.
 * @returns true when supported.
 */
export function supportsShapeApiVersion(version?: number): boolean {
  return (version ?? SHAPE_API_VERSION) === SHAPE_API_VERSION
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

/** One capability offered by a provider plugin. */
export interface ShapeCapability {
  /** Providing plugin package name. */
  plugin: string
  /** Capability name within that plugin. */
  capability: string
  /** Capability contract version, independent of the plugin package version. */
  version: string
  /** Narrow API passed to shapes that require this capability. */
  api: unknown
}

/** One requirement that could not be satisfied. */
export interface ShapeMissingCapability {
  plugin: string
  capability: string
  range: string
  /** Provider version when one exists. */
  found?: string
  reason: 'missing' | 'version-mismatch' | 'invalid-range'
}

/** Result of resolving a shape's capability requirements. */
export interface ShapeResolution {
  ok: boolean
  /** APIs keyed by `plugin#capability`. */
  capabilities: Record<string, unknown>
  missing: ShapeMissingCapability[]
}

/** Registry exposed to capability providers and shape startup. */
export interface ShapeCapabilityRegistry {
  /**
   * Register a capability.
   * @param capability - provider identity, version, and API.
   * @returns a disposer that removes the capability.
   */
  provide(capability: ShapeCapability): () => void
  /**
   * Read one capability by qualified identity.
   * @param plugin - provider package name.
   * @param capability - capability name.
   * @returns the capability, when registered.
   */
  get(plugin: string, capability: string): ShapeCapability | undefined
  /**
   * List registered capabilities.
   * @returns a snapshot of all capabilities.
   */
  list(): readonly ShapeCapability[]
  /**
   * Observe registration and removal.
   * @param listener - change callback.
   * @returns unsubscribe function.
   */
  subscribe(listener: () => void): () => void
  /**
   * Resolve a shape's requirements against the current registry.
   * @param requirements - declared plugin/capability/version requirements.
   * @returns resolved APIs and every missing required capability.
   */
  resolve(requirements: readonly ShapeRequirement[]): ShapeResolution
}

/** Props for a slot component that checks shape dependencies. */
export interface ShapeResolverInjected {
  resolveShape: (requirements: readonly ShapeRequirement[]) => ShapeResolution
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Shape capability registry provided by the dsh-shape Client half. */
    shapeCapabilities: ShapeCapabilityRegistry
  }
}

/**
 * Build the capability registry exposed to other Client plugins.
 * @returns a registry whose entries disappear when their disposer is called.
 */
export function createShapeCapabilityRegistry(): ShapeCapabilityRegistry {
  const entries = new Map<string, ShapeCapability>()
  const listeners = new Set<() => void>()
  const keyOf = (plugin: string, capability: string): string => `${plugin}#${capability}`
  const notify = (): void => {
    for (const listener of listeners) listener()
  }

  return {
    provide(capability) {
      if (capability.plugin.trim().length === 0 || capability.capability.trim().length === 0) {
        throw new Error('capability plugin and capability must be non-empty')
      }
      if (!valid(capability.version)) {
        throw new Error(`invalid capability version: ${capability.version}`)
      }
      const key = keyOf(capability.plugin, capability.capability)
      if (entries.has(key)) throw new Error(`capability already provided: ${key}`)
      entries.set(key, capability)
      notify()
      let disposed = false
      return () => {
        if (disposed) return
        disposed = true
        if (entries.get(key) === capability) entries.delete(key)
        notify()
      }
    },
    get(plugin, capability) {
      return entries.get(keyOf(plugin, capability))
    },
    list() {
      return [...entries.values()]
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
    resolve(requirements) {
      const capabilities: Record<string, unknown> = {}
      const missing: ShapeMissingCapability[] = []
      for (const requirement of requirements) {
        const key = keyOf(requirement.plugin, requirement.capability)
        if (validRange(requirement.version) === null) {
          missing.push({ ...requirement, range: requirement.version, reason: 'invalid-range' })
          continue
        }
        const found = entries.get(key)
        if (found === undefined) {
          if (requirement.optional !== true) {
            missing.push({ ...requirement, range: requirement.version, reason: 'missing' })
          }
          continue
        }
        if (!satisfies(found.version, requirement.version, { includePrerelease: true })) {
          missing.push({
            plugin: requirement.plugin,
            capability: requirement.capability,
            range: requirement.version,
            found: found.version,
            reason: 'version-mismatch',
          })
          continue
        }
        capabilities[key] = found.api
      }
      return { ok: missing.length === 0, capabilities, missing }
    },
  }
}
