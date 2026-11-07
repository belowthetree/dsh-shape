/** Top-bar action that opens the registered-shape browser. */

import { useEffect, useState } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ShapeResolverInjected } from '../capabilities.ts'
import { ShapeDialog } from './ShapeDialog.tsx'
import { subscribeShapeBrowser } from './shape-browser.ts'

/**
 * Render the header action and own the dialog's open state.
 * @param props.resolveShape - capability resolver injected by the Client entry.
 * @returns the button plus its dialog.
 */
export function ShapeButton({ resolveShape }: ShapeResolverInjected) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (event.defaultPrevented || event.repeat || event.isComposing) return
      if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return
      if (event.key !== '.' && event.code !== 'Period') return
      event.preventDefault()
      setOpen(true)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => { window.removeEventListener('keydown', onKeyDown) }
  }, [])

  useEffect(() => subscribeShapeBrowser(() => { setOpen(true) }), [])

  return (
    <>
      <Button
        data-testid="dsh-shape-open"
        size="sm"
        variant="ghost"
        title="Shapes (Ctrl+.)"
        aria-haspopup="dialog"
        aria-keyshortcuts="Control+."
        onClick={() => { setOpen(true) }}
      >
        Shapes
      </Button>
      <ShapeDialog open={open} onClose={() => { setOpen(false) }} resolveShape={resolveShape} />
    </>
  )
}
