# Shape client module

`client/index.js` is optional. After the shape is enabled, valid, has a supported ABI, and all required capabilities resolve, dsh-shape imports the entry and calls `activate`.

## Activation

```js
export function activate(api) {
  const workspace = api.require('dsh-shape', 'workspace')
  const off = api.shortcuts.register({
    id: 'my-shape.next',
    keys: 'Ctrl+Alt+ArrowRight',
    run: () => workspace.next(),
  })
  return () => off()
}
```

- `activate` receives `api` and may return a cleanup function or an object with `dispose`.
- The runtime also calls an exported `deactivate` on shutdown.
- Returning a cleanup function is the supported way to remove listeners and shortcuts.
- Activation errors are logged; already-registered shortcuts for that shape are removed.
- The module is imported with a cache-busting query on each runtime refresh.
- Only `client/index.js` is the entry; other files under `client/` are served and can be imported relatively.

## API

| Call | Returns | Notes |
| --- | --- | --- |
| `api.shape` | `{ id, title, version }` | Identity of the running shape. |
| `api.capabilities` | `Record<'plugin#capability', unknown>` | Every declared capability API. |
| `api.require(plugin, capability)` | capability API | Throws when the shape did not declare it. |
| `api.mount(slot, render, options?)` | disposer | One of the ten slots; `options` is `{ placement, snap }` for `conversation.input.overlay`. |
| `api.panel({ id, title, order?, render })` | `{ id, open, dispose }` | Floating window over the conversation input; `open()` shows it. |
| `api.tab({ id, title, render })` | `{ id, open, dispose }` | Right sidebar page; `open()` shows it as a tab. |
| `api.shortcuts.register({ keys, run })` | disposer | Private `keydown` listener: not rebindable and invisible in Settings. |

Capabilities are read with `api.require`, never off `api.capabilities` directly, so a missing declaration fails at the call site:

| Capability | Methods |
| --- | --- |
| `dsh-shape#workspace` | `list` `current` `next` `previous` |
| `dsh-shape#ui` | `openSession` `openWorkspace` `toggleSidebar` `selectPanel` `getTheme` `setTheme` `send` `cancelTurn` `notify` `openShapeBrowser` |
| `dsh-shape#shortcuts` | `register` `list` |
| `dsh-shape#slots` | `list` `mount` `entries` |
| `dsh-shape#events` | `emit` `on` |
| `dsh-shape#storage` | `get` `set` `remove` `keys` |
| `dsh-shape#composer` | `getText` `setText` `insert` `submit` `sessionId` |
| `dsh-shape#conversation` | `messages` `find` `reveal` `subscribe` |

Details:

- `api.shape`: `{ id, title, version }`.
- `api.capabilities`: object keyed by `plugin#capability`, containing resolved API objects.
- `api.require(plugin, capability)`: returns the declared capability API; throws otherwise.
- `api.shortcuts.register(binding)`: registers one or more shortcuts; returns an idempotent disposer.
- `api.mount(slot, render, options)`: renders into a supported conversation slot; throws for an unsupported slot and returns an idempotent disposer. `options.placement` (`anchored` | `floating`) and `options.snap` apply to `conversation.input.overlay`. See [slots.md](slots.md) for the slot list, the container contract, and floating windows.
- `api.panel(options)`: registers a panel and returns `{ id, open(), dispose() }`. `options` is `{ id, title, order?, render }`; `open()` shows the panel as a floating window over the conversation input.
- `api.tab(options)`: adds a page type to the right sidebar and returns `{ id, open(), dispose() }`. `options` is `{ id, title, render }`; `open()` shows it as a tab.

## Panels

```js
export function activate(api) {
  const panel = api.panel({
    id: 'board',
    title: '任务看板',
    order: 30,
    render: (container) => {
      container.textContent = '看板内容'
    },
  })
  api.shortcuts.register({ id: 'board', label: '打开看板', keys: 'Ctrl+Alt+B', run: () => panel.open() })
  return () => panel.dispose()
}
```

The panel id is namespaced as `shape:<shapeId>:<id>`, so two shapes can use the same local id. `open()` mounts the panel as a floating window in `conversation.input.overlay`: it has a drag bar, snaps to viewport edges, and remembers its position. The window only exists while a conversation is on screen, and `open()` again re-creates it.

Panels do not use the `main` slot: a shape's `main` entry renders but never commits, so panel content is hosted by the overlay slot instead.

## Tabs

```js
export function activate(api) {
  const tab = api.tab({
    id: 'notes',
    title: '笔记',
    render: (container) => {
      container.textContent = '这一页属于形态自己'
    },
  })
  return () => tab.dispose()
}
```

A tab is a page type: `open()` adds one to the right sidebar, and opening the same tab twice focuses the existing page instead of duplicating it. The body mounts only while the tab is visible, and the same cleanup rules as panels apply. `open()` throws when the host has no right sidebar service.

## Mounts

```js
export function activate(api) {
  return api.mount('conversation.input.overlay', (container) => {
    const panel = document.createElement('div')
    panel.textContent = '可以拖动、可以吸附到屏幕边缘'
    container.append(panel)
    return () => panel.remove()
  }, { placement: 'floating', snap: true })
}
```

`render` receives the slot's own container and re-runs after the slot remounts; the returned cleanup runs before the container is dropped, and the runtime disposes every mount when the shape is disabled or reloaded.

## Shortcuts

`binding` has:

- `id` optional diagnostic name.
- `keys`: a key string or array, e.g. `Ctrl+Alt+ArrowRight`.
- `run`: callback; may return a promise.

Modifiers are `Ctrl`/`Control`, `Alt`, `Shift`, and `Meta`/`Cmd`/`Command`. Key aliases include `Esc`, `Space`, `Period`, `Comma`, `Slash`, `Enter`, `Tab`, and `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`.

Matching requires exact modifiers. The runtime skips events that are already handled, composing, or repeated, prevents the default action on a match, and works while an input is focused. Duplicate combinations throw. Callback failures are logged.

## Security

Client modules run with page privileges, not in the view iframe. Only install trusted shapes. Treat capability APIs as trusted in-process objects.
