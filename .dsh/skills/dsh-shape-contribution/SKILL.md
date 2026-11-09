---
name: dsh-shape-contribution
description: Develop and maintain the dsh-shape plugin package itself — the Host plugin, the hand-maintained browser bundle, the Shape Studio preset, the tools, and the published artifacts. Use when changing dsh-shape source, splicing client.js, editing cordis.patch.yml or tools.js, fixing a preset that disappeared, or releasing a version. Not for authoring shapes; use shape-development for that.
---

# dsh-shape contribution

Maintain the `dsh-shape` package itself: the Host plugin, the browser bundle, the Shape Studio preset, the tools, and the published artifacts. This is not the same job as building a shape — for that, use the `shape-development` skill.

## Where this skill lives

This is a DSH-level skill, not a Shape Studio one. It sits in the repository's `.dsh/skills/` — DSH's project-level skill root — so any preset used inside this repository loads it. Copy the directory into `$DSH_HOME/skills/` or `~/.agents/skills/` to make it available in other projects.

The package's bundled `skills/shape-development/` is a different layer: it ships with the package and is mounted only by the Shape Studio preset.

## What this package is

| File | Role |
| --- | --- |
| `index.js` | Package entry: a re-export of `src/host/plugin.js` and nothing else |
| `src/host/plugin.js` | `name`, `inject`, `apply`, and the `/dsh-shape` route dispatch |
| `src/host/http.js` | Route prefixes, `json`, `readJsonBody`, and the view/client static routes |
| `src/host/shapes.js` | Shape discovery: folder scan, manifest parse, slot descriptors |
| `src/host/data.js` | The `/api/data` storage route |
| `src/host/state.js` | Enable/disable map and the capability mirror under `$DSH_HOME/dsh-shape` |
| `client.js` | Browser bundle (hand-maintained, region-spliced from `src/client/` and `src/shared/`) |
| `src/shared/capabilities.ts` | ABI, version types, and the capability registry, used by both halves and published as `./capabilities` |
| `src/shared/version-range.ts` | Semver subset used for capability version matching |
| `src/client/*.ts(x)` | Sources behind each `client.js` region |
| `tools.js` | Eleven tools mounted only by the Shape Studio preset (plain JS) |
| `skill.js` | Registers the `shape-development` and `shape-playbook` skills into the preset scope (plain JS) |
| `cordis.patch.yml` | Bundle patch: inserts the plugin row and the `preset-shape` row |
| `shapes/` | Bundled example shapes (user shapes override them by id) |
| `docs/` | Reference docs (Chinese), not published to npm |
| `scripts/` | The three gates plus `publish-decision.mjs`, used by CI; not published |
| `skills/` | Agent skills: `shape-development` (contract), `shape-playbook` (verified workflows and traps) |

Only `client.js` is a build artifact — JSX and CSS modules force a build. The host, `tools.js`, and `skill.js` are hand-written ESM: edit `src/host/*.js` and you are done. The host used to exist twice (`src/host/index.ts` plus a committed `index.js`), and `/api/data` reached only the artifact; there is one copy now, and `index.js` no longer carries logic.

## Before changing anything

1. Read [`docs/architecture.md`](../../docs/architecture.md) — it explains how a bundle entry, the patch, and the client bundle fit together.
2. Decide which surface you are touching; each has its own reload rule:

