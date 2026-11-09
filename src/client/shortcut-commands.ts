/** Built-in shortcut capability: DSH commands that users can rebind. */

import type { Context } from '@deepseek-ai/cordis'
import type {
  ShortcutBinding,
  ShortcutCommandId,
  ShortcutModifier,
  ShortcutProfile,
} from '@deepseek-ai/dsh-client-shortcuts/client'

/** Every profile a default binding is expanded to. */
const PROFILES: readonly ShortcutProfile[] = [
  'desktop:macos',
  'desktop:windows',
  'desktop:linux',
  'web:macos',
  'web:windows',
  'web:linux',
]

/** Modifier spellings accepted in `keys`. */
const MODIFIERS: Readonly<Record<string, ShortcutModifier>> = {
  ctrl: 'control',
  control: 'control',
  alt: 'alt',
  option: 'alt',
  opt: 'alt',
  shift: 'shift',
  meta: 'meta',
  cmd: 'meta',
  command: 'meta',
  super: 'meta',
  win: 'meta',
  mod: 'primary',
  primary: 'primary',
}

/** Named keys accepted in `keys`; anything else must be a letter, digit, or F-key. */
const NAMED_CODES: Readonly<Record<string, string>> = {
  esc: 'Escape',
  escape: 'Escape',
  space: 'Space',
  tab: 'Tab',
  enter: 'Enter',
  return: 'Enter',
  backspace: 'Backspace',
  delete: 'Delete',
  del: 'Delete',
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
  slash: 'Slash',
  comma: 'Comma',
  period: 'Period',
  dot: 'Period',
  backslash: 'Backslash',
  backquote: 'Backquote',
  minus: 'Minus',
  equal: 'Equal',
  bracketleft: 'BracketLeft',
  bracketright: 'BracketRight',
  semicolon: 'Semicolon',
  quote: 'Quote',
}

/** One command a shape contributes. */
export interface ShapeShortcutCommand {
  /** Local id; the runtime registers it as `shape.<shapeId>.<id>`. */
  id: string
  /** Human label shown in the shortcut settings and reference. */
  label: string
  /** Extra search terms for the reference page. */
  aliases?: readonly string[]
  /** Default combination such as `Ctrl+Alt+M`; omit for an unbound command. */
  keys?: string
  /** Regions the command fires in; defaults to `['page']`. */
  regions?: readonly ShapeShortcutRegion[]
  /** Modal ids the command fires in; defaults to none. */
  modals?: readonly string[]
  /** Runtimes to bind by default; defaults to both. Use it when a Web profile already owns the combination. */
  profiles?: readonly ShapeShortcutRuntime[]
  /** Action invoked when the combination matches. */
  run: () => void | Promise<void>
}

/** Shells a default binding may be declared for. */
export type ShapeShortcutRuntime = 'desktop' | 'web'

/** Regions DSH dispatches shortcuts in. */
export type ShapeShortcutRegion = 'page' | 'editable' | 'terminal'

/** Every region a command may opt into. */
const REGIONS: readonly ShapeShortcutRegion[] = ['page', 'editable', 'terminal']

/**
 * Validate and de-duplicate the regions a command asked for.
 * @param regions - requested regions, or undefined for the page default.
 * @returns the regions to register.
 */
function normalizeRegions(regions: readonly ShapeShortcutRegion[] | undefined): ShapeShortcutRegion[] {
  if (regions === undefined) return ['page']
  const seen = new Set<ShapeShortcutRegion>()
  for (const region of regions) {
    if (!REGIONS.includes(region)) {
      throw new Error(`shape shortcut region must be page, editable, or terminal: ${String(region)}`)
    }
    seen.add(region)
  }
  if (seen.size === 0) throw new Error('shape shortcut regions must not be empty')
  return [...seen]
}

/** Catalog row for one of this shape's commands. */
export interface ShapeShortcutEntry {
  /** Local id without the shape prefix. */
  id: string
  label: string
  /** Keycaps for the accepted binding; empty when unbound. */
  keys: readonly string[]
  /** Whether the user replaced the default binding. */
  modified: boolean
  /** Other commands whose binding overlaps this one. */
  conflicts: readonly string[]
  /** Why the binding cannot run, when it cannot. */
  issue: string | null
}

/** API passed to shapes that require `dsh-shape#shortcuts`. */
export interface ShapeShortcutsApi {
  /** Register one command; duplicate ids and overlapping defaults throw. */
  register(command: ShapeShortcutCommand): () => void
  /** Catalog rows for this shape's commands. */
  list(): readonly ShapeShortcutEntry[]
}

/** Provider that the runtime scopes to one shape. */
export interface ShapeShortcutProvider {
  /** Bind the API to one shape so command ids are namespaced. */
  forShape(shapeId: string): ShapeShortcutsApi
}

/**
 * One dotted segment DSH admits after the first: a letter, then letters, digits, or hyphens.
 * A shape authors its own id and command ids, and the Desktop rejects the whole command
 * catalog over one inadmissible id, so invalid characters become hyphens and a leading
 * non-letter is prefixed with `s` instead of failing the shared catalog.
 * @param value - shape or local command id.
 * @returns the segment to place after a dot.
 */
function idSegment(value: string): string {
  const cleaned = value.replace(/[^a-zA-Z0-9-]/gu, '-')
  return /^[a-zA-Z]/u.test(cleaned) ? cleaned : `s${cleaned}`
}

/**
 * Build the shortcut capability provider.
 * @param ctx - Client context with the shortcuts service.
 * @returns the provider the runtime scopes per shape.
 */
