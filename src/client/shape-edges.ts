/** Shape-owned edge popups: windows that slide in from one viewport edge. */

/** Viewport edge an edge popup is anchored to. */
export type ShapeEdge = 'top' | 'right' | 'bottom' | 'left'

/** One edge popup a shape contributes. */
export interface ShapeEdgePopup {
  /** Owning shape id. */
  readonly shapeId: string
  /** Namespaced popup id, used as the registry key and the test hook. */
  readonly id: string
  /** Window bar label. */
  readonly title: string
  /** Edge the window sits on and slides in from. */
  readonly edge: ShapeEdge
  /** File below the shape's `views/` directory rendered in the window. */
  readonly view: string
  /** Window width in pixels, or `full` to span the viewport width. */
  readonly width?: number | 'full'
  /** Window height in pixels, or `full` to span the viewport height. */
  readonly height?: number | 'full'
  /** Whether dragging the inner edge resizes the window; defaults to true. */
  readonly resizable: boolean
  /** Whether Escape closes the window; defaults to true. */
  readonly esc: boolean
}

/** What the layer renders: open popup ids in stacking order plus the ones animating out. */
export interface ShapeEdgeSnapshot {
  /** Open popup ids, oldest first; the last entry is the topmost window. */
  readonly open: readonly string[]
  /** Open ids whose exit animation is playing. */
  readonly closing: readonly string[]
}

// Registry state is prefixed because every client source region shares one
// bundle scope: a bare `listeners` or `notify` would collide with the slot and
// panel registries.
const edgePopups = new Map<string, ShapeEdgePopup>()
const edgeListeners = new Set<() => void>()
/** Open ids in stacking order; the last one is the topmost window. */
const edgeStack: string[] = []
/** Open ids that are playing their exit animation. */
const edgeClosing = new Set<string>()

/** Tell every observer that the snapshot changed. */
function notifyEdges(): void {
  for (const listener of edgeListeners) listener()
}

/**
 * Drop one id from the stacking order and the closing set.
 * @param id - namespaced popup id.
 * @returns whether the id was open or closing.
 */
function forgetEdge(id: string): boolean {
  const at = edgeStack.indexOf(id)
  if (at !== -1) edgeStack.splice(at, 1)
  const wasClosing = edgeClosing.delete(id)
  return at !== -1 || wasClosing
}

/**
 * Register one edge popup.
 * @param popup - popup definition; a second registration with the same id replaces it.
 * @returns an idempotent disposer that also closes the window.
 */
export function registerShapeEdge(popup: ShapeEdgePopup): () => void {
  edgePopups.set(popup.id, popup)
  notifyEdges()
  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    if (edgePopups.get(popup.id) !== popup) return
    edgePopups.delete(popup.id)
    forgetEdge(popup.id)
    notifyEdges()
  }
}

/**
 * Read one registered popup.
 * @param id - namespaced popup id.
 * @returns the popup, or undefined when it is not registered.
 */
export function shapeEdge(id: string): ShapeEdgePopup | undefined {
  return edgePopups.get(id)
}

/**
 * Show one registered popup, or raise it when it is already open.
 * @param id - namespaced popup id.
 */
export function openShapeEdge(id: string): void {
  if (!edgePopups.has(id)) throw new Error(`dsh-shape: no edge popup "${id}" is registered`)
  edgeClosing.delete(id)
  const at = edgeStack.indexOf(id)
  if (at !== -1) edgeStack.splice(at, 1)
  edgeStack.push(id)
  notifyEdges()
}

/**
 * Ask one open popup to close; the layer plays its exit animation and then drops it.
 * @param id - namespaced popup id.
 */
export function closeShapeEdge(id: string): void {
  if (!edgeStack.includes(id) || edgeClosing.has(id)) return
  edgeClosing.add(id)
  notifyEdges()
}

/**
 * Open a closed popup or close an open one.
 * @param id - namespaced popup id.
 */
export function toggleShapeEdge(id: string): void {
  if (edgeStack.includes(id) && !edgeClosing.has(id)) closeShapeEdge(id)
  else openShapeEdge(id)
}

/**
 * Whether a popup is open and not already animating out.
 * @param id - namespaced popup id.
 * @returns true while the window is fully shown.
 */
export function isShapeEdgeOpen(id: string): boolean {
  return edgeStack.includes(id) && !edgeClosing.has(id)
}

/**
 * Drop a popup after its exit animation finished.
 * @param id - namespaced popup id.
 */
export function finishShapeEdgeClose(id: string): void {
  if (!edgeClosing.has(id)) return
  edgeClosing.delete(id)
  const at = edgeStack.indexOf(id)
  if (at !== -1) edgeStack.splice(at, 1)
  notifyEdges()
}

/**
 * Read the current open state.
 * @returns a fresh snapshot the layer can render.
 */
export function shapeEdgeSnapshot(): ShapeEdgeSnapshot {
  return { open: [...edgeStack], closing: [...edgeClosing] }
}

/**
 * Observe open-state changes.
 * @param listener - change callback.
 * @returns an unsubscribe function.
 */
export function subscribeShapeEdges(listener: () => void): () => void {
  edgeListeners.add(listener)
  return () => { edgeListeners.delete(listener) }
}

/**
 * Read the topmost open popup that is not animating out.
 * @returns the popup Escape should reach, or undefined when none is open.
 */
export function topShapeEdge(): ShapeEdgePopup | undefined {
  for (let index = edgeStack.length - 1; index >= 0; index -= 1) {
    const id = edgeStack[index]
    if (id === undefined || edgeClosing.has(id)) continue
    const popup = edgePopups.get(id)
    if (popup !== undefined) return popup
  }
  return undefined
}

/**
 * Remove every popup one shape owns, closing any that are open.
 * @param shapeId - owning shape.
 */
export function disposeShapeEdges(shapeId: string): void {
  let changed = false
  for (const [id, popup] of edgePopups) {
    if (popup.shapeId !== shapeId) continue
    edgePopups.delete(id)
    forgetEdge(id)
    changed = true
  }
  if (changed) notifyEdges()
}
