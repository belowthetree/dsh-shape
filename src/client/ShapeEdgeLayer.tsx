/** Fixed layer that renders shape edge popups and owns their Escape handling. */

import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from 'react'
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

/**
 * Top boundary published by the DSH frame: the Windows caption row, 0 while
 * fullscreen. The fallback keeps Web and macOS at the plain viewport edge, so
 * the same expression works in a browser and inside the desktop shell.
 */
const FRAME_TOP = 'var(--dsh-frame-chrome-top, 0px)'

/** Thickness of the invisible strip that resizes a window. */
const RESIZE_EDGE = 6

/** Smallest size a user drag can produce. */
const MIN_WIDTH = 240
const MIN_HEIGHT = 160

/** Key prefix for a window size the user dragged. */
const SIZE_STORAGE_PREFIX = 'dsh-shape:edge-size:'

/** One window dimension: pixels, or the whole viewport. */
type Dimension = number | 'full'

/** Width and height of one window. */
interface EdgeSize {
  width: Dimension
  height: Dimension
}

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
  boxSizing: 'border-box',
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

/** The invisible strip that owns one resize direction. */
const RESIZE_STRIP: CSSProperties = {
  position: 'absolute',
  zIndex: 3,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  touchAction: 'none',
}

/** Faint grip that makes the resize strip discoverable. */
const GRIP: CSSProperties = {
  pointerEvents: 'none',
  borderRadius: 2,
  background: 'var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.18))',
}

/**
 * Position one popup on its edge, centered along it.
 *
 * A `full` axis makes the strip reach the opposite viewport edge, so the
 * window's percentage size resolves against a definite box.
 * @param edge - edge the window belongs to.
 * @param size - current window size.
 * @returns the fixed strip that centers and sizes the window.
 */
function stripStyle(edge: ShapeEdge, size: EdgeSize): CSSProperties {
  const base: CSSProperties = {
    position: 'fixed',
    display: 'flex',
    zIndex: LAYER_Z,
    pointerEvents: 'none',
  }
  const fullWidth = size.width === 'full'
  const fullHeight = size.height === 'full'
  if (edge === 'top' || edge === 'bottom') {
    return {
      ...base,
      left: 0,
      right: 0,
      justifyContent: 'center',
      // A top window starts below the caption row; the caption never moves.
      ...(edge === 'top'
        ? { top: `calc(${FRAME_TOP} + ${String(EDGE_MARGIN)}px)` }
        : { bottom: EDGE_MARGIN }),
      ...(fullHeight ? (edge === 'top' ? { bottom: 0 } : { top: FRAME_TOP }) : {}),
    }
  }
  return {
    ...base,
    top: FRAME_TOP,
    bottom: 0,
    alignItems: 'center',
    ...(edge === 'left' ? { left: EDGE_MARGIN } : { right: EDGE_MARGIN }),
    ...(fullWidth ? (edge === 'left' ? { right: 0 } : { left: 0 }) : {}),
  }
}

/**
 * Size one window; `full` fills the strip, numbers stay inside the viewport.
 * @param size - current window size.
 * @returns the width, height, and maximums for the window.
 */
function sizeStyle(size: EdgeSize): CSSProperties {
  return {
    width: size.width === 'full' ? '100%' : `${String(size.width)}px`,
    height: size.height === 'full' ? '100%' : `${String(size.height)}px`,
    maxWidth: size.width === 'full' ? '100vw' : 'calc(100vw - 24px)',
    maxHeight: size.height === 'full' ? '100vh' : `calc(100vh - ${FRAME_TOP} - 24px)`,
  }
}

/**
 * Position the resize strip on the window's inner edge.
 * @param edge - edge the window is anchored to.
 * @returns the strip geometry and its resize cursor.
 */
