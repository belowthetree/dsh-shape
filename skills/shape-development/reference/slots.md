# Conversation slots

A shape contributes to the conversation through two mechanisms: JSON descriptors under `slots/` and, when it needs its own DOM, `api.mount()` from its client module.

## Descriptor

Each `slots/*.json` file may contain one object (or an array of them):

| Field | Required | Behavior |
|---|---|---|
| `slot` | yes | One of the slot names below; other names are accepted and never rendered. |
| `title` | no | Heading; falls back to the shape title. |
| `text` | no | Body paragraph, or the tooltip of a compact chip. |
| `button` | no | Action label; reveals `greeting`. Cards default to `打个招呼`, compact slots only show a button when one is declared. |
| `greeting` | no | Text revealed after pressing the button; defaults to `你好！`. |
| `icon` | no | SVG path data in a 16×16 view box; compact slots fall back to the title's first letter. |
| `placement` | no | `anchored` (default) or `floating`; only `conversation.input.overlay` honours it. |
| `snap` | no | Whether a floating window snaps to the nearest viewport edge when a drag ends; defaults to `true`. |

Files with invalid JSON, non-object content, or a missing/empty `slot` are ignored. Optional fields must be strings when present, except `snap`.

## Supported slots

| Slot | Placement | Presentation |
|---|---|---|
| `conversation.input.dock` | Full-width stack above the composer card | Card: mark, title, shape id, text, button |
| `conversation.input.overlay` | Floating anchor at the top edge of the composer card | Panel above the composer, dismissible, several stack |
| `conversation.composer.dock` | Statistics row below the composer card, next to the context meter | Compact strip: title and text, no mark or id |
| `conversation.input.left` | Composer tool row, left side | Informational chip: icon and title, `text` as tooltip |
| `conversation.input.right` | Composer tool row, before submit | Informational chip |
| `conversation.session.header.actions` | Session header, next to the title | Informational chip |
| `conversation.session.header.utilities` | Session header, right side | Informational chip |
| `conversation.hero.options` | New Session row, right side | Informational chip |
| `conversation.session.header.views.actions` | Rows of the View tab row's More menu | Menu row: icon, title, text, optional button |

`conversation.view` is deliberately unsupported: its entries are tabs that render the whole Session body, which neither a descriptor nor a bare container can satisfy. `single` and `chain` slots are reserved for their owning product surface.

Chips are informational only. Use `api.mount()` when a slot needs interaction.

## Mount API

A client module renders into a slot container:

```js
export function activate(api) {
  const off = api.mount('conversation.input.left', (container) => {
    const chip = document.createElement('button')
    chip.textContent = '构建中'
    chip.onclick = () => { chip.textContent = '已通过' }
    container.append(chip)
    return () => chip.remove()
  })
  return off
}
```

- `api.mount(slot, render, options)` throws for an unsupported slot, otherwise returns an idempotent disposer.
- `options.placement` is `anchored` (default) or `floating`; `options.snap` defaults to `true`. Both apply only to `conversation.input.overlay`.
- `render` receives the slot's own container element; it runs after mount and again after the slot remounts (session switch, host restart).
- The returned cleanup runs before the container is dropped; the runtime also disposes every mount when the shape is disabled or the shape list reloads.
- The container carries the slot's layout chrome: `inline-flex` for chips and strips, full width for cards and panels.
- Client modules run with page privileges, so a mount can render anything the page can.

## Floating windows

`conversation.input.overlay` entries and mounts may ask for `placement: 'floating'`. The host then renders a window instead of an anchored panel:

- The window is portalled to the document body and positioned `fixed`, so it can leave the composer area and is not clipped.
- Its bar is the drag handle; the title comes from the descriptor's `title` or the shape title.
- When a drag ends and `snap` is on, a window within 24px of a viewport edge snaps to that edge with an 8px margin.
- The position is remembered per slot and shape in `localStorage` under `dsh-shape:float:<slot>:<shape>` and restored on the next mount, clamped into the viewport.
- A descriptor window carries a dismiss control in its bar. A mounted window has no host control; the shape renders its own close/collapse inside the body.

## Rendering rules

- Entries and mounts appear only when the shape is valid, enabled, ABI-compatible, and its required capabilities resolve.
- Several entries can be contributed by one shape, and one shape can target several slots.
- A descriptor button only reveals `greeting`; it never calls the shape module or a server endpoint.
- A panel's dismiss control hides that entry until the shape list reloads.
- Turning off the shape hides its entries and disposes its mounts immediately.

Example files are available in the bundled shapes; use `shape_inspect` to see parsed descriptors.
