/** Shape browser: a large launcher-style window with a responsive app grid. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Button,
  IconCloseOutlineRegular,
  IconRefreshOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives'
import css from './shape-dialog.module.css'

interface ShapeInfo {
  id: string
  title: string
  description: string
  version: string
  origin: 'bundled' | 'user'
  dir: string
  views: string[]
  slots: string[]
  tools: string[]
  input: unknown
  output: string
  valid: boolean
  error?: string
}

interface Snapshot {
  shapes: ShapeInfo[]
  roots?: { bundled: string; user: string }
}

type Status = 'loading' | 'ready' | 'error'

/**
 * Read the current shape list.
 * @param refresh - ask the Host to rescan the shape roots first.
 * @returns the snapshot.
 */
async function readShapes(refresh: boolean): Promise<Snapshot> {
  if (refresh) {
    const rescan = await fetch('/dsh-shape/api/refresh', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    })
    if (!rescan.ok) throw new Error(`refresh failed (${String(rescan.status)})`)
  }

  const response = await fetch('/dsh-shape/api/shapes', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`HTTP ${String(response.status)}`)
  const payload = await response.json() as { ok?: boolean; shapes?: ShapeInfo[]; roots?: Snapshot['roots'] }
  if (payload.ok !== true || !Array.isArray(payload.shapes)) throw new Error('invalid shape response')
  return {
    shapes: payload.shapes,
    ...(payload.roots === undefined ? {} : { roots: payload.roots }),
  }
}

/**
 * Render the read-only grid of registered folder-based shapes.
 * @param props.open - whether the window is showing.
 * @param props.onClose - closes the window.
 * @returns the window, or null while closed.
 */
