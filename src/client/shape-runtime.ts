/** Runtime that loads enabled shape Client modules after capability checks. */

import type { ShapeCapabilityRegistry, ShapeRequirement } from '../shared/capabilities.ts'
import { supportsShapeApiVersion } from '../shared/capabilities.ts'
import { disposeShapeMounts, isShapeSlot, registerShapeMount, type ShapePlacementOptions } from './shape-slots.ts'
import { disposeShapeEvents } from './shape-events.ts'
import {
  closeShapeEdge,
  disposeShapeEdges,
  isShapeEdgeOpen,
  openShapeEdge,
  registerShapeEdge,
  toggleShapeEdge,
  type ShapeEdge,
} from './shape-edges.ts'
import {
  disposeShapePanels,
  disposeShapeTabs,
  openShapePanel,
  openShapeTab,
  registerShapePanel,
  registerShapeTab,
} from './shape-surfaces.ts'
import {
  disposeShapeWorkbenches,
  openShapeWorkbench,
  registerShapeWorkbench,
} from './shape-workbench.ts'

interface ShapeInfo {
  id: string
  title: string
  version: string
  valid: boolean
  enabled?: boolean
  shapeApiVersion?: number
  /** Declared kind; only `workbench` may register a workbench surface. */
  kind?: string
  requirements?: ShapeRequirement[]
  clientEntry?: string
  /** Content signature of the shape's `client/` folder, used to version module URLs. */
  clientHash?: string
  /** Files below `views/`, relative to that directory. */
  views?: string[]
  /**
   * How the shape is woken: `eager` activates it at page load, `keys` are
   * page-level combinations that wake it first. Absent means dormant until the
   * Shapes browser opens it.
   */
  wake?: { keys?: readonly string[]; eager?: boolean }
}

/** One shortcut a shape asks the runtime to own. */
export interface ShapeShortcutBinding {
  /** Stable name used for diagnostics. */
  id?: string
  /** One or more key combinations such as `Ctrl+Alt+ArrowRight`. */
  keys: string | readonly string[]  /** Action invoked when the combination matches. */
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
  /**
   * Contribute a left sidebar panel.
   * @param options - panel id, title, order, and render callback.
   * @returns a handle that opens the panel and releases it.
   */
  panel: (options: ShapePanelOptions) => ShapePanelHandle
  /**
   * Contribute a right sidebar tab.
   * @param options - tab id, title, and render callback.
   * @returns a handle that opens the tab and releases it.
   */
  tab: (options: ShapeTabOptions) => ShapeTabHandle
  /**
   * Contribute an edge popup: a window that slides in from one viewport edge
   * and renders one of the shape's `views/` pages.
   * @param options - popup id, edge, view, size, shortcut, and Escape policy.
   * @returns a handle that opens, closes, and releases the popup.
   */
  edge: (options: ShapeEdgeOptions) => ShapeEdgeHandle
  /**
   * Contribute a workbench surface to the Workbench window. Only shapes whose
   * manifest declares `shape.kind: "workbench"` may call it.
   * @param options - workbench id, title, order, and render callback.
   * @returns a handle that shows the workbench and releases it.
   */
  workbench: (options: ShapeWorkbenchOptions) => ShapeWorkbenchHandle
  shortcuts: {
    register: (binding: ShapeShortcutBinding) => () => void
  }
}

/** Options accepted by `api.panel()`. */
export interface ShapePanelOptions {
  /** Panel id, namespaced per shape by the runtime. */
  id: string
  /** Sidebar label. */
  title: string
  /** Sidebar order; lower sorts first. */
  order?: number
  /**
   * Render the panel body.
   * @param container - element owned by the panel host.
   * @returns an optional cleanup run before the container is dropped.
   */
  render: (container: HTMLElement) => (() => void) | void
}

/** Handle returned by `api.panel()`. */
export interface ShapePanelHandle {
  /** Namespaced panel id. */
  readonly id: string
  /** Select the panel in the main area. */
  open: () => void
  /** Remove the panel from the sidebar. */
  dispose: () => void
}

