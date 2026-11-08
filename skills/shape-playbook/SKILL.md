# Shape playbook

Proven ways to build a `dsh-shape` shape, plus the traps that cost time on the way. `shape-development` documents the contract; this skill records **what actually worked** when the contract met a running Host.

Every entry here was verified end to end in a real app. Anything unverified does not belong in this skill.

## Index

The Shape Studio preset cannot read this package, so each document is also a `shape_spec` topic:

| Document | `shape_spec` topic | Read it when |
| --- | --- | --- |
| [workflows.md](reference/workflows.md) | `playbook-workflows` | You are starting a shape from scratch, or building one of the known kinds (find bar, switcher, card, panel, stored state) |
| [rendering.md](reference/rendering.md) | `playbook-rendering` | UI never appears, disappears on a session switch, or nothing from the shape works at all |
| [keyboard.md](reference/keyboard.md) | `playbook-keyboard` | You need `Ctrl+F`, `F3`, `Esc`, `Ctrl+Tab`, or any single-modifier combination |
| [transcript.md](reference/transcript.md) | `playbook-transcript` | You search, expand, scroll to, or highlight conversation content |
| [tooling.md](reference/tooling.md) | `playbook-tooling` | You write tools for the preset, or a preset vanished from the picker |

`shape_spec` with topic `playbook` returns this page.

## The five rules that cover most failures

1. **Never depend on a slot rendering.** A registered slot entry can be dropped without an error. If the UI is essential, mount it on `document.body` with `position: fixed` and treat the slot as decoration.
2. **A shape's own client is the only layer you fully control.** `api.mount` and `api.shortcut` go through host registries that can silently no-op; `document.addEventListener` and `document.body.append` do not.
3. **DSH only accepts multi-modifier shortcuts on the Web host.** `Ctrl+F`, `F3`, `Esc` cannot be registered as commands there; use a document-level key listener.
4. **The transcript is DOM, not data.** Only rendered rows are searchable, collapsed blocks keep their text in the DOM but hidden, and expanding them is a click on a host button that steals focus.
5. **Verify in the running app, not in the source.** Every entry below was found by running it, and several contradict what the code reads like.

## Recording a new workflow

After a shape works end to end:

1. Write the flow into [workflows.md](reference/workflows.md) as numbered steps, with the exact paths, commands, and `data-testid` hooks you used.
2. If it needed a workaround, note the trap in the matching reference document: symptom, what the host actually does, the workaround, and how it was verified.
3. Only record what you confirmed working. A workaround nobody ran is a guess, and this skill is worthless if it carries guesses.
