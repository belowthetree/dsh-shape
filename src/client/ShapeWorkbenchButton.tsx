/** Top-bar action that raises the shape workbench window. */

import { Button } from '@deepseek-ai/dsh-client-ui-primitives'
import { openShapeWorkbench } from './shape-workbench.ts'

/**
 * Render the header action; the window itself lives in its own overlay layer.
 * @returns the button.
 */
export function ShapeWorkbenchButton() {
  return (
    <Button
      data-testid="dsh-shape-workbench-open"
      size="sm"
      variant="ghost"
      title="shape 工作台 (Ctrl+Alt+W)"
      aria-haspopup="dialog"
      aria-keyshortcuts="Control+Alt+W"
      onClick={() => { openShapeWorkbench() }}
    >
      shape 工作台
    </Button>
  )
}
