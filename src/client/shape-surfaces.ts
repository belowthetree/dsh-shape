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
 * Install the function that shows a panel.
 * @param open - receives a namespaced panel id.
 */
export function setShapePanelOpener(open: (id: string) => void): void {
  opener = open
}

/**
 * Show one registered panel.
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

/** One page a shape contributes to the right sidebar. */
export interface ShapeTab {
  /** Owning shape id. */
  readonly shapeId: string
  /** Namespaced tab id, used as the tab type id and the slot key. */
  readonly id: string
  /** Tab label. */
  readonly title: string
  /**
   * Render into the tab body.
   * @param container - element owned by the tab host.
   * @returns an optional cleanup run before the container is dropped.
   */
  readonly render: (container: HTMLElement) => (() => void) | void
}

const tabs = new Map<string, ShapeTab>()
const tabListeners = new Set<() => void>()
let tabOpener: ((id: string) => void) | undefined

/**
 * Register one tab.
 * @param tab - tab definition.
 * @returns an idempotent disposer.
 */
export function registerShapeTab(tab: ShapeTab): () => void {
  tabs.set(tab.id, tab)
  notifyTabs()
  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    if (tabs.get(tab.id) === tab) {
      tabs.delete(tab.id)
      notifyTabs()
    }
  }
}

/**
 * Read every registered tab.
 * @returns tabs in registration order.
 */
export function shapeTabs(): readonly ShapeTab[] {
  return [...tabs.values()]
}

/**
 * Observe tab registration changes.
 * @param listener - change callback.
 * @returns an unsubscribe function.
 */
export function subscribeShapeTabs(listener: () => void): () => void {
  tabListeners.add(listener)
  return () => { tabListeners.delete(listener) }
}

/**
 * Remove every tab one shape owns.
 * @param shapeId - owning shape.
 */
export function disposeShapeTabs(shapeId: string): void {
  let changed = false
  for (const [id, tab] of tabs) {
    if (tab.shapeId !== shapeId) continue
    tabs.delete(id)
    changed = true
  }
  if (changed) notifyTabs()
}

/**
 * Install the function that opens a tab in the right sidebar.
 * @param open - receives a namespaced tab id.
 */
export function setShapeTabOpener(open: (id: string) => void): void {
  tabOpener = open
}

/**
 * Open one registered tab.
 * @param id - namespaced tab id.
 */
export function openShapeTab(id: string): void {
  if (tabOpener === undefined) throw new Error('dsh-shape: tab opening is unavailable in this host')
  tabOpener(id)
}

/**
 * Notify every tab observer.
 */
function notifyTabs(): void {
  for (const listener of tabListeners) listener()
}
