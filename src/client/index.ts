/**
 * dsh-shape Client half: shape browser, composer cards, and the capability
 * registry providers use to extend shapes.
 * @module @deepseek-ai/dsh-shape/client
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import {
  createShapeCapabilityRegistry,
  type ShapeRequirement,
  type ShapeResolution,
} from '../capabilities.ts'
import { ShapeChatCards } from './ShapeChatCards.tsx'
import { ShapeButton } from './ShapeButton.tsx'

/** The leading header seat and composer dock are owned by the conversation client. */
export const inject = ['slots']

/**
 * Register shape surfaces and expose the shape capability registry.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  const capabilities = createShapeCapabilityRegistry()
  ctx.provide('shapeCapabilities', capabilities)
  ctx.effect(() => capabilities.provide({
    plugin: 'dsh-shape',
    capability: 'core',
    version: '1.0.0',
    api: { apiVersion: 1 },
  }), 'dsh-shape: core capability')

  capabilities.subscribe(() => {
    window.dispatchEvent(new CustomEvent('dsh-shape:capabilities'))
  })

  const resolveShape = (requirements: readonly ShapeRequirement[]): ShapeResolution =>
    capabilities.resolve(requirements)

  ctx.slots.inject('conversation.header.leading', () => ctx.slots.register({
    name: 'conversation.header.leading',
    inject: () => ({ resolveShape }),
  }, ShapeButton))
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'dsh-shape-chat-cards',
    order: 20,
    inject: () => ({ resolveShape }),
  }, ShapeChatCards))
}
