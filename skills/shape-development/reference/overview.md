# Shape development overview

A shape is a folder under a shape root. dsh-shape discovers it, exposes its view and slot artifacts to the Web client, and optionally loads its client module after dependency and ABI checks.

## Roots and precedence

- Bundled: `shapes/` inside the installed dsh-shape package.
- User: `$DSH_HOME/dsh-shape/shapes/`.
- A user shape with the same id overrides the bundled shape.
- `shape_list` and `shape_inspect` report both roots; `shape_scaffold` writes to the user root.

## Current contributions

- `views/`: static HTML/CSS/JS rendered in a second modal iframe.
- `slots/*.json`: chat composer cards; only `conversation.input.dock` is rendered.
- `client/index.js`: page-level `activate(api)` behavior, including shortcuts.
- `tools/`: declared files are listed and inspected, but not executed.
- `package.json` `shape` block: ABI and capability requirements.

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

Use `shape_list` then `shape_inspect` on bundled shapes. `workspace-switch` demonstrates a client module, a required capability, a view, and shortcut cleanup.

## Source access

`shape_spec` returns the installed package root and reference root. When a topic is not enough, read the package's `client.js`, `index.js`, `tools.js`, or bundled shape folders directly. For live Host services and tool schemas, use the `cordis` inspection tool.
