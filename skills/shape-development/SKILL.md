# Shape development

Build and maintain `dsh-shape` shapes in the user's shape directory, normally `$DSH_HOME/dsh-shape/shapes/<id>/`.

## Workflow

1. Inspect existing shapes with `shape_list`. Reuse their conventions before creating another shape.
2. Decide what the shape contributes:
   - `views/index.html`: content rendered in the Shape browser's second modal.
   - `slots/chat-card.json`: a card above the chat composer.
   - `client/index.js`: page-level behavior such as shortcuts, using declared capabilities.
   - `tools/`: metadata only today; do not assume these tools execute.
3. Scaffold a new shape with `shape_scaffold`, then edit the generated files.
4. Declare dependencies in `package.json`:

```json
{
  "name": "<id>",
  "version": "0.1.0",
  "title": "Display title",
  "description": "What it does",
  "output": "text",
  "shape": {
    "apiVersion": 1,
    "requires": [
      { "plugin": "dsh-shape", "capability": "core", "version": "^1.0.0" }
    ]
  }
}
```

Capabilities are identified by `plugin#capability`; never use an unqualified name. Use `optional: true` only when the shape remains useful without the capability. The built-in `dsh-shape#workspace` capability exposes `list()`, `current()`, `next()`, and `previous()`.

5. For a client module, export `activate(api)` and return a cleanup function:

```js
export function activate(api) {
  const workspace = api.require('dsh-shape', 'workspace')
  const off = api.shortcuts.register({
    keys: 'Ctrl+Alt+ArrowRight',
    run: () => workspace.next(),
  })
  return () => off()
}
```

Use `api.shape`, `api.capabilities`, `api.require(plugin, capability)`, and `api.shortcuts.register(...)`. A shape whose requirements or `apiVersion` are not satisfied is never imported.

6. Run `shape_validate` and fix every error before testing.
7. Test in the app: open Shapes with `Ctrl+.`, open the shape's view, exercise its chat card and shortcuts, and toggle it off to confirm all client registrations are removed.

## Rules

- Keep shape code in the shape folder. Do not add tools or skills to the global preset; this Shape Studio preset is the only place shape tools and the shape-development skill are mounted.
- Shape client modules run with page privileges. Do not fetch or execute untrusted remote code.
- Do not edit the dsh-shape package to add a specific shape; use a new folder under the user shape root.
- The host scans shapes at startup and on refresh. After adding a folder, use the Shape browser refresh button; restart only when changing dsh-shape's own host or client code.
- Keep model-facing text and descriptions concise. The shape browser is user-facing; do not put computed state that the view cannot access.
- The current runtime supports `views/`, `slots/chat-card.json`, and `client/index.js`. It does not execute `tools/` or arbitrary slot names.
