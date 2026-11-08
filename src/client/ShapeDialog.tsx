/** Shape browser: a large launcher-style window with a responsive app grid. */

import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  Button,
  IconCloseOutlineRegular,
  IconRefreshOutlineRegular,
  IconTrashOutlineRegular,
} from '@deepseek-ai/dsh-client-ui-primitives'
import type {
  ShapeMissingCapability,
  ShapeRequirement,
  ShapeResolverInjected,
} from '../shared/capabilities.ts'
import { SHAPE_API_VERSION, supportsShapeApiVersion } from '../shared/capabilities.ts'
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
  enabled?: boolean
  requirements?: ShapeRequirement[]
  shapeApiVersion?: number
  error?: string
}

interface Snapshot {
  shapes: ShapeInfo[]
  roots?: { bundled: string; user: string }
}

type Status = 'loading' | 'ready' | 'error'

/**
 * Format one unresolved capability for the card.
 * @param item - missing requirement.
 * @returns compact diagnostic text.
 */
function describeMissing(item: ShapeMissingCapability): string {
  const id = `${item.plugin}#${item.capability}`
  if (item.reason === 'version-mismatch') return `${id} 需要 ${item.range}，当前 ${item.found ?? '未知'}`
  if (item.reason === 'invalid-range') return `${id} 的版本范围无效：${item.range}`
  return `${id} ${item.range}`
}

/**
 * Read the current shape list.
 * @param refresh - ask the Host to rescan the shape roots first.
 * @returns the snapshot, or null when the page is reloading to pick up changed client modules.
 */
async function readShapes(refresh: boolean): Promise<Snapshot | null> {
  let rescanChanged = false
  if (refresh) {
    const rescan = await fetch('/dsh-shape/api/refresh', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { accept: 'application/json' },
    })
    if (!rescan.ok) throw new Error(`refresh failed (${String(rescan.status)})`)
    const receipt = await rescan.json().catch(() => null) as { changed?: boolean } | null
    rescanChanged = receipt?.changed === true
  }

  const response = await fetch('/dsh-shape/api/shapes', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { accept: 'application/json' },
  })
  if (!response.ok) throw new Error(`HTTP ${String(response.status)}`)
  const payload = await response.json() as { ok?: boolean; shapes?: ShapeInfo[]; roots?: Snapshot['roots'] }
  if (payload.ok !== true || !Array.isArray(payload.shapes)) throw new Error('invalid shape response')
  // A shape's client modules are imported once per page load, and a module URL
  // that answered 404 keeps failing; only a reload can pick up a changed set.
  if (rescanChanged) {
    window.location.reload()
    return null
  }
  return {
    shapes: payload.shapes,
    ...(payload.roots === undefined ? {} : { roots: payload.roots }),
  }
}

/**
 * Render the read-only grid of registered folder-based shapes.
 * @param props.open - whether the window is showing.
 * @param props.onClose - closes the window.
 * @param props.resolveShape - resolves declared capability requirements.
 * @returns the window, or null while closed.
 */
