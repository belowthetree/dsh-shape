/** Top-bar action that opens the registered-shape browser. */

import { useState } from 'react'
import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import { ShapeDialog } from './ShapeDialog.tsx'

/**
 * Render the header action and own the dialog's open state.
 * @returns the button plus its dialog.
 */
export function ShapeButton() {
  const [open, setOpen] = useState(false)
  return (
    <>
      <Button
        data-testid="dsh-shape-open"
        size="sm"
        variant="ghost"
        title="Shapes"
        aria-haspopup="dialog"
        onClick={() => { setOpen(true) }}
      >
        Shapes
      </Button>
      <ShapeDialog open={open} onClose={() => { setOpen(false) }} />
    </>
  )
}
