# Rendering: where shape UI actually appears

## A registered slot entry can render nothing, silently

Symptom: the slot accepts the registration, `api.mount()` returns a disposer, and no DOM ever appears. No error is thrown.

Observed twice, in different layers:

- `shell.overlay` mounts never appeared because the plugin's overlay component received no slot name and rendered `null` for an empty mount list.
- The plugin's own panel body was registered into the `main` slot; the wrapper component ran (React called it several times) but its subtree was never committed, so `useEffect` never fired and `render()` was never called.

What the host actually does: a keyed slot entry that fails to assemble is dropped and the slot renders an empty anchor. Registration success and render success are independent facts.

Workaround that holds:

```js
// Decoration: a slot is fine.
api.mount('conversation.session.header.utilities', (container) => {
  container.append(trigger)
  return () => trigger.remove()
})

// Essential UI: park it outside every slot.
box.style.cssText = 'position:fixed;top:64px;right:24px;z-index:60'
document.body.append(box)
```

A fixed-positioned element on `document.body` is visually identical to an overlay mount and cannot be dropped by a slot decision.

Verified by: a find bar that stayed invisible while mounted in `shell.overlay`, and rendered immediately once appended to `document.body`, with `[data-overlay]` absent in the DOM throughout.

## Slot re-renders detach local state

A bar mounted inside the session header is rebuilt when the session switches, and its input loses focus when that slot re-renders. Anything holding a caret, a scroll position, or a selection belongs on `document.body`.

Verified by: focus jumping from a search input to a collapsed-block toggle every time a hit was expanded inside the header.

## A client module that fails to import kills the whole shape

Symptom: nothing from the shape works — no button, no shortcut, no card — and the host reports no error.

Cause: the browser loads shape code from `/dsh-shape/client/<id>/<file>`, so a relative import is resolved against **that** URL. `import { actions } from '../actions.js'` becomes `/dsh-shape/client/actions.js`, which the host does not serve (it serves only `/dsh-shape/client/<id>/<file>`), and the whole module graph fails before `activate` runs.

Rule: every module a client imports must live **inside `client/`**, imported as `./name.js`. If shared logic must also be reachable from `shape_test`, keep the implementation in `client/` and make the shape-root file a re-export:

```js
// actions.js  (read by shape_test)
export { actions, tests } from './client/actions.js'
```

Verified by: a switcher whose client imported `../actions.js` never activated — `activate` was never called, so `Ctrl+Tab` and its button were both dead — and worked immediately once the module moved under `client/`.

## Always keep an escape hatch

If the entry point itself is a slot mount, add a watchdog:

```js
const timer = setTimeout(() => {
  if (trigger.isConnected) return
  document.body.append(trigger)   // fixed positioning; still reachable
}, 1500)
```

Verified by: a host that rendered the session header late left the trigger absent until the watchdog parked it.

## Cards come from descriptors, not from code

`slots/*.json` produces a card in the input dock. If the user asked for a find bar and a card appeared instead, the card is the descriptor, not the client module. Deleting the file removes the card; the client keeps working.