function resizeStripStyle(edge: ShapeEdge): CSSProperties {
  if (edge === 'top') return { ...RESIZE_STRIP, bottom: 0, left: 0, right: 0, height: RESIZE_EDGE, cursor: 'ns-resize' }
  if (edge === 'bottom') return { ...RESIZE_STRIP, top: 0, left: 0, right: 0, height: RESIZE_EDGE, cursor: 'ns-resize' }
  if (edge === 'left') return { ...RESIZE_STRIP, right: 0, top: 0, bottom: 0, width: RESIZE_EDGE, cursor: 'ew-resize' }
  return { ...RESIZE_STRIP, left: 0, top: 0, bottom: 0, width: RESIZE_EDGE, cursor: 'ew-resize' }
}

/**
 * Shape of the grip inside a resize strip.
 * @param axis - dimension the strip resizes.
 * @returns the grip style.
 */
function gripStyle(axis: 'width' | 'height'): CSSProperties {
  return axis === 'width' ? { ...GRIP, width: 3, height: 32 } : { ...GRIP, width: 32, height: 3 }
}

/**
 * Height of the DSH frame's reserved top strip (the Windows caption row).
 * @returns the pixel inset, or 0 in a browser, on macOS, or while fullscreen.
 */
function frameTopInset(): number {
  if (typeof document === 'undefined') return 0
  const raw = getComputedStyle(document.documentElement).getPropertyValue('--dsh-frame-chrome-top')
  const value = Number.parseFloat(raw)
  return Number.isFinite(value) ? Math.max(0, value) : 0
}

/**
 * Largest size one axis may take inside the usable viewport.
 * @param axis - dimension to measure.
 * @returns the pixel limit, never below the minimum.
 */
function viewportLimit(axis: 'width' | 'height'): number {
  const total = axis === 'width' ? window.innerWidth : window.innerHeight
  const inset = axis === 'height' ? EDGE_MARGIN * 2 + frameTopInset() : EDGE_MARGIN * 2
  return Math.max(axis === 'width' ? MIN_WIDTH : MIN_HEIGHT, total - inset)
}

/**
 * Clamp one dimension to the viewport and the minimum size.
 * @param value - requested pixels.
 * @param axis - dimension being clamped.
 * @returns the rounded, clamped size.
 */
function clampSize(value: number, axis: 'width' | 'height'): number {
  const min = axis === 'width' ? MIN_WIDTH : MIN_HEIGHT
  return Math.round(Math.min(Math.max(value, min), viewportLimit(axis)))
}

/**
 * Read a size the user dragged for one popup.
 * @param id - namespaced popup id.
 * @returns the stored size, or null when nothing valid is stored.
 */
function readStoredSize(id: string): { width: number; height: number } | null {
  try {
    const raw = localStorage.getItem(SIZE_STORAGE_PREFIX + id)
    if (raw === null) return null
    const parsed = JSON.parse(raw) as { width?: unknown; height?: unknown }
    if (typeof parsed.width !== 'number' || typeof parsed.height !== 'number') return null
    return { width: parsed.width, height: parsed.height }
  } catch {
    return null
  }
}

/**
 * Remember a size the user dragged.
 * @param id - namespaced popup id.
 * @param size - pixel size to store.
 */
function storeSize(id: string, size: { width: number; height: number }): void {
  try {
    localStorage.setItem(SIZE_STORAGE_PREFIX + id, JSON.stringify(size))
  } catch {
    // Private-mode storage can refuse writes; the window still works for this mount.
  }
}

/**
 * Resolve the size a popup opens with: its declared size, or the size the user
 * last dragged for it.
 * @param popup - popup definition.
 * @returns declared or remembered size, clamped to the viewport.
 */
