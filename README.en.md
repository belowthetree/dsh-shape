# dsh-shape

[English](README.en.md) | [中文](README.md)

dsh-shape is a DeepSeek Harness plugin that extends DSH's UI, chat cards, and workspace shortcuts through shape folders.

## What it can do

- **Shape browser**: open an app grid from the conversation header and browse every shape; press `Ctrl + .` to open it quickly
- **Dedicated views**: click a shape card to show that shape's own interface in a second window
- **Chat cards**: inject shape-provided cards above the chat composer, with buttons that reveal greetings or prompts
- **Per-shape switches**: enable or disable each shape independently; turning one off also disables its view, chat cards, and client logic
- **Client behavior**: shapes can register page-level behavior and shortcuts, and read only the capability APIs they declare
- **Workspace switching**: built-in previous/next workspace shortcuts, `Ctrl + Alt + ←` and `Ctrl + Alt + →`
- **Capability requirements**: shapes declare required plugin capabilities and versions; missing dependencies prevent startup and hide their chat cards
- **Instant updates**: add or edit a shape folder and refresh; no DSH restart is needed

## Shape Studio preset

Installation adds the **Shape Studio** preset for developing shapes and extension plugins:

- Tools to list, inspect, scaffold, and validate shapes
- A shape-development skill
- Cordis inspection, plugin installation/management, and the plugin market
- Skills for plugin development and preset editing

These tools and skills are visible only in Shape Studio; other presets never see them.

## Install

- CLI: `dsh plugin --profile <profile> add github:belowthetree/dsh-shape`
- Local development: `dsh plugin --profile <profile> add link:/path/to/dsh-shape`
- Or install the GitHub repository `belowthetree/dsh-shape` from DSH's plugin manager

Restart the target DSH profile after installation. Requires DSH `>= 0.2.2-rc.1`.

After startup, click **Shapes** in the conversation header or press `Ctrl + .`.
