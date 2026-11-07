/** Runtime that loads enabled shape Client modules after capability checks. */

import type { ShapeCapabilityRegistry, ShapeRequirement } from '../capabilities.ts'
import { supportsShapeApiVersion } from '../capabilities.ts'
import { disposeShapeMounts, isShapeSlot, registerShapeMount, type ShapePlacementOptions } from './shape-slots.ts'
import { disposeShapeEvents } from './shape-events.ts'

interface ShapeInfo {
  id: string
  title: string
  version: string
  valid: boolean
  enabled?: boolean
  shapeApiVersion?: number
  requirements?: ShapeRequirement[]
  clientEntry?: string
}

/** One shortcut a shape asks the runtime to own. */
export interface ShapeShortcutBinding {
  /** Stable name used for diagnostics. */
  id?: string
  /** One or more key combinations such as `Ctrl+Alt+ArrowRight`. */
  keys: string | readonly string[]
  /** Action invoked when the combination matches. */
  run: () => void | Promise<void>
}

/** API handed to a shape Client module. */
export interface ShapeClientApi {
  shape: Readonly<{ id: string; title: string; version: string }>
  capabilities: Readonly<Record<string, unknown>>
  require: (plugin: string, capability: string) => unknown
  /**
   * Render into one conversation slot.
   * @param slot - supported slot name; see `SHAPE_SLOTS`.
   * @param render - receives the slot's container; returns an optional cleanup.
   * @param options - placement for the panel slot: anchored (default) or floating.
   * @returns an idempotent disposer.
   */
  mount: (
    slot: string,
    render: (container: HTMLElement) => (() => void) | void,
    options?: ShapePlacementOptions,
  ) => () => void
  shortcuts: {
    register: (binding: ShapeShortcutBinding) => () => void
  }
}

interface ShapeModule {
  activate?: (api: ShapeClientApi) => void | (() => void) | { dispose?: () => void }
  deactivate?: () => void
}

/**
 * Bind capability providers that expose a per-shape view to the receiving shape.
 * @param capabilities - resolved capability map.
 * @param shapeId - shape receiving the API.
 * @returns the map handed to that shape.
 */
function scopeCapabilities(
  capabilities: Readonly<Record<string, unknown>>,
  shape: { id: string; title: string },
): Record<string, unknown> {
  const scoped: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(capabilities)) {
    const provider = value as { forShape?: (id: string, info: { title: string }) => unknown } | null
    scoped[key] = typeof provider?.forShape === 'function'
      ? provider.forShape(shape.id, { title: shape.title })
      : value
  }
  return scoped
}

interface ParsedShortcut {
  ctrl: boolean
  alt: boolean
  shift: boolean
  meta: boolean
  key: string
}

interface RegisteredShortcut extends ParsedShortcut {
  run: () => void | Promise<void>
}

interface ActiveShape {
  id: string
  dispose: () => void
}

const KEY_ALIASES: Record<string, string> = {
  esc: 'Escape',
  space: ' ',
  period: '.',
  comma: ',',
  slash: '/',
  arrowleft: 'ArrowLeft',
  arrowright: 'ArrowRight',
  arrowup: 'ArrowUp',
  arrowdown: 'ArrowDown',
  enter: 'Enter',
  tab: 'Tab',
}

/**
 * Normalize one key token.
 * @param token - raw token from a shortcut string.
 * @returns browser key or code.
 */
function normalizeKeyToken(token: string): string {
  if (token.length === 1) return token.toLowerCase()
  return KEY_ALIASES[token.toLowerCase()] ?? token
}

/**
 * Parse one shortcut string.
 * @param spec - combination such as `Ctrl+Alt+ArrowRight`.
 * @returns normalized modifiers and key.
 */
function parseShortcut(spec: string): ParsedShortcut {
  const parts = spec.split('+').map(part => part.trim()).filter(part => part.length > 0)
  const key = parts.pop()
  if (key === undefined) throw new Error(`invalid shortcut: ${spec}`)
  const parsed: ParsedShortcut = { ctrl: false, alt: false, shift: false, meta: false, key: normalizeKeyToken(key) }
  for (const modifier of parts) {
    switch (modifier.toLowerCase()) {
      case 'ctrl':
      case 'control':
        parsed.ctrl = true
        break
      case 'alt':
        parsed.alt = true
        break
      case 'shift':
        parsed.shift = true
        break
      case 'meta':
      case 'cmd':
      case 'command':
        parsed.meta = true
        break
      default:
        throw new Error(`unknown shortcut modifier: ${modifier}`)
    }
  }
  return parsed
}

/**
 * Check whether a keyboard event matches a parsed shortcut.
 * @param event - keyboard event.
 * @param shortcut - parsed combination.
 * @returns true on an exact modifier and key match.
 */
function matchesShortcut(event: KeyboardEvent, shortcut: ParsedShortcut): boolean {
  if (event.ctrlKey !== shortcut.ctrl || event.altKey !== shortcut.alt
    || event.shiftKey !== shortcut.shift || event.metaKey !== shortcut.meta) return false
  const key = event.key.length === 1 ? event.key.toLowerCase() : event.key
  return key === shortcut.key || event.code === shortcut.key
}