function initialSize(popup: ShapeEdgePopup): EdgeSize {
  const fallback = DEFAULT_SIZE[popup.edge]
  const declared: EdgeSize = {
    width: popup.width === 'full' ? 'full' : clampSize(popup.width ?? fallback.width, 'width'),
    height: popup.height === 'full' ? 'full' : clampSize(popup.height ?? fallback.height, 'height'),
  }
  const stored = readStoredSize(popup.id)
  if (stored === null) return declared
  return {
    width: declared.width === 'full' ? 'full' : clampSize(stored.width, 'width'),
    height: declared.height === 'full' ? 'full' : clampSize(stored.height, 'height'),
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
 * One edge popup window: entry animation, resize, focus, and dismissal.
 * @param props.popup - registered popup.
 * @param props.closing - whether the registry asked it to close.
 * @returns the window.
 */
function EdgeWindow({ popup, closing }: { popup: ShapeEdgePopup; closing: boolean }) {
  const ref = useRef<HTMLDivElement>(null)
  /** Element focused before the popup opened; focus returns there on close. */
  const restore = useRef<HTMLElement | null>(null)
  const [size, setSize] = useState<EdgeSize>(() => initialSize(popup))
  /** Latest size, readable before React commits the state from a pointer move. */
  const sizeRef = useRef<EdgeSize>(size)
  /** Live drag: pointer origin and the size it started from. */
  const drag = useRef<{ start: number; startSize: number } | null>(null)

  const axis: 'width' | 'height' = popup.edge === 'left' || popup.edge === 'right' ? 'width' : 'height'
  const direction = popup.edge === 'top' || popup.edge === 'left' ? 1 : -1
  const resizable = popup.resizable && size[axis] !== 'full'

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

  const onResizeStart = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (event.button !== 0 || !resizable) return
    const element = ref.current
    if (element === null) return
    const rect = element.getBoundingClientRect()
    drag.current = {
      start: axis === 'width' ? event.clientX : event.clientY,
      startSize: axis === 'width' ? rect.width : rect.height,
    }
    try {
      event.currentTarget.setPointerCapture(event.pointerId)
    } catch {
      // Synthetic pointer events have no capturable pointer; moves still arrive.
    }
    event.preventDefault()
    event.stopPropagation()
  }

  const onResizeMove = (event: ReactPointerEvent<HTMLDivElement>): void => {
    const current = drag.current
    if (current === null) return
    const delta = (axis === 'width' ? event.clientX : event.clientY) - current.start
    const next = clampSize(current.startSize + direction * delta, axis)
    // A pointerup can arrive before React commits the move, so keep the latest
    // value in a ref for the handler that persists it.
    const nextSize: EdgeSize = { ...sizeRef.current, [axis]: next }
    sizeRef.current = nextSize
    setSize(nextSize)
    event.preventDefault()
  }

  const onResizeEnd = (event: ReactPointerEvent<HTMLDivElement>): void => {
    if (drag.current === null) return
    drag.current = null
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }
    const element = ref.current
    if (element !== null) {
      const current = sizeRef.current
      storeSize(popup.id, {
        width: typeof current.width === 'number' ? current.width : element.offsetWidth,
        height: typeof current.height === 'number' ? current.height : element.offsetHeight,
      })
    }
  }

  return (
    <div style={stripStyle(popup.edge, size)} data-shape-edge-strip={popup.id}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-label={popup.title}
        style={{ ...WINDOW, ...sizeStyle(size) }}
        data-testid="dsh-shape-edge"
        data-shape-edge={popup.id}
        data-edge={popup.edge}
        data-width={size.width === 'full' ? 'full' : String(size.width)}
        data-height={size.height === 'full' ? 'full' : String(size.height)}
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
        {resizable && (
          <div
            style={resizeStripStyle(popup.edge)}
            role="separator"
            aria-orientation={axis === 'width' ? 'vertical' : 'horizontal'}
            aria-label="调整窗口大小"
            data-testid="dsh-shape-edge-resize"
            onPointerDown={onResizeStart}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeEnd}
            onPointerCancel={onResizeEnd}
          >
            <span style={gripStyle(axis)} aria-hidden="true" />
          </div>
        )}
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
