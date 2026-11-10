# dsh-shape

[English](README.en.md) | [中文](README.md)

[![dsh-shape poster](https://raw.githubusercontent.com/belowthetree/dsh-shape/main/demo/poster.png)](https://github.com/belowthetree/dsh-shape/blob/main/demo/dsh-shape-demo.mp4)

dsh-shape is a DeepSeek Harness plugin offering a **dynamic lightweight extension form** (形态): a shape is a manifest plus optional scripts that adds UI, chat cards, and page-level shortcuts to DSH on the fly.

## What it can do

- **Shape browser**: open an app grid from the conversation header and browse every shape; press `Ctrl + .` to open it quickly
- **Dedicated views**: click a shape card to show that shape's own interface in a second window
- **Conversation slots**: ten slots — the card stack above the composer, the info strip below it, the floating panel above it (anchored or free-floating with viewport edge snapping), status chips in the composer tool row and Session header, New Session options, View menu rows, and a full-screen layer above the whole app for boot screens or command palettes; client modules can also render their own DOM into a supported slot with `api.mount()`
- **Floating panel**: `api.panel()` registers a panel; `open()` shows it as a floating window above the conversation input — draggable, snapping to viewport edges, remembering its position, and gone when the shape is disabled
- **Right sidebar tab**: `api.tab()` adds a page type to the right sidebar; `open()` shows it as a tab, and opening it again focuses the existing page instead of duplicating it
- **Edge popup**: `api.edge()` registers a window that slides in from the center of the top, right, bottom, or left edge; its content is a page from the shape's `views/` directory. `keys` binds a toggle shortcut, `Esc` closes it (`esc: false` opts out), dragging its inner edge resizes it and the size is remembered, `width`/`height` accept `'full'` to span the viewport, and windows stay clear of the Windows caption row
- **Workbench**: a shape declaring `shape.kind: "workbench"` registers its own surface with `api.workbench()`; the **shape 工作台** header action or `Ctrl + Alt + W` opens it in a window covering roughly 80% of the viewport. The window has no title bar — the shape surface fills it — and no close button: `Esc`, a press on the blank area around the window, or the same shortcut closes it. A tab strip below the window marks the active workbench with a filled white dot (hollow when inactive); `Ctrl + Alt + ←/→` or a click switches. When no workbench shape is installed, the window says how to scaffold one with Shape Studio
- **Per-shape switches**: enable or disable each shape independently; turning one off also disables its view, slot entries, and client logic
- **Client behavior**: shapes can register page-level behavior and shortcuts, and read only the capability APIs they declare
- **Shape deletion**: a delete button on each card removes that shape's folder from disk after confirmation
- **Capability requirements**: shapes declare required plugin capabilities and versions; missing dependencies prevent startup and hide their slot entries
- **Capability catalog**: inspect which capabilities are available to shapes, including versions, purpose, usage, and API method names
- **Built-in capabilities**: twelve capabilities cover workspace switching, workspace files, command-line execution, surface control, shortcuts, slots, events, storage, the composer, the conversation, and MCP server management; see [Built-in capabilities](#built-in-capabilities) below
- **Bundled shapes**: `chat-search` (find in the conversation, Ctrl+F) and `workspace-tab-switch` (workspace switcher, Ctrl+Tab) ship with the package; enable, disable, or delete them from the shapes panel, and a user shape with the same id overrides either one
- **Instant updates**: editing an existing file in a shape folder only needs a page reload; adding or deleting files needs a refresh from the shapes panel (or `POST /dsh-shape/api/refresh`), which reloads the page for you

## Bundled shapes

Ready to use after installation:

| Shape | Trigger | What it does |
| --- | --- | --- |
| `chat-search` | `Ctrl + F`, or the 🔍 button in the header | Find text in the conversation: highlights hits, expands collapsed thinking blocks, scrolls to the match; `F3` / `Shift + F3` step through, `Esc` closes |
| `workspace-tab-switch` | Hold `Ctrl` and tap `Tab` | Opens a workspace strip; releasing the key lands on the highlighted one. `Ctrl + Shift + Tab` reverses, arrows move, `Esc` cancels |

Both live in the package's `shapes/`; enable, disable, or delete them from the shapes panel. To customize one, copy its folder into the user shape root under the same id — the user copy overrides the bundled one and survives plugin upgrades.

## Built-in capabilities

A shape declares what it needs in `shape.requires` and reads it with `api.require('dsh-shape', '<capability>')`; a missing or mismatched capability keeps the shape from starting.

| Capability | Version | Methods | Purpose |
| --- | --- | --- | --- |
| `dsh-shape#core` | 1.0.0 | field `apiVersion` | Read the shape ABI |
| `dsh-shape#workspace` | 1.0.0 | `list` `current` `next` `previous` | Switch workspaces and reveal the target group |
| `dsh-shape#files` | 1.0.0 | `workspace` `read` `write` `append` `replace` `list` | Read, write, append, replace, and list files inside the current workspace; `read` takes line/byte ranges, `write` replaces by default and can append; paths are workspace-relative and each read/write is capped at 1 MB |
| `dsh-shape#shell` | 1.0.0 | `workspace` `run` | Run command lines inside the current workspace through the host `shell` service and its sandbox; `cwd` is workspace-relative, `mode` defaults to `workspace-write` and accepts `read-only`, timeout and output caps are per call, and a non-zero exit still returns `exitCode`, `stdout`, `stderr`, and the sandbox facts |
| `dsh-shape#ui` | 1.0.0 | `openSession` `openWorkspace` `toggleSidebar` `selectPanel` `getTheme` `setTheme` `send` `cancelTurn` `notify` `openShapeBrowser` | Navigate, move panels, switch themes, act on the conversation, show toasts, open Shapes |
| `dsh-shape#shortcuts` | 1.0.0 | `register` `list` | Register shape actions as DSH commands users can rebind; `regions` decides whether they also fire while the composer has focus |
| `dsh-shape#slots` | 1.0.0 | `list` `mount` `entries` | Inspect the ten slots, mount into them, count occupancy |
| `dsh-shape#events` | 1.0.0 | `emit` `on` | Share events between shapes |
| `dsh-shape#storage` | 1.0.0 | `get` `set` `remove` `keys` | Persist JSON under the shape's `data/` directory |
| `dsh-shape#composer` | 1.0.0 | `getText` `setText` `insert` `submit` `sessionId` | Read and rewrite the active composer draft |
| `dsh-shape#conversation` | 1.0.0 | `messages` `find` `reveal` `subscribe` | Read the rendered transcript, search it, jump to a message |
| `dsh-shape#mcp` | 1.0.0 | `available` `list` `projects` `get` `add` `update` `remove` `setMode` `setProjectTrusted` `session` | Read and edit MCP servers: status, workspace scoping, workspace-config trust, and the servers one Session sees (rows owned by `dsh-mcp-setting`) |

```js
const ui = api.require('dsh-shape', 'ui')
const shortcuts = api.require('dsh-shape', 'shortcuts')
const store = api.require('dsh-shape', 'storage')

shortcuts.register({ id: 'summary', label: 'Show MCP summary', keys: 'Ctrl+Alt+M', run: () => ui.notify('3 servers') })
await store.set('collapsed', true)   // → <shape>/data/collapsed.json
```

The `shape_capabilities` tool lists every capability with its version, purpose, usage, and API method names.

## Documentation

The reference docs under [`docs/`](docs/README.md) are written in Chinese:

- [Architecture](docs/architecture.md) — host plugin, client bundle, shape loading, capabilities
- [Shape folder](docs/shapes.md) — manifest fields, views, slot entries, client module
- [Capabilities](docs/capabilities.md) — methods, return values, and failure behavior
- [Development and release](docs/development.md) — local linking, pre-publish checks, `client.js` splicing
- [Known issues](docs/known-issues.md) — APIs that do not work yet and the traps behind them

Three skills live in the repository: `skills/shape-development/` (authoring shapes), `skills/shape-playbook/` (verified workflows for each kind of shape, plus the traps that cost time: UI that never renders, rejected shortcuts, searching and expanding the transcript, presets that break), both bundled into the Shape Studio preset, and `.dsh/skills/dsh-shape-contribution/` (changing the package itself). The last one sits in DSH's **project-level** skill root, so any preset used in this repository can load it.

## Demo

![dsh-shape demo](https://raw.githubusercontent.com/belowthetree/dsh-shape/main/demo/dsh-shape-demo.gif)

22-second feature demo: [1080p MP4](https://github.com/belowthetree/dsh-shape/blob/main/demo/dsh-shape-demo.mp4) · [source and reproduction steps](https://github.com/belowthetree/dsh-shape/tree/main/demo)

## Shape Studio preset

Installation adds the **Shape Studio** preset: the standard preset with shell and general filesystem tools replaced by shape-scoped file tools.

- List, inspect, scaffold, and validate shapes: `shape_list`, `shape_inspect`, `shape_scaffold`, `shape_validate`, `shape_test`
- Shape-scoped file access: `shape_read` and `shape_write` take a shape id plus a path relative to that shape
- Directory structure and text search: `shape_tree`, `shape_grep`
- Capability catalog (`shape_capabilities`) and a topic-based spec (`shape_spec`, including the `playbook` topics)
- Two skills: `shape-development` (the contract) and `shape-playbook` (verified workflows for each kind of shape, plus the traps that cost time)
- Everything else matches the standard preset: web search and fetch, background jobs, schedules, goals and planning, subagents and workflows, todos, `present`, plugin management

**Two gaps only**: no `bash`/`pwsh` and no `tool-fs`/`tool-fs-search`, so it cannot reach files outside a shape — shape files always go through the shape tools. These tools and skills are visible only in Shape Studio; other presets never see them.

## Install

npm package: **`@belowthetree/dsh-shape`**

```sh
dsh plugin --profile <profile> add @belowthetree/dsh-shape
```

Replace `<profile>` with the profile to install into (`desktop`, `web`, …), then restart that profile.

Other ways to install:

- GitHub repository: `dsh plugin --profile <profile> add github:belowthetree/dsh-shape`
- Local development: `dsh plugin --profile <profile> add link:/path/to/dsh-shape`
- Plugin manager: install by package name `@belowthetree/dsh-shape` or repository `belowthetree/dsh-shape`

Requires DSH `>= 0.2.2-rc.1`. After startup, click **Shapes** in the conversation header or press `Ctrl + .`.

> Upgrading from the old unscoped `dsh-shape`: run `dsh plugin --profile <profile> remove dsh-shape`, install with the command above, then change `dsh-shape` to `@belowthetree/dsh-shape` in the profile's `dsh.profile.bundles`.

---

[![](https://img.shields.io/badge/powered_by-dsh-4D6BFE?style=flat-square&logo=deepseek&logoColor=white)](https://github.com/deepseek-ai/deepseek-harness)
