/** Hosts for shape-owned left sidebar panels. */

import { useEffect, useRef, type CSSProperties } from 'react'
import type { ShapePanel } from './shape-surfaces.ts'

const BODY: CSSProperties = { display: 'block', width: '100%', height: '100%', overflow: 'auto' }

/** Panellist entries carry metadata only; the sidebar reads their options, not their DOM. */
export function ShapePanelEntry() {
  return null
}

/**
 * Render one shape panel body.
 * @param props.panel - panel registered by the shape.
 * @returns the panel container.
 */
export function ShapePanelBody({ panel }: { panel: ShapePanel }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const container = ref.current
    if (container === null) return
    let cleanup: (() => void) | undefined
    try {
      const result = panel.render(container)
      if (typeof result === 'function') cleanup = result
    } catch (cause) {
      console.warn('dsh-shape: panel render failed', cause)
    }
    return () => {
      cleanup?.()
      container.replaceChildren()
    }
  }, [panel])
  return <div ref={ref} data-shape-panel={panel.id} style={BODY} />
}

/**
 * Bind one panel to a slot component without an element factory in the caller.
 * @param panel - panel registered by the shape.
 * @returns component rendering that panel's body.
 */
export function createPanelComponent(panel: ShapePanel) {
  return function ShapePanelSlotBody() {
    return <ShapePanelBody panel={panel} />
  }
}