export function ShapeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<Status>('loading')
  const [shapes, setShapes] = useState<ShapeInfo[]>([])
  const [roots, setRoots] = useState<Snapshot['roots']>()
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<ShapeInfo | null>(null)
  const windowRef = useRef<HTMLElement>(null)
  const viewRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)
  const selectedRef = useRef(selected)
  onCloseRef.current = onClose
  selectedRef.current = selected
  onCloseRef.current = onClose

  const load = useCallback(async (refresh: boolean): Promise<void> => {
    setStatus('loading')
    setError('')
    try {
      const snapshot = await readShapes(refresh)
      setShapes(snapshot.shapes)
      setRoots(snapshot.roots)
      setStatus('ready')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setStatus('error')
    }
  }, [])

  useEffect(() => {
    if (!open) return
    void load(false)
  }, [load, open])

  useEffect(() => {
    if (!open) setSelected(null)
  }, [open])

  useEffect(() => {
    if (!open) return
    if (selected === null) windowRef.current?.focus()
    else viewRef.current?.focus()
  }, [open, selected])

  useEffect(() => {
    if (!open) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      if (selectedRef.current !== null) {
        setSelected(null)
        return
      }
      onCloseRef.current()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = previousOverflow
      previous?.focus()
    }
  }, [open])

  if (!open) return null

  const subtitle = status === 'loading'
    ? '正在读取 shape…'
    : status === 'error'
      ? '读取失败'
      : `${String(shapes.length)} 个 shape`

  return createPortal((
    <div
      className={css.backdrop}
      role="presentation"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}
    >
      <section
        ref={windowRef}
        tabIndex={-1}
        className={css.window}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dsh-shape-title"
        data-testid="dsh-shape-dialog"
      >
        <header className={css.header}>
          <div className={css.heading}>
            <span className={css.appMark} aria-hidden="true">
              <span className={css.appMarkGrid}>
                <span /><span /><span /><span />
              </span>
            </span>
            <div className={css.headingText}>
              <h2 className={css.title} id="dsh-shape-title">Shapes</h2>
              <p className={css.subtitle}>{subtitle}</p>
            </div>
          </div>
          <div className={css.actions}>
            <button
              type="button"
              className={css.iconButton}
              aria-label="刷新"
              title="刷新"
              data-testid="dsh-shape-refresh"
              onClick={() => { void load(true) }}
            >
              <IconRefreshOutlineRegular />
            </button>
            <button
              type="button"
              className={css.iconButton}
              aria-label="关闭"
              title="关闭"
              data-testid="dsh-shape-close"
              onClick={onClose}
            >
              <IconCloseOutlineRegular />
            </button>
          </div>
        </header>

        <div className={css.content}>
          {status === 'loading' && (
            <div className={css.grid} aria-label="正在读取 shape">
              {Array.from({ length: 8 }, (_, index) => (
                <div className={css.skeletonCard} key={index} />
              ))}
            </div>
          )}

          {status === 'error' && (
            <div className={css.placeholder}>
              <span className={css.placeholderMark} aria-hidden="true">!</span>
              <strong>无法读取 shape</strong>
              <span>{error}</span>
              <Button variant="outline" size="sm" onClick={() => { void load(false) }}>
                重试
              </Button>
            </div>
          )}

          {status === 'ready' && shapes.length === 0 && (
            <div className={css.placeholder}>
              <span className={css.placeholderMark} aria-hidden="true">＋</span>
              <strong>还没有 shape</strong>
              <span>把 shape 文件夹放进用户目录，然后点刷新。</span>
              {roots !== undefined && <code className={css.placeholderPath}>{roots.user}</code>}
            </div>
          )}

          {status === 'ready' && shapes.length > 0 && (
            <div className={css.grid} data-testid="dsh-shape-grid">
              {shapes.map((shape) => {
                const initial = Array.from(shape.title.trim())[0] ?? '?'
                return (
                  <button
                    type="button"
                    className={css.card}
                    key={shape.id}
                    data-testid="dsh-shape-card"
                    data-shape-id={shape.id}
                    aria-haspopup="dialog"
                    aria-label={`打开 ${shape.title}`}
                    onClick={() => { setSelected(shape) }}
                  >
                    <div className={css.cardHead}>
                      <span className={css.appIcon} aria-hidden="true">{initial.toLocaleUpperCase()}</span>
                      <div className={css.cardIdentity}>
                        <h3 className={css.cardTitle} title={shape.title}>{shape.title}</h3>
                        <code className={css.cardId} title={shape.id}>{shape.id}</code>
                      </div>
                      <span className={css.origin}>{shape.origin === 'bundled' ? '内置' : '用户'}</span>
                    </div>
                    <p className={css.description}>{shape.description.length > 0 ? shape.description : '暂无描述'}</p>
                    {!shape.valid && (
                      <span className={css.invalid}>
                        无效 package.json：{shape.error ?? '缺少 id 或 name'}
                      </span>
                    )}
                    <div className={css.cardFooter}>
                      <span className={css.badge}>v{shape.version}</span>
                      <span className={css.badge}>{String(shape.views.length)} views</span>
                      <span className={css.badge}>{String(shape.slots.length)} slots</span>
                      <span className={css.badge}>{String(shape.tools.length)} tools</span>
                      <span className={css.badge}>{shape.output}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <footer className={css.footer}>
          <span className={css.footerPath} title={roots?.user}>
            {roots?.user ?? 'shape 目录'}
          </span>
          <span className={css.footerCount}>{String(shapes.length)} registered</span>
        </footer>
      </section>

      {selected !== null && (
        <div
          className={css.viewBackdrop}
          role="presentation"
          onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}
        >
          <section
            ref={viewRef}
            tabIndex={-1}
            className={css.viewWindow}
            role="dialog"
            aria-modal="true"
            aria-labelledby="dsh-shape-view-title"
            data-testid="dsh-shape-view"
          >
            <header className={css.viewHeader}>
              <div className={css.viewHeading}>
                <span className={css.appIcon} aria-hidden="true">
                  {(Array.from(selected.title.trim())[0] ?? '?').toLocaleUpperCase()}
                </span>
                <div className={css.viewHeadingText}>
                  <h3 className={css.viewTitle} id="dsh-shape-view-title">{selected.title}</h3>
                  <p className={css.viewSubtitle}>
                    {selected.id} · {String(selected.views.length)} views
                  </p>
                </div>
              </div>
              <button
                type="button"
                className={css.iconButton}
                aria-label="关闭"
                title="关闭"
                data-testid="dsh-shape-view-close"
                onClick={() => { setSelected(null) }}
              >
                <IconCloseOutlineRegular />
              </button>
            </header>
            <div className={css.viewBody}>
              {selected.views.length > 0 ? (
                <iframe
                  className={css.viewFrame}
                  title={selected.title}
                  src={`/dsh-shape/view/${encodeURIComponent(selected.id)}/`}
                  sandbox="allow-scripts allow-forms allow-modals allow-popups"
                />
              ) : (
                <div className={css.placeholder}>
                  <span className={css.placeholderMark} aria-hidden="true">◇</span>
                  <strong>这个 shape 没有 views/ 界面</strong>
                  <span>在 shape 目录下添加 `views/index.html` 后再试。</span>
                </div>
              )}
            </div>
            <footer className={css.footer}>
              <span className={css.footerPath} title={selected.dir}>{selected.dir}</span>
              <span className={css.footerCount}>{selected.views[0] ?? 'no views'}</span>
            </footer>
          </section>
        </div>
      )}
    </div>
  ), document.body)
}
