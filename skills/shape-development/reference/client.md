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

- `api.shape`: `{ id, title, version }`.
- `api.capabilities`: object keyed by `plugin#capability`, containing resolved API objects.
- `api.require(plugin, capability)`: returns the declared capability API; throws otherwise.
- `api.shortcuts.register(binding)`: registers one or more shortcuts; returns an idempotent disposer.

## Shortcuts

`binding` has:

- `id` optional diagnostic name.
- `keys`: a key string or array, e.g. `Ctrl+Alt+ArrowRight`.
- `run`: callback; may return a promise.

Modifiers are `Ctrl`/`Control`, `Alt`, `Shift`, and `Meta`/`Cmd`/`Command`. Key aliases include `Esc`, `Space`, `Period`, `Comma`, `Slash`, `Enter`, `Tab`, and `ArrowLeft`/`ArrowRight`/`ArrowUp`/`ArrowDown`.

Matching requires exact modifiers. The runtime skips events that are already handled, composing, or repeated, prevents the default action on a match, and works while an input is focused. Duplicate combinations throw. Callback failures are logged.

## Security

Client modules run with page privileges, not in the view iframe. Only install trusted shapes. Treat capability APIs as trusted in-process objects.
