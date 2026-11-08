# Tooling: preset-breaking mistakes

## The JSON Schema subset is narrower than it looks

DSH validates every tool schema before a preset mounts it, and accepts only:

- one `type`, as a **single string** — `type: ['string', 'null']` is rejected;
- `properties`, `required`, `additionalProperties` on objects only;
- `items` on arrays only;
- scalar `enum`/`const` matching the declared type;
- `oneOf` with at least two branches and no sibling constraints;
- annotations `description`, `title`, `default`, `examples`.

The failure is silent at load and fatal in the UI: the row mounting the tool is marked unusable, the whole preset becomes `broken`, and it disappears from the preset picker with no message.

Represent "unknown" with an empty string, not `null`:

```js
packageVersion: { type: 'string' }   // '' when unknown
```

Verified by: a preset that vanished from the picker after a `type: ['string', 'null']` change, then returned once the field became a plain string.

`node scripts/check-tool-schemas.mjs` reproduces the subset locally; run it before publishing.

## Validate the value, not just the schema

A schema that is itself legal can still reject the tool's own output. `additionalProperties: false` with an undeclared field fails the call, and the model only sees an error.

Check both: the schema subset, and one real `execute()` result against that schema.

Verified by: `shape_capabilities` returning `catalog.entries` while its schema declared only four catalog keys — every call failed until `entries` was declared.

## Required rows in the preset

- `skill-filesystem` provides the `skills` service. Drop it and the shape skill row cannot inject, the preset is marked broken, and it disappears from the picker.
- A row that cannot resolve its module fails the same way. Keep every `name` resolvable from the profile that installs the package.
- `dsh.profile.bundles` only applies the package's `cordis.patch.yml`; it does **not** load the package. The patch must insert the plugin row itself.

## Scope the file tools

Prefer one parameter that names the subject (`shape`) plus a path relative to it over one root-wide path. It keeps the blast radius obvious to the model and makes traversal checks trivial:

```js
shape_read({ shape: 'hello', path: 'views/index.html' })
```

Reject absolute paths, `..`, and ids that are not kebab-case before touching the filesystem.