/**
 * Create the shape Client runtime.
 * @param capabilities - registry used for startup dependency checks.
 * @returns a start function returning its disposer.
 */
export function createShapeRuntime(capabilities: ShapeCapabilityRegistry): { start: () => () => void } {
  const shortcuts = new Map<string, RegisteredShortcut>()
  const active: ActiveShape[] = []
  let generation = 0
  let started = false

  const stopAll = (): void => {
    for (const shape of active.splice(0)) shape.dispose()
    shortcuts.clear()
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.repeat || event.isComposing) return
    for (const shortcut of shortcuts.values()) {
      if (!matchesShortcut(event, shortcut)) continue
      event.preventDefault()
      try {
        void Promise.resolve(shortcut.run()).catch((cause: unknown) => {
          console.warn('dsh-shape: shortcut failed', cause)
        })
      } catch (cause) {
        console.warn('dsh-shape: shortcut failed', cause)
      }
      return
    }
  }

  const refresh = async (): Promise<void> => {
    const current = ++generation
    stopAll()
    let shapes: ShapeInfo[]
    try {
      const response = await fetch('/dsh-shape/api/shapes', { credentials: 'same-origin', cache: 'no-store' })
      if (!response.ok) return
      const payload = await response.json() as { ok?: boolean; shapes?: ShapeInfo[] }
      if (payload.ok !== true || !Array.isArray(payload.shapes)) return
      shapes = payload.shapes
    } catch {
      return
    }

    for (const shape of shapes) {
      if (current !== generation) return
      if (shape.enabled === false || !shape.valid || shape.clientEntry === undefined) continue
      if (!supportsShapeApiVersion(shape.shapeApiVersion)) continue
      const resolution = capabilities.resolve(shape.requirements ?? [])
      if (!resolution.ok) continue

      const state = {
        shortcuts: [] as Array<() => void>,
        mounts: [] as Array<() => void>,
        cleanup: undefined as (() => void) | undefined,
      }
      const scopedCapabilities = scopeCapabilities(resolution.capabilities, shape)
      const api: ShapeClientApi = {
        shape: { id: shape.id, title: shape.title, version: shape.version },
        capabilities: scopedCapabilities,
        require(plugin, capability) {
          const key = `${plugin}#${capability}`
          if (!(key in scopedCapabilities)) throw new Error(`capability not declared: ${key}`)
          return scopedCapabilities[key]
        },
        mount(slot, render, options) {
          if (!isShapeSlot(slot)) throw new Error(`unsupported shape slot: ${slot}`)
          const off = registerShapeMount({
            slot,
            shapeId: shape.id,
            title: shape.title,
            placement: options?.placement === 'floating' ? 'floating' : 'anchored',
            snap: options?.snap !== false,
            render,
          })
          state.mounts.push(off)
          return off
        },
        shortcuts: {
          register(binding) {
            const specs = typeof binding.keys === 'string' ? [binding.keys] : binding.keys
            const disposers: Array<() => void> = []
            for (const spec of specs) {
              const parsed = parseShortcut(spec)
              const key = `${String(parsed.ctrl)}|${String(parsed.alt)}|${String(parsed.shift)}|${String(parsed.meta)}|${parsed.key}`
              if (shortcuts.has(key)) throw new Error(`shortcut conflict: ${spec}`)
              const registered: RegisteredShortcut = { ...parsed, run: binding.run }
              shortcuts.set(key, registered)
              const off = (): void => {
                if (shortcuts.get(key) === registered) shortcuts.delete(key)
              }
              disposers.push(off)
              state.shortcuts.push(off)
            }
            return () => { for (const off of disposers) off() }
          },
        },
      }

      let url = `/dsh-shape/client/${encodeURIComponent(shape.id)}/${shape.clientEntry}`
      url += `?v=${encodeURIComponent(shape.version)}-${String(Date.now())}`
      try {
        const module = await import(/* @vite-ignore */ url) as ShapeModule
        if (current !== generation) return
        if (typeof module.activate !== 'function') continue
        const result = module.activate(api)
        if (typeof result === 'function') state.cleanup = result
        else if (result !== undefined && typeof result.dispose === 'function') state.cleanup = result.dispose
        active.push({
          id: shape.id,
          dispose: () => {
            state.cleanup?.()
            module.deactivate?.()
            for (const off of state.mounts) off()
            for (const off of state.shortcuts) off()
            disposeShapeMounts(shape.id)
            disposeShapeEvents(shape.id)
          },
        })
      } catch (cause) {
        for (const off of state.mounts) off()
        for (const off of state.shortcuts) off()
        disposeShapeMounts(shape.id)
        disposeShapeEvents(shape.id)
        state.cleanup?.()
        console.warn(`dsh-shape: failed to activate ${shape.id}`, cause)
      }
    }
  }

  const start = (): (() => void) => {
    if (started) throw new Error('shape runtime already started')
    started = true
    window.addEventListener('keydown', onKeyDown)
    const reload = (): void => { void refresh() }
    window.addEventListener('dsh-shape:refresh', reload)
    window.addEventListener('dsh-shape:capabilities', reload)
    void refresh()
    return () => {
      started = false
      generation++
      stopAll()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('dsh-shape:refresh', reload)
      window.removeEventListener('dsh-shape:capabilities', reload)
    }
  }

  return { start }
}