| Changed | Verify by | Why a page refresh is not enough |
| --- | --- | --- |
| `client.js` | Reload the page; run `node scripts/check-client-bundle.mjs` | — (served per page load) |
| `index.js`, `src/host/`, `tools.js`, `skill.js`, `cordis.patch.yml` | Restart the host (`dsh web`, or the desktop app); check `/dsh-shape/api/health` | `apply(ctx)` ran once at boot: tools, skills, and preset rows are registered then, and the renderer cannot re-run it |
| An existing file inside a shape | Reload the page | — (client modules and views are read from disk per request) |
| A **new or deleted** file, shape, or enabled flag | `POST /dsh-shape/api/refresh`, **then** reload the page (the panel's refresh does both) | The shape list and each shape's `clientFiles` come from an in-memory scan done at load, and a failed client import is cached for the page's lifetime |

The last two rows are the usual surprise: editing a shape's `index.js` shows up after F5, but adding `client/actions.js` next to it does not, and neither does a new skill in `skills/`.

## The three gates

```sh
node scripts/check-client-bundle.mjs              # loads client.js through the module loader and calls apply(ctx)
node scripts/gen-capability-fallback.mjs --check  # bundled capability list matches the client
node scripts/check-tool-schemas.mjs               # every tool schema is inside DSH's subset
```

They run in CI before publish. Run all three before committing anything that touches `client.js` or `tools.js`.

## Splicing `client.js`

`client.js` is a rolldown artifact kept in the repo. Regions are delimited by:

```js
//#region ../../dsh-plugins/dsh-shape/src/client/<file>
...
//#endregion
```

When you replace a region with `tsc` output, three bindings must be rewritten or the code dies at runtime with `X is not defined`:

| In the bundle | Never leave |
| --- | --- |
| `let react = require("react")` | bare `useRef(...)` → write `react.useRef(...)` |
| `let react_jsx_runtime = require("react/jsx-runtime")` | bare `jsx(...)` / `_jsx(...)` → write `react_jsx_runtime.jsx(...)` |
| Components exported from a `.tsx` region | `createElement(...)` inside a `.ts` region — export a bound component instead |

Strip `import` lines and `export ` prefixes, re-indent to the surrounding depth, then always run `node --check client.js` and the bundle gate. A misplaced brace that closes `apply` early is the failure mode that once shipped a fatal bundle.

Two traps that pass every gate and still break the UI, both hit while splicing `ShapeDialog.tsx`:

- **Double rewriting.** Rewriting `_jsx(` → `react_jsx_runtime.jsx(` and then also rewriting bare `jsx(` produces `react_jsx_runtime.react_jsx_runtime.jsx(`. Apply one rule per identifier, and grep the result for `react_jsx_runtime.react_` and `react.react.`. Six such bindings shipped in `client.js` (the whole of `ShapeOverlay` and `ShapeTabHost`) and only surfaced when an overlay finally mounted; they were repaired while adding the edge layer. `node --check` cannot catch this — only rendering can.
- **`createPortal` is on `react-dom`.** Rewriting it with the other React APIs yields `react.createPortal` — `undefined` at render. Map it to `react_dom.createPortal`.

**One factory scope.** Every region is a statement list inside the same `factory`, so a new module must prefix its module-level identifiers: `edgePopups`/`edgeListeners`/`notifyEdges`, not `popups`/`listeners`/`notify` — the latter collided with the slot and panel registries and the bundle died with `Identifier 'listeners' has already been declared`. Rename before splicing, and check with a parser after: duplicate `function` declarations do not throw at parse time, they silently override.

**A source edit that is not spliced changes nothing.** The bundle gate loads `apply(ctx)` and passes even when a whole new registration is missing from `client.js`; the harness showed the popup registry open with no window because the `index.ts` region still lacked the `dsh-shape-edge-layer` slot row. Re-splice every touched region, then diff the region against its source.

`check-client-bundle.mjs` only loads the module and calls `apply(ctx)`; it never renders. After splicing a `.tsx` region, open the affected surface in the browser and confirm it appears — a region that renders `null` passes every automated gate.

When only one function changes, **edit that function inside the existing region** instead of replacing the whole region with compiler output. The surrounding text keeps its working bindings, and the diff stays reviewable. That is how the `readShapes` reload landed after the whole-region swap broke the dialog.

## The patch must load the plugin

`dsh.profile.bundles` only applies a package's `cordis.patch.yml`; it does **not** load the package. So `cordis.patch.yml` must insert both rows:

```yaml
- insert:
    - id: dsh-shape
      name: '@belowthetree/dsh-shape'
    - id: preset-shape
      name: '@deepseek-ai/dsh-agent-preset'
```

Remove the plugin row and the Host plugin stops loading: `/dsh-shape/api/health` returns 404 and the Shapes button disappears from the header.

## Shape Studio preset rules

- The preset is sandboxed: it mounts the shape tools (`shape_list`, `shape_inspect`, `shape_validate`, `shape_test`, `shape_scaffold`, `shape_read`, `shape_write`, `shape_capabilities`, `shape_spec`) and the shape-development skill, and **no** shell, general filesystem, web, or plugin-installation row.
- `shape_read` / `shape_write` resolve paths against the shapes root and reject anything that escapes it.
- Keep `skill-filesystem` in the preset: it provides the `skills` service that `shape-skill` injects. Dropping it makes the preset row unusable and the preset disappears from the picker.
- Any row that cannot resolve or mount marks the whole preset `broken`, and a broken preset is hidden from the picker.

## Tool schemas

DSH accepts a small JSON Schema subset. `type` must be a single string — `type: ['string', 'null']` is rejected. A rejected row makes the preset broken, so the failure is silent at load and fatal in the picker. Use `string` with `''` for "unknown".

## Shortcut defaults on Web

`web:linux` admits only `Ctrl+/`, `Ctrl+Shift+,`, `Ctrl+Shift+.`. `expandDefaults` skips that profile, and registration falls back to desktop-only defaults when the platform still objects. Do not remove that fallback: without it a shape cannot register any multi-modifier command on Web.

## Versioning and publishing

- Bump `package.json` for every publishable change, including docs and scripts — CI publishes only when the version is unpublished.
- Verify a publish against the registry, not the npm CLI cache:

```sh
curl https://registry.npmjs.org/@belowthetree%2Fdsh-shape/<version>
```

- `files` decides what ships. `docs/`, `demo/`, `scripts/`, and `.dsh/` are intentionally excluded; `skills/`, `shapes/`, `src/shared/capabilities.ts`, and the four root `.js`/`.yml` files are included.

## Recording experience

`skills/shape-playbook/` is the package's experience record: verified end-to-end workflows plus the traps that cost time. It ships with the package and the preset reads it through `shape_spec` topics `playbook`, `playbook-workflows`, `playbook-rendering`, `playbook-keyboard`, `playbook-transcript`, `playbook-tooling`.

**After any shape work verifies successfully, write the flow into `skills/shape-playbook/reference/workflows.md` in the same change.** That covers a new shape kind, a host behavior you had to work around, or a verification step that finally proved something. Record only what you ran:

- numbered steps with the real paths, commands, and `data-testid` hooks;
- a "verified" line stating what a successful run looked like;
- for a workaround, the trap in the matching reference document: symptom, what the host actually does, the workaround, how it was verified.

Do not record guesses, and do not leave the lesson only in a commit message — the next agent sees the playbook, not the history.

## Documentation duties

- `README.md` (Chinese) and `README.en.md` mirror each other; user-visible capability lists and bullets change in both.
- `docs/` holds the reference set: architecture, shape folder, capabilities, development, known issues. Fix the doc in the same change as the behavior.
- `skills/shape-development/reference/*` is mounted into the preset — keep it accurate for the shape author, and keep ABI details out of `README`.
- `skills/shape-playbook/` is mounted into the preset too; keep its index in `SKILL.md` in step with the documents it lists, and add the matching `shape_spec` topic in `tools.js` for any new document.

## Local verification loop

```sh
dsh plugin --profile web add link:E:/Project/dsh-plugins/dsh-shape   # or copy the folder into the profile
dsh web --no-open --port 0
curl http://127.0.0.1:<port>/dsh-shape/api/health
curl -X POST http://127.0.0.1:<port>/dsh-shape/api/refresh   # after adding or deleting shape files
```

Rescanning is not optional when a shape gains a file. The client route only serves names from the scan done at load, so a freshly added `client/<name>.js` answers 404 — and its importer then fails to load, which looks exactly like "the shape stopped working and refreshing did not help". Verified both ways: new file before `POST /api/refresh` → 404, immediately after → 200.

**Order matters, and the shape panel now handles it.** A shape's client modules are imported once per page load, and the cache-busting query the loader appends (`?v=<version>-<time>`) applies to the entry URL only — its static imports keep a stable URL, so a failed import stays failed for the life of the page.

`POST /api/refresh` reports a `revision` signature plus `changed`:

```sh
curl -X POST http://127.0.0.1:<port>/dsh-shape/api/refresh   # {"changed": true, ...}
```

The shape panel's refresh button reads that receipt and reloads the page itself when `changed` is `true`; when only file contents changed it just refreshes the list. If you drive the API yourself, do the same: rescan, then reload when `changed`. A page reloaded before the rescan must be reloaded **again** after it — restarting the Host works only because it does both at once.

On Windows `link:` may fail with `EPERM`; copying the package contents into the profile's `node_modules/@belowthetree/dsh-shape/` works.

### Checking `client.js` without a shell

When the terminal is unavailable but a browser is, a `file://` page beside the bundle reproduces both client gates: define `window.__ModuleLoader__` before a `<script src="client.js">`, then call `loaded.factory(stubs)` and `apply(ctx)` with the same stub context `check-client-bundle.mjs` uses, and print the capability catalog into the page. Classic scripts load from `file://`; `fetch` does not, so stub `window.fetch` for whichever capability you are exercising.

Verified while adding `dsh-shape#mcp`: the page reported the shape-capability registry with all 10 providers and 27/27 contract checks — URL, method, request body, response normalization, and error passthrough against a stubbed `dsh-mcp-setting` 0.2.0 payload. Delete the harness page afterwards; `node scripts/check-client-bundle.mjs` and `gen-capability-fallback.mjs --check` remain the gates of record.

### Checking the host without a running DSH

`index.js` boots standalone against a stub context, which is the fastest way to prove a host change and to drive its routes:

```js
// .smoke.mjs — node .smoke.mjs, then delete it
import { Readable } from 'node:stream'
import path from 'node:path'
process.env.DSH_HOME = path.join(process.cwd(), '.smoke-home')   // never the real one
const plugin = await import('./index.js')
let registered
await plugin.apply({
  effect: (callback) => { callback(); return () => {} },
  webServer: { register: (options) => { registered = options; return () => {} } },
})
// then call registered.handler(req, res) with a Readable body and
// { writeHead() {}, end(value) { /* capture */ } }; kind is 'prefix', path '/dsh-shape'
```

Verified on `0.4.30` (31 checks, all routes): `GET /api/health` → `count` matches the roots; `op:'set'` on a bundled shape → `403 read-only`; `key: '../etc'` → `400`; unknown shape → `404`; `POST /api/refresh` receipt keys are `ok, shapes, roots, revision, changed`.

**Trap:** the delete route accepts *bundled* shapes too — `isInsideRoot` holds for the package's own `shapes/` directory. A smoke test that calls `delete` on `hello` removes it from the working tree (recover with `git restore shapes/`). Test deletion on a shape created inside the throwaway `DSH_HOME` instead.

### The version matcher

`src/shared/version-range.ts` replaces the semver package that used to be inlined into `client.js` (1,283 lines, 28% of the bundle) with `valid`, `validRange`, and `satisfies`. It is pinned to semver 7.8.5 by a differential test; a local install exists at `E:\Project\deepseek-harness\node_modules\semver`, so verify rather than reason:

```js
const real = require('E:/Project/deepseek-harness/node_modules/semver')   // compare against this
```

Compare `valid()` normalization, `validRange()` null-ness, and `satisfies()` as a boolean for every version × range pair, in **both** `includePrerelease` modes, then fuzz generated ranges (`220 versions × 260 ranges × 2 = 114,400` cases passed, 0 failures). Test the shipped artifact too: cut the region out of `client.js` by its `//#region …/src/shared/version-range.ts` markers, `new Function` it, and run the same corpus (2,104 cases passed).

Semantics that are easy to get wrong: `includePrerelease` widens x-range, tilde, and hyphen **lower** bounds to `-0` but leaves exact caret bounds alone (`^1.2.3` stays `>=1.2.3`, `~1.2` becomes `>=1.2.0-0`); a hyphen's exact upper bound becomes `<x.y.(z+1)-0` in that mode; `~>` is `~`; operators may be followed by spaces (`>= 1.0.0`); and `valid()` accepts a `v` prefix and surrounding whitespace while rejecting leading zeros.

When a UI behavior is in doubt, prove it in the running app instead of reasoning from source: mount a probe shape that writes its results to `data/probe.json`, then read that file. DOM queries can miss the real mount point — a component's `useEffect` counter is the reliable signal that it mounted.