export function ShapeDialog({
  open,
  onClose,
  resolveShape,
}: {
  open: boolean
  onClose: () => void
  resolveShape?: ShapeResolverInjected['resolveShape']
}) {
  const [status, setStatus] = useState<Status>('loading')
  const [shapes, setShapes] = useState<ShapeInfo[]>([])
  const [roots, setRoots] = useState<Snapshot['roots']>()
  const [error, setError] = useState('')
  const [selected, setSelected] = useState<ShapeInfo | null>(null)
  const [viewLoading, setViewLoading] = useState(false)
  const [viewError, setViewError] = useState('')
  const [busyId, setBusyId] = useState('')
  const [toggleError, setToggleError] = useState('')
  const [pendingDelete, setPendingDelete] = useState<ShapeInfo | null>(null)
  const [deleteError, setDeleteError] = useState('')
  const windowRef = useRef<HTMLElement>(null)
  const viewRef = useRef<HTMLElement>(null)
  const onCloseRef = useRef(onClose)
  const selectedRef = useRef(selected)
  onCloseRef.current = onClose
  selectedRef.current = selected

  const load = useCallback(async (refresh: boolean): Promise<void> => {
    setStatus('loading')
    setError('')
    try {
      const snapshot = await readShapes(refresh)
      if (snapshot === null) return
      setShapes(snapshot.shapes)
      setRoots(snapshot.roots)
      setStatus('ready')
      window.dispatchEvent(new CustomEvent('dsh-shape:refresh'))
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause))
      setStatus('error')
    }
  }, [])

  const openView = useCallback(async (shape: ShapeInfo): Promise<void> => {
    if (shape.enabled === false) return
    setSelected(shape)
    setViewError('')
    if (shape.views.length === 0) {
      setViewLoading(false)
      return
    }
    setViewLoading(true)
    try {
      const response = await fetch(`/dsh-shape/view/${encodeURIComponent(shape.id)}/`, { cache: 'no-store' })
      if (!response.ok) {
        let message = `Host 返回 HTTP ${String(response.status)}。`
        if (response.status === 404) {
          const payload = await response.json().catch(() => null) as { error?: { message?: unknown } } | null
          message = payload?.error?.message === 'unknown dsh-shape route'
            ? 'Host 视图路由未加载（HTTP 404）。请重启 DSH 后重试。'
            : '这个 shape 没有可打开的 views/index.html。'
        }
        throw new Error(message)
      }
      if (!(response.headers.get('content-type') ?? '').includes('text/html')) {
        throw new Error('Host 返回的不是 HTML 页面。')
      }
      setViewError('')
    } catch (cause) {
      setViewError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setViewLoading(false)
    }
  }, [])

  const closeView = useCallback((): void => {
    setSelected(null)
    setViewError('')
    setViewLoading(false)
  }, [])

  const toggleShape = useCallback(async (shape: ShapeInfo): Promise<void> => {
    const enabled = shape.enabled === false
    setBusyId(shape.id)
    setToggleError('')
    try {
      const response = await fetch('/dsh-shape/api/toggle', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ id: shape.id, enabled }),
      })
      if (!response.ok) throw new Error(`HTTP ${String(response.status)}`)
      const payload = await response.json() as { ok?: boolean; shapes?: ShapeInfo[] }
      if (payload.ok !== true || !Array.isArray(payload.shapes)) throw new Error('invalid toggle response')
      setShapes(payload.shapes)
      window.dispatchEvent(new CustomEvent('dsh-shape:refresh'))
    } catch (cause) {
      setToggleError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusyId('')
    }
  }, [])

  const deleteShape = useCallback(async (shape: ShapeInfo): Promise<void> => {
    setBusyId(shape.id)
    setDeleteError('')
    try {
      const response = await fetch('/dsh-shape/api/delete', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({ id: shape.id }),
      })
      const payload = await response.json().catch(() => null) as {
        ok?: boolean
        shapes?: ShapeInfo[]
        error?: { message?: unknown }
      } | null
      if (payload?.ok !== true || !Array.isArray(payload.shapes)) {
        const message = typeof payload?.error?.message === 'string'
          ? payload.error.message
          : `HTTP ${String(response.status)}`
        throw new Error(message)
      }
      setShapes(payload.shapes)
      setPendingDelete(null)
      window.dispatchEvent(new CustomEvent('dsh-shape:refresh'))
    } catch (cause) {
      setDeleteError(cause instanceof Error ? cause.message : String(cause))
    } finally {
      setBusyId('')
    }
  }, [])

  useEffect(() => {
    if (!open) return
    void load(false)
  }, [load, open])

  useEffect(() => {
    if (!open) return
    const reload = (): void => { void load(false) }
    window.addEventListener('dsh-shape:capabilities', reload)
    return () => { window.removeEventListener('dsh-shape:capabilities', reload) }
  }, [load, open])

  useEffect(() => {
    if (!open) {
      setSelected(null)
      setViewError('')
      setViewLoading(false)
      setPendingDelete(null)
      setDeleteError('')
    }
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
        closeView()
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
  }, [closeView, open])

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
          {toggleError !== '' && (
            <div className={css.toggleError} role="alert">
              切换 shape 失败：{toggleError}
            </div>
          )}

          {deleteError !== '' && (
            <div className={css.toggleError} role="alert">
              删除 shape 失败：{deleteError}
            </div>
          )}

          {pendingDelete !== null && (
            <div className={css.confirmBar} role="group" aria-label={`删除 ${pendingDelete.title}`}>
              <span className={css.confirmText}>
                删除「{pendingDelete.title}」？
                {pendingDelete.origin === 'bundled'
                  ? '内置 shape 会从插件目录移除，重新安装插件才能恢复。'
                  : '该 shape 目录会从磁盘移除，无法撤销。'}
              </span>
              <div className={css.confirmActions}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setPendingDelete(null)
                    setDeleteError('')
                  }}
                >
                  取消
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className={css.confirmDelete}
                  disabled={busyId === pendingDelete.id}
                  onClick={() => { void deleteShape(pendingDelete) }}
                >
                  {busyId === pendingDelete.id ? '删除中…' : '删除'}
                </Button>
              </div>
            </div>
          )}

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
                const enabled = shape.enabled !== false
                const resolution = resolveShape?.(shape.requirements ?? []) ?? {
                  ok: true,
                  capabilities: {},
                  missing: [],
                }
                const apiSupported = supportsShapeApiVersion(shape.shapeApiVersion)
                const blocked = !resolution.ok || !apiSupported
                return (
                  <div
                    className={css.cardShell}
                    key={shape.id}
                    data-enabled={enabled ? 'true' : 'false'}
                    data-blocked={blocked ? 'true' : 'false'}
                  >
                    <button
                      type="button"
                      className={css.card}
                      data-testid="dsh-shape-card"
                      data-shape-id={shape.id}
                      aria-haspopup="dialog"
                      aria-label={`打开 ${shape.title}`}
                      disabled={!enabled || blocked}
                      onClick={() => { void openView(shape) }}
                    >
                      <div className={css.cardHead}>
                        <span className={css.appIcon} aria-hidden="true">{initial.toLocaleUpperCase()}</span>
                        <div className={css.cardIdentity}>
                          <h3 className={css.cardTitle} title={shape.title}>{shape.title}</h3>
                          <code className={css.cardId} title={shape.id}>{shape.id}</code>
                        </div>
                      </div>
                      <p className={css.description}>{shape.description.length > 0 ? shape.description : '暂无描述'}</p>
                      {blocked && (
                        <span className={css.blocked}>
                          {!apiSupported
                            ? `不支持的 shape apiVersion ${String(shape.shapeApiVersion ?? 0)}（需要 ${String(SHAPE_API_VERSION)}）`
                            : `缺少 ${resolution.missing.map(describeMissing).join('、')}`}
                        </span>
                      )}
                      {!shape.valid && (
                        <span className={css.invalid}>
                          无效 package.json：{shape.error ?? '缺少 id 或 name'}
                        </span>
                      )}
                      <div className={css.cardFooter}>
                        <span className={css.origin}>{shape.origin === 'bundled' ? '内置' : '用户'}</span>
                        <span className={css.badge}>v{shape.version}</span>
                        <span className={css.badge}>{String(shape.views.length)} views</span>
                        <span className={css.badge}>{String(shape.slots.length)} slots</span>
                        <span className={css.badge}>{String(shape.tools.length)} tools</span>
                        <span className={css.badge}>{shape.output}</span>
                      </div>
                    </button>
                    <button
                      type="button"
                      className={css.switch}
                      role="switch"
                      aria-checked={enabled}
                      aria-busy={busyId === shape.id}
                      aria-label={`${enabled ? '停用' : '启用'} ${shape.title}`}
                      title={`${enabled ? '停用' : '启用'} ${shape.title}`}
                      data-testid="dsh-shape-toggle"
                      data-toggle-shape-id={shape.id}
                      disabled={busyId === shape.id}
                      onClick={() => { void toggleShape(shape) }}
                    />
                    <button
                      type="button"
                      className={css.deleteButton}
                      aria-label={`删除 ${shape.title}`}
                      title={`删除 ${shape.title}`}
                      data-testid="dsh-shape-delete"
                      data-delete-shape-id={shape.id}
                      disabled={busyId === shape.id}
                      onClick={() => {
                        setDeleteError('')
                        setPendingDelete(shape)
                      }}
                    >
                      <IconTrashOutlineRegular />
                    </button>
                  </div>
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
          onMouseDown={(event) => { if (event.target === event.currentTarget) closeView() }}
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
                onClick={closeView}
              >
                <IconCloseOutlineRegular />
              </button>
            </header>
            <div className={css.viewBody}>
              {selected.views.length === 0 ? (
                <div className={css.placeholder}>
                  <span className={css.placeholderMark} aria-hidden="true">◇</span>
                  <strong>这个 shape 没有 views/ 界面</strong>
                  <span>在 shape 目录下添加 `views/index.html` 后再试。</span>
                </div>
              ) : viewLoading ? (
                <div className={css.placeholder}>
                  <span className={css.placeholderMark} aria-hidden="true">…</span>
                  <span>正在打开界面…</span>
                </div>
              ) : viewError !== '' ? (
                <div className={css.placeholder} data-testid="dsh-shape-view-error">
                  <span className={css.placeholderMark} aria-hidden="true">!</span>
                  <strong>无法打开 shape 界面</strong>
                  <span className={css.placeholderMessage}>{viewError}</span>
                  <Button variant="outline" size="sm" onClick={() => { void openView(selected) }}>
                    重试
                  </Button>
                </div>
              ) : (
                <iframe
                  className={css.viewFrame}
                  title={selected.title}
                  src={`/dsh-shape/view/${encodeURIComponent(selected.id)}/`}
                  sandbox="allow-scripts allow-forms allow-modals allow-popups"
                />
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
