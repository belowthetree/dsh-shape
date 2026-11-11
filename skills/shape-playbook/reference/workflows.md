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
3. `edge` is `top` / `right` / `bottom` / `left`; sides default to 380×560 and top/bottom to 640×420, and the window never leaves the viewport. `width`/`height` accept pixels or `'full'`: a full axis spans the viewport (the anchored edge keeps its gap), so `edge: 'top'` + `width: 'full'` is a full-width bar. A right window stops 52px short of the viewport edge so the conversation's turn rail stays visible (12px rail gap + 28px rail + 12px breathing room); the other three edges keep 12px.
4. `keys` binds a private page-level shortcut that toggles the window (any combination, invisible in Settings). For a rebindable command, register it through `dsh-shape#shortcuts` and call `popup.toggle()`.
5. `Esc` closes the topmost popup; `esc: false` opts out, and `finishShapeEdgeClose` drops the window after its exit animation. The title bar's close button works even when focus is inside the sandboxed view.
6. The inner edge is a resize strip (right window → left edge, top window → bottom edge, …). Dragging it updates the perpendicular dimension, clamped to the viewport with a 240×160 minimum; the size is stored per popup in `localStorage` and restored on the next open. `resizable: false` removes the strip, and a `'full'` axis is not resizable.
7. A shape may open several popups at once; the one opened last is on top, and `open()` raises an already-open window.
8. `peek: true` parks the window on its edge: only a 10px strip stays on screen, the pointer (or keyboard focus) slides it out, and it slides back 240ms after the pointer leaves — unless focus is still inside the view. The parked window sits off-screen behind the edge, so a top window ignores `peek` (sliding it up would paint over the Windows caption row).

Verified: the shipped `client.js` loaded in Chromium through a harness page with stubbed slots (React 18 UMD), a demo shape calling `api.edge()` for all four edges. Windows landed centered on their edge (top/bottom 12px from the edge, sides 12px and vertically centered — that harness run predates the turn-rail inset below), the iframe showed `views/index.html`, `Escape` closed only the topmost popup, `Ctrl+Alt+E` reopened it, `esc: false` ignored `Escape`, and stopping the shape runtime closed every window with no console or surface errors. Dragging the right window's inner edge 120px grew it from 360 to exactly 480 and the size survived a page reload; `edge: 'top'` + `width: 'full'` measured 1280×260 at the top edge and `edge: 'left'` + `height: 'full'` measured 320×900, both with their remaining axis still resizable; `resizable: false` exposed no strip. With `--dsh-frame-chrome-top: 40px` (the Windows caption) the top window moved to y=52, the full-height left window to y=40/h=860, the centered right window to y=210, and a dragged top window clamped at 836px (900−40−24), so no edge window crosses the caption. This has not yet been run inside the full DSH GUI.

Right-edge clearance (0.8.1): the conversation view draws its turn rail 12px inside the transcript's right edge, 28px wide (`ui-chat/.../TurnNavigator.module.css`, `.frame { right: 12px; width: 28px }`), so a window anchored at 12px sat on top of it. `ShapeEdgeLayer.tsx` now anchors `edge: 'right'` at 52px and subtracts that inset from the width budget. Verified from the shipped bundle, not the source: `stripStyle` and `viewportLimit` were cut out of `client.js` and run with a stubbed 1000×900 viewport — right resolved to `{ right: 52 }` with no `left`, full-width right to `{ right: 52, left: 0 }`, left stayed `{ left: 12 }`, top/bottom kept their 12px gaps, and the width clamp became `1000 − 64` (7/7 checks, `node .tmp-scan/check-edge-geometry.mjs`, script not committed). On-screen confirmation with a right-edge popup in a multi-turn session is still pending.

Peek (0.8.1): `peek: true` parks a popup as a 10px strip on its edge. Two checks, both run:

- Bundle geometry: the pure helpers were cut out of `client.js` and run with a stubbed 1000×900 viewport — `peekTransform('right')` parks at `translate3d(calc(100% + 42px), 0, 0)` (52px anchor + 10px strip), left/bottom park at the 12px anchor + 10px strip, the strip hit test accepts only the outer 10px of its own edge span and rejects the turn-rail band, and the parked state wires `data-peek`, a pointer-transparent iframe, and no resize strip (15/15 checks, `node .tmp-scan/check-peek.mjs`).
- Browser interaction: a temporary harness page (React 18 UMD, jsx runtime and `dsh-client-ui-primitives` stubbed, the shipped `client.js` region mounted directly, 1280×900) opened the popup parked — left edge 1270, 10px visible, `matrix(1, 0, 0, 1, 422, 0)`. A synthetic `pointermove` on the strip slid it out to 848..1228 (52px clear of the right edge), a move to 500 re-parked it after the delay, a point above the window's span did not reveal it, and a `peek: true` top-edge popup stayed anchored at y=12 with no `data-peek`. 8/8 behavioural checks, no page or console errors.

