# Testing and validation

## Static checks

1. Call `shape_validate` with the shape id after every manifest or directory change.
2. Call `shape_inspect` to confirm the parsed manifest, requirements, slots, file inventory, and client code.
3. Call `shape_list` to confirm both origins and that the intended shape replaced any bundled shape.

`shape_validate` checks the manifest object, ABI, requirement fields and semver ranges, and reports warnings for missing `views/`/`slots/` directories. It does not execute client code or validate HTML.

## Package checks

The package itself runs four gates before a publish; run them locally after changing `client.js` or `tools.js`:

```sh
node scripts/check-client-bundle.mjs              # loads client.js through the module loader and calls apply()
node scripts/gen-capability-fallback.mjs --check  # the bundled capability list matches the client
node scripts/check-tool-schemas.mjs               # every tool schema stays inside DSH's supported subset
node scripts/check-runtime-refresh.mjs            # refresh re-imports only changed shapes; restart re-imports one
```

A tool schema outside that subset does not fail loudly at runtime: the row mounting the tool becomes unusable and the whole preset disappears from the picker. `type` must be one string — `type: ['string', 'null']` is rejected.

## Actions and `shape_test`

Keep behavior that does not need the DOM in `actions.js` at the shape root, so it can be tested without a browser:

```js
// actions.js
export const actions = {
  summarize(servers) {
    return `${servers.filter(server => server.connected).length}/${servers.length} 已连接`
  },
}

export const tests = {
  'summarize counts connected servers': ({ actions, assert }) => {
    assert.equal(actions.summarize([{ connected: true }, { connected: false }]), '1/2 已连接')
  },
}
```

`client/index.js` binds those actions to capabilities:

```js
import { actions } from '../actions.js'

export function activate(api) {
  const shortcuts = api.require('dsh-shape', 'shortcuts')
  return shortcuts.register({ id: 'summary', label: '显示 MCP 摘要', keys: 'Ctrl+Alt+M', run: () => actions.summarize(load()) })
}
```

`shape_test` imports `actions.js`, runs every exported test with `{ actions, assert }`, and reports each result. `assert` provides `ok`, `equal`, and `deepEqual`. The module is imported as ESM, so the shape's `package.json` needs `"type": "module"` (`shape_scaffold` writes it).

What stays manual: pressing the real combination inside DSH and watching the surface react. `shape_test` covers the action and the binding data, not the live keyboard path.

## UI checks

- Open Shapes with `Ctrl + .`; the header button also opens it.
- Confirm the shape card is not blocked and the switch is on.
- Open the view and check its content and browser console.
- Check that chat cards render above the composer and the button reveals the greeting.
- Exercise every client shortcut, including the disabled/re-enabled path.
- Turn the shape off: its cards disappear, its view returns 404, and its shortcuts stop.
- Turn it back on: cards, view, and shortcuts return.
- Delete a throwaway user shape: the confirmation bar appears, the card disappears after confirming, and the folder is gone from disk.

## Debugging

- The shape browser shows blocked reasons, including missing capability ranges and ABI mismatches.
- Client activation and shortcut errors are reported in the browser console.
- Capability availability is visible through `shape_capabilities`.
- If a newly added tool or client capability is missing, restart DSH; ordinary shape files do not need a restart.

## Safety

Client modules run with page privileges. Do not execute untrusted shape code. Views are sandboxed but can still make network requests; review their content before use.
