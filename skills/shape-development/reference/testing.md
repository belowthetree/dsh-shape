# Testing and validation

## Static checks

1. Call `shape_validate` with the shape id after every manifest or directory change.
2. Call `shape_inspect` to confirm the parsed manifest, requirements, slots, file inventory, and client code.
3. Call `shape_list` to confirm both origins and that the intended shape replaced any bundled shape.

`shape_validate` checks the manifest object, ABI, requirement fields and semver ranges, and reports warnings for missing `views/`/`slots/` directories. It does not execute client code or validate HTML.

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
