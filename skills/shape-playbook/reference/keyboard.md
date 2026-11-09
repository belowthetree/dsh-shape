# Keyboard: why the obvious combination is rejected

## DSH admission rules on the Web host

`dsh-shape#shortcuts` registers a real DSH command, which means the host validates the default binding before it exists. On the Web host a binding is admitted only when one of these holds:

- three or more modifiers (`Ctrl+Alt+Shift+P`);
- exactly two modifiers including the platform primary plus Alt or Shift (`Ctrl+Alt+M`, `Ctrl+Shift+F`);
- one of the fixed combinations `Ctrl+/`, `Ctrl+Shift+,`, `Ctrl+Shift+.`.

Everything else fails, and the failure is not silent per-combination — it rejects the whole registration:

```
Unsupported Web shortcut: shape.<shapeId>.<id>
```

Consequences:

- `Ctrl+F`, `F3`, `Shift+F3` and `Esc` **cannot** be registered as shape commands on the Web host. `Esc` is also on the reserved list (`Reserved shortcut default`).
- `dsh-shape` catches that error and retries with desktop-only defaults, so the command still exists and can be rebound in Settings — but nothing fires on Web.

Verified by: a shape registering `Ctrl+F` logged `Unsupported Web shortcut` and its handler never ran, while the same handler worked perfectly once moved to a document listener.

## Use a document listener when the combination matters

```js
const onKeyDown = (event) => {
  const primary = event.ctrlKey || event.metaKey
  if (primary && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'f') {
    event.preventDefault()      // suppresses the browser find bar
    event.stopPropagation()
    toggle()
  }
  if (event.key === 'F3' && visible) {
    event.preventDefault()
    focusHit(index + (event.shiftKey ? -1 : 1))
  }
  if (event.key === 'Escape' && visible) close()
}
document.addEventListener('keydown', onKeyDown, true)   // capture: see it before the host
```

Rules that make this work:

- **capture phase** (`true`) so the host and the editor cannot swallow the combination first;
- **`preventDefault()`** for browser-owned keys such as `Ctrl+F`;
- **only claim `F3`/`Esc` while your UI is open**, so you do not take them away from the rest of the app;
- remove the listener in the disposer.

## Do not mix the two

Registering a command *and* listening on `document` double-fires on hosts where the binding was admitted. Pick one per combination: the command when it must be rebindable, the listener when the exact keys matter.

The one exception is a listener that also checks `defaultPrevented`, described below; that pairing is deliberately exclusive rather than duplicated.

## A registered command that never fires on Windows desktop

Symptom: the command exists with a bound default (`shortcuts.list()` shows `keys: ["Ctrl","Alt","T"]`, `issue: null`), the page still receives the key, and nothing runs. Moving focus out of the composer changes nothing.

What the host actually does: the Windows desktop shell forwards keys from the main process, and only forwards combinations present in its own binding index:

```js
// apps/desktop/src/keyboard.ts
const match = keys.has(bindingKey({ code: input.code, modifiers }))
if (!priority && (main || !match)) return   // not forwarded at all
```

That index is built from the catalog the renderer pushes over IPC, and the payload is validated as a whole — one invalid command id, or one overlapping default between *any* two commands on *any* profile, rejects the entire catalog and leaves the index stale. A command a shape registers after startup then never becomes reachable, while the renderer's own catalog still reports it as bound.

Diagnose it by proving whether the key reached the page at all: a capture listener records `event.defaultPrevented`. `false` means the shell never claimed the combination, so the command did not run; `true` means it ran and something else is broken.

Workarounds that hold, in order of preference:

1. Narrow the default with `profiles: ['desktop']` so the payload cannot clash with a Web command that already owns the combination (the sidebar browser owns `Ctrl+Alt+T` on Web).
2. Add a bubble-phase page listener that acts only when the shell did not:

```js
const shellKeyDown = (event) => {
  if (event.defaultPrevented) return   // the command already handled it
  if (!isToggleKey(event)) return
  event.preventDefault()
  popup.toggle()
}
if (window.location.protocol === 'dsh-app:') document.addEventListener('keydown', shellKeyDown, false)
```

The guard makes the pair exclusive: when the shell claims the key it calls `preventDefault` before the renderer sees it, so the listener cannot also fire. Gate the listener on the desktop origin, or a Web host that also owns the combination will run two actions per press.

Verified by: a shape whose `Ctrl+Alt+T` command showed as bound but never ran on Windows desktop, with `key-seen` recorded and `defaultPrevented: false`; the bubble listener made the same press open the window while the command stayed registered for rebinding.

## A colon command id rejects the whole catalog

Symptom: Settings → Shortcuts shows the read-failure banner naming `userData/keybindings.json`, editing is disabled, and the shape command still lists its default keys.

What the host actually does: the desktop validates every id in the catalog it receives over IPC, before it reads any file:

```js
// packages/client/shortcuts/src/configuration.ts
const commandPattern = /^[a-z][a-zA-Z0-9-]*(?:\.[a-zA-Z][a-zA-Z0-9-]*)+$/u
if (!commandPattern.test(entry.id)) throw new Error('Invalid shortcut definition')
```

A colon id (`shape:config-workbench:toggle`) fails the pattern, the IPC call rejects, and the renderer marks the preference document unreadable — so the toast blames the file and its permissions while that file is not even involved.