/** Options accepted by `api.tab()`. */
export interface ShapeTabOptions {
  /** Tab id, namespaced per shape by the runtime. */
  id: string
  /** Tab label. */
  title: string
  /**
   * Render the tab body.
   * @param container - element owned by the tab host.
   * @returns an optional cleanup run before the container is dropped.
   */
  render: (container: HTMLElement) => (() => void) | void
}

/** Handle returned by `api.tab()`. */
export interface ShapeTabHandle {
  /** Namespaced tab id. */
  readonly id: string
  /** Open the tab in the right sidebar. */
  open: () => void
  /** Remove the tab type. */
  dispose: () => void
}

/** Options accepted by `api.edge()`. */
export interface ShapeEdgeOptions {
  /** Popup id, namespaced per shape by the runtime. */
  id: string
  /** Window bar label; the shape title when omitted. */
  title?: string
  /** Viewport edge to anchor to; defaults to `right`. */
  edge?: ShapeEdge
  /** File below the shape's `views/` directory; defaults to `index.html`. */
  view?: string
  /** Window width in pixels, or `full` to span the viewport width; the edge default when omitted. */
  width?: number | 'full'
  /** Window height in pixels, or `full` to span the viewport height; the edge default when omitted. */
  height?: number | 'full'
  /** Combination(s) that toggle the popup, such as `Ctrl+Alt+E`. */
  keys?: string | readonly string[]
  /** Whether dragging the window's inner edge resizes it; defaults to true. */
  resizable?: boolean
  /** Whether Escape closes the popup; defaults to true. */
  esc?: boolean
  /**
   * Whether the window rests as a thin strip on its edge and slides out when
   * the pointer reaches it; defaults to false. Top-edge popups ignore it.
   */
  peek?: boolean
}

/** Handle returned by `api.edge()`. */
export interface ShapeEdgeHandle {
  /** Namespaced popup id. */
  readonly id: string
  /** Show the window, raising it above the other open popups. */
  open: () => void
  /** Animate the window out and drop it. */
  close: () => void
  /** Open a closed popup or close an open one. */
  toggle: () => void
  /** Whether the window is currently shown. */
  isOpen: () => boolean
  /** Remove the popup and release its shortcut. */
  dispose: () => void
}

/** Options accepted by `api.workbench()`. */
export interface ShapeWorkbenchOptions {
  /** Workbench id, namespaced per shape by the runtime. */
  id: string
  /** Label shown in the window header and its switcher. */
  title: string
  /** Switcher order; lower sorts first. */
  order?: number
  /**
   * Render the workbench body.
   * @param container - element owned by the workbench window.
   * @returns an optional cleanup run before the window drops the body.
   */
  render: (container: HTMLElement) => (() => void) | void
}

