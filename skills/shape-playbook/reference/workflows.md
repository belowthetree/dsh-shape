# Workflows: verified end-to-end flows

Each flow below was run against a live Host. Follow the steps in order; the "verified" line states what a successful run looks like.

## 1. Any new shape

1. `shape_scaffold({ id: 'my-shape' })` creates `<userRoot>/my-shape/` with a manifest, a view, and a client stub.
2. Edit `package.json`: set `title`, keep `"type": "module"`, and declare `shape.apiVersion: 1` plus only the capabilities you actually call.
3. Write the logic that must be testable into `actions.js` (root) **as pure functions**, then call it from both the client and `tests`.
4. Implement `client/index.js` exporting `activate(api)`, returning a disposer.
5. `shape_validate({ id })` — expect `valid: true`, no errors.
6. `shape_test({ id })` — expect every test passing.
7. Reload the app page (F5) and confirm the shape's `data-testid` element exists:

   ```
   document.querySelector('[data-testid="my-shape-..."]') !== null
   ```

Verified: a scaffolded shape passing `shape_validate` and `shape_test`, then rendering after a page reload.

Keep every client module inside `client/` — a cross-directory relative import fails and kills the whole shape (see [rendering.md](rendering.md)).

## 2. A floating find bar (search the conversation)

1. Capabilities: `conversation` (find/reveal/subscribe), `slots` (one header mount for the trigger).
2. Build the bar as a plain DOM node; `position: fixed; top: 64px; right: 24px; z-index: 60`.
3. **Append it to `document.body`, not to a slot** — the bar must survive header re-renders.
4. Mount only the 🔍 trigger into `conversation.session.header.utilities`, with a watchdog that parks it on `document.body` if it is still disconnected after ~1.5 s.
5. Keyboard: a `document` capture listener owning `Ctrl/Cmd+F` (`preventDefault`), with `F3`/`Shift+F3` only while open (see [keyboard.md](keyboard.md)).
6. Search: `conversation.find(needle, { limit })`; retry once after ~300 ms when the result is empty, because the transcript may still be mounting.
7. On a hit: expand collapsed blocks, `scrollIntoView({ block: 'center' })`, highlight, and restore input focus (see [transcript.md](transcript.md)).
8. `Escape` closes and clears highlights.

Verified: `1/57` hits on a long session, `F3` stepping, `Esc` clearing, and a hit inside a collapsed thinking block expanding automatically.

## 3. A workspace/tab switcher (hold a key, release to commit)

1. Capabilities: `workspace` (list/current/next/previous), `shortcuts` (optional command), `slots`, `ui` (optional toast).
2. Put the strip math in `actions.js` (`strip`, `describe`, `accentHue`, `monogram`) so wrap-around edges are testable with `shape_test`.
3. Register `Ctrl+Tab` / `Ctrl+Shift+Tab` as commands **and** own the same combination with a `document` capture listener; de-duplicate the double fire with a short timestamp guard.
4. Handle `Ctrl+Alt+ArrowLeft/Right` too — a browser reserves `Ctrl+Tab` for its own tab strip.
5. On trigger: show a full-screen layer on `document.body`, keydown moves the selection, `keyup` of the primary key commits, `Escape` cancels.
6. Add `slots/chat-card.json` only if you want the card in the input dock; the client works without it.

Verified: a five-card switcher rendering the registry, committing on key release, and cancelling on `Escape`.

## 4. A chat card

1. Create `slots/chat-card.json` with `title`, `description`, `entry`, and the action ids it exposes.
2. Implement the action in `actions.js` and list it under `tests` so `shape_test` covers it.
3. The card renders in the input dock on the next page load; clicking it runs the action.

Verified: a card appearing in the dock and running its action from a keyword match.

## 5. State that survives a reload

1. Require the `storage` capability.
2. Read with `storage.get(key)` and write with `storage.set(key, value)`; keep values JSON-serialisable and small.
3. Namespace keys with the shape id; two shapes share one store.
4. Treat a missing key as "never set", never as an error.

Verified: a preference surviving a full page reload while other shapes kept their own keys.

## 6. A view inside an edge popup

1. Put the interface in `views/index.html`; it is a plain page with no client API.
2. In `client/index.js`, register one popup per surface:
   ```js
   export function activate(api) {
     const popup = api.edge({
       id: 'dock',
       title: '快捷面板',
       edge: 'top',
       view: 'index.html',
       width: 'full',        // 左右占满；像素也可以
       height: 300,          // 像素或 'full'（上下占满）
       keys: 'Ctrl+Alt+E',
       resizable: true,
     })
     popup.open()
     return () => popup.dispose()
   }
   ```
3. `edge` is `top` / `right` / `bottom` / `left`; sides default to 380×560 and top/bottom to 640×420, and the window never leaves the viewport. `width`/`height` accept pixels or `'full'`: a full axis spans the viewport (the anchored edge keeps its 12px gap), so `edge: 'top'` + `width: 'full'` is a full-width bar.
4. `keys` binds a private page-level shortcut that toggles the window (any combination, invisible in Settings). For a rebindable command, register it through `dsh-shape#shortcuts` and call `popup.toggle()`.
5. `Esc` closes the topmost popup; `esc: false` opts out, and `finishShapeEdgeClose` drops the window after its exit animation. The title bar's close button works even when focus is inside the sandboxed view.
6. The inner edge is a resize strip (right window → left edge, top window → bottom edge, …). Dragging it updates the perpendicular dimension, clamped to the viewport with a 240×160 minimum; the size is stored per popup in `localStorage` and restored on the next open. `resizable: false` removes the strip, and a `'full'` axis is not resizable.
7. A shape may open several popups at once; the one opened last is on top, and `open()` raises an already-open window.

Verified: the shipped `client.js` loaded in Chromium through a harness page with stubbed slots (React 18 UMD), a demo shape calling `api.edge()` for all four edges. Windows landed centered on their edge (top/bottom 12px from the edge, sides 12px and vertically centered), the iframe showed `views/index.html`, `Escape` closed only the topmost popup, `Ctrl+Alt+E` reopened it, `esc: false` ignored `Escape`, and stopping the shape runtime closed every window with no console or surface errors. Dragging the right window's inner edge 120px grew it from 360 to exactly 480 and the size survived a page reload; `edge: 'top'` + `width: 'full'` measured 1280×260 at the top edge and `edge: 'left'` + `height: 'full'` measured 320×900, both with their remaining axis still resizable; `resizable: false` exposed no strip. With `--dsh-frame-chrome-top: 40px` (the Windows caption) the top window moved to y=52, the full-height left window to y=40/h=860, the centered right window to y=210, and a dragged top window clamped at 836px (900−40−24), so no edge window crosses the caption. This has not yet been run inside the full DSH GUI.

## 7. Regression pass before handing a shape over

1. `shape_validate` and `shape_test` clean.
2. Reload the page; the entry point exists and the primary action works.
3. Switch sessions and back; the UI is still there and still focused where it should be.
4. `shape_inspect` shows the files you expect, with no stray `client/` duplicates.
5. Record anything new that the run taught you in this document (see the rule in [SKILL.md](../SKILL.md)).
