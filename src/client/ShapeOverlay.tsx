/** Full-screen layer that hosts `shell.overlay` mounts. */

import { useEffect, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { shapeMounts, subscribeShapeMounts } from './shape-slots.ts'
import { ShapeMountBox } from './ShapeSlotEntries.tsx'

/** The layer ignores pointer events; each mount re-enables them for its own content. */
const LAYER: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 2147483000,
  display: 'block',
  pointerEvents: 'none',
}

const ENTRY: CSSProperties = { pointerEvents: 'auto' }

/**
 * Render every `shell.overlay` mount into one fixed layer above the app.
 * @param props.slot - overlay slot name; defaults to the only overlay slot.
 * @returns the portal, or null when nothing is mounted.
 */
export function ShapeOverlay({ slot = 'shell.overlay' }: { slot?: string }) {
  const [list, setList] = useState(() => shapeMounts(slot))
  useEffect(() => {
    const sync = (): void => { setList(shapeMounts(slot)) }
    sync()
    return subscribeShapeMounts(slot, sync)
  }, [slot])
  if (list.length === 0) return null
  return createPortal(
    <div style={LAYER} data-shape-overlay={slot}>
      {list.map(mount => (
        <ShapeMountBox key={`mount:${mount.shapeId}`} mount={mount} style={ENTRY} />
      ))}
    </div>,
    document.body,
  )
}