export function createShapeShortcuts(ctx: Context): ShapeShortcutProvider {
  return {
    forShape(shapeId) {
      const prefix = `shape.${idSegment(shapeId)}.`
      const service = () => {
        const shortcuts = ctx.get('shortcuts')
        if (shortcuts === undefined) {
          throw new Error('dsh-shape#shortcuts: the shortcuts service is unavailable in this host')
        }
        return shortcuts
      }
      return {
        register(command) {
          if (!/^[a-z0-9][a-z0-9-]*$/.test(command.id)) {
            throw new Error(`shape shortcut id must be lowercase letters, digits, and hyphens: ${command.id}`)
          }
          const definition = (defaults: Partial<Record<ShortcutProfile, ShortcutBinding>>) => ({
            id: `${prefix}${idSegment(command.id)}` as ShortcutCommandId,
            label: () => command.label,
            aliases: command.aliases ?? [],
            defaults,
            regions: normalizeRegions(command.regions),
            modals: command.modals ?? [],
            resolve: () => ({
              status: 'handled',
              run: () => { void runAction(command.run) },
            }),
          })
          const all = expandDefaults(command.keys, command.profiles)
          try {
            return service().register(definition(all))
          } catch (cause) {
            // A Web profile may reject the combination outright, or already own it:
            // the whole catalog is validated at the IPC boundary, and one clash
            // makes every definition unusable. Either way keep the desktop defaults
            // so the command still exists and stays rebindable.
            const message = cause instanceof Error ? cause.message : ''
            if (!message.includes('Unsupported Web shortcut') && !message.includes('Conflicting shortcut defaults')) {
              throw cause
            }
            const desktopOnly = Object.fromEntries(
              Object.entries(all).filter(([profile]) => profile.startsWith('desktop:')),
            ) as Partial<Record<ShortcutProfile, ShortcutBinding>>
            return service().register(definition(desktopOnly))
          }
        },
        list() {
          return service().catalog.getSnapshot()
            .filter(entry => entry.id.startsWith(prefix))
            .map(entry => ({
              id: entry.id.slice(prefix.length),
              label: entry.label,
              keys: entry.keys,
              modified: entry.modified,
              conflicts: entry.conflicts.map(value => String(value)),
              issue: entry.issue,
            }))
        },
      }
    },
  }
}

/**
 * Expand one combination into the same default for every profile.
 * @param spec - combination such as `Ctrl+Alt+M`, or undefined for no default.
 * @returns defaults keyed by profile.
 */
/** Combinations DSH admits for Web on Linux; every other profile admits more. */
const WEB_LINUX_ALLOWED: ReadonlyArray<{ code: string, modifiers: readonly ShortcutModifier[] }> = [
  { code: 'Slash', modifiers: ['primary'] },
  { code: 'Comma', modifiers: ['primary', 'shift'] },
  { code: 'Period', modifiers: ['primary', 'shift'] },
]

/**
 * Check one binding against the Web-on-Linux admission rule.
 * @param binding - candidate default.
 * @returns whether the profile accepts it.
 */
function webLinuxAllows(binding: ShortcutBinding): boolean {
  const key = [...binding.modifiers].sort().join('+') + '|' + binding.code
  return WEB_LINUX_ALLOWED.some((candidate) => (
    [...candidate.modifiers].sort().join('+') + '|' + candidate.code === key
  ))
}

/**
 * Expand one combination to every profile that admits it.
 * @param spec - combination text.
 * @returns defaults keyed by profile; `web:linux` is omitted when it would reject the binding.
 */
function expandDefaults(
  spec: string | undefined,
  only?: readonly ShapeShortcutRuntime[],
): Partial<Record<ShortcutProfile, ShortcutBinding>> {
  if (spec === undefined) return {}
  const binding = parseBinding(spec)
  const defaults: Partial<Record<ShortcutProfile, ShortcutBinding>> = {}
  for (const profile of PROFILES) {
    if (only !== undefined && !only.some(prefix => profile.startsWith(`${prefix}:`))) continue
    if (profile === 'web:linux' && !webLinuxAllows(binding)) continue
    defaults[profile] = binding
  }
  return defaults
}

/**
 * Parse `Modifier+…+Key` into a physical binding.
 * @param spec - combination text.
 * @returns the binding to register as a default.
 */
function parseBinding(spec: string): ShortcutBinding {
  const parts = spec.split('+').map(part => part.trim()).filter(part => part.length > 0)
  const key = parts.pop()
  if (key === undefined) throw new Error(`empty shortcut: "${spec}"`)
  const modifiers: ShortcutModifier[] = []
  for (const part of parts) {
    const modifier = MODIFIERS[part.toLowerCase()]
    if (modifier === undefined) throw new Error(`unknown modifier "${part}" in "${spec}"`)
    modifiers.push(modifier)
  }
  return { code: codeOf(key, spec), modifiers }
}

/**
 * Map a key name to the physical code the shortcut registry accepts.
 * @param key - key token from the combination.
 * @param spec - original combination, for error messages.
 * @returns physical code.
 */
function codeOf(key: string, spec: string): string {
  if (/^[a-z]$/i.test(key)) return `Key${key.toUpperCase()}`
  if (/^[0-9]$/.test(key)) return `Digit${key}`
  if (/^f([1-9]|1[0-9]|2[0-4])$/i.test(key)) return key.toUpperCase()
  const named = NAMED_CODES[key.toLowerCase()]
  if (named !== undefined) return named
  throw new Error(`unknown key "${key}" in "${spec}"`)
}

/**
 * Run a shape action and contain its failure.
 * @param run - action to invoke.
 * @returns completion after the action settles.
 */
async function runAction(run: () => void | Promise<void>): Promise<void> {
  try {
    await run()
  } catch (cause) {
    console.warn('dsh-shape: shortcut failed', cause)
  }
}
