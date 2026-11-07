/** Built-in composer capability: read and write the active composer draft. */

/** The subset of the composer action surface a shape may call. */
export interface ShapeComposerActions {
  /** Replace the whole draft with plain text. */
  setDraft: (text: string) => void
  /** Capture the caret before asynchronous work. */
  captureInsertion?: () => unknown
  /** Insert text at the captured caret. */
  insertText?: (text: string, span: unknown) => boolean
  /** Submit the draft. */
  submit?: () => void
}

/** API passed to shapes that require `dsh-shape#composer`. */
export interface ShapeComposerApi {
  /**
   * Session whose composer is attached.
   * @returns the session id, or null when no composer is mounted.
   */
  sessionId: () => string | null
  /**
   * Read the current draft text.
   * @returns the draft, or an empty string when no composer is mounted.
   */
  getText: () => string
  /**
   * Replace the whole draft.
   * @param text - plain text.
   */
  setText: (text: string) => void
  /**
   * Insert text at the caret, or append when the caret cannot be captured.
   * @param text - plain text.
   * @returns whether the composer accepted the insertion.
   */
  insert: (text: string) => boolean
  /** Submit the draft. */
  submit: () => void
}

interface ComposerBridge {
  readonly sessionId: string
  readonly readText: () => string
  readonly actions: ShapeComposerActions
}

const bridges = new Map<string, ComposerBridge>()
let active: string | undefined

/**
 * Attach one mounted composer.
 * @param bridge - session id, draft reader, and actions.
 * @returns a detacher that only removes its own bridge.
 */
export function attachComposer(bridge: ComposerBridge): () => void {
  bridges.set(bridge.sessionId, bridge)
  active = bridge.sessionId
  return () => {
    if (bridges.get(bridge.sessionId) !== bridge) return
    bridges.delete(bridge.sessionId)
    if (active === bridge.sessionId) active = bridges.keys().next().value
  }
}

/**
 * Build the composer capability.
 * @returns the API shapes receive.
 */
export function createComposer(): ShapeComposerApi {
  const current = (): ComposerBridge | undefined => {
    const id = active
    return id === undefined ? undefined : bridges.get(id)
  }
  return {
    sessionId: () => current()?.sessionId ?? null,
    getText: () => current()?.readText() ?? '',
    setText(text) {
      const bridge = current()
      if (bridge === undefined) throw new Error('dsh-shape#composer: no composer is mounted')
      bridge.actions.setDraft(text)
    },
    insert(text) {
      const bridge = current()
      if (bridge === undefined) throw new Error('dsh-shape#composer: no composer is mounted')
      const span = bridge.actions.captureInsertion?.()
      if (span !== undefined && bridge.actions.insertText?.(text, span) === true) return true
      bridge.actions.setDraft(`${bridge.readText()}${text}`)
      return true
    },
    submit() {
      const bridge = current()
      if (bridge === undefined) throw new Error('dsh-shape#composer: no composer is mounted')
      bridge.actions.submit?.()
    },
  }
}
