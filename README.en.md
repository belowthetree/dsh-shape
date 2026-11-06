# dsh-shape

[English](README.en.md) | [中文](README.md)

dsh-shape lets you customize DeepSeek Harness features quickly. A shape is a folder that can carry its own view, chat card, and tool entry. Drop it under `shapes/`, refresh the Shape browser, and it takes effect without restarting DSH.

## Features

- Open the **Shapes** browser from the conversation header and see every shape in an app grid
- `Ctrl + .` opens it from anywhere
- Click a shape card to show its `views/` interface in a second window
- Inject cards above the chat composer through `slots/*.json`
- Each shape has a persisted switch; turning it off disables its interfaces, chat cards, and logic
- Add or edit a shape folder, refresh, and it applies without restarting DSH

## Shape folder

```text
shapes/greeting/
  package.json
  views/index.html
  slots/chat-card.json
  tools/greet.js
```

`package.json` currently reads `name` (shape id), `version`, `title`, `description`, `input`, and `output`.

Scan roots:

- the plugin's bundled `shapes/`
- `$DSH_HOME/dsh-shape/shapes/`

## Chat cards

A `slots/*.json` file can declare a card:

```json
{
  "slot": "conversation.input.dock",
  "title": "A card from Greeting Shape",
  "text": "This card is injected above the chat composer by a shape.",
  "button": "Say hello",
  "greeting": "Hello! 👋 This greeting comes from Greeting Shape."
}
```

`conversation.input.dock` is the supported slot today. The card appears above the composer, and the button reveals its `greeting` text.

## Switch

The switch in each card's top-right corner controls all interfaces and logic for that shape:

- Turning it off immediately hides its chat cards
- Its view can no longer be opened from the card, and the view route returns 404
- The state is stored in `$DSH_HOME/dsh-shape/state.json` and survives restarts
- Host API: `POST /dsh-shape/api/toggle` with `{ "id": "greeting", "enabled": false }`

## Instant updates

Shape folder changes do not require a DSH restart:

- New shape: put it under `shapes/` and refresh once
- Edited `slots/*.json`: chat cards update after refresh
- Edited `views/`: the next view open reads the new content
- Switch state: applied immediately and persisted

> Changing dsh-shape's own Host or Client code still requires rebuilding and restarting DSH.

## Install

```sh
dsh plugin --profile <profile> add link:E:/Project/dsh-plugins/dsh-shape
```

Start the profile and click **Shapes** in the conversation header. The plugin requires `dsh >= 0.2.2-rc.1`.

Test profile: `dsh-shape-test`, port 3904.

## Current scope

- `tools/` is registered but not executed
- Only `conversation.input.dock` slot cards are implemented
- Views run in a sandboxed iframe

## Development

- `index.js`: Host entry for scanning shape folders, parsing slot descriptors, the API, and view routes
- `client.js`: Client entry for the header button, Shape browser, view window, and chat cards
- `src/`: original TypeScript source

`index.js` and `client.js` are prebuilt artifacts. There is no standalone local build script yet; regenerate these two entrypoints after changing the source.
