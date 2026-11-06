# Capabilities

A capability is a versioned API that a Client plugin provides to shapes. Shapes declare requirements; dsh-shape resolves them before startup.

## Provider contract

A provider is a DSH Client plugin with:

- `inject`: includes `shapeCapabilities`.
- `ctx.shapeCapabilities.provide({ plugin, capability, version, api })` inside a `ctx.effect`.
- `plugin` and `capability`: non-empty strings.
- `version`: valid semver contract version, independent of the provider package version.
- `api`: the object passed to shapes.

One provider may own one `plugin#capability`. A duplicate registration throws. The disposer removes the capability.

```ts
export const inject = ['shapeCapabilities']

export function apply(ctx) {
  ctx.effect(() => ctx.shapeCapabilities.provide({
    plugin: 'my-plugin',
    capability: 'workspace',
    version: '1.0.0',
    api: {
      list: () => [],
      open: id => {},
    },
  }), 'my-plugin: workspace capability')
}
```

## Shape declaration

Requirements live in `package.json` under `shape.requires`, using `plugin`, `capability`, `version`, and optional `optional: true`. They are matched with `semver.satisfies(..., { includePrerelease: true })`.

## Resolution

- Missing required capability: blocked; card shows the missing qualified id and range; chat cards are suppressed; client module is not imported.
- Existing provider with a non-satisfying version: blocked; the message includes the found version.
- Invalid range: blocked.
- Optional missing capability: not blocked; absent from `api.capabilities`.
- `api.require(plugin, capability)` throws if the shape did not declare that capability.

## Built-ins

- `dsh-shape#core` version `1.0.0`; field `apiVersion: 1`.
- `dsh-shape#workspace` version `1.0.0`; methods `list`, `current`, `next`, `previous`.

`shape_capabilities` lists providers with qualified id, contract version, method names, and non-function field types. It is a catalog, not a signature reference; inspect provider source or use `cordis` for exact service behavior.

The catalog is mirrored from the Client registry to the Host. External providers appear after registration.
