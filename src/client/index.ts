/**
 * dsh-shape Client half: one top-bar action that opens the registered-shape
 * browser. The Host half owns discovery; this half only presents the result.
 * @module @deepseek-ai/dsh-shape/client
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import { ShapeButton } from './ShapeButton.tsx'

/** The leading header seat is owned by the conversation client. */
export const inject = ['slots']

/**
 * Register the shape browser button in the always-visible conversation header.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  ctx.slots.inject('conversation.header.leading', () => ctx.slots.register({
    name: 'conversation.header.leading',
  }, ShapeButton))
}
