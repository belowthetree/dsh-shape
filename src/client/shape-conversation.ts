/** Built-in conversation capability: read the rendered transcript and reveal one message. */

/** Selector of the transcript flow container. */
const FLOW_SELECTOR = '[data-chat-flow]'
/** Selector of one rendered message anchor. */
const ANCHOR_SELECTOR = '[data-chat-anchor-key]'

/** One rendered message. */
export interface ShapeConversationMessage {
  /** Anchor key the transcript assigned to the message. */
  readonly id: string
  /** Turn number when the row carries one, otherwise 0. */
  readonly turn: number
  /** Visible text of the row. */
  readonly text: string
}

/** One match inside a message. */
export interface ShapeConversationMatch {
  /** Anchor key of the matching message. */
  readonly messageId: string
  /** Offset of the match inside the message text. */
  readonly index: number
  /** Short excerpt around the match. */
  readonly preview: string
}

/** API passed to shapes that require `dsh-shape#conversation`. */
export interface ShapeConversationApi {
  /**
   * Read every message currently rendered in the conversation.
   * @returns messages in transcript order.
   */
  messages: () => readonly ShapeConversationMessage[]
  /**
   * Search the rendered messages.
   * @param text - nonblank needle.
   * @param options - case sensitivity and match cap.
   * @returns matches in transcript order.
   */
  find: (text: string, options?: { caseSensitive?: boolean, limit?: number }) => readonly ShapeConversationMatch[]
  /**
   * Scroll one message into view.
   * @param messageId - anchor key returned by `messages()`.
   * @returns whether the message is rendered.
   */
  reveal: (messageId: string) => boolean
  /**
   * Observe transcript changes.
   * @param listener - change callback.
   * @returns an unsubscribe function.
   */
  subscribe: (listener: () => void) => () => void
}

/**
 * Read one rendered message.
 * @param element - anchor element.
 * @returns its message record.
 */
function readMessage(element: Element): ShapeConversationMessage {
  const turn = Number.parseInt(element.getAttribute('data-chat-turn') ?? '', 10)
  return {
    id: element.getAttribute('data-chat-anchor-key') ?? '',
    turn: Number.isFinite(turn) ? turn : 0,
    text: (element.textContent ?? '').replace(/\s+/gu, ' ').trim(),
  }
}

/**
 * Build the conversation capability.
 * @returns the API shapes receive.
 */
export function createConversation(): ShapeConversationApi {
  const messages = (): readonly ShapeConversationMessage[] => {
    const seen = new Set<string>()
    const rows: ShapeConversationMessage[] = []
    for (const element of document.querySelectorAll(ANCHOR_SELECTOR)) {
      const message = readMessage(element)
      if (message.id === '' || message.text === '' || seen.has(message.id)) continue
      seen.add(message.id)
      rows.push(message)
    }
    return rows
  }
  return {
    messages,
    find(text, options) {
      const needle = options?.caseSensitive === true ? text : text.toLowerCase()
      if (needle === '') return []
      const limit = options?.limit ?? 100
      const matches: ShapeConversationMatch[] = []
      for (const message of messages()) {
        const haystack = options?.caseSensitive === true ? message.text : message.text.toLowerCase()
        let index = haystack.indexOf(needle)
        while (index >= 0 && matches.length < limit) {
          const start = Math.max(0, index - 24)
          matches.push({
            messageId: message.id,
            index,
            preview: message.text.slice(start, Math.min(message.text.length, index + needle.length + 24)),
          })
          index = haystack.indexOf(needle, index + needle.length)
        }
        if (matches.length >= limit) break
      }
      return matches
    },
    reveal(messageId) {
      const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
        ? CSS.escape(messageId)
        : messageId.replace(/["\\]/gu, '\\$&')
      const element = document.querySelector(`[data-chat-anchor-key="${escaped}"]`)
      if (element === null || typeof element.scrollIntoView !== 'function') return false
      element.scrollIntoView({ block: 'center' })
      return true
    },
    subscribe(listener) {
      if (typeof MutationObserver === 'undefined') return () => {}
      const target = document.querySelector(FLOW_SELECTOR) ?? document.body
      const observer = new MutationObserver(() => listener())
      observer.observe(target, { childList: true, subtree: true, characterData: true })
      return () => observer.disconnect()
    },
  }
}