## 7. A workbench shape

1. The manifest must declare the kind; without it `api.workbench` throws:
   ```json
   "shape": { "apiVersion": 1, "kind": "workbench", "requires": [] }
   ```
2. Register the surface from `client/index.js`; the render callback owns its container and returns a cleanup:
   ```js
   export function activate(api) {
     const workbench = api.workbench({
       id: 'main',
       title: '任务工作台',
       render: (container) => {
         const board = document.createElement('div')
         board.textContent = '工作台内容'
         container.append(board)
         return () => board.remove()
       },
     })
     return () => workbench.dispose()
   }
   ```
3. `shape_validate({ id })` — a workbench with no `client/index.js` is valid but warns, because it can never contribute a surface. `shape_scaffold({ id, ..., kind: 'workbench' })` generates the manifest kind and the client stub in one step.
4. Open the window with the header's **shape 工作台** action or `Ctrl+Alt+W`; close it with `Esc`, a press on the blank area around the window, or `Ctrl+Alt+W` again. There is deliberately no close button.
5. While it is open, the strip **below the window** lists every registered workbench; the dot under each name is hollow when inactive and filled white for the active one. `Ctrl+Alt+ArrowLeft` / `Ctrl+Alt+ArrowRight` cycle through the workbenches (window capture plus `stopImmediatePropagation`, so the bundled `workspace-tab-switch` shape's `document` capture listener does not also switch), and the selection is remembered across close/reopen.
6. The layer renders into `document.body` and unmounts while closed, so it only owns the DSH modal role while it is open (see [keyboard.md](keyboard.md)). There is no title bar: the surface fills the window, and the tabs sit outside the dialog element.
7. Workbench shapes sleep like every other shape by default. The first open of the window dispatches `dsh-shape:workbench-open`; the runtime wakes every dormant `kind: "workbench"` shape there, so do **not** add `wake.eager` just to make a workbench appear. Reopening the window does not re-import them. A workbench shape whose own shortcut should work before the window was ever opened still needs `wake.keys`.

Verified on 0.5.5 (sources, bundle, and the desktop boot path), except for one on-screen confirmation noted at the end:

- Host scan: a stub-context boot calling `GET /dsh-shape/api/shapes` returned `kind: "workbench"` for a shape declaring it, while `kind: "panel"` came back `valid: false` with `shape.kind must be "shape" or "workbench"` (7 checks, `node .tmp-host-smoke.mjs`, script deleted afterwards).
- Client bundle: loaded the shipped `client.js` in jsdom with real React 18 (`E:/Project/deepseek-harness/node_modules/.pnpm/react@18.3.1`) and `apply(ctx)`, then rendered the single `conversation.header.leading` registration (which renders both header actions) and the `shell.overlay` layer. A custom Node loader resolved `/dsh-shape/client/<id>/index.js` to a fake workbench module, so the real runtime activated it. 15 checks passed: header shows **shape 工作台** beside **Shapes**; `Ctrl+Alt+W` toggles the window; `Ctrl+W` and `Ctrl+Shift+Alt+W` do not; `Esc` and a backdrop press close it; the runtime surface renders (`runtime-surface`); a plain-kind shape calling `api.workbench` threw the expected error; the window has no close button.
- Layer in isolation (same bundle regions, jsdom): empty state names `kind` and lists installed workbench shapes with their state, 80% inline sizing, two-workbench switcher, previous surface cleanup on switch, and cleanup on close all passed (16 checks).
- Tools: `shape_scaffold({ kind: 'workbench' })` wrote the manifest kind and a client that calls `api.workbench`; `shape_validate`, `shape_list`, and `shape_inspect` reported the kind; an unknown kind failed validation (11 checks).
- Workbench tabs: rendered the shipped layer in jsdom with three registered workbenches. All three got a tab, the first was active by default, the active dot was filled (`background: var(--dsw-alias-label-primary, #fff)`) and inactive dots hollow; the tabs rendered **outside** the `[role=dialog]` element, in DOM order after it, inside the window's backdrop; `Ctrl+Alt+ArrowRight`/`ArrowLeft` selected the next/previous workbench and the surface text changed, wrapping at both ends; clicking a tab selected it without closing the window; a `document` capture listener (standing in for the bundled switcher shape) was **not** called because the workbench listener used window capture plus `stopImmediatePropagation`; the selection survived close/reopen; removing every workbench returned the empty state and removed the tabs (15 checks).
- Placement check: the same layer under jsdom confirmed the tab strip sits in the backdrop's column **below** the window, DOM-after the dialog, and that clicking a tab keeps the window open while a backdrop press still closes it (11 checks).
- Visual harness: a temporary `file://` page in Chromium rendered the same two bundle regions with React 18 UMD and a 1280×900 viewport. The window measured about 1024×720 (80% on both axes); there is no title bar, the shape's own surface starts at the top edge, the three-workbench tab pill sits below the window on the backdrop with hollow/filled dots, and there is no scrollbar (the empty state uses `box-sizing: border-box` so its padding cannot overflow the body). The empty state showed the creation hint with each code snippet kept on one line, plus the installed-shape list with its states.
- Desktop boot: the first build registered the workbench button as a second `conversation.header.leading` entry and the desktop app could not start (`web boot: 1 entry did not activate`, then `desktop welcome: Web authentication failed`). After merging both actions into the `ShapeButton` registration (see [rendering.md](rendering.md)), the same profile booted and the host at the app's URL reported `10` capabilities and `kind: "shape"` for every installed shape.

Pending: a manual `Ctrl+Alt+W` / **shape 工作台** click in the running desktop app. With no `kind: "workbench"` shape installed, the expected result is the empty state explaining how to add one.

## 8. Regression pass before handing a shape over

1. `shape_validate` and `shape_test` clean.
2. Reload the page; the entry point exists and the primary action works.
3. Switch sessions and back; the UI is still there and still focused where it should be.
4. `shape_inspect` shows the files you expect, with no stray `client/` duplicates.
5. Record anything new that the run taught you in this document (see the rule in [SKILL.md](../SKILL.md)).

## 9. A dormant shape woken by a shortcut

1. Keep the manifest minimal: `wake` is optional and its absence is the default — the shape is not imported at page open.
2. Register the key in the manifest if the shape should be reachable without opening the Shapes browser:

   ```json
   "shape": {
     "apiVersion": 1,
     "wake": { "keys": ["Ctrl+Alt+K"] }
   }
   ```

3. Write the client as usual (`api.edge({ keys: 'Ctrl+Alt+K' })` or `api.shortcuts.register`) — the runtime registers the wake key before the module loads, and after `activate` returns it replays the waking press into those bindings. Do not add a second private `keydown` listener for the same combination.
4. A shape whose entry point must be visible before any wake (a header button, an injected chip) has to opt out: `"wake": { "eager": true }`. The bundled `chat-search` and `workspace-tab-switch` do this. `kind: "workbench"` shapes are the exception: opening the workbench window wakes them, so they stay dormant without `eager`.
5. Opening the shape's card in the Shapes browser wakes it too (`wakeShape(id)` is what the card calls). Restarting a dormant shape wakes it.
6. Verify without the GUI: serve a page that stubs `fetch('/dsh-shape/api/shapes')` with `wake` policies and imports fake `client/index.js` modules that push to a global on `activate`; start `createShapeRuntime` and check which modules ran.

Verified on the shipped `client.js` (harness page in Chrome, real dynamic imports, 10 checks): only the `eager` shape had been imported 600ms after boot; `Ctrl+Alt+D` then imported the dormant shape and ran its own `Ctrl+Alt+D` binding from the same press; a second press ran that binding again without re-importing; calling the bundle's `openShapeWorkbench()` imported the dormant `kind: "workbench"` shape while leaving a dormant key-shape asleep, and closing/reopening did not re-import it; `wakeShape('keyed')` (the card path) imported its module and did not run a key binding; the key worked afterwards. Host side, a stub-context boot on `GET /dsh-shape/api/shapes` reported `{ keys: [], eager: false }` for a shape without `wake`, the declared keys for one with them, `eager: true` for one opting out, and marked `wake: { keys: [42] }` invalid with `shape.wake.keys must be a string or an array of strings` (4 checks).
