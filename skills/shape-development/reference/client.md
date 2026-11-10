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
| `api.edge({ id, title?, edge?, view?, width?, height?, keys?, resizable?, esc? })` | `{ id, open, close, toggle, isOpen, dispose }` | Edge popup: a window that slides in from one viewport edge and shows one of the shape's views. |
| `api.workbench({ id, title, order?, render })` | `{ id, open, dispose }` | Workbench surface in the shape 工作台 window; only for `shape.kind: "workbench"`. |
| `api.shortcuts.register({ keys, run })` | disposer | Private `keydown` listener: not rebindable and invisible in Settings. |

Capabilities are read with `api.require`, never off `api.capabilities` directly, so a missing declaration fails at the call site:

| Capability | Methods |
| --- | --- |
| `dsh-shape#workspace` | `list` `current` `next` `previous` |
| `dsh-shape#files` | `workspace` `read` `write` `append` `replace` `list` |
| `dsh-shape#shell` | `workspace` `run` |
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
- `dsh-shape#files`'s `workspace()` returns `{ id, path }` for the active Session's workspace or `null`; `read(path, { offset, limit, unit })` returns text or a line (`line`, default) / byte (`byte`) slice; `write(path, content, { mode })` overwrites by default, accepts `mode: 'append'`, creates parent directories, and returns `{ bytes, total }`; `append(path, content)` is the append shorthand; `replace(path, search, replacement, { limit })` replaces text in place and returns `{ replaced, bytes }` (`limit` defaults to 1, `0` means all, a miss writes nothing); `list(path = '.')` returns `{ name, type, size? }`. Paths are workspace-relative, absolute paths and `..` are rejected, and each read/write is capped at 1 MB.
- `dsh-shape#shell`'s `workspace()` returns the same `{ id, path }`; `run(command, { cwd, timeoutMs, maxBytes, env, stdin, mode })` resolves with `{ exitCode, signal, timedOut, aborted, stdout, stderr, sandbox, ... }` for one command line run in the Host's default shell (PowerShell on Windows, bash elsewhere). A non-zero exit resolves rather than throwing. `cwd` stays inside the workspace, `mode` is `workspace-write` (default) or `read-only`, `timeoutMs` defaults to 30,000 (capped at 300,000), and captured standard output is capped at `maxBytes` (default 256 KB, up to 1 MB) while standard error uses the Host cap. `stdout`/`stderr` are `{ text, truncated, spillPath? }`; commands run through the Host shell service and its sandbox, so a Host without it — or without a sandboxing executor — throws instead of running unconfined.
- `api.shortcuts.register(binding)`: registers one or more shortcuts; returns an idempotent disposer.
- `dsh-shape#shortcuts`'s `register` takes `{ id, label, keys?, regions?, profiles?, modals?, run }` and returns a disposer. `keys` becomes a rebindable default in every profile the runtime admits. `regions` defaults to `['page']`; add `'editable'` for a command that must fire while the composer has the caret. `profiles: ['desktop']` (or `['web']`) narrows the runtimes that get a default — use it when another command already owns the combination on the other runtime, because one overlapping default invalidates the whole catalog at the desktop IPC boundary.
- `api.mount(slot, render, options)`: renders into a supported conversation slot; throws for an unsupported slot and returns an idempotent disposer. `options.placement` (`anchored` | `floating`) and `options.snap` apply to `conversation.input.overlay`. See [slots.md](slots.md) for the slot list, the container contract, and floating windows.
- `api.panel(options)`: registers a panel and returns `{ id, open(), dispose() }`. `options` is `{ id, title, order?, render }`; `open()` shows the panel as a floating window over the conversation input.
- `api.tab(options)`: adds a page type to the right sidebar and returns `{ id, open(), dispose() }`. `options` is `{ id, title, render }`; `open()` shows it as a tab.
- `api.edge(options)`: registers an edge popup and returns `{ id, open(), close(), toggle(), isOpen(), dispose() }`. `options` is `{ id, title?, edge?, view?, width?, height?, keys?, resizable?, esc? }`; the window shows `views/<view>` in a sandboxed iframe. `width`/`height` accept pixels or `'full'` to span the viewport axis.
- `api.workbench(options)`: registers a workbench surface and returns `{ id, open(), dispose() }`. `options` is `{ id, title, order?, render }`; `open()` shows the shape 工作台 window with this workbench selected.

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

## Edge popups

An edge popup is a window anchored to the middle of one viewport edge. Its body is one of the shape's `views/` pages, so the shape browser and the popup show the same UI.

```js
export function activate(api) {
  const popup = api.edge({
    id: 'dock',
    title: 'Quick dock',
    edge: 'top',          // top | right | bottom | left; defaults to right
    view: 'index.html',   // file below views/; defaults to index.html
    width: 'full',        // pixels or 'full'; full spans the viewport axis
    height: 300,          // sides default 380×560, top/bottom 640×420
    keys: 'Ctrl+Alt+E',   // optional toggle shortcut
    resizable: true,      // optional; dragging the inner edge resizes, default true
    esc: true,            // optional; Escape closes by default
  })
  return () => popup.dispose()
}
```

