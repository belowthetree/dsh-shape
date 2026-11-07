/** Shape-owned surfaces that are not conversation slots: left sidebar panels. */

/** One panel a shape contributes to the left sidebar. */
export interface ShapePanel {
  /** Owning shape id. */
  readonly shapeId: string
  /** Namespaced panel id, used as the `main` slot key. */
  readonly id: string
  /** Sidebar label. */
  readonly title: string
  /** Sidebar order; lower sorts first. */
  readonly order: number
  /**
   * Render into the panel body.
   * @param container - element owned by the panel host.
   * @returns an optional cleanup run before the container is dropped.
   */
  readonly render: (container: HTMLElement) => (() => void) | void
}

const panels = new Map<string, ShapePanel>()
const panelListeners = new Set<() => void>()
let opener: ((id: string) => void) | undefined

/**
 * Install the function that selects a panel in the main area.
 * @param open - receives a namespaced panel id.
 */
export function setShapePanelOpener(open: (id: string) => void): void {
  opener = open
}

/**
 * Select one registered panel in the main area.
 * @param id - namespaced panel id.
 */
export function openShapePanel(id: string): void {
  if (opener === undefined) throw new Error('dsh-shape: panel opening is unavailable in this host')
  opener(id)
}

/**
 * Register one panel.
 * @param panel - panel definition.
 * @returns an idempotent disposer.
 */
export function registerShapePanel(panel: ShapePanel): () => void {
  panels.set(panel.id, panel)
  notify()
  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    if (panels.get(panel.id) === panel) {
      panels.delete(panel.id)
      notify()
    }
  }
}

/**
 * Read every registered panel.
 * @returns panels in registration order.
 */
export function shapePanels(): readonly ShapePanel[] {
  return [...panels.values()]
}

/**
 * Observe panel registration changes.
 * @param listener - change callback.
 * @returns an unsubscribe function.
 */
export function subscribeShapePanels(listener: () => void): () => void {
  panelListeners.add(listener)
  return () => { panelListeners.delete(listener) }
}

/**
 * Remove every panel one shape owns.
 * @param shapeId - owning shape.
 */
export function disposeShapePanels(shapeId: string): void {
  let changed = false
  for (const [id, panel] of panels) {
    if (panel.shapeId !== shapeId) continue
    panels.delete(id)
    changed = true
  }
  if (changed) notify()
}

/**
 * Notify every observer.
 */
function notify(): void {
  for (const listener of panelListeners) listener()
}
