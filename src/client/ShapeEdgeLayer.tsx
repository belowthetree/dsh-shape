/** Fixed layer that renders shape edge popups and owns their Escape handling. */

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import {
  closeShapeEdge,
  finishShapeEdgeClose,
  shapeEdge,
  shapeEdgeSnapshot,
  subscribeShapeEdges,
  topShapeEdge,
  type ShapeEdge,
  type ShapeEdgePopup,
  type ShapeEdgeSnapshot,
} from './shape-edges.ts'

/** Above the app frame and its floating panels; below modal dialogs and the shell overlay. */
const LAYER_Z = 1100

/** Gap kept between a window and the viewport edge it sits on. */
const EDGE_MARGIN = 12

/** Default window size per edge: wide bands on top and bottom, tall columns at the sides. */
const DEFAULT_SIZE: Readonly<Record<ShapeEdge, { width: number; height: number }>> = {
  top: { width: 640, height: 420 },
  right: { width: 380, height: 560 },
  bottom: { width: 640, height: 420 },
  left: { width: 380, height: 560 },
}

/** Distance and direction the window travels while opening or closing. */
const SLIDE: Readonly<Record<ShapeEdge, { x: number; y: number }>> = {
  top: { x: 0, y: -28 },
  right: { x: 28, y: 0 },
  bottom: { x: 0, y: 28 },
  left: { x: -28, y: 0 },
}

const ENTER_MS = 190
const EXIT_MS = 140
const ENTER_EASING = 'cubic-bezier(0.16, 0.84, 0.3, 1)'
const EXIT_EASING = 'cubic-bezier(0.4, 0, 1, 1)'

/** Window chrome; the strip outside it lets pointer events through. */
const WINDOW: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  pointerEvents: 'auto',
  outline: 'none',
  color: 'var(--dsw-alias-label-primary, #e6edf3)',
  background: 'var(--dsw-alias-bg-layer-2, #1b1d22)',
  border: '1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.12))',
  borderRadius: 12,
  boxShadow: '0 18px 48px rgba(0, 0, 0, 0.38)',
}

/** Drag-free title bar; it only labels the window and carries the dismiss control. */
const BAR: CSSProperties = {
  display: 'flex',
  flex: 'none',
  alignItems: 'center',
  gap: 8,
  height: 34,
  padding: '0 6px 0 12px',
  background: 'var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.04))',
  borderBottom: '1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.08))',
  fontSize: 12,
  lineHeight: '18px',
  userSelect: 'none',
}

/** Window label; long titles ellipsize instead of widening the window. */
const BAR_TITLE: CSSProperties = {
  flex: 1,
  minWidth: 0,
  overflow: 'hidden',
  whiteSpace: 'nowrap',
  textOverflow: 'ellipsis',
}

/** Dismiss control. */
const BAR_CLOSE: CSSProperties = {
  flex: 'none',
  width: 24,
  height: 24,
  padding: 0,
  border: 0,
  borderRadius: 6,
  background: 'transparent',
  color: 'var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.6))',
  cursor: 'pointer',
  font: 'inherit',
  fontSize: 16,
  lineHeight: '24px',
}

/** The shape's view fills the rest of the window. */
const FRAME: CSSProperties = {
  display: 'block',
  flex: 1,
  width: '100%',
  minHeight: 0,
  border: 0,
  background: 'var(--dsw-alias-bg-layer-1, #14161a)',
  colorScheme: 'normal',
}

/**
 * Position one popup on its edge, centered along it.
 * @param edge - edge the window belongs to.
 * @returns the fixed strip that centers the window without a transform.
 */
function stripStyle(edge: ShapeEdge): CSSProperties {
  const base: CSSProperties = {
    position: 'fixed',
    display: 'flex',
    zIndex: LAYER_Z,
    pointerEvents: 'none',
  }
  if (edge === 'top') return { ...base, top: EDGE_MARGIN, left: 0, right: 0, justifyContent: 'center' }
  if (edge === 'bottom') return { ...base, bottom: EDGE_MARGIN, left: 0, right: 0, justifyContent: 'center' }
  if (edge === 'left') return { ...base, left: EDGE_MARGIN, top: 0, bottom: 0, alignItems: 'center' }
  return { ...base, right: EDGE_MARGIN, top: 0, bottom: 0, alignItems: 'center' }
}

/**
 * Size one popup, keeping it inside the viewport.
 * @param popup - popup definition.
 * @returns width and height for the window.
 */
function windowSize(popup: ShapeEdgePopup): CSSProperties {
  const fallback = DEFAULT_SIZE[popup.edge]
  const width = Math.max(160, popup.width ?? fallback.width)
  const height = Math.max(120, popup.height ?? fallback.height)
  return {
    width: `${String(width)}px`,
    height: `${String(height)}px`,
    maxWidth: 'calc(100vw - 24px)',
    maxHeight: 'calc(100vh - 24px)',
  }
}

