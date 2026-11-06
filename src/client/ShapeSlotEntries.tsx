/** Shape-owned entries and mounts in the conversation slots. */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ShapeRequirement, ShapeResolverInjected } from '../capabilities.ts'
import { supportsShapeApiVersion } from '../capabilities.ts'
import {
  presentationOf,
  shapeMounts,
  subscribeShapeMounts,
  type ShapeMount,
  type ShapePresentation,
  type ShapeSlot,
} from './shape-slots.ts'
import css from './shape-chat-cards.module.css'

interface SlotDescriptor {
  slot: string
  title?: string
  text?: string
  button?: string
  greeting?: string
  icon?: string
}

interface ShapeInfo {
  id: string
  title: string
  valid: boolean
  enabled?: boolean
  requirements?: ShapeRequirement[]
  shapeApiVersion?: number
  slotData?: SlotDescriptor[]
}

interface Entry {
  shape: ShapeInfo
  card: SlotDescriptor
}

/** Stack positioning of floating entries, anchored at the composer card's top edge. */
const PANEL_STACK: CSSProperties = {
  position: 'absolute',
  left: 0,
  right: 0,
  bottom: 'calc(100% + 8px)',
  display: 'grid',
  gap: 6,
  maxWidth: 720,
  margin: '0 auto',
}

/** Compact entry chrome shared by the strip, inline, and menu-row presentations. */
const COMPACT_ENTRY: CSSProperties = {
  gap: 8,
  padding: '4px 10px',
  borderRadius: 999,
  boxShadow: 'none',
}

/** One informational chip for the compact tool rows. */
const INLINE_ENTRY: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  minWidth: 0,
  maxWidth: 240,
  height: 24,
  padding: '0 8px',
  borderRadius: 6,
  border: '1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.08))',
  background: 'var(--dsw-alias-bg-layer-2, transparent)',
  color: 'var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.6))',
  fontSize: 12,
  lineHeight: '20px',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
}

/** One row inside a menu. */
const MENU_ROW: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  minWidth: 0,
  padding: '6px 10px',
  borderRadius: 6,
  fontSize: 13,
  lineHeight: '18px',
  textAlign: 'left',
}

/** Glyph fallback when a descriptor declares no icon path. */
const GLYPH_FALLBACK: CSSProperties = {
  display: 'grid',
  flex: 'none',
  placeItems: 'center',
  width: 14,
  height: 14,
  borderRadius: 3,
  background: 'color-mix(in srgb, currentColor 16%, transparent)',
  fontSize: 9,
  lineHeight: 1,
  textTransform: 'uppercase',
}

/** Dismiss control of one floating entry. */
const DISMISS_STYLE: CSSProperties = {
  flex: 'none',
  width: 24,
  height: 24,
  padding: 0,
  border: 0,
  borderRadius: 6,
  background: 'transparent',
  color: 'var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.6))',
  cursor: 'pointer',
  fontSize: 16,
  lineHeight: '24px',
}

/** Wrapper chrome that keeps a mount inside its slot's layout. */
function mountStyle(presentation: ShapePresentation): CSSProperties {
  return presentation === 'inline' || presentation === 'strip' || presentation === 'menu-row'
    ? { display: 'inline-flex', alignItems: 'center', minWidth: 0 }
    : { display: 'block', width: '100%' }
}

/**
 * Read shape descriptors targeting one slot.
 * @param slot - conversation slot to collect.
 * @returns entries contributed by valid shapes.
 */
async function readEntries(slot: string): Promise<Entry[]> {
  const response = await fetch('/dsh-shape/api/shapes', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { accept: 'application/json' },
  })
  if (!response.ok) return []
  const payload = await response.json() as { ok?: boolean; shapes?: ShapeInfo[] }
  if (payload.ok !== true || !Array.isArray(payload.shapes)) return []

  const entries: Entry[] = []
  for (const shape of payload.shapes) {
    if (!shape.valid || shape.enabled === false) continue
    for (const card of shape.slotData ?? []) {
      if (card.slot === slot) entries.push({ shape, card })
    }
  }
  return entries
}

/**
 * Render one descriptor glyph.
 * @param props.icon - SVG path data in a 16×16 view box.
 * @param props.title - fallback letter source.
 * @returns the glyph.
 */
function ShapeGlyph({ icon, title }: { icon?: string; title: string }) {
  if (icon !== undefined) {
    return (
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
        <path d={icon} fill="currentColor" />
      </svg>
    )
  }
  return <span style={GLYPH_FALLBACK} aria-hidden="true">{Array.from(title.trim())[0] ?? '?'}</span>
}

/**
 * Render one mount into a container the slot host owns.
 * @param props.mount - registered mount.
 * @param props.style - wrapper chrome for the slot's layout.
 * @returns the container element.
 */
function ShapeMountBox({ mount, style }: { mount: ShapeMount; style: CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = ref.current
    if (container === null) return
    let cleanup: (() => void) | undefined
    try {
      const result = mount.render(container)
      if (typeof result === 'function') cleanup = result
    } catch (cause) {
      console.warn('dsh-shape: slot mount failed', cause)
    }
    return () => {
      cleanup?.()
      container.replaceChildren()
    }
  }, [mount])
  return <div ref={ref} style={style} data-shape-mount={mount.shapeId} />
}

