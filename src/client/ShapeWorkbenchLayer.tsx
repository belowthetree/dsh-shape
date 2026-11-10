/** Workbench window: a large modal that hosts surfaces contributed by workbench shapes. */

import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import {
  closeShapeWorkbench,
  isShapeWorkbenchOpen,
  selectShapeWorkbench,
  shapeWorkbenchRequestedId,
  shapeWorkbenches,
  subscribeShapeWorkbenchWindow,
  subscribeShapeWorkbenches,
  type ShapeWorkbench,
} from './shape-workbench.ts'

/** One installed shape whose manifest declares `kind: "workbench"`. */
interface WorkbenchShapeInfo {
  id: string
  title: string
  kind?: string
  valid: boolean
  enabled?: boolean
  clientEntry?: string
  error?: string
}

/** Dimmed area around the window; a press here closes it. */
const WORKBENCH_BACKDROP: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 1300,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 24,
  background: 'var(--dsw-alias-bg-mask-1, rgba(0, 0, 0, 0.5))',
  backdropFilter: 'var(--dsw-mask-blur, blur(12px))',
}

/** The window itself: roughly 80% of the viewport on both axes. */
const WORKBENCH_WINDOW: CSSProperties = {
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  width: 'min(80vw, calc(100vw - 48px))',
  height: 'min(80vh, calc(100dvh - 96px))',
  minWidth: 320,
  minHeight: 240,
  overflow: 'hidden',
  outline: 'none',
  pointerEvents: 'auto',
  color: 'var(--dsw-alias-label-primary, #e6edf3)',
  background: 'var(--dsw-alias-bg-layer-2, #1b1d22)',
  border: '1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.08))',
  borderRadius: 'var(--dsw-radius-panel, 18px)',
  boxShadow: 'var(--dsw-elevation-prominent, 0 24px 80px rgba(0, 0, 0, 0.36))',
}

/** Window plus the tab strip underneath; the gap stays click-through to the backdrop. */
const WORKBENCH_STACK: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 10,
  maxHeight: '100%',
  pointerEvents: 'none',
}

/** Workbench tabs below the window: a label column and selection dot each. */
const WORKBENCH_TABS: CSSProperties = {
  display: 'flex',
  flex: 'none',
  alignItems: 'flex-start',
  justifyContent: 'center',
  gap: 18,
  maxWidth: 'calc(100vw - 48px)',
  padding: '6px 14px',
  overflowX: 'auto',
  pointerEvents: 'auto',
  background: 'color-mix(in srgb, var(--dsw-alias-bg-layer-2, #1b1d22) 92%, transparent)',
  border: '1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.08))',
  borderRadius: 12,
  backdropFilter: 'blur(8px)',
}

/** One workbench tab: its title above the selection dot. */
const WORKBENCH_TAB: CSSProperties = {
  display: 'flex',
  flex: 'none',
  flexDirection: 'column',
  alignItems: 'center',
  gap: 5,
  maxWidth: 180,
  minWidth: 0,
  padding: 0,
  font: 'inherit',
  background: 'transparent',
  border: 0,
  cursor: 'pointer',
}

const WORKBENCH_TAB_LABEL: CSSProperties = {
  overflow: 'hidden',
  color: 'var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.6))',
  fontSize: 11,
  lineHeight: '15px',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}

const WORKBENCH_TAB_LABEL_ACTIVE: CSSProperties = {
  color: 'var(--dsw-alias-label-primary, #e6edf3)',
}

const WORKBENCH_BODY: CSSProperties = {
  position: 'relative',
  flex: 1,
  minHeight: 0,
  overflow: 'auto',
}

const WORKBENCH_FRAME_BODY: CSSProperties = {
  width: '100%',
  height: '100%',
}

const WORKBENCH_FOOTER: CSSProperties = {
  display: 'flex',
  flex: 'none',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '8px 20px',
  color: 'var(--dsw-alias-label-tertiary, rgba(255, 255, 255, 0.42))',
  fontSize: 11,
  lineHeight: '16px',
  borderTop: '1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.08))',
}

/** Selection dot under a workbench tab: hollow when inactive, filled when active. */
const WORKBENCH_DOT: CSSProperties = {
  boxSizing: 'border-box',
  width: 7,
  height: 7,
  background: 'transparent',
  borderWidth: 1,
  borderStyle: 'solid',
  borderColor: 'var(--dsw-alias-label-tertiary, rgba(255, 255, 255, 0.45))',
  borderRadius: '50%',
}

const WORKBENCH_DOT_ACTIVE: CSSProperties = {
  background: 'var(--dsw-alias-label-primary, #fff)',
  borderColor: 'var(--dsw-alias-label-primary, #fff)',
}

