# Capabilities

A capability is a versioned API that a Client plugin provides to shapes. Shapes declare requirements; dsh-shape resolves them before startup.

## Provider contract

A provider is a DSH Client plugin with:

- `inject`: includes `shapeCapabilities`.
- `ctx.shapeCapabilities.provide({ plugin, capability, version, api })` inside a `ctx.effect`.
- `plugin` and `capability`: non-empty strings.
- `version`: valid semver contract version, independent of the provider package version.
- `description`: optional short statement of what the API is for.
- `usage`: optional guidance on how to call it, including method notes.
- `api`: the object passed to shapes.

One provider may own one `plugin#capability`. A duplicate registration throws. The disposer removes the capability.

```ts
export const inject = ['shapeCapabilities']

export function apply(ctx) {
  ctx.effect(() => ctx.shapeCapabilities.provide({
    plugin: 'my-plugin',
    capability: 'workspace',
    version: '1.0.0',
    description: 'Navigate DSH workspaces.',
    usage: 'Call next() or previous() to switch; list() returns workspace summaries.',
    api: {
      list: () => [],
      open: id => {},
    },
  }), 'my-plugin: workspace capability')
}
```

## Shape declaration

Requirements live in `package.json` under `shape.requires`, using `plugin`, `capability`, `version`, and optional `optional: true`. They are matched with `semver.satisfies(..., { includePrerelease: true })`.

## Resolution

- Missing required capability: blocked; card shows the missing qualified id and range; chat cards are suppressed; client module is not imported.
- Existing provider with a non-satisfying version: blocked; the message includes the found version.
- Invalid range: blocked.
- Optional missing capability: not blocked; absent from `api.capabilities`.
- `api.require(plugin, capability)` throws if the shape did not declare that capability.

## Built-ins

- `dsh-shape#core` version `1.0.0`; field `apiVersion: 1`; ABI metadata.
- `dsh-shape#workspace` version `1.0.0`; methods `list`, `current`, `next`, `previous`; workspace navigation. Switching also expands the target workspace group in the sidebar and scrolls it into view.
- `dsh-shape#ui` version `1.0.0`; methods `openSession`, `openWorkspace`, `toggleSidebar`, `selectPanel`, `getTheme`, `setTheme`, `send`, `cancelTurn`, `notify`, `openShapeBrowser`; controls the DSH surface.
- `dsh-shape#shortcuts` version `1.0.0`; methods `register`, `list`; registers DSH keyboard commands under the shape's own namespace.
- `dsh-shape#slots` version `1.0.0`; methods `list`, `mount`, `entries`; discovers the conversation slots and renders into them.
- `dsh-shape#events` version `1.0.0`; methods `emit`, `on`; a shared event bus between running shapes.
- `dsh-shape#storage` version `1.0.0`; methods `get`, `set`, `remove`, `keys`; JSON files under the shape's own `data/` directory.
- `dsh-shape#composer` version `1.0.0`; methods `getText`, `setText`, `insert`, `submit`, `sessionId`; the draft of the composer currently mounted in the conversation.
- `dsh-shape#conversation` version `1.0.0`; methods `messages`, `find`, `reveal`, `subscribe`; the rendered transcript, for search and jump-to-message.

### `dsh-shape#conversation`

```js
const conversation = api.require('dsh-shape', 'conversation')
const hits = conversation.find('timeout')
for (const hit of hits) console.log(hit.messageId, hit.preview)
conversation.reveal(hits[0].messageId)
```

`messages()` returns `{ id, turn, text }` for every rendered row, and `find(text, { caseSensitive, limit })` returns `{ messageId, index, preview }` matches; matching is case-insensitive by default and capped at 100 hits. `reveal(messageId)` scrolls that row to the centre and returns false when it is no longer rendered. `subscribe(listener)` reports transcript mutations so a search panel can refresh.

Only loaded turns are readable: the conversation renders a window of history, so older messages appear in `messages()` after the reader scrolls back. This capability reads the DOM, so it follows whatever the conversation currently shows rather than a private message store.

### `dsh-shape#composer`

```js
const composer = api.require('dsh-shape', 'composer')
const draft = composer.getText()
composer.setText(`${draft}\n\n请补充测试`)
composer.insert(' [选中片段]')
composer.submit()
```

The capability follows the mounted composer: `sessionId()` names its Session, and every call throws when no composer is mounted. `insert` uses the caret when the composer exposes it and appends otherwise. `setText` replaces the whole draft and drops inline reference chips, so a shape that rewrites a prompt should read `getText()` first and compose the full replacement.

### `dsh-shape#events`