/** Handle returned by `api.workbench()`. */
export interface ShapeWorkbenchHandle {
  /** Namespaced workbench id. */
  readonly id: string
  /** Show the workbench window with this workbench selected. */
  open: () => void
  /** Unregister the workbench surface. */
  dispose: () => void
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

/** One wake key bound to a shape that has not been imported yet. */
interface WakeBinding {
  /** Combination key the binding is stored under. */
  key: string
  /** Dormant shape the key wakes. */
  shape: ShapeInfo
  /** Parsed combination. */
  parsed: ParsedShortcut
}

interface ActiveShape {
  id: string
  /** `clientHash` the running module graph was imported from. */
  hash: string
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
 * Stable key for one combination, so bindings and wake keys stay unique.
 * @param parsed - parsed shortcut.
 * @returns the map key.
 */
function combinationKey(parsed: ParsedShortcut): string {
  return `${String(parsed.ctrl)}|${String(parsed.alt)}|${String(parsed.shift)}|${String(parsed.meta)}|${parsed.key}`
}

/**
 * Normalize the view path an edge popup declares.
 * @param view - path relative to the shape's `views/` directory.
 * @returns the posix path the Host serves.
 */
function normalizeView(view: string): string {
  const normalized = view.trim().replaceAll('\\', '/').replace(/^\.\//u, '')
  if (normalized === '' || normalized.startsWith('/')
    || normalized.split('/').some(segment => segment === '' || segment === '.' || segment === '..')) {
    throw new Error(`dsh-shape: invalid view path "${view}"`)
  }
  return normalized
}

/**
 * Check a declared view against the shape's scanned file listing.
 * @param shape - shape the popup belongs to.
 * @param view - normalized view path.
 * @throws when the shape has no such view; a host that does not report views skips the check.
 */
function assertShapeView(shape: ShapeInfo, view: string): void {
  const views = shape.views
  if (views === undefined) return
  if (views.includes(view)) return
  // The Host serves `index.html` as the shape's first top-level page.
  if (view === 'index.html' && views.some(file => !file.includes('/') && /\.html?$/i.test(file))) return
  const available = views.length === 0 ? 'no views/ directory' : views.join(', ')
  throw new Error(`dsh-shape: shape "${shape.id}" has no view "${view}" (${available})`)
}

/**
 * Validate one optional window dimension.
 * @param value - pixels declared by the shape, or `full`.
 * @param field - field name for the error message.
 * @returns the rounded size, `full`, or undefined when omitted.
 */
function normalizeDimension(value: number | 'full' | undefined, field: string): number | 'full' | undefined {
  if (value === undefined) return undefined
  if (value === 'full') return 'full'
  if (!Number.isFinite(value) || value <= 0) {
    throw new Error(`dsh-shape: edge popup ${field} must be a positive number of pixels or "full"`)
  }
  return Math.round(value)
}

/** Set while a runtime is started; the Shapes browser wakes cards through it. */
let wakeRequest: ((id: string) => void) | undefined

/**
 * Wake one dormant shape. The Shapes browser calls this when a card is opened;
 * it is a no-op when no runtime is running or the shape is already awake.
 * @param id - shape id.
 */
export function wakeShape(id: string): void {
  wakeRequest?.(id)
}

/**
 * Create the shape Client runtime.
 * @param capabilities - registry used for startup dependency checks.
 * @returns a start function returning its disposer.
 */
export function createShapeRuntime(capabilities: ShapeCapabilityRegistry): { start: () => () => void } {
  const shortcuts = new Map<string, RegisteredShortcut>()
  const active: ActiveShape[] = []
  /** Wake keys owned by dormant shapes, keyed by combination. */
  const wakeBindings = new Map<string, WakeBinding>()
  /** Shapes whose module is being imported right now, so a held key wakes once. */
  const waking = new Set<string>()
  /** Restart counters, so restarting one shape gives it a fresh module URL. */
  const restarts = new Map<string, number>()
  let generation = 0
  let started = false

  const stopAll = (): void => {
    for (const shape of active.splice(0)) shape.dispose()
    shortcuts.clear()
    wakeBindings.clear()
  }

  /**
   * Run the first shape shortcut that matches one key event.
   * @param event - key event being dispatched.
   * @returns true when a shortcut consumed the event.
   */
  const runShortcut = (event: KeyboardEvent): boolean => {
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
      return true
    }
    return false
  }

  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.defaultPrevented || event.repeat || event.isComposing) return
    if (runShortcut(event)) return
    for (const binding of wakeBindings.values()) {
      if (!matchesShortcut(event, binding.parsed)) continue
      event.preventDefault()
      void wakeShapeNow(binding.shape.id, event)
      return
    }
  }

  /**
   * Whether a shape can be started at all.
   * @param shape - shape reported by the Host.
   * @returns true when it is enabled, valid, has a client, and its capabilities resolve.
   */
  const canStart = (shape: ShapeInfo): boolean => {
    if (shape.enabled === false || !shape.valid || shape.clientEntry === undefined) return false
    if (!supportsShapeApiVersion(shape.shapeApiVersion)) return false
    return capabilities.resolve(shape.requirements ?? []).ok
  }

  /**
   * Rebuild the wake keys for the shapes that are still dormant.
   * @param shapes - current Host catalog.
   */
  const syncWake = (shapes: ShapeInfo[]): void => {
    const live = new Set<string>()
    for (const shape of shapes) {
      if (shape.wake?.eager === true || !canStart(shape)) continue
      if (active.some(candidate => candidate.id === shape.id)) continue
      const keys = shape.wake?.keys ?? []
      if (keys.length === 0) continue
      live.add(shape.id)
      for (const spec of keys) {
        let parsed: ParsedShortcut
        try {
          parsed = parseShortcut(spec)
        } catch (cause) {
          console.warn(`dsh-shape: ${shape.id} has an invalid wake key "${spec}"`, cause)
          continue
        }
        const key = combinationKey(parsed)
        if (shortcuts.has(key) || wakeBindings.has(key)) continue
        wakeBindings.set(key, { key, shape, parsed })
      }
    }
    for (const [key, binding] of wakeBindings) {
      if (!live.has(binding.shape.id)) wakeBindings.delete(key)
    }
  }