const WORKBENCH_EMPTY: CSSProperties = {
  boxSizing: 'border-box',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 10,
  width: '100%',
  height: '100%',
  padding: 32,
  textAlign: 'center',
}

const WORKBENCH_EMPTY_MARK: CSSProperties = {
  display: 'grid',
  placeItems: 'center',
  width: 52,
  height: 52,
  color: 'var(--dsw-alias-label-tertiary, rgba(255, 255, 255, 0.42))',
  font: '300 26px/1 var(--ds-font-family, system-ui)',
  border: '1px dashed var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.18))',
  borderRadius: 14,
}

const WORKBENCH_EMPTY_TITLE: CSSProperties = {
  margin: 0,
  fontSize: 16,
  fontWeight: 500,
}

const WORKBENCH_EMPTY_TEXT: CSSProperties = {
  maxWidth: 560,
  margin: 0,
  color: 'var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.6))',
  fontSize: 13,
  lineHeight: '21px',
}

const WORKBENCH_EMPTY_NOTE: CSSProperties = {
  maxWidth: 560,
  margin: 0,
  color: 'var(--dsw-alias-label-tertiary, rgba(255, 255, 255, 0.42))',
  fontSize: 12,
  lineHeight: '18px',
}

const WORKBENCH_CODE: CSSProperties = {
  padding: '1px 5px',
  fontFamily: 'var(--ds-font-family-mono, ui-monospace, SFMono-Regular, Menlo, monospace)',
  fontSize: '0.92em',
  whiteSpace: 'nowrap',
  background: 'var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.06))',
  borderRadius: 4,
}

/**
 * Read the installed shapes whose manifest declares the workbench kind.
 * @returns workbench shapes known to the Host, or an empty list.
 */
async function readWorkbenchShapes(): Promise<WorkbenchShapeInfo[]> {
  try {
    const response = await fetch('/dsh-shape/api/shapes', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { accept: 'application/json' },
    })
    if (!response.ok) return []
    const payload = await response.json() as { ok?: boolean; shapes?: WorkbenchShapeInfo[] }
    if (payload.ok !== true || !Array.isArray(payload.shapes)) return []
    return payload.shapes.filter(shape => shape.kind === 'workbench')
  } catch {
    return []
  }
}

/**
 * Explain why an installed workbench shape contributed no surface.
 * @param shape - installed shape entry.
 * @returns a short reason.
 */
function describeWorkbenchState(shape: WorkbenchShapeInfo): string {
  if (shape.enabled === false) return '已停用'
  if (!shape.valid) return `清单无效${shape.error === undefined ? '' : `：${shape.error}`}`
  if (shape.clientEntry === undefined) return '没有 client/index.js'
  return '尚未激活'
}

/**
 * Mount one workbench's render callback into a container the window owns.
 * @param props.workbench - workbench to render.
 * @returns the container element.
 */
function WorkbenchSurface({ workbench }: { workbench: ShapeWorkbench }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = ref.current
    if (container === null) return
    let cleanup: (() => void) | undefined
    try {
      const result = workbench.render(container)
      if (typeof result === 'function') cleanup = result
    } catch (cause) {
      console.warn('dsh-shape: workbench render failed', cause)
      container.textContent = '工作台渲染失败，详见控制台。'
    }
    return () => {
      cleanup?.()
      container.replaceChildren()
    }
  }, [workbench])
  return (
    <div
      ref={ref}
      style={WORKBENCH_FRAME_BODY}
      data-testid="dsh-shape-workbench-body"
      data-shape-workbench={workbench.id}
    />
  )
}

/**
 * Explain how a workbench shape is added when none is mounted.
 * @param props.installed - installed shapes the Host reported as workbench-kind.
 * @returns the empty state.
 */
function WorkbenchEmptyState({ installed }: { installed: readonly WorkbenchShapeInfo[] }) {
  return (
    <div style={WORKBENCH_EMPTY} data-testid="dsh-shape-workbench-empty">
      <span style={WORKBENCH_EMPTY_MARK} aria-hidden="true">＋</span>
      <strong style={WORKBENCH_EMPTY_TITLE}>还没有工作台类型的 shape</strong>
      <p style={WORKBENCH_EMPTY_TEXT}>
        用 Shape Studio 预设新建一个工作台：在 package.json 的 shape 块里写
        {' '}
        <code style={WORKBENCH_CODE}>"kind": "workbench"</code>
        ，再在 client/index.js 里调用
        {' '}
        <code style={WORKBENCH_CODE}>api.workbench({'{ id, title, render }'})</code>
        。
      </p>
      {installed.length > 0 && (
        <p style={WORKBENCH_EMPTY_NOTE}>
          已安装但未挂载：
          {installed.map(shape => `${shape.id}（${describeWorkbenchState(shape)}）`).join('、')}
        </p>
      )}
    </div>
  )
}

