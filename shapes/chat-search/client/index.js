/**
 * Chat search: Ctrl+F opens a floating find bar at the top-right of the
 * conversation, F3 / Shift+F3 step through hits, Esc closes and clears.
 *
 * The bar itself lives in `shell.overlay`, the one slot the host portals to
 * document.body; the session header keeps nothing but the 🔍 trigger. A bar
 * mounted inside the header is rebuilt on a session switch and loses the
 * input's focus whenever that slot re-renders, which is exactly what a find
 * field cannot afford. Hosts without the overlay slot fall back to the header.
 *
 * Keyboard handling is a document-level listener rather than a registered
 * shortcut: DSH only admits multi-modifier combinations on the Web host, so
 * Ctrl+F / F3 / Esc would be rejected there.
 *
 * Hits are painted with the CSS Custom Highlight API instead of by wrapping
 * text nodes in <mark>. Ranges never modify the host's React-managed DOM, so a
 * re-render cannot orphan a highlight, and every rendered hit is highlighted at
 * once instead of only the row the bar currently stands on.
 */

const BOX_STYLE = [
  'position:fixed',
  'top:64px',
  'right:24px',
  'z-index:60',
  'display:flex',
  'align-items:center',
  'gap:8px',
  'padding:6px 10px',
  'border:1px solid var(--dsw-alias-border-secondary, rgba(255,255,255,.16))',
  'border-radius:10px',
  'background:var(--dsw-alias-bg-layer-2, #1b1d22)',
  'box-shadow:0 12px 32px rgba(0,0,0,.36)',
  'color:var(--dsw-alias-label-primary, #e6edf3)',
  'font:12px system-ui',
  'pointer-events:auto',
].join(';')

const INPUT_STYLE = [
  'width:200px',
  'border:0',
  'outline:0',
  'background:transparent',
  'color:inherit',
  'font:12px system-ui',
  'padding:2px 2px',
].join(';')

const BUTTON_STYLE = [
  'border:0',
  'background:transparent',
  'color:inherit',
  'cursor:pointer',
  'font:13px system-ui',
  'opacity:.75',
  'padding:0 4px',
  'line-height:18px',
].join(';')

const COUNT_STYLE = 'min-width:56px;text-align:right;opacity:.7;white-space:nowrap'
const ACTIVE_OUTLINE = '2px solid #f5a623'

const HIGHLIGHT_HITS = 'chat-search-hits'
const HIGHLIGHT_ACTIVE = 'chat-search-active'
const HIGHLIGHT_CSS = [
  `::highlight(${HIGHLIGHT_HITS}){background-color:#ffe58f;color:#111}`,
  `::highlight(${HIGHLIGHT_ACTIVE}){background-color:#f5a623;color:#111}`,
].join('')

const SEARCH_DEBOUNCE_MS = 120
const EXPAND_SETTLE_MS = 60
const REVEAL_RETRY_MS = 140
const EMPTY_RETRY_MS = 300
const HIT_LIMIT = 500

/**
 * Collect the non-empty text nodes under a row, in document order.
 * @param root - row to walk.
 * @returns the text nodes.
 */
function textNodesUnder(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT)
  const nodes = []
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) {
    if (typeof node.nodeValue === 'string' && node.nodeValue !== '') nodes.push(node)
  }
  return nodes
}

/**
 * Build one range per occurrence of a needle inside a row.
 * @param root - row to scan.
 * @param needle - non-empty, lowercased needle.
 * @returns ranges covering the matches.
 */
function rangesFor(root, needle) {
  const ranges = []
  for (const node of textNodesUnder(root)) {
    const text = node.nodeValue ?? ''
    const hay = text.toLowerCase()
    let at = hay.indexOf(needle)
    while (at !== -1) {
      const range = document.createRange()
      range.setStart(node, at)
      range.setEnd(node, at + needle.length)
      ranges.push(range)
      at = hay.indexOf(needle, at + needle.length)
    }
  }
  return ranges
}

/**
 * Index every rendered transcript row by its anchor key.
 * @returns message id to row element.
 */
function rowsByAnchor() {
  const rows = new Map()
  for (const row of document.querySelectorAll('[data-chat-anchor-key]')) {
    const key = row.getAttribute('data-chat-anchor-key')
    if (key !== null && key !== '') rows.set(key, row)
  }
  return rows
}

/**
 * Resolve one message row by anchor key.
 * @param messageId - conversation anchor key.
 * @returns the row, or null when it is not rendered.
 */
