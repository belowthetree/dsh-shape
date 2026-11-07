/** Shape-owned entries and mounts in the conversation slots. */

import { useCallback, useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
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
  placement?: string
  snap?: boolean
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

/** A window position in viewport coordinates. */
interface Point {
  x: number
  y: number
}

/** One measured box. */
interface Size {
  width: number
  height: number
}

/** Distance from a viewport edge that snaps a floating window. */
const SNAP_DISTANCE = 24
/** Margin kept between a snapped window and the viewport edge. */
const SNAP_MARGIN = 8
/** Key prefix for a floating window's remembered position. */
const FLOAT_STORAGE_PREFIX = 'dsh-shape:float:'

/** Stack positioning of anchored entries, at the composer card's top edge. */
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

/** Compact entry chrome shared by the strip presentation. */
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

/** Window chrome of a floating panel. */
const FLOAT_WINDOW: CSSProperties = {
  position: 'fixed',
  zIndex: 60,
  width: 320,
  maxWidth: 'min(380px, calc(100vw - 16px))',
  borderRadius: 10,
  border: '1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.12))',
  background: 'var(--dsw-alias-bg-layer-2, #1b1d22)',
  boxShadow: '0 16px 40px rgba(0, 0, 0, 0.36)',
  color: 'var(--dsw-alias-label-primary, #e6edf3)',
  overflow: 'hidden',
}

/** Drag bar of a floating panel. */
const FLOAT_BAR: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '6px 8px 6px 12px',
  cursor: 'move',
  userSelect: 'none',
  touchAction: 'none',
  background: 'var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.04))',
  fontSize: 12,
  lineHeight: '18px',
}

/** Body of a floating panel. */
const FLOAT_BODY: CSSProperties = {
  padding: '10px 12px 12px',
  fontSize: 12,
  lineHeight: 1.6,
}

/**
 * Keep a window inside the viewport.
 * @param position - desired top-left corner.
 * @param size - window size.
 * @param viewport - viewport size.
 * @returns the clamped position.
 */
function clampPosition(position: Point, size: Size, viewport: Size): Point {
  return {
    x: Math.min(Math.max(0, position.x), Math.max(0, viewport.width - size.width)),
    y: Math.min(Math.max(0, position.y), Math.max(0, viewport.height - size.height)),
  }
}

/**
 * Snap a released window to the nearest viewport edge.
 * @param position - released top-left corner.
 * @param size - window size.
 * @param viewport - viewport size.
 * @param snap - whether snapping is enabled.
 * @returns the snapped, clamped position.
 */
function snapPosition(position: Point, size: Size, viewport: Size, snap: boolean): Point {
  const clamped = clampPosition(position, size, viewport)
  if (!snap) return clamped
  let { x, y } = clamped
  if (x <= SNAP_DISTANCE) x = SNAP_MARGIN
  else if (x + size.width >= viewport.width - SNAP_DISTANCE) x = viewport.width - size.width - SNAP_MARGIN
  if (y <= SNAP_DISTANCE) y = SNAP_MARGIN
  else if (y + size.height >= viewport.height - SNAP_DISTANCE) y = viewport.height - size.height - SNAP_MARGIN
  return clampPosition({ x, y }, size, viewport)
}

/**
 * Place a window that has no remembered position above the composer's corner.
 * @param size - window size.
 * @param viewport - viewport size.
 * @returns the default position.
 */
function defaultPosition(size: Size, viewport: Size): Point {
  return clampPosition({
    x: viewport.width - size.width - SNAP_MARGIN,
    y: viewport.height - size.height - 160,
  }, size, viewport)
}

/**
 * Read a remembered window position.
 * @param key - storage key.
 * @returns the stored position, when one is readable.
 */
function readStoredPosition(key: string): Point | null {
  try {
    const raw = localStorage.getItem(key)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as { x?: unknown; y?: unknown }
    if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number') return null
    return { x: parsed.x, y: parsed.y }
  } catch {
    return null
  }
}

/**
 * Remember a window position.
 * @param key - storage key.
 * @param position - position to store.
 */