/**
 * Render the workbench window while it is open.
 * @returns the portal, or null while closed.
 */
export function ShapeWorkbenchLayer() {
  const [open, setOpen] = useState(isShapeWorkbenchOpen)
  const [workbenches, setWorkbenches] = useState(shapeWorkbenches)
  const [requested, setRequested] = useState(shapeWorkbenchRequestedId)
  const [installed, setInstalled] = useState<readonly WorkbenchShapeInfo[]>([])
  const windowRef = useRef<HTMLElement>(null)

  useEffect(() => subscribeShapeWorkbenchWindow(() => {
    setOpen(isShapeWorkbenchOpen())
    setRequested(shapeWorkbenchRequestedId())
  }), [])

  useEffect(() => subscribeShapeWorkbenches(() => { setWorkbenches(shapeWorkbenches()) }), [])

  useEffect(() => {
    if (!open) return
    let cancelled = false
    void readWorkbenchShapes().then((shapes) => {
      if (!cancelled) setInstalled(shapes)
    })
    return () => { cancelled = true }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return
      if (!event.ctrlKey || !event.altKey || event.metaKey || event.shiftKey) return
      if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return
      const list = shapeWorkbenches()
      if (list.length === 0) return
      event.preventDefault()
      // Window capture runs before the bundled workspace switcher shape's own
      // document listener, so only the workbench reacts while it is open.
      event.stopImmediatePropagation()
      const current = shapeWorkbenchRequestedId() ?? list[0]?.id
      const index = list.findIndex(workbench => workbench.id === current)
      const delta = event.key === 'ArrowLeft' ? -1 : 1
      const nextIndex = index === -1
        ? (delta === 1 ? 0 : list.length - 1)
        : (index + delta + list.length) % list.length
      const next = list[nextIndex]
      if (next !== undefined) selectShapeWorkbench(next.id)
    }
    window.addEventListener('keydown', onKeyDown, true)
    return () => { window.removeEventListener('keydown', onKeyDown, true) }
  }, [open])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape' || event.defaultPrevented) return
      event.preventDefault()
      event.stopPropagation()
      closeShapeWorkbench()
    }
    document.addEventListener('keydown', onKeyDown, true)
    windowRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKeyDown, true)
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [open])

  if (!open) return null

  const active = workbenches.find(workbench => workbench.id === requested) ?? workbenches[0] ?? null

  return createPortal((
    <div
      style={WORKBENCH_BACKDROP}
      role="presentation"
      data-testid="dsh-shape-workbench-backdrop"
      onMouseDown={(event) => { if (event.target === event.currentTarget) closeShapeWorkbench() }}
    >
      <div style={WORKBENCH_STACK}>
        <section
          ref={windowRef}
          tabIndex={-1}
          style={WORKBENCH_WINDOW}
          role="dialog"
          aria-modal="true"
          aria-label="shape 工作台"
          data-testid="dsh-shape-workbench"
        >
          <div style={WORKBENCH_BODY}>
            {active === null
              ? <WorkbenchEmptyState installed={installed} />
              : <WorkbenchSurface key={active.id} workbench={active} />}
          </div>
          <footer style={WORKBENCH_FOOTER}>
            <span>Esc、点击空白处或 Ctrl+Alt+W 关闭</span>
            <span>Ctrl+Alt+←/→ 切换工作台</span>
          </footer>
        </section>
        {workbenches.length > 0 && (
          <div style={WORKBENCH_TABS} role="tablist" aria-label="切换 shape 工作台">
            {workbenches.map((workbench) => {
              const selected = workbench.id === active?.id
              return (
                <button
                  key={workbench.id}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  data-testid="dsh-shape-workbench-tab"
                  data-shape-workbench-id={workbench.id}
                  data-active={selected ? 'true' : 'false'}
                  style={WORKBENCH_TAB}
                  onClick={() => { selectShapeWorkbench(workbench.id) }}
                >
                  <span style={selected ? { ...WORKBENCH_TAB_LABEL, ...WORKBENCH_TAB_LABEL_ACTIVE } : WORKBENCH_TAB_LABEL}>
                    {workbench.title}
                  </span>
                  <span
                    style={selected ? { ...WORKBENCH_DOT, ...WORKBENCH_DOT_ACTIVE } : WORKBENCH_DOT}
                    aria-hidden="true"
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </div>
  ), document.body)
}
