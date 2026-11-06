# Chat slot cards

A shape contributes cards from JSON files under `slots/`. Only `conversation.input.dock` is currently rendered, above the chat composer.

## Descriptor

Each `slots/*.json` file may contain one object:

| Field | Required | Behavior |
|---|---|---|
| `slot` | yes | Non-empty slot name. Only `conversation.input.dock` is rendered. |
| `title` | no | Card heading; falls back to the shape title. |
| `text` | no | Body paragraph. |
| `button` | no | Button label; defaults to `打个招呼`. |
| `greeting` | no | Text revealed after pressing the button; defaults to `你好！`. |

Files with invalid JSON, non-object content, or a missing/empty `slot` are ignored. Optional fields must be strings when present.

## Rendering

- Cards are shown only when the shape is valid, enabled, ABI-compatible, and its required capabilities resolve.
- Several cards can be contributed by one shape.
- The button only reveals the descriptor's text in the card; it does not call the shape client module or a server endpoint.
- Turning off the shape hides all its cards immediately.

Example files are available in the bundled shapes; use `shape_inspect` to see parsed descriptors.