/**
 * Observe the mounts registered for one slot.
 * @param slot - slot to observe.
 * @returns current mounts.
 */
function useShapeMounts(slot: ShapeSlot): readonly ShapeMount[] {
  const [list, setList] = useState<readonly ShapeMount[]>(() => shapeMounts(slot))
  useEffect(() => {
    const sync = (): void => { setList(shapeMounts(slot)) }
    sync()
    return subscribeShapeMounts(slot, sync)
  }, [slot])
  return list
}

/**
 * Render the descriptors and mounts one conversation slot receives.
 * @param props.resolveShape - resolves declared capability requirements.
 * @param props.slot - conversation slot this host is registered for.
 * @returns the slot content, or null when nothing contributes.
 */
export function ShapeSlotEntries({ resolveShape, slot }: ShapeResolverInjected & { slot: ShapeSlot }) {
  const [entries, setEntries] = useState<Entry[]>([])
  const [greetings, setGreetings] = useState<Record<string, string>>({})
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set())
  const mounts = useShapeMounts(slot)

  const load = useCallback(async (): Promise<void> => {
    try {
      const read = await readEntries(slot)
      setEntries(read.filter(({ shape }) => (
        supportsShapeApiVersion(shape.shapeApiVersion)
        && resolveShape(shape.requirements ?? []).ok
      )))
    } catch {
      // A failed read leaves the slot empty; the shape browser still reports errors.
    }
  }, [resolveShape, slot])

  useEffect(() => {
    void load()
    const reload = (): void => { void load() }
    window.addEventListener('dsh-shape:refresh', reload)
    window.addEventListener('dsh-shape:capabilities', reload)
    return () => {
      window.removeEventListener('dsh-shape:refresh', reload)
      window.removeEventListener('dsh-shape:capabilities', reload)
    }
  }, [load])

  const presentation = presentationOf(slot)
  const rendered = entries
    .map((entry, index) => ({ entry, key: `${entry.shape.id}:${String(index)}` }))
    .filter(({ key }) => !dismissed.has(key))
    .map(({ entry: { shape, card }, key }) => {
      const greeting = greetings[key]
      const title = card.title ?? shape.title
      const greet = (): void => {
        setGreetings(current => ({ ...current, [key]: card.greeting ?? '你好！' }))
      }
      if (presentation === 'inline') {
        return (
          <span key={key} style={INLINE_ENTRY} title={card.text ?? title} data-testid="dsh-shape-slot-entry" data-shape-id={shape.id} data-slot={slot}>
            <ShapeGlyph icon={card.icon} title={title} />
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
          </span>
        )
      }
      if (presentation === 'menu-row') {
        return (
          <div key={key} style={MENU_ROW} data-testid="dsh-shape-slot-entry" data-shape-id={shape.id} data-slot={slot}>
            <ShapeGlyph icon={card.icon} title={title} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div>{title}</div>
              {card.text !== undefined && <div style={{ opacity: 0.7, fontSize: 12 }}>{card.text}</div>}
              {greeting !== undefined && <div style={{ opacity: 0.9, fontSize: 12 }} role="status">{greeting}</div>}
            </div>
            {card.button !== undefined && <Button size="sm" variant="outline" data-testid="dsh-shape-chat-greet" onClick={greet}>{card.button}</Button>}
          </div>
        )
      }
      const action = card.button ?? (presentation === 'strip' ? undefined : '打个招呼')
      return (
        <section
          className={css.card}
          style={presentation === 'strip' ? COMPACT_ENTRY : presentation === 'panel' ? { boxShadow: '0 10px 28px rgba(0, 0, 0, 0.28)' } : undefined}
          key={key}
          data-testid="dsh-shape-slot-entry"
          data-shape-id={shape.id}
          data-slot={slot}
        >
          {presentation !== 'strip' && (
            <span className={css.mark} aria-hidden="true">
              <span className={css.markGrid}>
                <span /><span /><span /><span />
              </span>
            </span>
          )}
          <div className={css.body}>
            <div className={css.heading}>
              <h3 className={css.title}>{title}</h3>
              {presentation !== 'strip' && <code className={css.id}>{shape.id}</code>}
            </div>
            {card.text !== undefined && <p className={css.text}>{card.text}</p>}
            {greeting !== undefined && (
              <p className={css.greeting} role="status">{greeting}</p>
            )}
          </div>
          {action !== undefined && (
            <Button
              size="sm"
              variant="outline"
              data-testid="dsh-shape-chat-greet"
              onClick={greet}
            >
              {action}
            </Button>
          )}
          {presentation === 'panel' && (
            <button
              type="button"
              aria-label="关闭"
              data-testid="dsh-shape-chat-dismiss"
              style={DISMISS_STYLE}
              onClick={() => {
                setDismissed(current => new Set(current).add(key))
              }}
            >
              ×
            </button>
          )}
        </section>
      )
    })

  const mounted = mounts.map(mount => (
    <ShapeMountBox key={`mount:${mount.shapeId}`} mount={mount} style={mountStyle(presentation)} />
  ))
  const content = [...rendered, ...mounted]
  if (content.length === 0) return null
  if (presentation === 'panel') return <div style={PANEL_STACK}>{content}</div>
  if (presentation === 'card') return <div className={css.list}>{content}</div>
  return <>{content}</>
}
