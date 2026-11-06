/**
 * Bundled shape-development skill. Mounted only by the Shape Studio preset.
 */

import { readFileSync } from 'node:fs'

export const name = 'dsh-shape-skill'
export const inject = ['skills']

const content = readFileSync(new URL('./skills/shape-development/SKILL.md', import.meta.url), 'utf8')

/**
 * Register the shape-development skill in the preset scope.
 * @param ctx - preset-scoped Host context.
 */
export function apply(ctx) {
  ctx.effect(() => ctx.skills.register({
    name: 'shape-development',
    description: 'Develop, validate, and test folder-based dsh-shape shapes.',
    whenToUse: 'Use when creating or changing a dsh-shape shape, its view, chat card, capability declarations, or client shortcuts.',
    source: 'runtime',
    content,
  }), 'dsh-shape: shape-development skill')
}
