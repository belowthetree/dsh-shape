# Extension plugins

A shape can consume capabilities, but a new capability provider or a broader DSH feature belongs in a separate DSH plugin.

## When to create a plugin

- The shape needs a new capability API (workspace, navigation, storage, host service, and so on).
- The feature needs Host access, new tools, a settings page, or a slot beyond `conversation.input.dock`.
- The behavior should be reusable by several shapes.

## Provider plugin

A capability provider is a normal DSH Client plugin. It injects `shapeCapabilities`, calls `provide` inside `ctx.effect`, and owns a qualified capability id and contract version. See the `capabilities` topic for the exact contract.

Keep the provider in its own package. Do not add a general capability to dsh-shape itself unless it is a core dsh-shape feature.

## Procedure

1. Load the bundled `cordis-plugin-development` skill and the composition reference when editing a preset or patch.
2. Inspect live services and tool schemas with `cordis`.
3. Create or edit the plugin package.
4. Register the plugin row in the profile; use `plugin_manager` to install or manage it when available.
5. Restart DSH so the Host and Client load the plugin.
6. Declare the new capability in the shape manifest and verify it with `shape_capabilities`.
7. Test the shape with the provider present and absent; missing required capabilities must block cleanly.

## Boundaries

- The shape capability registry is a Client service; it is not automatically available as a Host service.
- `plugin_manager` and the plugin market require a profile context; they are intentionally unavailable in deployments without one.
- Shape Studio tools and skills are preset-scoped. Other presets do not see them.
- The Shapes browser itself is global UI; preset scoping covers tools and skills, not that browser.
