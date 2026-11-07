/** Hosts for shape-owned right sidebar tabs. */

import { useEffect, useRef, type CSSProperties } from 'react'
import type { ShapeTab } from './shape-surfaces.ts'

const TAB_BODY_STYLE: CSSProperties = { display: 'block', width: '100%', height: '100%', overflow: 'auto' }
const TAB_TITLE_STYLE: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 }

/**
 * Render one shape tab body.
 * @param props.tab - tab registered by the shape.
 * @returns the tab container.
 */
export function ShapeTabBody({ tab }: { tab: ShapeTab }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = ref.current
    if (container === null) return
    let cleanup: (() => void) | undefined
    try {
      const result = tab.render(container)
      if (typeof result === 'function') cleanup = result
    } catch (cause) {
      console.warn('dsh-shape: tab render failed', cause)
    }
    return () => {
      cleanup?.()
      container.replaceChildren()
    }
  }, [tab])
  return <div ref={ref} data-shape-tab={tab.id} style={TAB_BODY_STYLE} />
}

/**
 * Render one shape tab's chip label.
 * @param props.tab - tab registered by the shape.
 * @returns the label element.
 */
export function ShapeTabTitle({ tab }: { tab: ShapeTab }) {
  return <span data-shape-tab-label={tab.id} style={TAB_TITLE_STYLE}>{tab.title}</span>
}