  /**
   * Wake one shape, then hand the key press that woke it to the shape's own
   * bindings — the shape registers them while it activates.
   * @param id - shape id.
   * @param event - key event that woke it, when waking from a shortcut.
   */
  const wakeShapeNow = async (id: string, event?: KeyboardEvent): Promise<void> => {
    if (active.some(candidate => candidate.id === id)) {
      if (event !== undefined) runShortcut(event)
      return
    }
    if (waking.has(id)) return
    waking.add(id)
    try {
      const awake = await refresh({ wake: id })
      if (awake && event !== undefined) runShortcut(event)
    } finally {
      waking.delete(id)
    }
  }

  /**
   * Wake every dormant shape of one kind. The Workbench window calls this when
   * it opens, so `kind: "workbench"` shapes register their surfaces on demand.
   * @param kind - shape kind to wake.
   */
  const wakeKindShapes = async (kind: string): Promise<void> => {
    await refresh({ wakeKind: kind })
  }

  /**
   * Address one shape's client entry.
   *
   * `?v=` only versions the entry itself: its static imports keep their own URLs and
   * the browser never re-evaluates them. A `@<hash>` path segment does reach them,
   * because relative specifiers resolve against the importing module's URL, so the
   * whole graph gets a fresh address and no page reload is needed.
   * @param shape - shape about to be imported.
   * @returns the import specifier.
   */
  const moduleUrl = (shape: ShapeInfo): string => {
    const entry = shape.clientEntry ?? ''
    const base = `/dsh-shape/client/${encodeURIComponent(shape.id)}/`
    if (shape.clientHash === undefined || shape.clientHash === '')
      return `${base}${entry}?v=${encodeURIComponent(shape.version)}-${String(Date.now())}`
    const restart = restarts.get(shape.id) ?? 0
    return `${base}@${shape.clientHash}${restart === 0 ? '' : `.${String(restart)}`}/${entry}`
  }

  /** Dispose one active shape, leaving the rest of the runtime untouched. */
  const stopShape = (id: string): void => {
    const at = active.findIndex(candidate => candidate.id === id)
    if (at === -1) return
    const [stopped] = active.splice(at, 1)
    stopped?.dispose()
  }

  /**
   * Whether a running shape already matches the Host's current module graph.
   * @param shape - shape reported by the Host.
   * @returns true when it can keep running as is.
   */
  const upToDate = (shape: ShapeInfo): boolean => {
    const running = active.find(candidate => candidate.id === shape.id)
    if (running === undefined) return false
    // A Host that does not report `clientHash` cannot be diffed, so every refresh re-imports.
    if (shape.clientHash === undefined || running.hash === '') return false
    return running.hash === shape.clientHash
  }

