/**
 * Bundled shape skills. Mounted only by the Shape Studio preset.
 */

import { readFileSync } from 'node:fs'

export const name = 'dsh-shape-skill'
export const inject = ['skills']

/**
 * Read one bundled skill body.
 * @param dir - skill directory under `skills/`.
 * @returns the SKILL.md content.
 */
function readSkill(dir) {
  return readFileSync(new URL(`./skills/${dir}/SKILL.md`, import.meta.url), 'utf8')
}

/** Skills this plugin registers, in the order the preset sees them. */
const SKILLS = [
  {
    name: 'shape-development',
    description: 'Develop, validate, and test folder-based dsh-shape shapes.',
    whenToUse: 'Use when creating or changing a dsh-shape shape, its view, chat card, capability declarations, or client shortcuts.',
    content: readSkill('shape-development'),
  },
  {
    name: 'shape-pitfalls',
    description: 'Field notes from building dsh-shape shapes: where the host does not behave as the reference implies, and the workarounds that hold.',
    whenToUse: 'Use when a shape\'s UI does not appear, a shortcut never fires, search or highlighting misses content, focus jumps, or a preset disappeared from the picker.',
    content: readSkill('shape-pitfalls'),
  },
]

/**
 * Register every bundled skill in the preset scope.
 * @param ctx - preset-scoped Host context.
 */
export function apply(ctx) {
  for (const skill of SKILLS) {
    ctx.effect(() => ctx.skills.register({
      name: skill.name,
      description: skill.description,
      whenToUse: skill.whenToUse,
      source: 'runtime',
      content: skill.content,
    }), `dsh-shape: ${skill.name} skill`)
  }
}
