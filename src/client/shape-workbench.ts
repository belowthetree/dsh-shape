/**
 * Shape workbenches: a host-owned window that shows the surface of a shape
 * whose manifest declares `shape.kind: "workbench"`.
 */

/** One workbench a shape contributes to the Workbench window. */
export interface ShapeWorkbench {
  /** Owning shape id. */
  readonly shapeId: string
  /** Namespaced workbench id. */
  readonly id: string
  /** Label shown in the window header and its switcher. */
  readonly title: string
  /** Switcher order; lower sorts first. */
  readonly order: number
  /**
   * Render the workbench body.
   * @param container - element owned by the workbench window.
   * @returns an optional cleanup run before the window drops the body.
   */
  readonly render: (container: HTMLElement) => (() => void) | void
}

const workbenches = new Map<string, ShapeWorkbench>()
const workbenchListeners = new Set<() => void>()
const windowListeners = new Set<() => void>()

let workbenchOpen = false
let requestedId: string | null = null

/**
 * Notify every observer of the registered workbenches.
 */
function notifyWorkbenches(): void {
  for (const listener of workbenchListeners) listener()
}

/**
 * Notify every observer of the window state.
 */
function notifyWindow(): void {
  for (const listener of windowListeners) listener()
}

/**
 * Register one workbench.
 * @param workbench - workbench definition.
 * @returns an idempotent disposer.
 */
export function registerShapeWorkbench(workbench: ShapeWorkbench): () => void {
  workbenches.set(workbench.id, workbench)
  notifyWorkbenches()
  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    if (workbenches.get(workbench.id) === workbench) {
      workbenches.delete(workbench.id)
      notifyWorkbenches()
    }
  }
}

/**
 * Read every registered workbench.
 * @returns workbenches sorted by their declared order.
 */
export function shapeWorkbenches(): readonly ShapeWorkbench[] {
  return [...workbenches.values()].sort((left, right) => left.order - right.order)
}

/**
 * Observe workbench registration changes.
 * @param listener - change callback.
 * @returns an unsubscribe function.
 */
export function subscribeShapeWorkbenches(listener: () => void): () => void {
  workbenchListeners.add(listener)
  return () => { workbenchListeners.delete(listener) }
}

/**
 * Remove every workbench one shape owns.
 * @param shapeId - owning shape.
 */
export function disposeShapeWorkbenches(shapeId: string): void {
  let changed = false
  for (const [id, workbench] of workbenches) {
    if (workbench.shapeId !== shapeId) continue
    workbenches.delete(id)
    changed = true
  }
  if (changed) notifyWorkbenches()
}

/** Event fired when the window changes from closed to open. */
const WORKBENCH_OPEN_EVENT = 'dsh-shape:workbench-open'

/**
 * Whether the workbench window is showing.
 * @returns the open state.
 */
export function isShapeWorkbenchOpen(): boolean {
  return workbenchOpen
}

/**
 * Workbench the last open request selected.
 * @returns the namespaced workbench id, or null when nothing was requested.
 */
export function shapeWorkbenchRequestedId(): string | null {
  return requestedId
}

/**
 * Select one workbench without touching the window state.
 * @param id - namespaced workbench id.
 */
export function selectShapeWorkbench(id: string): void {
  if (requestedId === id) return
  requestedId = id
  notifyWindow()
}

/**
 * Show the workbench window, optionally selecting one workbench.
 * @param id - namespaced workbench id; omit to keep the current selection.
 */
export function openShapeWorkbench(id?: string): void {
  const changed = id !== undefined && id !== requestedId
  if (id !== undefined) requestedId = id
  if (workbenchOpen && !changed) return
  const wasOpen = workbenchOpen
  workbenchOpen = true
  notifyWindow()
  // Opening the window is the wake signal for dormant `kind: "workbench"`
  // shapes: they register their surfaces only after activation, and the window
  // is the only place those surfaces can appear.
  if (!wasOpen && typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(WORKBENCH_OPEN_EVENT))
  }
}

/**
 * Hide the workbench window.
 */
export function closeShapeWorkbench(): void {
  if (!workbenchOpen) return
  workbenchOpen = false
  notifyWindow()
}

/**
 * Open a closed workbench window or close an open one.
 */
export function toggleShapeWorkbench(): void {
  if (workbenchOpen) closeShapeWorkbench()
  else openShapeWorkbench()
}

/**
 * Observe window open/close and selection changes.
 * @param listener - change callback.
 * @returns an unsubscribe function.
 */
export function subscribeShapeWorkbenchWindow(listener: () => void): () => void {
  windowListeners.add(listener)
  return () => { windowListeners.delete(listener) }
}