  const refresh = async (options: { force?: boolean; wake?: string; wakeKind?: string } = {}): Promise<boolean> => {
    const current = ++generation
    let shapes: ShapeInfo[]
    try {
      const response = await fetch('/dsh-shape/api/shapes', { credentials: 'same-origin', cache: 'no-store' })
      if (!response.ok) return false
      const payload = await response.json() as { ok?: boolean; shapes?: ShapeInfo[] }
      if (payload.ok !== true || !Array.isArray(payload.shapes)) return false
      shapes = payload.shapes
    } catch {
      return false
    }
    if (current !== generation) return false

    if (options.force === true) {
      stopAll()
    } else {
      // Restart only the shapes whose module graph changed; the rest keep running.
      for (const running of [...active]) {
        const next = shapes.find(candidate => candidate.id === running.id)
        if (next === undefined || next.enabled === false || !next.valid
          || next.clientEntry === undefined || !upToDate(next)) {
          stopShape(running.id)
        }
      }
    }

    let woke = false
    if (options.wake !== undefined && active.some(candidate => candidate.id === options.wake)) woke = true

    for (const shape of shapes) {
      if (current !== generation) return false
      if (!canStart(shape)) continue
      if (active.some(candidate => candidate.id === shape.id)) continue
      const targeted = shape.id === options.wake
        || (options.wakeKind !== undefined && shape.kind === options.wakeKind)
      // Everything is dormant by default: only eager shapes and the one being
      // woken pay the import cost here.
      if (shape.wake?.eager !== true && !targeted) continue
      const resolution = capabilities.resolve(shape.requirements ?? [])
      if (!resolution.ok) continue

      const state = {
        shortcuts: [] as Array<() => void>,
        mounts: [] as Array<() => void>,
        cleanup: undefined as (() => void) | undefined,
      }
      const scopedCapabilities = scopeCapabilities(resolution.capabilities, shape)

      /**
       * Register one or more private page-level shortcuts for this shape.
       * @param specs - combination or combinations.
       * @param run - action invoked on a match.
       * @returns a disposer releasing every combination.
       */
      const registerShortcuts = (
        specs: string | readonly string[],
        run: () => void | Promise<void>,
      ): (() => void) => {
        const list = typeof specs === 'string' ? [specs] : specs
        const disposers: Array<() => void> = []
        try {
          for (const spec of list) {
            const parsed = parseShortcut(spec)
            const key = combinationKey(parsed)
            if (shortcuts.has(key)) throw new Error(`shortcut conflict: ${spec}`)
            const registered: RegisteredShortcut = { ...parsed, run }
            shortcuts.set(key, registered)
            const off = (): void => {
              if (shortcuts.get(key) === registered) shortcuts.delete(key)
            }
            disposers.push(off)
            state.shortcuts.push(off)
          }
        } catch (cause) {
          // A conflict halfway through must not leave the earlier combinations bound.
          for (const off of disposers) off()
          throw cause
        }
        return () => { for (const off of disposers) off() }
      }

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
        panel(options) {
          const id = `shape:${shape.id}:${options.id}`
          const off = registerShapePanel({
            shapeId: shape.id,
            id,
            title: options.title,
            order: options.order ?? 100,
            render: options.render,
          })
          state.mounts.push(off)
          return {
            id,
            open() {
              openShapePanel(id)
            },
            dispose: off,
          }
        },
        tab(options) {
          const id = `shape:${shape.id}:${options.id}`
          const off = registerShapeTab({
            shapeId: shape.id,
            id,
            title: options.title,
            render: options.render,
          })
          state.mounts.push(off)
          return {
            id,
            open() {
              openShapeTab(id)
            },
            dispose: off,
          }
        },
        edge(options) {
          const id = `shape:${shape.id}:${options.id}`
          const edge = options.edge ?? 'right'
          if (edge !== 'top' && edge !== 'right' && edge !== 'bottom' && edge !== 'left') {
            throw new Error(`dsh-shape: edge must be top, right, bottom, or left: ${String(edge)}`)
          }
          const view = normalizeView(options.view ?? 'index.html')
          assertShapeView(shape, view)
          const width = normalizeDimension(options.width, 'width')
          const height = normalizeDimension(options.height, 'height')
          const offShortcut = options.keys === undefined
            ? undefined
            : registerShortcuts(options.keys, () => { toggleShapeEdge(id) })
          const offPopup = registerShapeEdge({
            shapeId: shape.id,
            id,
            title: options.title ?? shape.title,
            edge,
            view,
            ...(width === undefined ? {} : { width }),
            ...(height === undefined ? {} : { height }),
            resizable: options.resizable !== false,
            esc: options.esc !== false,
            peek: options.peek === true,
          })
          let disposed = false
          const dispose = (): void => {
            if (disposed) return
            disposed = true
            offShortcut?.()
            offPopup()
          }
          state.mounts.push(dispose)
          return {
            id,
            open() {
              openShapeEdge(id)
            },
            close() {
              closeShapeEdge(id)
            },
            toggle() {
              toggleShapeEdge(id)
            },
            isOpen() {
              return isShapeEdgeOpen(id)
            },
            dispose,
          }
        },
        workbench(options) {
          if (shape.kind !== 'workbench') {
            throw new Error(
              `dsh-shape: api.workbench needs shape.kind = "workbench"; ${shape.id} declares "${shape.kind ?? 'shape'}"`,
            )
          }
          const id = `shape:${shape.id}:${options.id}`
          const off = registerShapeWorkbench({
            shapeId: shape.id,
            id,
            title: options.title,
            order: options.order ?? 100,
            render: options.render,
          })
          state.mounts.push(off)
          return {
            id,
            open() {
              openShapeWorkbench(id)
            },
            dispose: off,
          }
        },
        shortcuts: {
          register(binding) {
            return registerShortcuts(binding.keys, binding.run)
          },
        },
      }

      const url = moduleUrl(shape)
      try {
        const module = await import(/* @vite-ignore */ url) as ShapeModule
        if (current !== generation) return false
        if (typeof module.activate !== 'function') continue
        const result = module.activate(api)
        if (typeof result === 'function') state.cleanup = result
        else if (result !== undefined && typeof result.dispose === 'function') state.cleanup = result.dispose
        active.push({
          id: shape.id,
          hash: shape.clientHash ?? '',
          dispose: () => {
            state.cleanup?.()
            module.deactivate?.()
            for (const off of state.mounts) off()
            for (const off of state.shortcuts) off()
            disposeShapeMounts(shape.id)
            disposeShapeEvents(shape.id)
            disposeShapePanels(shape.id)
            disposeShapeTabs(shape.id)
            disposeShapeEdges(shape.id)
            disposeShapeWorkbenches(shape.id)
          },
        })
        if (targeted) woke = true
      } catch (cause) {
        for (const off of state.mounts) off()
        for (const off of state.shortcuts) off()
        disposeShapeMounts(shape.id)
        disposeShapeEvents(shape.id)
        disposeShapePanels(shape.id)
        disposeShapeTabs(shape.id)
        disposeShapeEdges(shape.id)
        disposeShapeWorkbenches(shape.id)
        state.cleanup?.()
        console.warn(`dsh-shape: failed to activate ${shape.id}`, cause)
      }
    }
    syncWake(shapes)
    return woke
  }

  /**
   * Restart one shape in place: bump its module URL and re-import just that shape.
   * @param id - shape to restart.
   */
  const restartShape = async (id: string): Promise<void> => {
    restarts.set(id, (restarts.get(id) ?? 0) + 1)
    stopShape(id)
    // A restart is an explicit action: it wakes a dormant shape instead of
    // leaving it asleep.
    await refresh({ wake: id })
  }

  const start = (): (() => void) => {
    if (started) throw new Error('shape runtime already started')
    started = true
    window.addEventListener('keydown', onKeyDown)
    // Content or file-set changes only need the affected shapes re-imported; a
    // capability catalog change can alter what every shape is allowed to do, so
    // that one rebuilds everything.
    const reload = (): void => { void refresh() }
    const rebuild = (): void => { void refresh({ force: true }) }
    const onRestart = (event: Event): void => {
      const detail = (event as CustomEvent<{ id?: unknown }>).detail
      const id = detail?.id
      if (typeof id === 'string' && id !== '') void restartShape(id)
    }
    // The Workbench window is the only surface for `kind: "workbench"` shapes,
    // so opening it wakes them instead of requiring an eager manifest.
    const onWorkbenchOpen = (): void => { void wakeKindShapes('workbench') }
    window.addEventListener('dsh-shape:refresh', reload)
    window.addEventListener('dsh-shape:capabilities', rebuild)
    window.addEventListener('dsh-shape:restart', onRestart)
    window.addEventListener('dsh-shape:workbench-open', onWorkbenchOpen)
    wakeRequest = (id) => { void wakeShapeNow(id) }
    void refresh()
    return () => {
      started = false
      wakeRequest = undefined
      generation++
      stopAll()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('dsh-shape:refresh', reload)
      window.removeEventListener('dsh-shape:capabilities', rebuild)
      window.removeEventListener('dsh-shape:restart', onRestart)
      window.removeEventListener('dsh-shape:workbench-open', onWorkbenchOpen)
    }
  }

  return { start }
}
