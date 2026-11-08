/**
 * Chat search: Ctrl+F opens a box in the conversation header, F3 / Shift+F3
 * step through hits, Esc closes and clears the highlight.
 */

const BOX_STYLE = [
  'display:flex', 'align-items:center', 'gap:6px', 'padding:4px 6px',
  'border:1px solid var(--dsh-border, #d0d0d0)', 'border-radius:8px',
  'background:var(--dsh-bg-elevated, #fff)', 'box-shadow:0 2px 10px rgba(0,0,0,.08)',
].join(';')

const INPUT_STYLE = [
  'width:180px', 'border:0', 'outline:0', 'background:transparent',
  'font:12px system-ui', 'color:inherit', 'padding:2px 4px',
].join(';')

const COUNT_STYLE = 'font:11px system-ui;opacity:.7;min-width:44px;text-align:right'
const BUTTON_STYLE = 'border:0;background:transparent;cursor:pointer;font:12px system-ui;opacity:.75;padding:0 4px'

/** Remove every highlight this shape added. */
function clearMarks() {
  for (const mark of document.querySelectorAll('mark[data-chat-search-hit]')) {
    const parent = mark.parentNode
    if (parent === null) continue
    parent.replaceChild(document.createTextNode(mark.textContent ?? ''), mark)
    parent.normalize()
  }
  for (const row of document.querySelectorAll('[data-chat-search-active]')) {
    row.removeAttribute('data-chat-search-active')
    row.style.removeProperty('outline')
    row.style.removeProperty('outline-offset')
  }
}

/**
 * Wrap every occurrence of `query` inside one element.
 * @param root - row to scan.
 * @param query - case-insensitive needle.
 * @returns number of marks created.
 */
function markRow(root, query) {
  const needle = query.toLowerCase()
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => (node.nodeValue !== null && node.nodeValue.toLowerCase().includes(needle)
      ? NodeFilter.FILTER_ACCEPT
      : NodeFilter.FILTER_REJECT),
  })
  const targets = []
  for (let node = walker.nextNode(); node !== null; node = walker.nextNode()) targets.push(node)
  let count = 0
  for (const node of targets) {
    const text = node.nodeValue ?? ''
    const lower = text.toLowerCase()
    const fragment = document.createDocumentFragment()
    let cursor = 0
    for (let at = lower.indexOf(needle); at !== -1; at = lower.indexOf(needle, at + needle.length)) {
      if (at > cursor) fragment.append(document.createTextNode(text.slice(cursor, at)))
      const mark = document.createElement('mark')
      mark.setAttribute('data-chat-search-hit', '')
      mark.style.cssText = 'background:#ffe58f;color:inherit;border-radius:2px;padding:0 1px'
      mark.textContent = text.slice(at, at + needle.length)
      fragment.append(mark)
      cursor = at + needle.length
      count += 1
    }
    if (cursor === 0) continue
    if (cursor < text.length) fragment.append(document.createTextNode(text.slice(cursor)))
    node.parentNode?.replaceChild(fragment, node)
  }
  return count
}

/**
 * Reveal one message row, expanding its collapsed ancestors.
 * @param messageId - conversation anchor key.
 * @returns the row, or null when it is not rendered.
 */
function rowFor(messageId) {
  const row = document.querySelector(`[data-chat-anchor-key="${CSS.escape(messageId)}"]`)
  if (row === null) return null
  const collapsed = row.closest('[data-collapsed="true"], details:not([open])')
  if (collapsed !== null) {
    const toggle = collapsed.querySelector('button, summary')
    if (toggle instanceof HTMLElement) toggle.click()
  }
  return row
}

/**
 * Register the chat-search behaviour.
 * @param api - shape client API.
 * @returns disposer.
 */
