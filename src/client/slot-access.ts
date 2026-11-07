/** Built-in slot capability: discover slots, mount into them, and count mounts. */

import type { Context } from '@deepseek-ai/cordis'
import {
  SHAPE_SLOTS,
  isShapeSlot,
  registerShapeMount,
  shapeMounts,
  type ShapePlacementOptions,
  type ShapeSlot,
} from './shape-slots.ts'

/** One slot as the receiving shape sees it. */
export interface ShapeSlotInfo {
  /** Slot name. */
  name: string
  /** Layout the slot host applies: card, strip, panel, inline, or menu-row. */
  presentation: string
  /** Whether this host renders the slot. */
  available: boolean
  /** Mounts this shape owns in the slot. */
  mounts: number
  /** Mounts every shape owns in the slot. */
  total: number
}

/** API passed to shapes that require `dsh-shape#slots`. */
export interface ShapeSlotsApi {
  /** Every supported slot with its presentation and occupancy. */
  list(): readonly ShapeSlotInfo[]
  /**
   * Render into one slot.
   * @param slot - supported slot name.
   * @param render - receives the slot's container; returns an optional cleanup.
   * @param options - placement for the panel slot.
   * @returns an idempotent disposer.
   */
  mount(
    slot: string,
    render: (container: HTMLElement) => (() => void) | void,
    options?: ShapePlacementOptions,
  ): () => void
  /** How many mounts this shape owns in the slot. */
  entries(slot: string): number
}

/** Provider that the runtime scopes to one shape. */
export interface ShapeSlotProvider {
  /** Bind the API to one shape so mounts are attributed and disposed with it. */
  forShape(shapeId: string, info?: { title?: string }): ShapeSlotsApi
}

/**
 * Build the slot capability provider.
 * @param ctx - Client context with the slots service.
 * @returns the provider the runtime scopes per shape.
 */
export function createShapeSlots(ctx: Context): ShapeSlotProvider {
  return {
    forShape(shapeId, info) {
      const title = info?.title ?? shapeId
      const owned = (slot: string) => shapeMounts(slot).filter(mount => mount.shapeId === shapeId).length
      return {
        list() {
          return SHAPE_SLOTS.map(spec => ({
            name: spec.name,
            presentation: spec.presentation,
            available: rendered(spec.name),
            mounts: owned(spec.name),
            total: shapeMounts(spec.name).length,
          }))
        },
        mount(slot, render, options) {
          if (!isShapeSlot(slot)) throw new Error(`unsupported shape slot: ${slot}`)
          return registerShapeMount({
            slot,
            shapeId,
            title,
            placement: options?.placement === 'floating' ? 'floating' : 'anchored',
            snap: options?.snap !== false,
            render,
          })
        },
        entries(slot) {
          if (!isShapeSlot(slot)) throw new Error(`unsupported shape slot: ${slot}`)
          return owned(slot)
        },
      }
    },
  }

  /**
   * Report whether this host renders a slot.
   * @param slot - supported slot name.
   * @returns true when at least one entry is registered for the slot.
   */
  function rendered(slot: ShapeSlot): boolean {
    const entries = ctx.slots.entries as (key: string) => readonly unknown[]
    return entries(slot).length > 0
  }
}
