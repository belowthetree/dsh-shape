# Shape development overview

A shape is a folder under a shape root. dsh-shape discovers it, exposes its view and slot artifacts to the Web client, and optionally loads its client module after dependency and ABI checks.

## Roots and precedence

- Bundled: `shapes/` inside the installed dsh-shape package.
- User: `$DSH_HOME/dsh-shape/shapes/`.
- A user shape with the same id overrides the bundled shape.
- `shape_list` and `shape_inspect` report both roots; `shape_scaffold` writes to the user root.
- `shape_read` and `shape_write` take a shape id plus a path relative to that shape (`shape_read({ shape: 'chat-search', path: 'views/index.html' })`); anything that escapes the shape folder is rejected. `shape_tree` lists one shape's directory structure and `shape_grep` searches its text files by literal or regular expression.
- Shape Studio omits only the shell and general filesystem rows (`tool-bash`/`tool-pwsh`, `tool-fs`/`tool-fs-search`), so these four shape tools are the only way to touch files; every other standard tool (web, jobs, schedules, goals, planning, subagents, workflows, todos, present, plugin management) is mounted.

## Current contributions

- `views/`: static HTML/CSS/JS rendered in a second modal iframe, or in an edge popup with `api.edge()`.
- `slots/*.json`: chat composer cards; only `conversation.input.dock` is rendered.
- `client/index.js`: page-level `activate(api)` behavior, including shortcuts, `api.panel()` floating panels, `api.tab()` right sidebar pages, `api.edge()` edge popups, and `api.workbench()` surfaces for workbench-kind shapes.
- `actions.js`: DOM-free actions and their tests, run by `shape_test`.
- `data/`: JSON values written through `dsh-shape#storage`; created on first write and read-only for bundled shapes.
- `tools/`: declared files are listed and inspected, but not executed.
- `package.json` `shape` block: ABI, `kind` (`shape` or `workbench`), and capability requirements.

## Required reading

- `manifest`: package fields, ABI, requirements, defaults.
- `capabilities`: provider contract, built-ins, resolution behavior.
- `client`: `activate(api)`, shortcut API, lifecycle.
- `slots`: card descriptor fields and rendering rules.
- `views`: URL, sandbox, index fallback.
- `lifecycle`: refresh, toggles, persistence, restart boundaries.
- `testing`: validation and UI checks.
- `plugin`: extending dsh-shape with a capability provider or separate DSH plugin.

## Existing examples

Use `shape_list` then `shape_inspect` on bundled shapes. Two bundled examples ship with the package: `chat-search` (a floating find bar over the transcript) and `workspace-tab-switch` (a held-key switcher with a chat card). Neither is minimal, but both show the complete manifest, client, and slot wiring.

## Source access

`shape_spec` returns the installed package root and reference root. When a topic is not enough, read the package's `client.js`, `index.js`, `tools.js`, or bundled shape folders directly. For live Host services and tool schemas, use the `cordis` inspection tool.
