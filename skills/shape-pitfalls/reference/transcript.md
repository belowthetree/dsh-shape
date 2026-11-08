# Transcript: searching, expanding, and highlighting conversation content

## `conversation.find` only sees rendered rows

`dsh-shape#conversation` reads the DOM (`[data-chat-anchor-key]`), not the session log. Consequences:

- older turns that the transcript has not loaded cannot be found;
- a row whose text has not mounted yet is skipped, so a search fired immediately after a session opens returns `0/0`;
- hits inside a collapsed block **are** found — the text is in the DOM, just hidden.

Workaround: retry once after a short delay when the result is empty.

```js
if (hits.length === 0 && needle !== '') {
  setTimeout(() => { if (query.trim() === needle) runSearch() }, 300)
}
```

Verified by: `0/0` on the first search after opening a session, then `1/57` on the retry.

## Collapsed blocks: thinking steps are a sibling row

A hit inside "thinking" content sits in a `turn-process` row, but the toggle that hides it is a **different** row's header button:

```html
<button data-turn-process="12" aria-expanded="false">已完成，用时 27 秒</button>
```

So expanding has to reach outside the matched row:

```js
const turn = row.getAttribute('data-chat-turn') ?? row.closest('[data-chat-turn]')?.getAttribute('data-chat-turn')
document.querySelector(`button[data-turn-process="${CSS.escape(turn)}"][aria-expanded="false"]`)?.click()
```

Also click any `button[aria-expanded="false"]` inside the row itself (turn headers, groups) and any `details:not([open]) > summary`.

## Expanding steals focus

The host's toggles focus themselves when clicked:

```js
onClick={(event) => { event.currentTarget.focus(); toggle() }}   // ChatGroupSeat, TurnProcessNodeView
```

Any input you own loses the caret the moment you expand a hit. Restore it explicitly, and only when it was yours to begin with:

```js
const keepInputFocus = (mutate) => {
  const before = document.activeElement
  mutate()
  if (before === input && document.activeElement !== input) input.focus({ preventScroll: true })
}
keepInputFocus(() => expandCollapsed(row))
```

`preventScroll: true` matters: without it the focus call scrolls the hit you just centred back out of view.

Verified by: focus landing on the process toggle after each jump, and staying in the input once the guard was added.

## Highlighting

Text ranges are the reliable unit; wrapping text nodes in `<mark>` mutates the DOM the host owns.

- `CSS.highlights` with a `Highlight` object leaves the DOM untouched and survives re-renders — prefer it when available (`typeof CSS.highlights === 'object' && typeof Highlight === 'function'`);
- if you must wrap nodes, unwrap and `normalize()` on close, or the transcript accumulates empty text nodes;
- keep two highlight groups (all hits, current hit) so the active one can be styled differently;
- re-paint after expansion settles (~60 ms), because the newly revealed block needs a layout pass before its ranges exist.

## Scrolling

`scrollIntoView({ block: 'center', behavior: 'smooth' })` on the anchor row is enough. Do not scroll a container you do not own — the transcript manages its own viewport and will fight you.
