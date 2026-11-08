# Shape pitfalls

Field notes from building real shapes: the places where the host does not behave the way the reference implies, and the workarounds that hold.

This skill complements `shape-development`. That one documents the contract; this one records what actually happened when the contract met a running Host.

## Index

The Shape Studio preset cannot read this package, so every document below is also reachable as a `shape_spec` topic:

| Document | `shape_spec` topic | Read it when |
| --- | --- | --- |
| [rendering.md](reference/rendering.md) | `pitfalls-rendering` | You put UI in a slot and nothing appears, or it disappears when the header re-renders |
| [keyboard.md](reference/keyboard.md) | `pitfalls-keyboard` | You need `Ctrl+F`, `F3`, `Esc`, or any single-modifier combination |
| [transcript.md](reference/transcript.md) | `pitfalls-transcript` | You search, expand, scroll to, or highlight conversation content |
| [tooling.md](reference/tooling.md) | `pitfalls-tooling` | You write tools for the preset, or a preset vanished from the picker |

`shape_spec` with topic `pitfalls` returns this page.

## The five rules that cover most failures

1. **Never depend on a slot rendering.** A registered slot entry can be dropped without an error. If the UI is essential, mount it on `document.body` with `position: fixed` and treat the slot as decoration.
2. **A shape's own client is the only layer you fully control.** `api.mount` and `api.shortcut` go through host registries that can silently no-op; `document.addEventListener` and `document.body.append` do not.
3. **DSH only accepts multi-modifier shortcuts on the Web host.** `Ctrl+F`, `F3`, and `Esc` cannot be registered as commands there; use a document-level key listener.
4. **The transcript is DOM, not data.** Only rendered rows are searchable, collapsed blocks keep their text in the DOM but hidden, and expanding them is a click on a host button that steals focus.
5. **Verify in the running app, not in the source.** Every entry below was found by running it, and several contradict what the code reads like.

## Reporting a new pitfall

Add one document per area rather than appending to an existing file, and keep the entry to: symptom, what the host actually does, the workaround that holds, and how it was verified. A workaround that was not observed working does not belong here.
