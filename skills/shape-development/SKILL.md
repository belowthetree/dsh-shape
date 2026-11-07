# Shape development

Build and maintain `dsh-shape` shapes in the user's shape directory, normally `$DSH_HOME/dsh-shape/shapes/<id>/`.

## Workflow

1. Read `shape_spec` for the exact contract before relying on memory: start with `overview`, then `manifest`, `client`, `slots`, `views`, `capabilities`, `lifecycle`, `testing`, or `plugin` as needed. Inspect existing shapes with `shape_list`; it reports both `user` and `bundled` origins. Reuse their conventions before creating another shape.
2. Check available capability APIs with `shape_capabilities`. It lists each provider's qualified id, contract version, purpose, usage guidance, API method names, and data fields. Read an existing shape's interface with `shape_inspect` before changing it or building a compatible shape; it returns the manifest, capability requirements, slot descriptors, file inventory, and client entry code.
3. Decide what the shape contributes:
   - `views/index.html`: content rendered in the Shape browser's second modal.
   - `slots/chat-card.json`: a card above the chat composer.
   - `client/index.js`: page-level behavior such as shortcuts, using declared capabilities.
   - `actions.js`: DOM-free behavior plus `tests`, so `shape_test` can run it without a browser.
   - `tools/`: metadata only today; do not assume these tools execute.
4. Scaffold a new shape with `shape_scaffold`, then edit the generated files. Pass `withActions` to get an `actions.js` with one passing test.
5. Declare dependencies in `package.json`:

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
      { "plugin": "dsh-shape", "capability": "core", "version": "^1.0.0" },
      { "plugin": "dsh-shape", "capability": "workspace", "version": "^1.0.0" },
      { "plugin": "dsh-shape", "capability": "shortcuts", "version": "^1.0.0" }
    ]
  }
}
```

Capabilities are identified by `plugin#capability`; never use an unqualified name. Use `optional: true` only when the shape remains useful without the capability. The built-in `dsh-shape#workspace` capability exposes `list()`, `current()`, `next()`, and `previous()`; switching also expands the target workspace group in the sidebar and scrolls it into view. The built-in `dsh-shape#ui` capability controls the surface: `openSession`, `openWorkspace`, `toggleSidebar`, `selectPanel`, `getTheme`, `setTheme`, `send`, `cancelTurn`, `notify`, and `openShapeBrowser`. The built-in `dsh-shape#shortcuts` capability registers DSH commands (`register`, `list`) that users can rebind in Settings instead of private key listeners. The built-in `dsh-shape#slots` capability lists the ten slots (`list`), renders into them (`mount`), and counts a shape's mounts (`entries`); `shell.overlay` is mount-only and covers the whole app. `dsh-shape#events` shares `emit`/`on` events between running shapes, `dsh-shape#storage` persists JSON under the shape's own `data/` directory, and `dsh-shape#composer` reads and rewrites the active composer draft.

6. For a client module, export `activate(api)` and return a cleanup function:

```js
export function activate(api) {
  const workspace = api.require('dsh-shape', 'workspace')
  const shortcuts = api.require('dsh-shape', 'shortcuts')
  const off = shortcuts.register({
    id: 'next-workspace',
    label: 'Next workspace',
    keys: 'Ctrl+Alt+ArrowRight',
    run: () => workspace.next(),
  })
  return () => off()
}
```

Use `api.shape`, `api.capabilities`, `api.require(plugin, capability)`, `api.mount(...)`, and the capabilities above. A shape whose requirements or `apiVersion` are not satisfied is never imported.

7. Run `shape_validate` and fix every error before testing.
8. Run `shape_test` after changing `actions.js`; it runs every exported test without a browser and reports failures with messages.
9. Test in the app: open Shapes with `Ctrl+.`, open the shape's view, exercise its chat card and shortcuts, and toggle it off to confirm all client registrations are removed.

## Extension plugins

When a shape needs a new capability provider, or the task expands into a DSH extension plugin:

1. Load `cordis-plugin-development` for the plugin procedure and `cordis-composition-reference` when editing a preset or patch.
2. Use `cordis` to inspect live service definitions, tool schemas, and entry configuration before writing against them.
3. Keep the provider in its own package and register a qualified capability ID such as `my-plugin#workspace`.
4. Test the provider from a shape that requires it; install or inspect profile rows with `plugin_manager` when needed.

Do not fold a general extension plugin into `dsh-shape`; use the normal DSH plugin package and bundle-patch path.

## Rules

- Keep shape code in the shape folder. Do not add tools or skills to the global preset; this Shape Studio preset is the only place shape tools and the shape-development skill are mounted.
- Shape client modules run with page privileges. Do not fetch or execute untrusted remote code.
- Do not edit the dsh-shape package to add a specific shape; use a new folder under the user shape root.
- The host scans shapes at startup and on refresh. After adding a folder, use the Shape browser refresh button; restart only when changing dsh-shape's own host or client code.
- Keep model-facing text and descriptions concise. The shape browser is user-facing; do not put computed state that the view cannot access.
- The current runtime supports `views/`, `slots/chat-card.json`, and `client/index.js`. It does not execute `tools/` or arbitrary slot names.