function rowFor(messageId) {
  const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
    ? CSS.escape(messageId)
    : messageId.replace(/["\\]/gu, '\\$&')
  return document.querySelector(`[data-chat-anchor-key="${escaped}"]`)
}

/**
 * Open every collapsed block inside a hit: turn headers, the step-process
 * group (which holds thinking text), and details elements.
 * @param root - hit row.
 */
function expandCollapsed(root) {
  for (const button of root.querySelectorAll('button[aria-expanded="false"]')) button.click()
  // Thinking steps live behind the turn's process header, which is a sibling
  // row rather than part of the matched one.
  const turn = root.getAttribute('data-chat-turn')
    ?? root.closest('[data-chat-turn]')?.getAttribute('data-chat-turn')
    ?? null
  if (turn !== null && turn !== '') {
    const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
      ? CSS.escape(turn)
      : turn
    for (const button of document.querySelectorAll(`button[data-turn-process="${escaped}"][aria-expanded="false"]`)) {
      button.click()
    }
  }
  for (const details of root.querySelectorAll('details:not([open])')) {
    const summary = details.querySelector('summary')
    if (summary !== null) summary.click()
  }
  // The process group can wrap the row instead of living inside it.
  let node = root.parentElement
  while (node !== null && !node.hasAttribute('data-chat-flow')) {
    for (const button of node.querySelectorAll(':scope > button[aria-expanded="false"]')) button.click()
    node = node.parentElement
  }
}

/**
 * Register the chat-search behaviour.
 * @param api - shape client API.
 * @returns disposer.
 */
export function activate(api) {
  const conversation = api.require('dsh-shape', 'conversation')
  const canHighlight = typeof CSS !== 'undefined'
    && CSS !== null
    && typeof CSS.highlights === 'object'
    && typeof Highlight === 'function'

  let query = ''
  let hits = []
  let index = -1
  let visible = false
  let retriedFor = null

  /** Timers owned by the current jump; dropped by the next jump or by close(). */
  const jumpTimers = new Set()
  const later = (run, ms) => {
    const id = window.setTimeout(() => { jumpTimers.delete(id); run() }, ms)
    jumpTimers.add(id)
    return id
  }
  const cancelJumpTimers = () => {
    for (const id of jumpTimers) window.clearTimeout(id)
    jumpTimers.clear()
  }

  let searchTimer = 0
  let refreshTimer = 0

  const box = document.createElement('div')
  box.style.cssText = BOX_STYLE
  box.style.display = 'none'
  box.setAttribute('data-testid', 'chat-search-box')

  const input = document.createElement('input')
  input.type = 'search'
  input.placeholder = '在对话中查找'
  input.style.cssText = INPUT_STYLE
  input.setAttribute('data-testid', 'chat-search-input')

  const counter = document.createElement('span')
  counter.style.cssText = COUNT_STYLE
  counter.setAttribute('data-testid', 'chat-search-count')

  let styleElement = null
  if (canHighlight) {
    styleElement = document.createElement('style')
    styleElement.setAttribute('data-chat-search-style', '')
    styleElement.textContent = HIGHLIGHT_CSS
    document.head.append(styleElement)
  }

  const clearHighlights = () => {
    if (!canHighlight) return
    CSS.highlights.delete(HIGHLIGHT_HITS)
    CSS.highlights.delete(HIGHLIGHT_ACTIVE)
  }

  const clearActiveRow = () => {
    for (const row of document.querySelectorAll('[data-chat-search-active]')) {
      row.removeAttribute('data-chat-search-active')
      row.style.removeProperty('outline')
      row.style.removeProperty('outline-offset')
    }
  }

  const updateCounter = () => {
    counter.title = ''
    if (query.trim() === '') {
      counter.textContent = ''
      return
    }
    if (hits.length === 0) {
      counter.textContent = '无结果'
      return
    }
    counter.textContent = `${String(index + 1)}/${String(hits.length)}`
  }

  const reportUnloaded = () => {
    counter.textContent = `${String(index + 1)}/${String(hits.length)} 未加载`
    counter.title = '这条命中所在的历史还没加载'
  }

  /** Repaint every hit, with the current one in its own stronger colour. */
  const paint = () => {
    if (!canHighlight) return
    const needle = query.trim().toLowerCase()
    if (needle === '' || hits.length === 0) {
      clearHighlights()
      return
    }
    const rows = rowsByAnchor()
    const activeId = index >= 0 && index < hits.length ? hits[index].messageId : null
    const rest = new Highlight()
    const active = new Highlight()
    for (const hit of hits) {
      const row = rows.get(hit.messageId)
      if (row === undefined) continue
      const target = hit.messageId === activeId ? active : rest
      for (const range of rangesFor(row, needle)) target.add(range)
    }
    clearHighlights()
    if (rest.size > 0) CSS.highlights.set(HIGHLIGHT_HITS, rest)
    if (active.size > 0) CSS.highlights.set(HIGHLIGHT_ACTIVE, active)
  }

  /**
   * Run one DOM mutation without letting it take the find bar's focus: the
   * host focuses the toggle it just expanded, which would drop the caret out
   * of the input.
   * @param mutate - work that may move focus.
   */
  const keepInputFocus = (mutate) => {
    const before = document.activeElement
    mutate()
    if (before === input && document.activeElement !== input && visible) {
      input.focus({ preventScroll: true })
    }
  }

  /**
   * Bring one hit on screen: outline its row, expand what hides the text, then
   * paint once the host has laid the expanded block out.
   * @param messageId - hit to settle on.
   */
  const settle = (messageId) => {
    const row = rowFor(messageId)
    if (row === null) {
      reportUnloaded()
      paint()
      return
    }
    clearActiveRow()
    row.setAttribute('data-chat-search-active', '')
    row.style.setProperty('outline', ACTIVE_OUTLINE)
    row.style.setProperty('outline-offset', '2px')
    row.scrollIntoView({ block: 'center', behavior: 'smooth' })
    keepInputFocus(() => { expandCollapsed(row) })
    paint()
    later(() => { keepInputFocus(paint) }, EXPAND_SETTLE_MS)
  }

  /**
   * Step to a hit by offset, wrapping at both ends.
   * @param next - target index, may be out of range.
   */
  const focusHit = (next) => {
    cancelJumpTimers()
    if (hits.length === 0) {
      index = -1
      updateCounter()
      paint()
      return
    }
    index = ((next % hits.length) + hits.length) % hits.length
    updateCounter()
    const messageId = hits[index].messageId
    if (rowFor(messageId) !== null) {
      settle(messageId)
      return
    }
    // Only a hit the host has not mounted needs reveal(): it asks the host to
    // bring that row into view, which may load the history around it.
    try {
      conversation.reveal(messageId)
    } catch {
      // Older host: settle() reports the row as unloaded instead.
    }
    later(() => { settle(messageId) }, REVEAL_RETRY_MS)
  }

  const runSearch = () => {
    const needle = query.trim()
    hits = needle === '' ? [] : [...conversation.find(needle, { limit: HIT_LIMIT })]
    index = hits.length === 0 ? -1 : 0
    if (hits.length === 0) {
      cancelJumpTimers()
      clearActiveRow()
      paint()
      updateCounter()
      if (needle !== '' && retriedFor !== needle) {
        retriedFor = needle
        // The transcript may still be mounting; retry once, then let the
        // transcript subscription keep the hits current.
        later(() => { if (visible && query.trim() === needle) runSearch() }, EMPTY_RETRY_MS)
      }
      return
    }
    focusHit(0)
  }

  const scheduleSearch = () => {
    window.clearTimeout(searchTimer)
    searchTimer = window.setTimeout(runSearch, SEARCH_DEBOUNCE_MS)
  }

  /**
   * Re-read the transcript without moving the user: the anchor message stays
   * current, so a growing or re-rendered conversation keeps its place.
   */
  const refresh = () => {
    if (!visible || query.trim() === '') return
    window.clearTimeout(refreshTimer)
    refreshTimer = window.setTimeout(() => {
      if (!visible) return
      const needle = query.trim()
      if (needle === '') return
      const anchorId = index >= 0 && index < hits.length ? hits[index].messageId : null
      hits = [...conversation.find(needle, { limit: HIT_LIMIT })]
      if (hits.length === 0) {
        index = -1
        clearActiveRow()
      } else {
        const at = anchorId === null ? -1 : hits.findIndex((hit) => hit.messageId === anchorId)
        index = at === -1 ? Math.min(Math.max(index, 0), hits.length - 1) : at
      }
      paint()
      updateCounter()
    }, SEARCH_DEBOUNCE_MS)
  }

  const close = () => {
    visible = false
    window.clearTimeout(searchTimer)
    window.clearTimeout(refreshTimer)
    cancelJumpTimers()
    clearActiveRow()
    clearHighlights()
    box.style.display = 'none'
    query = ''
    hits = []
    index = -1
    retriedFor = null
    input.value = ''
    updateCounter()
  }

  const open = () => {
    visible = true
    // Re-park on every open: a session switch remounts the header and can drop
    // a bar that was living there.
    if (!box.isConnected) parkBar()
    box.style.display = 'flex'
    input.focus()
    input.select()
    runSearch()
  }

  const toggle = () => {
    if (visible) close()
    else open()
  }

  input.addEventListener('input', () => {
    query = input.value
    retriedFor = null
    scheduleSearch()
  })
  input.addEventListener('keydown', (event) => {
    // While an IME composes, Enter commits the composition instead of acting on
    // the bar; keyCode 229 covers engines that report the composition key.
    if (event.isComposing || event.keyCode === 229) return
    if (event.key === 'Enter') {
      event.preventDefault()
      focusHit(index + (event.shiftKey ? -1 : 1))
      return
    }
    if (event.key === 'Escape') {
      event.preventDefault()
      event.stopPropagation()
      close()
    }
  })

  /**
   * Build one step button.
   * @param delta - +1 for next, -1 for previous.
   * @returns the button.
   */
  const step = (delta) => {
    const button = document.createElement('button')
    button.type = 'button'
    button.textContent = delta > 0 ? '↓' : '↑'
    button.title = delta > 0 ? '下一个 (F3)' : '上一个 (Shift+F3)'
    button.style.cssText = BUTTON_STYLE
    button.addEventListener('click', () => focusHit(index + delta))
    return button
  }

  const dismiss = document.createElement('button')
  dismiss.type = 'button'
  dismiss.textContent = '×'
  dismiss.title = '关闭 (Esc)'
  dismiss.style.cssText = BUTTON_STYLE
  dismiss.addEventListener('click', close)

  box.append(input, counter, step(-1), step(1), dismiss)

  const trigger = document.createElement('button')
  trigger.type = 'button'
  trigger.textContent = '🔍'
  trigger.title = '在对话中查找 (Ctrl+F)'
  trigger.setAttribute('data-testid', 'chat-search-toggle')
  trigger.style.cssText = BUTTON_STYLE
  trigger.addEventListener('click', toggle)

  // Ctrl/Cmd+F is not an admissible DSH shortcut on Web, so the bar owns the
  // combination at the document level and suppresses the browser find UI.
  const onKeyDown = (event) => {
    const primary = event.ctrlKey || event.metaKey
    if (primary && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'f') {
      event.preventDefault()
      event.stopPropagation()
      toggle()
      return
    }
    // F3 is the browser's own "find next": only claim it while the bar is open,
    // otherwise the browser keeps its behaviour.
    if (event.key === 'F3' && visible) {
      event.preventDefault()
      event.stopPropagation()
      focusHit(index + (event.shiftKey ? -1 : 1))
      return
    }
    if (event.key === 'Escape' && visible) {
      event.stopPropagation()
      close()
    }
  }
  document.addEventListener('keydown', onKeyDown, true)

  const offTranscript = typeof conversation.subscribe === 'function'
    ? conversation.subscribe(refresh)
    : null

  // The bar lives directly on document.body: it is outside every React-managed
  // subtree, so re-rendering the header or the transcript cannot detach it or
  // steal the input's focus. It is fixed-positioned, so a body mount looks
  // exactly like an overlay mount without depending on a slot rendering.
  const parkBar = () => {
    if (box.isConnected) return
    document.body.append(box)
  }
  parkBar()

  const offTrigger = api.mount('conversation.session.header.utilities', (container) => {
    container.append(trigger)
    // The header slot re-renders on a session switch: search the transcript that
    // is now on screen instead of keeping hits from the previous session.
    if (visible) later(runSearch, 0)
    return () => {
      trigger.remove()
    }
  })

  // A host that renders neither slot would leave the shape with no reachable
  // entry point, so the last resort parks the trigger on document.body itself.
  let fallbackWrap = null
  const mountBodyFallback = () => {
    if (fallbackWrap !== null || trigger.isConnected) return
    fallbackWrap = document.createElement('div')
    fallbackWrap.setAttribute('data-testid', 'chat-search-fallback')
    fallbackWrap.style.cssText = 'position:fixed;top:10px;right:16px;z-index:61;display:flex;align-items:center;gap:6px'
    fallbackWrap.append(trigger)
    document.body.append(fallbackWrap)
    if (box.parentElement === null) document.body.append(box)
  }
  const fallbackTimer = window.setTimeout(mountBodyFallback, 1500)

  return () => {
    window.clearTimeout(fallbackTimer)
    document.removeEventListener('keydown', onKeyDown, true)
    if (typeof offTranscript === 'function') offTranscript()
    offTrigger()
    window.clearTimeout(searchTimer)
    window.clearTimeout(refreshTimer)
    cancelJumpTimers()
    clearActiveRow()
    clearHighlights()
    if (styleElement !== null) styleElement.remove()
    fallbackWrap?.remove()
  }
}
