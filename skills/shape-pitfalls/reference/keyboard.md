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
