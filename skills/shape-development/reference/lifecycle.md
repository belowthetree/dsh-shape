# Lifecycle and refresh

## Discovery

The Host scans bundled `shapes/` and `$DSH_HOME/dsh-shape/shapes/` at startup. A user shape with the same id replaces the bundled one. Missing user directories are created and are not fatal.

## Refresh

- The Shape browser's refresh action calls `POST /dsh-shape/api/refresh` and re-reads both roots.
- Adding or editing a shape folder takes effect after refresh.
- Views are read from disk when opened; replacing a file does not require a refresh, though the iframe must be reopened.
- Slot cards update on the next card load after refresh.
- The shape client runtime listens for refresh and capability-change events; it stops current modules and re-imports eligible ones.
- Changes to dsh-shape's own Host or Client code require a DSH restart.

## Enablement

- Each shape has a persisted boolean in `$DSH_HOME/dsh-shape/state.json`; default is enabled.
- Disabling immediately hides chat cards, stops the client module and its shortcuts, and makes the view route return 404.
- `POST /dsh-shape/api/toggle` with a shape id and boolean updates state.
- State write failure rolls back the in-memory switch.

## Deletion

- The Shape browser's card menu offers delete with a confirmation bar.
- `POST /dsh-shape/api/delete` with a shape id removes the shape folder from its root and drops its persisted enable flag.
- Only directories directly below the bundled or user root are removable; anything else answers 409.
- Deletion is permanent: a bundled shape returns only with a plugin reinstall, a user shape only from a copy.

## Blocking

A shape is blocked when it is invalid, has an unsupported `shape.apiVersion`, or misses a required capability. Blocked shapes remain visible in the browser with a diagnostic, but cannot open a view or render chat cards; their client module is not imported.

## Restart boundary

Restart DSH after changing the dsh-shape plugin, adding a new Client capability provider, or installing a plugin. Restarting is not required for ordinary shape folder edits.

## Runtime data

The Client mirrors capability metadata to `$DSH_HOME/dsh-shape/capabilities.json`. The Host exposes it at `GET /dsh-shape/api/capabilities`. This catalog is informational; runtime APIs stay inside the browser.