```js
const events = api.require('dsh-shape', 'events')
const off = events.on('mcp-manager/servers-changed', (payload) => {
  render(payload)
})
events.emit('mcp-manager/servers-changed', { count: 3 })
```

Names are plain strings; namespace them by producer (`<producer>/<event>`) because every shape shares one bus. A throwing handler is contained and logged, and the remaining handlers still run. Subscriptions are released when the shape is disabled or reloaded, so the returned unsubscribe function is optional but recommended for early cleanup.

### `dsh-shape#storage`

```js
const store = api.require('dsh-shape', 'storage')
await store.set('collapsed', true)      // data/collapsed.json
await store.get('collapsed')            // true
await store.keys()                      // ['collapsed']
await store.remove('collapsed')
```

Values are JSON-serializable and limited to 256 KB each; keys match `[a-z0-9][a-z0-9._-]{0,63}` and map to `data/<key>.json` inside the shape directory. The `data/` folder is created on first write and is not part of `shape_list`/`shape_inspect` inventory. Bundled shapes can be read but not written, and deleting the shape removes its data with the folder.

### `dsh-shape#slots`

```js
const slots = api.require('dsh-shape', 'slots')
slots.list()
// [{ name: 'conversation.input.dock', presentation: 'card', available: true, mounts: 0, total: 1 }, …]

const off = slots.mount('conversation.composer.dock', (container) => {
  container.textContent = '3 个任务'
})
slots.entries('conversation.composer.dock') // 1
```

`list()` covers the nine supported slots and reports `presentation` (`card`, `strip`, `panel`, `inline`, `menu-row`), `available` (whether this host renders the slot), `mounts` (owned by this shape), and `total` (owned by every shape). `mount` accepts the same options as `api.mount`: `placement` (`anchored` by default, `floating` for `conversation.input.overlay`) and `snap`. Mounts made through the capability are disposed with the shape, alongside `api.mount` registrations.

### `dsh-shape#shortcuts`

```js
const shortcuts = api.require('dsh-shape', 'shortcuts')
const off = shortcuts.register({
  id: 'toggle-panel',
  label: '打开 MCP 管理器',
  aliases: ['mcp'],
  keys: 'Ctrl+Alt+M',
  run: () => openPanel(),
})
```

The command id becomes `shape:<shapeId>:<id>`. `keys` accepts `Ctrl`, `Alt`, `Shift`, `Meta`, and `Mod` (Meta on macOS, Control elsewhere) plus one letter, digit, `F1`–`F24`, or named key (`Esc`, `Enter`, `Space`, `Tab`, `Backspace`, `Delete`, arrows, `/`, `,`, `.`, `;`, `'`, `[`, `]`, `\`, `` ` ``, `-`, `=`). Omit `keys` to register an unbound command. Commands run only outside editable regions; registration throws on duplicate ids and overlapping defaults.

Because these are DSH commands rather than raw listeners, users can rebind them in Settings, they appear in the shortcut reference, and conflicts with other plugins are reported. `list()` returns this shape's catalog rows: `{ id, label, keys, modified, conflicts, issue }`.

The older `api.shortcuts.register({ keys, run })` still exists as a low-level escape hatch: it installs a private `keydown` listener that ignores user rebinding, the settings page, and cross-plugin conflicts.

### `dsh-shape#ui`

```js
const ui = api.require('dsh-shape', 'ui')
ui.openSession(sessionId)        // show one Session
await ui.openWorkspace(id)       // connect a Workspace and open its Session
ui.toggleSidebar()               // collapse or expand the sidebar
ui.selectPanel('settings')       // switch main panel; null returns to the Conversation
ui.getTheme()                    // { id, preference }
ui.setTheme('dark')              // switch the active theme
await ui.send('hello')           // send a prompt into the scoped Session
await ui.cancelTurn()            // cancel the in-flight turn
ui.notify('构建完成', { tone: 'success', timeout: 2000 })
ui.openShapeBrowser()            // raise the shape browser
```

`notify` accepts `tone` (`info`, `success`, `warn`, `error`) and `timeout` in milliseconds; toasts stack in the top-right corner and dismiss themselves. Methods backed by a Client service the host does not provide throw an error naming that service, so guard with `try`/`catch` when the shape must run on unknown hosts.

`shape_capabilities` lists providers with qualified id, contract version, self-description, usage guidance, method names, and non-function field types. It is a discovery catalog, not a signature or validation contract; inspect provider source or use `cordis` for exact service behavior.

`description` and `usage` are optional, non-empty strings when provided. Missing metadata does not block registration or resolution. The catalog is mirrored from the Client registry to the Host. External providers appear after registration.