Fix: dotted segments, each starting with a letter — `shape.config-workbench.toggle`. Since 0.4.38 `dsh-shape` builds `shape.<shapeId>.<id>` and normalizes both segments (invalid characters become `-`, a leading non-letter gets an `s` prefix), because a shape author cannot be expected to keep the DSH id grammar.

Verified: `pattern.test('shape:config-workbench:toggle') === false` and `pattern.test('shape.config-workbench.toggle') === true` against the shipped pattern; after the change `check-client-bundle.mjs` (41 registrations), `gen-capability-fallback.mjs --check` (9 capabilities), and `check-tool-schemas.mjs` (11 tools) all pass.

## A mounted dialog turns Ctrl+, and Ctrl+/ into no-ops

Symptom: on the desktop, Ctrl+, stops opening Settings and Ctrl+/ stops opening the shortcut reference, while Ctrl+N and the sidebar gear still work. Settings opens fine from the gear, Settings → Shortcuts still lists both commands as bound, and reloading the window changes nothing.

What the host actually does: the shortcut adapters take the modal owner from the document, not from a registry:

```js
// packages/client/ui-primitives/src/useModalLayer.ts
export const modalSelector = '[role="dialog"][aria-modal="true"], [role="menu"]'
// packages/client/shortcuts/src/client/native.ts
const top = [...window.document.querySelectorAll(modalSelector)].at(-1)
const context = { target, region, modal: top?.dataset.shortcutModal ?? (top === undefined ? null : 'other') }
```

`settings.open` resolves `{ status: 'blocked' }` whenever `modal` is neither `null` nor `settings`; `shortcuts.open` accepts only `null`, `settings`, `shortcuts`. Visibility plays no part in the query, and on Windows/macOS desktop `dispatch` skips its own modal gate, so each command's own `resolve` is the only decider. One element that stays mounted while hidden therefore disables both commands for the whole session — and only those: commands without a `modals` scope keep working, which is why this reads as "the settings shortcut broke".

Found in: the bundled `workspace-tab-switch` shape appended its `wts-root` panel to `document.body` once at activation and set `role="dialog"` + `aria-modal="true"` on it permanently. Idle it is only CSS-hidden (`data-phase="idle"`), which the selector cannot see.

Fix: own the role with the visible phase — add both attributes when the panel opens and remove them when it closes. `display:none`, `visibility:hidden`, or `aria-hidden="true"` are not enough; remove the attributes.

Verified — on the failing desktop window, with Ctrl+, and Ctrl+/ dead and Ctrl+N working:

```js
JSON.stringify([...document.querySelectorAll('[role="dialog"][aria-modal="true"],[role="menu"]')].map(e => [e.tagName, e.getAttribute('role'), e.dataset.shortcutModal ?? '-', (e.className || '').toString().slice(0, 60)]))
```

returned `[["DIV","dialog","-","wts-root"]]`: one element, no `data-shortcut-modal`, the shape's class. The gear still opened Settings, so the panel and the command catalog were intact — only the gesture was blocked. After the fix the same query returns `[]` at idle and Ctrl+, opens Settings again.

## Host windows: mount the modal instead of hiding it

`Shell.overlay` hosts three independent layers in this package: shape mounts, edge popups, and the workbench window. The workbench keeps the role tied to the mount rather than to a CSS phase: `ShapeWorkbenchLayer` returns `null` while closed, so the `[role="dialog"][aria-modal="true"]` node does not exist at idle and Ctrl+,/Ctrl+/ keep working. Opening renders the portal with the role; closing unmounts it. Its `Esc` handler is a `document` **capture** listener that calls `stopPropagation()`, so the shape browser underneath cannot also consume the same press.

The open/close shortcut (`Ctrl+Alt+W`) and the browser shortcut (`Ctrl+.`) are plain page-level `keydown` listeners, not `dsh-shape#shortcuts` commands. That is deliberate: `web:linux` rejects multi-modifier defaults other than `Ctrl+/`, `Ctrl+Shift+,`, `Ctrl+Shift+.`, so registering `Ctrl+Alt+W` would leave it unbound on Web. The listener checks exact modifiers and both `event.code === 'KeyW'` and `event.key`, so a layout that reports a different `key` still toggles.

While the workbench is open it also owns `Ctrl+Alt+ArrowLeft/Right` for switching between registered **workbenches**, and those already belong to the bundled `workspace-tab-switch` shape (a `document` capture listener). The workbench listener therefore sits on **window capture** and calls `stopImmediatePropagation()`: window capture runs before the shape's document listener, so the event never reaches it and only the workbench switches. `preventDefault` plus `stopImmediatePropagation` also keep DSH's own handling from firing. The same pattern is the one to copy for any host window that must override a shape shortcut while it is open.

Verified in the bundle test (jsdom, real React 18): while the window was closed, opening required exactly Ctrl+Alt+W; Ctrl+W and Ctrl+Shift+Alt+W did nothing; Escape closed the window opened by the header button; the window unmounted completely instead of staying hidden. A workbench-tab test also confirmed Ctrl+Alt+ArrowRight/Left selected the next/previous workbench while a stand-in `document` capture listener never fired, that the selection survived close/reopen, and that the shortcut went dead after close.