/**
 * Whether the user asked the platform to minimize motion.
 * @returns true when animations should be skipped.
 */
function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Address of the view a popup shows.
 * @param popup - popup definition.
 * @returns the Host URL of the shape's view file.
 */
function viewUrl(popup: ShapeEdgePopup): string {
  const shape = encodeURIComponent(popup.shapeId)
  const file = popup.view.split('/').map(segment => encodeURIComponent(segment)).join('/')
  return `/dsh-shape/view/${shape}/${file}`
}

/**
 * One edge popup window: entry animation, focus ownership, and dismissal.
 * @param props.popup - registered popup.
 * @param props.closing - whether the registry asked it to close.
 * @returns the window.
 */
function EdgeWindow({ popup, closing }: { popup: ShapeEdgePopup; closing: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  /** Element focused before the popup opened; focus returns there on close. */
  const restore = useRef<HTMLElement | null>(null)

  useEffect(() => {
    const element = ref.current
    if (element === null) return
    restore.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    element.focus({ preventScroll: true })
    const slide = SLIDE[popup.edge]
    if (typeof element.animate === 'function' && !prefersReducedMotion()) {
      const animation = element.animate([
        { opacity: 0, transform: `translate3d(${String(slide.x)}px, ${String(slide.y)}px, 0)` },
        { opacity: 1, transform: 'translate3d(0px, 0px, 0px)' },
      ], { duration: ENTER_MS, easing: ENTER_EASING })
      animation.finished.catch(() => {})
    }
    return () => {
      const previous = restore.current
      if (previous !== null && previous.isConnected) previous.focus({ preventScroll: true })
    }
  }, [popup.edge])

  useEffect(() => {
    if (!closing) return
    const element = ref.current
    let settled = false
    const settle = (): void => {
      if (settled) return
      settled = true
      finishShapeEdgeClose(popup.id)
    }
    if (element === null || typeof element.animate !== 'function' || prefersReducedMotion()) {
      settle()
      return
    }
    const slide = SLIDE[popup.edge]
    const animation = element.animate([
      { opacity: 1, transform: 'translate3d(0px, 0px, 0px)' },
      { opacity: 0, transform: `translate3d(${String(slide.x)}px, ${String(slide.y)}px, 0)` },
    ], { duration: EXIT_MS, easing: EXIT_EASING, fill: 'forwards' })
    animation.finished.then(settle, settle)
    // A tab switched to the background can starve `finished`; drop the window anyway.
    const timer = window.setTimeout(settle, EXIT_MS + 120)
    return () => {
      window.clearTimeout(timer)
      animation.cancel()
    }
  }, [closing, popup.edge, popup.id])

  return (
    <div style={stripStyle(popup.edge)} data-shape-edge-strip={popup.id}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-label={popup.title}
        style={{ ...WINDOW, ...windowSize(popup) }}
        data-testid="dsh-shape-edge"
        data-shape-edge={popup.id}
        data-edge={popup.edge}
      >
        <div style={BAR}>
          <span style={BAR_TITLE} title={popup.title}>{popup.title}</span>
          <button
            type="button"
            style={BAR_CLOSE}
            aria-label="关闭"
            title="关闭 (Esc)"
            data-testid="dsh-shape-edge-close"
            onClick={() => { closeShapeEdge(popup.id) }}
          >
            ×
          </button>
        </div>
        <iframe
          style={FRAME}
          title={popup.title}
          src={viewUrl(popup)}
          referrerPolicy="no-referrer"
          sandbox="allow-scripts allow-forms allow-modals allow-popups"
        />
      </div>
    </div>
  )
}

/**
 * Render every open edge popup into a fixed layer above the app.
 * @returns the portal, or null when no popup is open.
 */
export function ShapeEdgeLayer() {
  const [snapshot, setSnapshot] = useState<ShapeEdgeSnapshot>(() => shapeEdgeSnapshot())

  useEffect(() => {
    const sync = (): void => { setSnapshot(shapeEdgeSnapshot()) }
    sync()
    return subscribeShapeEdges(sync)
  }, [])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented || event.repeat || event.isComposing) return
      const popup = topShapeEdge()
      if (popup === undefined || !popup.esc) return
      // Own the key while a popup accepts Escape: a dialog behind it must not
      // also close on the same press.
      event.preventDefault()
      event.stopPropagation()
      closeShapeEdge(popup.id)
    }
    document.addEventListener('keydown', onKeyDown, true)
    return () => { document.removeEventListener('keydown', onKeyDown, true) }
  }, [])

  if (snapshot.open.length === 0) return null

  const windows = snapshot.open.map((id) => {
    const popup = shapeEdge(id)
    if (popup === undefined) return null
    return <EdgeWindow key={id} popup={popup} closing={snapshot.closing.includes(id)} />
  })

  return createPortal(<>{windows}</>, document.body)
}