- `open()` slides the window in and raises it above the other open popups; `close()` animates it out; `toggle()` switches; `isOpen()` reports the shown state.
- The iframe is sandboxed **without** `allow-same-origin`: the view cannot read the host DOM, cookies, or the client API. Put behavior in `client/index.js`, not in the view.
- `width`/`height` are `number | 'full'`; `'full'` spans that viewport axis (the anchored edge keeps its 12px gap), so `edge: 'top'` + `width: 'full'` is a full-width bar and `edge: 'right'` + `height: 'full'` fills the viewport height.
- The inner edge is a resize strip: drag the left edge of a right window, the right edge of a left window, the bottom edge of a top window, or the top edge of a bottom window. Sizes are clamped to the viewport with a 240×160 minimum, remembered per popup in `localStorage`, and restored on the next open. `resizable: false` removes the strip; a `'full'` axis is not resizable.
- Edge windows stay below the desktop shell's top bar: a top window starts 12px under the Windows caption row, and side or full-height windows start at its bottom edge. The boundary comes from `--dsh-frame-chrome-top` (0 while fullscreen), so a plain browser and macOS keep the viewport edge.
- `keys` is a private page-level shortcut (not rebindable, invisible in Settings, any combination). For a rebindable command, register with `dsh-shape#shortcuts` and call `popup.toggle()` from `run`.
- `Esc` is handled on the host page. Focus is inside the sandboxed iframe after the user clicks the view, so keystrokes there never reach the host — the title bar's close button always works.
- A missing view file throws with the list of available views when the host reports them.

## Workbenches

A workbench is a large window (~80% of the viewport) that the host owns. Open it from the header's **shape 工作台** action or `Ctrl+Alt+W`; close it with `Esc`, a press on the blank area around the window, or the same shortcut again. There is no close button.

Only a shape whose manifest declares `"shape": { "kind": "workbench" }` may call `api.workbench`; any other shape gets a thrown error, so the kind is not just a label.

```js
export function activate(api) {
  const workbench = api.workbench({
    id: 'main',
    title: '任务工作台',
    render: (container) => {
      const board = document.createElement('div')
      board.textContent = '工作台内容'
      container.append(board)
      return () => board.remove()
    },
  })
  return () => workbench.dispose()
}
```

- `render(container)` receives a host-owned container and re-runs if the window remounts; the returned cleanup runs when the window drops the surface or switches to another workbench.
- The surface renders in the host document, not in an iframe, so host shortcuts, `Esc`, and every capability API work as usual.
- The id becomes `shape:<shapeId>:<id>`; `order` (default `100`) sorts the workbench tabs. Every registered workbench gets a tab in the strip **below the window** — its title with a dot below, hollow when inactive and filled white for the active one. `Ctrl+Alt+ArrowLeft` / `Ctrl+Alt+ArrowRight` cycle through them (window capture, so the bundled Ctrl+Tab switcher does not also fire), clicking a tab selects it, and the selection is remembered across close/reopen. The window has no title bar: the surface fills it.
- If no workbench is registered, the window shows how to add one — the Shape Studio preset can scaffold a workbench shape (`shape_scaffold` with `kind: "workbench"`).
- Disabling or reloading a shape removes its workbench with the rest of its registrations.

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

## 对话框与 DSH 的模态状态

形态自己往宿主文档里挂 DOM 时，`role="dialog"` + `aria-modal="true"`（或 `role="menu"`）不只是无障碍标注。DSH 的快捷键适配器取文档里最后一个匹配 `[role="dialog"][aria-modal="true"], [role="menu"]` 的元素当模态所有者（`ui-primitives` 的 `modalSelector`），把它的 `data-shortcut-modal`（没有就是 `'other'`）交给命令的 `resolve`；`settings.open`（Ctrl+,）和 `shortcuts.open`（Ctrl+/）只接受 `null`、`settings`、`shortcuts`，其余一律 blocked。

所以只有面板真正显示时才挂这两个属性，常驻的隐藏节点必须在闲置时移除：

```js
const setOpen = (open) => {
  if (open) {
    root.setAttribute('role', 'dialog')
    root.setAttribute('aria-modal', 'true')
  } else {
    root.removeAttribute('role')
    root.removeAttribute('aria-modal')
  }
}
```

`display:none` / `visibility:hidden` 不够——选择器只看属性。一个常驻的模态角色会让整个窗口的 Ctrl+, 和 Ctrl+/ 失效，同时 Ctrl+N 这类不受模态限制的命令照常工作，看起来就像"设置快捷键坏了"。

## Shortcuts

`binding` has:

- `id` optional diagnostic name.
- `keys`: a key string or array, e.g. `Ctrl+Alt+ArrowRight`.
- `run`: callback; may return a promise.

Modifiers are `Ctrl`/`Control`, `Alt`, `Shift`, and `Meta`/`Cmd`/`Command`. Key aliases include `Esc`, `Space`, `Period`, `Comma`, `Slash`, `Enter`, `Tab`, and `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`.

Matching requires exact modifiers. The runtime skips events that are already handled, composing, or repeated, prevents the default action on a match, and works while an input is focused. Duplicate combinations throw. Callback failures are logged.

## Security

Client modules run with page privileges, not in the view iframe. Only install trusted shapes. Treat capability APIs as trusted in-process objects.
