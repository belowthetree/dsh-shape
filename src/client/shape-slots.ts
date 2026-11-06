/** Conversation slots a shape may target, and the mounts shapes register into them. */

/** How one slot lays out the entries and mounts it receives. */
export type ShapePresentation = 'card' | 'strip' | 'panel' | 'inline' | 'menu-row'

/** One slot name a shape may target. */
export type ShapeSlot =
  | 'conversation.input.dock'
  | 'conversation.input.overlay'
  | 'conversation.composer.dock'
  | 'conversation.input.left'
  | 'conversation.input.right'
  | 'conversation.session.header.actions'
  | 'conversation.session.header.utilities'
  | 'conversation.hero.options'
  | 'conversation.session.header.views.actions'

/** One conversation slot exposed to shapes. */
export interface ShapeSlotSpec {
  /** DSH slot name. */
  readonly name: ShapeSlot
  /** Layout the slot host applies to shape content. */
  readonly presentation: ShapePresentation
}

/**
 * Supported slots, in registration order.
 *
 * `conversation.view` is deliberately absent: its entries are tabs that must
 * render the whole Session body, which neither a descriptor nor a bare mount
 * container can satisfy.
 */
export const SHAPE_SLOTS: readonly ShapeSlotSpec[] = [
  { name: 'conversation.input.dock', presentation: 'card' },
  { name: 'conversation.input.overlay', presentation: 'panel' },
  { name: 'conversation.composer.dock', presentation: 'strip' },
  { name: 'conversation.input.left', presentation: 'inline' },
  { name: 'conversation.input.right', presentation: 'inline' },
  { name: 'conversation.session.header.actions', presentation: 'inline' },
  { name: 'conversation.session.header.utilities', presentation: 'inline' },
  { name: 'conversation.hero.options', presentation: 'inline' },
  { name: 'conversation.session.header.views.actions', presentation: 'menu-row' },
]

/**
 * Check whether a name is a supported slot.
 * @param slot - candidate slot name.
 * @returns true when shapes may target it.
 */
export function isShapeSlot(slot: string): slot is ShapeSlot {
  return SHAPE_SLOTS.some(spec => spec.name === slot)
}

/**
 * Presentation of one slot.
 * @param slot - supported slot name.
 * @returns the declared presentation.
 */
export function presentationOf(slot: string): ShapePresentation {
  return SHAPE_SLOTS.find(spec => spec.name === slot)?.presentation ?? 'card'
}

/** One DOM region a shape renders into. */
export interface ShapeMount {
  /** Target slot name. */
  readonly slot: string
  /** Owning shape id. */
  readonly shapeId: string
  /**
   * Render into the provided container.
   * @param container - element owned by the slot host.
   * @returns an optional cleanup run before the container is dropped.
   */
  readonly render: (container: HTMLElement) => (() => void) | void
}

const mounts = new Map<string, Set<ShapeMount>>()
const listeners = new Map<string, Set<() => void>>()

/**
 * Notify every listener of one slot.
 * @param slot - slot whose mounts changed.
 */
function notify(slot: string): void {
  for (const listener of listeners.get(slot) ?? []) listener()
}

/**
 * Register one mount.
 * @param mount - slot, owner, and render callback.
 * @returns an idempotent disposer.
 */
export function registerShapeMount(mount: ShapeMount): () => void {
  let set = mounts.get(mount.slot)
  if (set === undefined) {
    set = new Set()
    mounts.set(mount.slot, set)
  }
  set.add(mount)
  notify(mount.slot)
  let disposed = false
  return () => {
    if (disposed) return
    disposed = true
    set.delete(mount)
    notify(mount.slot)
  }
}

/**
 * Read the mounts of one slot.
 * @param slot - slot to read.
 * @returns a stable-ordered snapshot.
 */
export function shapeMounts(slot: string): readonly ShapeMount[] {
  return [...(mounts.get(slot) ?? [])]
}

/**
 * Observe mount changes of one slot.
 * @param slot - slot to observe.
 * @param listener - change callback.
 * @returns an unsubscribe function.
 */
export function subscribeShapeMounts(slot: string, listener: () => void): () => void {
  let set = listeners.get(slot)
  if (set === undefined) {
    set = new Set()
    listeners.set(slot, set)
  }
  set.add(listener)
  return () => {
    set.delete(listener)
    if (set.size === 0) listeners.delete(slot)
  }
}