function storePosition(key: string, position: Point): void {
  try {
    localStorage.setItem(key, JSON.stringify(position))
  } catch {
    // Private-mode storage can refuse writes; the window still works for this mount.
  }
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
export function ShapeMountBox({ mount, style }: { mount: ShapeMount; style: CSSProperties }) {
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
 * One draggable window portalled to the document body.
 * @param props.title - bar label.
 * @param props.storageKey - key that remembers the position.
 * @param props.snap - whether a released window snaps to viewport edges.
 * @param props.onClose - optional dismiss control.
 * @param props.children - window body.
 * @returns the window.
 */
function FloatingWindow({ title, storageKey, snap, onClose, children }: {
  title: string
  storageKey: string
  snap: boolean
  onClose?: () => void
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [position, setPosition] = useState<Point | null>(null)
  const drag = useRef<{ dx: number; dy: number } | null>(null)

  useEffect(() => {
    const element = ref.current
    if (element === null || position !== null) return
    const size = { width: element.offsetWidth, height: element.offsetHeight }
    const viewport = { width: window.innerWidth, height: window.innerHeight }
    const stored = readStoredPosition(storageKey)
    setPosition(stored === null ? defaultPosition(size, viewport) : clampPosition(stored, size, viewport))
  }, [position, storageKey])

  const measure = (): { size: Size; viewport: Size } => {
    const element = ref.current
    return {
      size: { width: element?.offsetWidth ?? 0, height: element?.offsetHeight ?? 0 },
      viewport: { width: window.innerWidth, height: window.innerHeight },
    }
  }

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0) return
    const element = ref.current
    if (element === null) return
    const rect = element.getBoundingClientRect()
    drag.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top }
    event.currentTarget.setPointerCapture(event.pointerId)
    event.preventDefault()
  }

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (drag.current === null) return
    const { size, viewport } = measure()
    setPosition(clampPosition({ x: event.clientX - drag.current.dx, y: event.clientY - drag.current.dy }, size, viewport))
  }

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (drag.current === null) return
    drag.current = null
    const { size, viewport } = measure()
    setPosition((current) => {
      if (current === null) return current
      const next = snapPosition(current, size, viewport, snap)
      storePosition(storageKey, next)
      return next
    })
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
  }

  return (
    <div
      ref={ref}
      style={{ ...FLOAT_WINDOW, left: position?.x ?? 0, top: position?.y ?? 0, visibility: position === null ? 'hidden' : 'visible' }}
      data-shape-float={storageKey}
    >
      <div
        style={FLOAT_BAR}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        title="拖动"
      >
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{title}</span>
        {onClose !== undefined && (
          <button
            type="button"
            aria-label="关闭"
            data-testid="dsh-shape-float-dismiss"
            style={DISMISS_STYLE}
            onPointerDown={(event) => { event.stopPropagation() }}
            onClick={onClose}
          >
            ×
          </button>
        )}
      </div>
      <div style={FLOAT_BODY}>{children}</div>
    </div>
  )
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
  const anchored: ReactNode[] = []
  const floating: ReactNode[] = []

  entries
    .map((entry, index) => ({ entry, key: `${entry.shape.id}:${String(index)}` }))
    .filter(({ key }) => !dismissed.has(key))
    .forEach(({ entry: { shape, card }, key }) => {
      const greeting = greetings[key]
      const title = card.title ?? shape.title
      const greet = (): void => {
        setGreetings(current => ({ ...current, [key]: card.greeting ?? '你好！' }))
      }
      const dismiss = (): void => {
        setDismissed(current => new Set(current).add(key))
      }

      if (presentation === 'inline') {
        anchored.push(
          <span key={key} style={INLINE_ENTRY} title={card.text ?? title} data-testid="dsh-shape-slot-entry" data-shape-id={shape.id} data-slot={slot}>
            <ShapeGlyph icon={card.icon} title={title} />
            <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</span>
          </span>,
        )
        return
      }
      if (presentation === 'menu-row') {
        anchored.push(
          <div key={key} style={MENU_ROW} data-testid="dsh-shape-slot-entry" data-shape-id={shape.id} data-slot={slot}>
            <ShapeGlyph icon={card.icon} title={title} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div>{title}</div>
              {card.text !== undefined && <div style={{ opacity: 0.7, fontSize: 12 }}>{card.text}</div>}
              {greeting !== undefined && <div style={{ opacity: 0.9, fontSize: 12 }} role="status">{greeting}</div>}
            </div>
            {card.button !== undefined && <Button size="sm" variant="outline" data-testid="dsh-shape-chat-greet" onClick={greet}>{card.button}</Button>}
          </div>,
        )
        return
      }

      const action = card.button ?? (presentation === 'strip' ? undefined : '打个招呼')
      if (presentation === 'panel' && card.placement === 'floating') {
        floating.push(
          <FloatingWindow
            key={key}
            title={title}
            storageKey={`${FLOAT_STORAGE_PREFIX}${slot}:${key}`}
            snap={card.snap !== false}
            onClose={dismiss}
          >
            {card.text !== undefined && <div>{card.text}</div>}
            {greeting !== undefined && <div style={{ marginTop: 4 }} role="status">{greeting}</div>}
            {action !== undefined && (
              <div style={{ marginTop: 8 }}>
                <Button size="sm" variant="outline" data-testid="dsh-shape-chat-greet" onClick={greet}>{action}</Button>
              </div>
            )}
          </FloatingWindow>,
        )
        return
      }
      anchored.push(
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
              onClick={dismiss}
            >
              ×
            </button>
          )}
        </section>,
      )
    })

  for (const mount of mounts) {
    const floatingMount = presentation === 'panel' && mount.placement === 'floating'
    if (floatingMount) {
      floating.push(
        <FloatingWindow
          key={`mount:${mount.shapeId}`}
          title={mount.title}
          storageKey={`${FLOAT_STORAGE_PREFIX}${slot}:${mount.shapeId}`}
          snap={mount.snap}
        >
          <ShapeMountBox mount={mount} style={{ display: 'block', width: '100%' }} />
        </FloatingWindow>,
      )
      continue
    }
    anchored.push(
      <ShapeMountBox key={`mount:${mount.shapeId}`} mount={mount} style={mountStyle(presentation)} />,
    )
  }

  if (anchored.length === 0 && floating.length === 0) return null
  const inlineContent = anchored.length === 0
    ? null
    : presentation === 'panel'
      ? <div style={PANEL_STACK}>{anchored}</div>
      : presentation === 'card'
        ? <div className={css.list}>{anchored}</div>
        : <>{anchored}</>
  return (
    <>
      {inlineContent}
      {floating.map(node => createPortal(node, document.body))}
    </>
  )
}
