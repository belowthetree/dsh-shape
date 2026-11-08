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
| `index.js` | Host plugin: HTTP routes, shape discovery, enable/disable, capability mirror |
| `client.js` | Browser bundle (hand-maintained, region-spliced from `src/client/`) |
| `src/client/*.ts(x)` | Sources behind each `client.js` region |
| `tools.js` | Eleven tools mounted only by the Shape Studio preset |
| `skill.js` | Registers the `shape-development` and `shape-playbook` skills into the preset scope |
| `cordis.patch.yml` | Bundle patch: inserts the plugin row and the `preset-shape` row |
| `shapes/` | Bundled example shapes (user shapes override them by id) |
| `docs/` | Reference docs (Chinese), not published to npm |
| `skills/` | Agent skills: `shape-development` (contract), `shape-playbook` (verified workflows and traps), and this one |

## Before changing anything

1. Read [`docs/architecture.md`](../../docs/architecture.md) — it explains how a bundle entry, the patch, and the client bundle fit together.
2. Decide which surface you are touching; each has its own reload rule:

| Changed | Verify by | Why a page refresh is not enough |
| --- | --- | --- |
| `client.js` | Reload the page; run `node scripts/check-client-bundle.mjs` | — (served per page load) |
| `index.js`, `tools.js`, `skill.js`, `cordis.patch.yml` | Restart the host (`dsh web`, or the desktop app); check `/dsh-shape/api/health` | `apply(ctx)` ran once at boot: tools, skills, and preset rows are registered then, and the renderer cannot re-run it |
| An existing file inside a shape | Reload the page | — (client modules and views are read from disk per request) |
| A **new or deleted** file, shape, or enabled flag | `POST /dsh-shape/api/refresh`, then reload | The shape list and each shape's `clientFiles` come from an in-memory scan done at load; a brand-new client module 404s until it is rescanned |

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

- `files` decides what ships. `docs/` is intentionally excluded; `skills/`, `shapes/`, `src/`, and the four root `.js`/`.yml` files are included.

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

On Windows `link:` may fail with `EPERM`; copying the package contents into the profile's `node_modules/@belowthetree/dsh-shape/` works.

When a UI behavior is in doubt, prove it in the running app instead of reasoning from source: mount a probe shape that writes its results to `data/probe.json`, then read that file. DOM queries can miss the real mount point — a component's `useEffect` counter is the reliable signal that it mounted.
