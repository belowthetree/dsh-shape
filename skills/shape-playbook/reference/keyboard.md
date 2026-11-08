# Keyboard: why the obvious combination is rejected

## DSH admission rules on the Web host

`dsh-shape#shortcuts` registers a real DSH command, which means the host validates the default binding before it exists. On the Web host a binding is admitted only when one of these holds:

- three or more modifiers (`Ctrl+Alt+Shift+P`);
- exactly two modifiers including the platform primary plus Alt or Shift (`Ctrl+Alt+M`, `Ctrl+Shift+F`);
- one of the fixed combinations `Ctrl+/`, `Ctrl+Shift+,`, `Ctrl+Shift+.`.

Everything else fails, and the failure is not silent per-combination — it rejects the whole registration:

```
Unsupported Web shortcut: shape:<shapeId>:<id>
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

That index is built from the catalog the renderer pushes over IPC, and the payload is validated as a whole — one overlapping default between *any* two commands, on *any* profile, rejects the entire catalog and leaves the index stale. A command a shape registers after startup then never becomes reachable, while the renderer's own catalog still reports it as bound.

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
