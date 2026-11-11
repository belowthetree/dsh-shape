# Shape manifest

`package.json` identifies the shape and declares its ABI and capability dependencies.

## Fields read by dsh-shape

| Field | Required | Behavior |
|---|---|---|
| `id` or `name` | yes | Shape id. `id` wins; non-empty string. A missing id is invalid and falls back only for display. |
| `title` | no | Display title; falls back to the id. |
| `description` | no | Display text; defaults to empty. |
| `version` | no | Display/package version; defaults to `0.0.0`. Not the capability contract version. |
| `input` | no | Passed through for future execution. |
| `output` | no | Display metadata; defaults to `text`. |
| `shape` | no | ABI, kind, and dependency block. |

## `shape` block

- `apiVersion`: positive integer; default `1`. The current runtime supports only `1`. Other values are discovered but the shape is blocked and cannot start.
- `kind`: `shape` (default) or `workbench`. A `workbench` shape may register a surface with `api.workbench({ render })`, which the host shows in the shape 工作台 window; any other value makes the manifest invalid. Workbench shapes stay dormant like any other, but opening the workbench window wakes every `kind: "workbench"` shape, so they do not need `wake.eager`.
- `requires`: array of capability requirements.
- `wake`: optional wake policy. `{ keys?: string | string[], eager?: boolean }`. Absent means dormant: the client module is not imported until the shape's card is opened in the Shapes browser. `keys` registers page-level combinations before the module loads and replays the waking press into the bindings `activate` registers; `eager: true` imports and activates the shape at page open, which is what always-visible entry points (header buttons, injected chips) need. Malformed values invalidate the shape.
- Each requirement: non-empty `plugin`, non-empty `capability`, non-empty semver `version` range, optional boolean `optional`.
- Missing required capability, invalid range, or version mismatch blocks the shape card, its chat cards, and its client module.
- `optional: true` means a missing provider does not block startup; the API is simply absent.
- Capability identity is qualified as `plugin#capability`; never use an unqualified capability name.

## Validity

A shape is invalid when the manifest cannot be parsed, has no non-empty `id`/`name`, or has a malformed `shape` block. Invalid shapes are listed with errors but cannot open views, render chat cards, or run client code.

## Minimal layout

```text
shapes/my-shape/
  package.json
  views/index.html
  slots/chat-card.json   # optional
  client/index.js        # optional
  tools/                 # optional; metadata only today
```

Use `shape_validate` after editing, and `shape_inspect` to compare an existing shape's manifest.