export function activate(api) {
  const conversation = api.require('dsh-shape', 'conversation')
  const shortcuts = api.require('dsh-shape', 'shortcuts')

  let query = ''
  let hits = []
  let index = -1
  let visible = false
  let input
  let counter

  const updateCounter = () => {
    if (counter === undefined) return
    counter.textContent = hits.length === 0 ? (query === '' ? '' : '0/0') : `${String(index + 1)}/${String(hits.length)}`
  }

  const focusHit = (next) => {
    clearMarks()
    if (hits.length === 0) { updateCounter(); return }
    index = ((next % hits.length) + hits.length) % hits.length
    const hit = hits[index]
    const row = rowFor(hit.messageId)
    if (row !== null) {
      row.scrollIntoView({ block: 'center', behavior: 'smooth' })
      row.setAttribute('data-chat-search-active', '')
      row.style.setProperty('outline', '2px solid #f5a623')
      row.style.setProperty('outline-offset', '2px')
      markRow(row, query)
    }
    updateCounter()
  }

  const runSearch = () => {
    clearMarks()
    hits = query.trim() === '' ? [] : conversation.find(query, { limit: 500 })
    index = hits.length === 0 ? -1 : 0
    focusHit(0)
  }

  const close = () => {
    visible = false
    clearMarks()
    if (box !== undefined) box.style.display = 'none'
    query = ''
    hits = []
    index = -1
    if (input !== undefined) input.value = ''
    updateCounter()
  }

  const open = () => {
    visible = true
    if (box !== undefined) {
      box.style.display = 'flex'
      input?.focus()
      input?.select()
    }
    runSearch()
  }

  let box
  const offMount = api.mount('conversation.session.header.utilities', (container) => {
    box = document.createElement('div')
    box.style.cssText = BOX_STYLE
    box.style.display = 'none'
    box.setAttribute('data-testid', 'chat-search-box')

    input = document.createElement('input')
    input.type = 'search'
    input.placeholder = '搜索聊天记录'
    input.style.cssText = INPUT_STYLE
    input.setAttribute('data-testid', 'chat-search-input')
    input.addEventListener('input', () => { query = input.value; runSearch() })
    input.addEventListener('keydown', (event) => {
      if (event.key === 'Enter') { event.preventDefault(); focusHit(index + (event.shiftKey ? -1 : 1)) }
      if (event.key === 'Escape') { event.preventDefault(); close() }
    })

    counter = document.createElement('span')
    counter.style.cssText = COUNT_STYLE
    counter.setAttribute('data-testid', 'chat-search-count')

    const prev = document.createElement('button')
    prev.type = 'button'
    prev.textContent = '↑'
    prev.title = '上一个 (Shift+F3)'
    prev.style.cssText = BUTTON_STYLE
    prev.addEventListener('click', () => focusHit(index - 1))

    const next = document.createElement('button')
    next.type = 'button'
    next.textContent = '↓'
    next.title = '下一个 (F3)'
    next.style.cssText = BUTTON_STYLE
    next.addEventListener('click', () => focusHit(index + 1))

    const dismiss = document.createElement('button')
    dismiss.type = 'button'
    dismiss.textContent = '×'
    dismiss.title = '关闭 (Esc)'
    dismiss.style.cssText = BUTTON_STYLE
    dismiss.addEventListener('click', close)

    box.append(input, counter, prev, next, dismiss)
    container.append(box)

    // Always-visible entry point: the shortcut is the fast path, this button is
    // the discoverable one (and the only one a pointer-only user can reach).
    const toggle = document.createElement('button')
    toggle.type = 'button'
    toggle.textContent = '🔍'
    toggle.title = '搜索聊天记录 (Ctrl+F)'
    toggle.setAttribute('data-testid', 'chat-search-toggle')
    toggle.style.cssText = BUTTON_STYLE
    toggle.addEventListener('click', () => { if (visible) close(); else open() })
    container.append(toggle)
    return () => { box?.remove(); toggle.remove(); clearMarks() }
  })

  const disposers = [offMount]
  /** Register one shortcut; a reserved combination must not kill the shape. */
  const addShortcut = (definition) => {
    try {
      disposers.push(shortcuts.register(definition))
    } catch (cause) {
      console.warn('chat-search: shortcut unavailable', definition.keys, cause instanceof Error ? cause.message : cause)
    }
  }
  addShortcut({
    id: 'find',
    label: '搜索聊天记录',
    keys: 'Ctrl+F',
    regions: ['page'],
    run: () => { if (visible) close(); else open() },
  })
  addShortcut({
    id: 'find-next',
    label: '下一个搜索结果',
    keys: 'F3',
    regions: ['page'],
    run: () => { if (visible) focusHit(index + 1) },
  })
  addShortcut({
    id: 'find-previous',
    label: '上一个搜索结果',
    keys: 'Shift+F3',
    regions: ['page'],
    run: () => { if (visible) focusHit(index - 1) },
  })
  addShortcut({
    id: 'find-close',
    label: '关闭搜索',
    keys: 'Escape',
    regions: ['page'],
    run: () => { if (visible) close() },
  })

  return () => {
    for (const off of disposers) off()
    clearMarks()
  }
}
