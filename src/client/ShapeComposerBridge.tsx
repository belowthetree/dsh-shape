/** Bridge that publishes one mounted composer to the `dsh-shape#composer` capability. */

import { useEffect } from 'react'
import { attachComposer, type ShapeComposerActions } from './shape-composer.ts'

/** Props the composer slot hands every entry. */
export interface ShapeComposerBridgeProps {
  readonly session?: { readonly sessionId?: string }
  readonly input?: { readonly draft?: string }
  readonly inputActions?: ShapeComposerActions
}

/**
 * Publish the composer of the session this entry is mounted in.
 * @param props.session - session snapshot of the slot scope.
 * @param props.input - current input state.
 * @param props.inputActions - composer actions.
 * @returns nothing; the entry renders no DOM.
 */
export function ShapeComposerBridge({ session, input, inputActions }: ShapeComposerBridgeProps) {
  const sessionId = session?.sessionId
  useEffect(() => {
    if (sessionId === undefined || inputActions === undefined) return
    return attachComposer({
      sessionId,
      readText: () => input?.draft ?? '',
      actions: inputActions,
    })
  }, [sessionId, inputActions, input])
  return null
}
