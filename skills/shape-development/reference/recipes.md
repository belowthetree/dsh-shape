# Recipes

Copy-paste starting points for common shape goals. Each recipe names the capabilities it needs and the files to create; adjust the copy and styling, keep the capability calls.

## Search the conversation

**Requires**: `core`, `slots`, `shortcuts`, `conversation`.

`dsh-shape#conversation` already reads the rendered transcript and scrolls a hit into view, so a search shape never queries DSH's DOM directly.

`package.json`:

```json
{
  "name": "conversation-search",
  "version": "0.1.0",
  "title": "搜索对话",
  "description": "Ctrl+F 搜索已加载的消息并跳转",
  "shape": {
    "apiVersion": 1,
    "requires": [
      { "plugin": "dsh-shape", "capability": "core", "version": "^1.0.0" },
      { "plugin": "dsh-shape", "capability": "slots", "version": "^1.0.0" },
      { "plugin": "dsh-shape", "capability": "shortcuts", "version": "^1.0.0" },
      { "plugin": "dsh-shape", "capability": "conversation", "version": "^1.0.0" }
    ]
  }
}
```

`client/index.js`:

```js
export function activate(api) {
  const conversation = api.require('dsh-shape', 'conversation')

  const panel = document.createElement('div')
  panel.style.cssText = 'display:none;gap:6px;padding:8px;border-radius:10px;background:var(--dsw-alias-bg-layer-2,#1b1d22);box-shadow:0 10px 28px rgba(0,0,0,.35)'
  const input = document.createElement('input')
  input.placeholder = '搜索对话'
  input.style.cssText = 'width:100%;padding:6px 8px;border-radius:6px;border:1px solid rgba(255,255,255,.12);background:transparent;color:inherit'
  const list = document.createElement('div')
  list.style.cssText = 'display:grid;gap:2px;max-height:240px;overflow:auto'
  panel.append(input, list)

  let hits = []
  let index = -1

  const render = () => {
    list.replaceChildren(...hits.map((hit, position) => {
      const row = document.createElement('button')
      row.type = 'button'
      row.textContent = hit.preview
      row.style.cssText = `text-align:left;padding:4px 6px;border-radius:6px;border:0;background:${position === index ? 'rgba(255,255,255,.12)' : 'transparent'};color:inherit;font-size:12px`
      row.addEventListener('click', () => { index = position; go() })
      return row
    }))
  }

  const go = () => {
    const hit = hits[index]
    if (hit !== undefined) conversation.reveal(hit.messageId)
    render()
  }

  const search = () => {
    hits = conversation.find(input.value.trim())
    index = hits.length === 0 ? -1 : 0
    render()
    go()
  }

  const open = () => {
    panel.style.display = 'flex'
    panel.style.flexDirection = 'column'
    input.focus()
    search()
  }
  const close = () => { panel.style.display = 'none' }

  input.addEventListener('input', search)
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') { close(); return }
    if (event.key !== 'Enter') return
    event.preventDefault()
    if (hits.length === 0) return
    index = (index + (event.shiftKey ? -1 : 1) + hits.length) % hits.length
    go()
  })

  const offMount = api.mount('conversation.input.overlay', (container) => {
    container.append(panel)
    return () => panel.remove()
  }, { placement: 'floating' })

  const offShortcut = api.require('dsh-shape', 'shortcuts').register({
    id: 'find',
    label: '搜索对话',
    keys: 'Mod+F',
    regions: ['page', 'editable'],
    run: open,
  })

  return () => {
    offShortcut()
    offMount()
  }
}
```

Only loaded turns are searchable: older history appears after the conversation loads it. `find` is case-insensitive by default and capped at 100 hits; pass `{ caseSensitive: true }` or `{ limit }` to change that.

## Save and reuse prompt templates

**Requires**: `core`, `storage`, `composer`, `slots`, `shortcuts`.

```js
export function activate(api) {
  const store = api.require('dsh-shape', 'storage')
  const composer = api.require('dsh-shape', 'composer')

  let templates = []
  const load = async () => { templates = (await store.get('templates')) ?? [] }
  const save = async () => { await store.set('templates', templates) }

  return api.require('dsh-shape', 'shortcuts').register({
    id: 'save-template',
    label: '把当前草稿存为模板',
    keys: 'Ctrl+Alt+S',
    regions: ['page', 'editable'],
    run: async () => {
      await load()
      const text = composer.getText().trim()
      if (text === '') return
      templates = [{ id: String(Date.now()), text }, ...templates].slice(0, 50)
      await save()
    },
  })
}
```

Reading `composer.getText()` and writing `composer.setText(text)` is the whole contract; `data/templates.json` inside the shape directory holds the result.

## Add a left sidebar panel

**Requires**: `core`, `slots`, `shortcuts`.

```js
export function activate(api) {
  const panel = api.panel({
    id: 'board',
    title: '任务看板',
    order: 30,
    render: (container) => {
      container.textContent = '看板内容'
      return () => {}
    },
  })
  api.require('dsh-shape', 'shortcuts').register({
    id: 'board',
    label: '打开任务看板',
    keys: 'Ctrl+Alt+B',
    run: () => panel.open(),
  })
  return () => panel.dispose()
}
```

`api.panel()` registers the sidebar entry and the main-area body together; `open()` selects it.

## Add a right sidebar page

**Requires**: `core`, `slots`.

```js
export function activate(api) {
  const tab = api.tab({
    id: 'notes',
    title: '笔记',
    render: (container) => {
      const area = document.createElement('textarea')
      area.style.cssText = 'width:100%;height:100%;border:0;background:transparent;color:inherit'
      container.append(area)
      return () => area.remove()
    },
  })
  tab.open()
  return () => tab.dispose()
}
```
