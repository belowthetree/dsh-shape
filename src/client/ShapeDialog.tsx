/** Shape browser dialog: the Host's folder-based registry, read-only. */

import { useCallback, useEffect, useState } from 'react'
import type { CSSProperties } from 'react'
import { Button, Modal } from '@deepseek-ai/dsh-client-ui-primitives'

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

const panel: CSSProperties = {
  display: 'grid',
  gap: '12px',
  width: '100%',
  maxHeight: '62vh',
  overflow: 'auto',
  paddingRight: '4px',
}

const toolbar: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: '12px',
}

const card: CSSProperties = {
  display: 'grid',
  gap: '8px',
  padding: '12px 14px',
  border: '1px solid var(--dsw-alias-border-secondary, rgba(120, 200, 170, 0.22))',
  borderRadius: '10px',
  background: 'var(--dsw-alias-bg-layer-3, #16261f)',
}

const line: CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  justifyContent: 'space-between',
  gap: '12px',
}

const muted: CSSProperties = {
  color: 'var(--dsw-alias-label-secondary, rgba(220, 240, 232, 0.66))',
  fontSize: '12px',
  lineHeight: 1.5,
}

const badges: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '6px',
  fontSize: '11px',
}

const badge: CSSProperties = {
  padding: '2px 7px',
  borderRadius: '999px',
  border: '1px solid var(--dsw-alias-border-secondary, rgba(120, 200, 170, 0.2))',
  color: 'var(--dsw-alias-label-secondary, rgba(220, 240, 232, 0.66))',
}

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
 * Render the read-only list of registered folder-based shapes.
 * @param props.open - whether the dialog is showing.
 * @param props.onClose - closes the dialog.
 * @returns the dialog, or null while closed.
 */
export function ShapeDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<Status>('loading')
  const [shapes, setShapes] = useState<ShapeInfo[]>([])
  const [roots, setRoots] = useState<Snapshot['roots']>()
  const [error, setError] = useState('')

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

  return (
    <Modal open={open} onClose={onClose} title="Shapes" closeLabel="关闭">
      <div style={panel} data-testid="dsh-shape-dialog">
        <div style={toolbar}>
          <span style={muted}>
            {status === 'ready'
              ? `${String(shapes.length)} 个已注册 shape`
              : status === 'loading' ? '正在读取 shape…' : '读取失败'}
          </span>
          <Button size="sm" variant="outline" data-testid="dsh-shape-refresh" onClick={() => { void load(true) }}>
            刷新
          </Button>
        </div>

        {status === 'error' && (
          <div style={{ ...card, borderColor: 'rgba(255, 120, 120, 0.4)' }}>
            <strong>无法读取 shape</strong>
            <span style={muted}>{error}</span>
            <Button size="sm" variant="outline" onClick={() => { void load(false) }}>重试</Button>
          </div>
        )}

        {status === 'loading' && <span style={muted}>扫描 `package.json`、`views/`、`slots/`、`tools/`…</span>}

        {status === 'ready' && shapes.length === 0 && (
          <div style={card}>
            <strong>还没有 shape</strong>
            <span style={muted}>把 shape 文件夹放进用户目录，然后点刷新。</span>
            {roots !== undefined && <code style={muted}>{roots.user}</code>}
          </div>
        )}

        {status === 'ready' && shapes.map(shape => (
          <div key={shape.id} style={card} data-testid="dsh-shape-card" data-shape-id={shape.id}>
            <div style={line}>
              <strong>{shape.title}</strong>
              <code style={muted}>{shape.id}</code>
            </div>
            {shape.description.length > 0 && <span style={muted}>{shape.description}</span>}
            <div style={badges}>
              <span style={badge}>{shape.origin === 'bundled' ? '内置' : '用户'}</span>
              <span style={badge}>v{shape.version}</span>
              <span style={badge}>views {String(shape.views.length)}</span>
              <span style={badge}>slots {String(shape.slots.length)}</span>
              <span style={badge}>tools {String(shape.tools.length)}</span>
              <span style={badge}>{shape.output}</span>
            </div>
            {!shape.valid && (
              <span style={{ ...muted, color: 'var(--dsw-alias-label-error, #ff9b9b)' }}>
                无效 package.json：{shape.error ?? '缺少 id 或 name'}
              </span>
            )}
            <code style={{ ...muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {shape.dir}
            </code>
          </div>
        ))}

        {roots !== undefined && status === 'ready' && shapes.length > 0 && (
          <span style={{ ...muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            用户目录：{roots.user}
          </span>
        )}
      </div>
    </Modal>
  )
}
