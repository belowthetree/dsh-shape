/**
 * Workspace Tab Switch shape.
 *
 * Hold Ctrl and tap Tab (or Ctrl+Alt+ArrowRight / Ctrl+Alt+ArrowLeft in a
 * browser, which reserves Ctrl+Tab for its own tab strip): a switcher panel
 * appears over the app showing the neighbouring workspaces as mini windows, the
 * highlighted card grows, and releasing Ctrl lands on it. Escape cancels,
 * arrows move, Enter or a click switches immediately.
 *
 * Triggers are wired twice on purpose:
 *
 * - `dsh-shape#shortcuts` registers `Ctrl+Tab` / `Ctrl+Shift+Tab` as real DSH
 *   commands, so they show up in Settings and can be rebound. They are declared
 *   with `regions: ['page', 'editable']` because a command does not fire while
 *   the composer has focus by default, which is exactly where a user presses a
 *   tab-switcher key. The Web host refuses single-modifier defaults, so there
 *   the command exists unbound and this layer stays silent.
 * - A document capture listener owns the same combination as its primary path
 *   and adds `Ctrl+Alt+→`, which is what a browser tab actually delivers.
 *   Both layers can fire for one press, so `trigger()` de-duplicates them.
 *
 * The panel is parked directly on document.body: an essential surface cannot
 * rely on a slot rendering, and a fixed body mount looks exactly like an
 * overlay. Everything here is owned by this module and removed by the returned
 * cleanup.
 */

import { actions } from './actions.js'

const SPAN = 2
const CARD_COUNT = SPAN * 2 + 1
const TRIGGER_DEDUPE_MS = 130
/** Cards travel to their new slot; the entering card fades in from its side. */
const STEP_SLIDE_MS = 190
const STEP_ENTER_MS = 210
const WATCHDOG_MS = 10000
const COMMIT_SETTLE_MS = 190
const TOAST_MS = 1600
const FALLBACK_MS = 1500
const STYLE_ID = 'workspace-tab-switch-style'

const ARROW_STEP = {
  ArrowRight: 1,
  ArrowDown: 1,
  ArrowLeft: -1,
  ArrowUp: -1,
}

const CSS = `
.wts-root {
  position: fixed;
  inset: 0;
  z-index: 2147483000;
  display: none;
  align-items: center;
  justify-content: center;
  padding: 28px;
  pointer-events: none;
  color: var(--wts-ink);
  font: 13px/1.5 system-ui, -apple-system, "Segoe UI", "Microsoft YaHei", sans-serif;
  -webkit-font-smoothing: antialiased;
}
.wts-root[data-phase="pre"],
.wts-root[data-phase="open"],
.wts-root[data-phase="closing"],
.wts-root[data-phase="toast"] { display: flex; }

.wts-root[data-theme="dark"] {
  color-scheme: dark;
  --wts-plate: rgba(23, 25, 31, .88);
  --wts-line: rgba(255, 255, 255, .10);
  --wts-ink: #eef1f6;
  --wts-ink-dim: rgba(233, 238, 246, .58);
  --wts-card: rgba(255, 255, 255, .045);
  --wts-card-line: rgba(255, 255, 255, .09);
  --wts-card-ink: rgba(236, 241, 249, .92);
  --wts-scrim: rgba(5, 7, 11, .52);
  --wts-accent: #7aa7ff;
  --wts-accent-soft: rgba(122, 167, 255, .18);
  --wts-shadow: 0 34px 80px rgba(0, 0, 0, .58), 0 3px 10px rgba(0, 0, 0, .42);
}
.wts-root[data-theme="light"] {
  color-scheme: light;
  --wts-plate: rgba(251, 252, 254, .92);
  --wts-line: rgba(15, 23, 42, .09);
  --wts-ink: #111827;
  --wts-ink-dim: rgba(17, 24, 39, .56);
  --wts-card: #ffffff;
  --wts-card-line: rgba(15, 23, 42, .09);
  --wts-card-ink: #1f2937;
  --wts-scrim: rgba(15, 23, 42, .26);
  --wts-accent: #3b6ff5;
  --wts-accent-soft: rgba(59, 111, 245, .12);
  --wts-shadow: 0 30px 70px rgba(15, 23, 42, .20), 0 2px 6px rgba(15, 23, 42, .10);
}

.wts-scrim {
  position: fixed;
  inset: 0;
  background: var(--wts-scrim);
  opacity: 0;
  transition: opacity .16s ease;
  backdrop-filter: blur(3px);
  -webkit-backdrop-filter: blur(3px);
}
.wts-root[data-phase="open"] .wts-scrim { opacity: 1; pointer-events: auto; }
.wts-root[data-phase="closing"] .wts-scrim { opacity: 0; transition-duration: .2s; }
.wts-root[data-phase="toast"] .wts-scrim,
.wts-root[data-phase="toast"] .wts-plate { display: none; }

.wts-plate {
  position: relative;
  display: block;
  width: min(880px, 94vw);
  max-height: calc(100vh - 56px);
  overflow: hidden auto;
  box-sizing: border-box;
  padding: 20px 24px 15px;
  border: 1px solid var(--wts-line);
  border-radius: 18px;
  background: var(--wts-plate);
  box-shadow: var(--wts-shadow);
  backdrop-filter: blur(22px) saturate(150%);
  -webkit-backdrop-filter: blur(22px) saturate(150%);
  opacity: 0;
  transform: scale(.94) translateY(14px);
  transition: opacity .16s ease, transform .2s cubic-bezier(.2, .9, .25, 1.08);
  pointer-events: auto;
}
.wts-root[data-phase="open"] .wts-plate { opacity: 1; transform: none; }
.wts-root[data-phase="closing"] .wts-plate {
  opacity: 0;
  transform: scale(.985) translateY(-8px);
  transition-duration: .18s;
}

.wts-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.wts-kicker {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-size: 10.5px;
  font-weight: 600;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: var(--wts-ink-dim);
}
.wts-kicker-dot { width: 16px; height: 2px; border-radius: 2px; background: var(--wts-accent); }
.wts-index { font-size: 11.5px; font-variant-numeric: tabular-nums; color: var(--wts-ink-dim); }

.wts-title {
  margin: 8px 0 4px;
  font-size: 21px;
  font-weight: 650;
  line-height: 1.25;
  letter-spacing: -.01em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wts-sub {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 20px;
  margin-bottom: 4px;
  color: var(--wts-ink-dim);
  font-size: 12px;
}
.wts-from { max-width: 58%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.wts-dir {
  flex: none;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--wts-accent-soft);
  color: var(--wts-ink);
  font-size: 11px;
  white-space: nowrap;
}
.wts-dir[data-kind="same"] { background: rgba(127, 127, 127, .14); color: var(--wts-ink-dim); }

.wts-strip-wrap { display: flex; align-items: center; justify-content: center; gap: 10px; }
.wts-strip {
  display: flex;
  flex: 0 1 auto;
  align-items: flex-end;
  justify-content: center;
  gap: 12px;
  padding: 18px 2px 4px;
  --wts-card-w: 148px;
}
.wts-ghost { flex: none; color: var(--wts-ink-dim); font-size: 17px; letter-spacing: 1px; opacity: .5; }

.wts-card {
  flex: 0 0 var(--wts-card-w);
  width: var(--wts-card-w);
  display: flex;
  flex-direction: column;
  padding: 0;
  border: 0;
  background: none;
  color: var(--wts-card-ink);
  font: inherit;
  text-align: left;
  cursor: pointer;
  transform-origin: bottom center;
  opacity: .74;
  transform: translateY(0) scale(1);
  transition: transform .18s cubic-bezier(.22, .9, .3, 1.25), opacity .16s ease;
  -webkit-tap-highlight-color: transparent;
}
.wts-card:focus { outline: none; }
.wts-card:hover { opacity: .95; }
.wts-card[data-state="current"] { opacity: .92; }
.wts-card[data-state="selected"] { opacity: 1; transform: translateY(-12px) scale(1.06); z-index: 2; }

.wts-inner {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--wts-card-line);
  border-radius: 11px;
  overflow: hidden;
  background: var(--wts-card);
  box-shadow: 0 6px 16px rgba(0, 0, 0, .12);
  transition: border-color .18s ease, box-shadow .2s ease, background .18s ease;
}
.wts-card[data-state="selected"] .wts-inner {
  border-color: var(--wts-accent);
  background: var(--wts-plate);
  box-shadow: 0 0 0 1.5px var(--wts-accent), 0 18px 34px -14px var(--wts-accent), 0 10px 22px rgba(0, 0, 0, .18);
}

.wts-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  height: 22px;
  padding: 0 8px;
  background: rgba(127, 127, 127, .10);
}
.wts-dots { display: flex; align-items: center; gap: 4px; }
.wts-dot { width: 5px; height: 5px; border-radius: 50%; background: currentColor; opacity: .3; }
.wts-chip {
  padding: 2px 6px;
  border-radius: 999px;
  background: rgba(127, 127, 127, .18);
  color: var(--wts-ink-dim);
  font-size: 9.5px;
  line-height: 1;
  white-space: nowrap;
}
.wts-chip[data-kind="selected"] { background: var(--wts-accent); color: #fff; }

.wts-screen {
  position: relative;
  display: block;
  height: 76px;
  padding: 10px;
  overflow: hidden;
  background: linear-gradient(180deg, rgba(127, 127, 127, .10), rgba(127, 127, 127, .02));
}
.wts-glyph {
  position: absolute;
  right: 7px;
  bottom: 1px;
  max-width: 90%;
  overflow: hidden;
  color: var(--wts-accent);
  font-size: 34px;
  font-weight: 700;
  line-height: 1;
  letter-spacing: -.04em;
  opacity: .22;
}
.wts-lines { position: relative; display: flex; flex-direction: column; gap: 7px; }
.wts-line { display: block; height: 6px; border-radius: 3px; background: currentColor; opacity: .14; }
.wts-card[data-state="selected"] .wts-line { opacity: .22; }
.wts-card[data-state="selected"] .wts-glyph { opacity: .34; }

.wts-name {
  display: block;
  padding: 7px 2px 0;
  color: var(--wts-card-ink);
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
  text-align: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.wts-card[data-state="selected"] .wts-name { color: var(--wts-ink); }

.wts-foot {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px 16px;
  margin-top: 12px;
  padding-top: 11px;
  border-top: 1px solid var(--wts-line);
  color: var(--wts-ink-dim);
  font-size: 11.5px;
}
.wts-hint { display: inline-flex; align-items: center; gap: 5px; }
.wts-foot kbd {
  font: inherit;
  font-size: 10.5px;
  line-height: 1.5;
  padding: 0 5px;
  border: 1px solid var(--wts-line);
  border-bottom-width: 2px;
  border-radius: 5px;
  background: rgba(127, 127, 127, .12);
  color: var(--wts-ink);
}

.wts-toast {
  position: fixed;
  left: 50%;
  top: 14vh;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 15px;
  border: 1px solid var(--wts-line);
  border-radius: 999px;
  background: var(--wts-plate);
  box-shadow: var(--wts-shadow);
  color: var(--wts-ink);
  font-size: 12.5px;
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, -8px) scale(.98);
  transition: opacity .16s ease, transform .2s cubic-bezier(.2, .9, .3, 1.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
}
.wts-root[data-phase="toast"] .wts-toast { opacity: 1; transform: translate(-50%, 0) scale(1); }
.wts-toast-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--wts-accent); }
.wts-toast[data-tone="muted"] .wts-toast-dot { background: var(--wts-ink-dim); }
.wts-toast[data-tone="warn"] .wts-toast-dot { background: #f59e0b; }

.wts-flash {
  position: fixed;
  inset: 0;
  opacity: 0;
  pointer-events: none;
  background: radial-gradient(58% 58% at 50% 52%, rgba(255, 255, 255, .5), rgba(255, 255, 255, 0) 72%);
}

.is-off { display: none !important; }

.wts-trigger {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  margin: 0 2px;
  padding: 2px 8px;
  border: 1px solid rgba(127, 127, 127, .32);
  border-radius: 7px;
  background: rgba(127, 127, 127, .10);
  color: inherit;
  font: inherit;
  font-size: 11.5px;
  line-height: 1.5;
  cursor: pointer;
  opacity: .82;
}
.wts-trigger:hover { opacity: 1; background: rgba(127, 127, 127, .18); }
.wts-trigger-glyph { font-size: 12px; opacity: .8; }

.wts-fallback {
  position: fixed;
  right: 18px;
  bottom: 18px;
  z-index: 2147482900;
  display: flex;
  align-items: center;
}

@media (max-width: 760px) {
  .wts-strip { --wts-card-w: 112px; gap: 9px; }
  .wts-plate { padding: 16px 16px 12px; }
  .wts-title { font-size: 18px; }
  .wts-ghost { font-size: 14px; }
}

@media (prefers-reduced-motion: reduce) {
  .wts-plate,
  .wts-card,
  .wts-card .wts-inner,
  .wts-scrim,
  .wts-toast { transition: none !important; }
}
`

/**
 * Build one element.
 * @param tag - element name.
 * @param className - class attribute, may be empty.
 * @param text - text content, may be omitted.
 * @returns the element.
 */
const el = (tag, className, text) => {
  const node = document.createElement(tag)
  if (className !== undefined && className !== '') node.className = className
  if (text !== undefined) node.textContent = text
  return node
}

/**
 * Read the alpha-aware luminance of a computed colour.
 * @param color - computed colour string.
 * @returns 0..1, or null when the colour is transparent or unparsable.
 */
const luminanceOf = (color) => {
  const match = /rgba?\(([^)]+)\)/u.exec(typeof color === 'string' ? color : '')
  if (match === null) return null
  const parts = match[1].split(/[\s,/]+/u).filter((part) => part !== '').map(Number)
  if (parts.length < 3 || parts.slice(0, 3).some((value) => !Number.isFinite(value))) return null
  if (parts.length >= 4 && Number.isFinite(parts[3]) && parts[3] < 0.4) return null
  const [red, green, blue] = parts
  return (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
}

/**
 * Decide whether the app is currently light or dark without depending on a
 * theme API: the body background wins, then the root background, then the text
 * colour (light text means a dark theme), then the OS preference.
 * @returns 'light' or 'dark'.
 */
const resolveTheme = () => {
  for (const node of [document.body, document.documentElement]) {
    if (node === null || node === undefined) continue
    const luminance = luminanceOf(getComputedStyle(node).backgroundColor)
    if (luminance !== null) return luminance > 0.55 ? 'light' : 'dark'
  }
  for (const node of [document.body, document.documentElement]) {
    if (node === null || node === undefined) continue
    const luminance = luminanceOf(getComputedStyle(node).color)
    if (luminance !== null) return luminance > 0.6 ? 'dark' : 'light'
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches === true ? 'dark' : 'light'
}

/**
 * Register the switcher.
 * @param api - shape client API.
 * @returns disposer.
 */
export function activate(api) {
  const workspace = api.require('dsh-shape', 'workspace')

  let ui = null
  try {
    ui = api.require('dsh-shape', 'ui')
  } catch {
    // Without it a distant card can only be reached by stepping there, which
    // still works; the panel itself is unaffected.
    ui = null
  }

  let shortcuts = null
  try {
    shortcuts = api.require('dsh-shape', 'shortcuts')
  } catch (cause) {
    console.warn('[workspace-tab-switch] shortcuts capability unavailable', cause)
  }

  const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches === true

  let phase = 'idle'
  let state = null
  let lastTriggerAt = 0
  let lastTriggerSign = 0
  let closeTimer = 0
  let toastTimer = 0
  let watchdogTimer = 0

  // ---- structure -----------------------------------------------------------

  const style = el('style')
  style.id = STYLE_ID
  style.textContent = CSS

  const root = el('div', 'wts-root')
  root.setAttribute('data-phase', 'idle')
  root.setAttribute('data-theme', 'dark')
  root.setAttribute('aria-hidden', 'true')
  root.setAttribute('data-testid', 'workspace-tab-switch')

  const scrim = el('div', 'wts-scrim')

  const plate = el('div', 'wts-plate')
  const head = el('div', 'wts-head')
  const kicker = el('span', 'wts-kicker')
  kicker.append(el('span', 'wts-kicker-dot'), el('span', 'wts-kicker-text', '切换工作区'))
  const counter = el('span', 'wts-index')
  head.append(kicker, counter)

  const title = el('div', 'wts-title')
  const sub = el('div', 'wts-sub')
  const fromLabel = el('span', 'wts-from')
  const dirLabel = el('span', 'wts-dir')
  sub.append(fromLabel, dirLabel)

  const stripWrap = el('div', 'wts-strip-wrap')
  const ghostBefore = el('span', 'wts-ghost', '⋯')
  const ghostAfter = el('span', 'wts-ghost', '⋯')
  const strip = el('div', 'wts-strip')
  stripWrap.append(ghostBefore, strip, ghostAfter)

  const foot = el('div', 'wts-foot')
  const hint = (keys, text) => {
    const wrap = el('span', 'wts-hint')
    for (const key of keys) wrap.append(el('kbd', '', key))
    wrap.append(el('span', 'wts-hint-text', text))
    return wrap
  }
  foot.append(
    hint(['Ctrl'], '松开即切换'),
    hint(['⇧'], '反向'),
    hint(['←', '→'], '选择'),
    hint(['Esc'], '取消'),
  )

  plate.append(head, title, sub, stripWrap, foot)

  const cards = Array.from({ length: CARD_COUNT }, () => {
    const button = el('button', 'wts-card')
    button.type = 'button'
    button.setAttribute('data-state', 'rest')

    const inner = el('span', 'wts-inner')
    const bar = el('span', 'wts-bar')
    const dots = el('span', 'wts-dots')
    for (let index = 0; index < 3; index += 1) dots.append(el('i', 'wts-dot'))
    const chip = el('span', 'wts-chip is-off')
    bar.append(dots, chip)

    const screen = el('span', 'wts-screen')
    const glyph = el('span', 'wts-glyph')
    const lines = el('span', 'wts-lines')
    const rows = [el('i', 'wts-line'), el('i', 'wts-line'), el('i', 'wts-line')]
    for (const row of rows) lines.append(row)
    screen.append(glyph, lines)
    inner.append(bar, screen)

    const name = el('span', 'wts-name')
    button.append(inner, name)
    strip.append(button)

    return { button, inner, chip, glyph, rows, name }
  })

  const flash = el('div', 'wts-flash')
  const toast = el('div', 'wts-toast')
  const toastText = el('span', 'wts-toast-text')
  toast.setAttribute('role', 'status')
  toast.append(el('span', 'wts-toast-dot'), toastText)

  root.append(scrim, plate, flash, toast)

  const triggerButton = el('button', 'wts-trigger')
  triggerButton.type = 'button'
  triggerButton.title = '切换工作区 (Ctrl+Tab，或 Ctrl+Alt+→)'
  triggerButton.append(el('span', 'wts-trigger-glyph', '⇥'), el('span', 'wts-trigger-text', '切换'))
  triggerButton.setAttribute('data-testid', 'workspace-tab-switch-trigger')

  document.head.append(style)
  document.body.append(root)

  // ---- rendering -----------------------------------------------------------

  /**
   * Paint the panel from the current state.
   * @param options.direction - ±1 to animate the strip in that direction.
   * @param options.animate - whether motion is allowed for this paint.
   */
  const render = (options = {}) => {
    if (state === null) return
    const { direction = 0, animate = true } = options
    const plan = actions.strip(state.list.length, state.selected, SPAN)
    const info = actions.describe(state.list, state.currentId, state.selected)
    const hue = actions.accentHue(info.selectedId ?? '')
    plate.style.setProperty('--wts-accent', `hsl(${String(hue)}, 72%, 56%)`)
    plate.style.setProperty('--wts-accent-soft', `hsla(${String(hue)}, 72%, 56%, .18)`)

    title.textContent = info.total === 0 ? '没有可切换的工作区' : info.selectedTitle
    counter.textContent = `${String(info.position)} / ${String(info.total)}`
    fromLabel.textContent = info.currentTitle === ''
      ? ''
      : info.same && info.total > 1
        ? `当前就是「${info.currentTitle}」`
        : `当前在「${info.currentTitle}」`
    fromLabel.classList.toggle('is-off', fromLabel.textContent === '')
    dirLabel.textContent = info.directionText
    dirLabel.setAttribute('data-kind', info.delta === 0 ? 'same' : info.delta > 0 ? 'next' : 'prev')
    root.setAttribute('aria-label', `切换工作区，当前高亮「${info.selectedTitle}」`)

    const hidden = plan.hidden > 0
    ghostBefore.classList.toggle('is-off', !hidden)
    ghostAfter.classList.toggle('is-off', !hidden)
    ghostBefore.title = `另有 ${String(plan.hidden)} 个工作区`
    ghostAfter.title = ghostBefore.title

    cards.forEach((card, slot) => {
      const item = plan.items[slot]
      if (item === undefined) {
        card.button.classList.add('is-off')
        delete card.button.dataset.index
        return
      }
      const entry = state.list[item.index]
      const isSelected = item.index === state.selected
      const isCurrent = entry.id === state.currentId
      card.button.classList.remove('is-off')
      card.button.dataset.index = String(item.index)
      card.button.dataset.state = isSelected ? 'selected' : isCurrent ? 'current' : 'rest'
      card.button.style.setProperty('--wts-accent', `hsl(${String(actions.accentHue(entry.id))}, 72%, 56%)`)
      card.button.setAttribute('aria-selected', isSelected ? 'true' : 'false')
      card.button.title = isSelected ? `切换到「${entry.title}」` : entry.title
      card.glyph.textContent = actions.monogram(entry.title)
      card.name.textContent = entry.title
      card.chip.textContent = isSelected ? '切换' : isCurrent ? '当前' : ''
      card.chip.classList.toggle('is-off', !(isSelected || isCurrent))
      card.chip.setAttribute('data-kind', isSelected ? 'selected' : 'current')
      const widths = actions.skeletonRows(entry.id)
      card.rows.forEach((row, index) => row.style.setProperty('width', `${String(widths[index])}%`))
      if (animate && !reduced()) {
        card.inner.animate(
          [
            { opacity: 0.25, transform: 'translateY(5px) scale(.985)' },
            { opacity: 1, transform: 'none' },
          ],
          { duration: 170, delay: Math.abs(slot - SPAN) * 8, easing: 'cubic-bezier(.22, .8, .3, 1)' },
        )
      }
    })

    if (animate && direction !== 0 && !reduced()) {
      const from = direction > 0 ? 18 : -18
      strip.animate(
        [{ transform: `translateX(${String(from)}px)`, opacity: 0.55 }, { transform: 'none', opacity: 1 }],
        { duration: 180, easing: 'cubic-bezier(.2, .8, .3, 1)' },
      )
    }
  }

  // ---- phase ---------------------------------------------------------------

  const setPhase = (next) => {
    phase = next
    root.setAttribute('data-phase', next)
    root.setAttribute('aria-hidden', next === 'open' || next === 'toast' ? 'false' : 'true')
    // The panel stays in the document for the whole session so its transitions can
    // run, but it is only a dialog while it is showing. DSH reads the last
    // `[role="dialog"][aria-modal="true"]` element as the shortcut adapter's modal
    // owner (`modalSelector` in ui-primitives); a permanently mounted one makes every
    // modal-scoped command — Ctrl+, opens Settings, Ctrl+/ the shortcut reference —
    // resolve as blocked for the rest of the session.
    if (next === 'open') {
      root.setAttribute('role', 'dialog')
      root.setAttribute('aria-modal', 'true')
    } else {
      root.removeAttribute('role')
      root.removeAttribute('aria-modal')
      root.removeAttribute('aria-label')
    }
  }

  const showToast = (text, tone = 'ok') => {
    toastText.textContent = text
    toast.setAttribute('data-tone', tone)
    root.setAttribute('data-theme', resolveTheme())
    setPhase('toast')
    window.clearTimeout(toastTimer)
    toastTimer = window.setTimeout(() => {
      if (phase === 'toast') setPhase('idle')
    }, TOAST_MS)
  }

  // ---- capabilities --------------------------------------------------------

  const readRegistry = () => {
    let raw = []
    try {
      raw = workspace.list()
    } catch (cause) {
      console.warn('[workspace-tab-switch] workspace.list() failed', cause)
    }
    let currentId = null
    try {
      currentId = workspace.current()
    } catch (cause) {
      console.warn('[workspace-tab-switch] workspace.current() failed', cause)
    }
    const list = actions.normalize(raw)
    if (typeof currentId !== 'string' || actions.indexOf(list, currentId) < 0) {
      currentId = list.length > 0 ? list[0].id : null
    }
    return { list, currentId }
  }

  /**
   * Run one navigation call, containing both a throw and a rejected promise.
   * @param run - call to perform.
   * @returns whether the call was accepted.
   */
  const attempt = (run) => {
    try {
      const result = run()
      if (result !== null && typeof result === 'object' && typeof result.then === 'function') {
        result.then(undefined, (cause) => {
          console.warn('[workspace-tab-switch] navigation failed', cause)
        })
      }
      return true
    } catch (cause) {
      console.warn('[workspace-tab-switch] navigation failed', cause)
      return false
    }
  }

  /**
   * Land on one workspace. A single step uses the capability's own navigation
   * (it also expands the sidebar group); a jump asks the UI capability to open
   * the target directly, and only falls back to stepping when that is missing.
   * @param list - registry snapshot.
   * @param currentId - active workspace at open time.
   * @param target - workspace to land on.
   * @returns whether the navigation was accepted.
   */
  const switchTo = (list, currentId, target) => {
    const fromIndex = actions.indexOf(list, currentId)
    const toIndex = actions.indexOf(list, target.id)
    const delta = fromIndex < 0 || toIndex < 0 ? 0 : actions.shortestDelta(fromIndex, toIndex, list.length)
    if (delta === 0) return false
    if (Math.abs(delta) === 1) {
      return attempt(() => (delta > 0 ? workspace.next() : workspace.previous()))
    }
    if (ui !== null && typeof ui.openWorkspace === 'function') {
      if (attempt(() => ui.openWorkspace(target.id))) return true
    }
    const step = delta > 0 ? 'next' : 'previous'
    let moved = true
    for (let index = 0; index < Math.abs(delta) && moved; index += 1) {
      moved = attempt(() => workspace[step]())
    }
    return moved
  }

  // ---- lifecycle -----------------------------------------------------------

  const commit = () => {
    if (phase !== 'open' || state === null) return
    const { list, currentId, selected } = state
    const target = list[selected] ?? null
    const same = target === null || target.id === currentId
    window.clearTimeout(watchdogTimer)
    state = null
    setPhase('closing')
    let landed = false
    if (!same && target !== null) landed = switchTo(list, currentId, target)
    if (!reduced()) {
      flash.animate(
        [
          { opacity: 0, transform: 'scale(.82)' },
          { opacity: same ? 0.22 : 0.82, transform: 'scale(1.02)', offset: 0.28 },
          { opacity: 0, transform: 'scale(1.36)' },
        ],
        { duration: same ? 240 : 430, easing: 'cubic-bezier(.2, .7, .3, 1)' },
      )
    }
    window.clearTimeout(closeTimer)
    closeTimer = window.setTimeout(() => {
      if (same) showToast('已经在这个工作区', 'muted')
      else if (landed) showToast(`已切换到「${target.title}」`, 'ok')
      else showToast(`无法切换到「${target.title}」`, 'warn')
    }, reduced() ? 0 : COMMIT_SETTLE_MS)
  }

  const closeModal = () => {
    window.clearTimeout(watchdogTimer)
    window.clearTimeout(closeTimer)
    state = null
    if (phase !== 'open') return
    setPhase('closing')
    closeTimer = window.setTimeout(() => {
      if (phase === 'closing') setPhase('idle')
    }, reduced() ? 0 : COMMIT_SETTLE_MS)
  }

  const armWatchdog = () => {
    window.clearTimeout(watchdogTimer)
    watchdogTimer = window.setTimeout(() => {
      // Nobody is holding a key any more, so the panel must not stay in front
      // of the app; land the same way a key release would.
      if (phase !== 'open' || state === null) return
      if (state.fromKeyboard) commit()
      else closeModal()
    }, WATCHDOG_MS)
  }

  const openModal = (options = {}) => {
    const { delta = 1, fromKeyboard = true } = options
    const registry = readRegistry()
    if (registry.list.length === 0) {
      showToast('没有找到可切换的工作区', 'warn')
      return
    }
    window.clearTimeout(toastTimer)
    window.clearTimeout(closeTimer)
    const base = Math.max(0, actions.indexOf(registry.list, registry.currentId))
    const selected = registry.list.length <= 1 ? base : actions.wrap(base + delta, registry.list.length)
    state = { ...registry, selected, fromKeyboard }
    root.setAttribute('data-theme', resolveTheme())
    render({ direction: 0, animate: false })
    // The panel needs a laid-out "before" state, or a display:none element
    // would skip its enter transition.
    setPhase('pre')
    void root.offsetWidth
    setPhase('open')
    armWatchdog()
  }

  /** Identifies the newest step; an older slide must not paint over it. */
  let stepToken = 0

  /**
   * Where each currently rendered entry sits, keyed by its list index.
   * `offsetLeft` ignores in-flight transforms, so measuring during an animation
   * still reports the resting slot.
   * @returns map of entry index to its layout position.
   */
  const measureCards = () => {
    const positions = new Map()
    for (const card of cards) {
      const index = card.button.dataset.index
      if (index === undefined) continue
      positions.set(Number(index), card.button.offsetLeft)
    }
    return positions
  }

  /**
   * Step one entry and slide the cards into their new slots.
   *
   * The list is repainted first and each card then animates from the slot that
   * held the same entry to the slot it now occupies, so the row visibly travels
   * one card sideways while the selection lands on the neighbour. Animating the
   * strip itself would have to swap content mid-flight, which reads as a refresh
   * rather than a move.
   * @param delta - +1 next, -1 previous.
   */
  const stepSelection = (delta) => {
    if (state === null) return
    const total = state.list.length
    if (total <= 1) return
    const token = ++stepToken
    const before = reduced() || phase !== 'open' ? null : measureCards()
    // Advance the selection at once: a second press must count from the target
    // of the first, not from what is still on screen.
    state.selected = actions.wrap(state.selected + delta, total)
    render({ direction: 0, animate: before === null })
    armWatchdog()
    if (before === null || token !== stepToken) return
    const enterFrom = delta > 0 ? 26 : -26
    for (const card of cards) {
      const index = card.button.dataset.index
      if (index === undefined) continue
      const left = card.button.offsetLeft
      const from = before.get(Number(index))
      // `translate` is its own property, so the selected card keeps its scale.
      if (from === undefined) {
        card.button.animate(
          [
            { translate: `${String(enterFrom)}px`, opacity: 0 },
            { translate: '0px', opacity: 1 },
          ],
          { duration: STEP_ENTER_MS, easing: 'cubic-bezier(.22, .8, .3, 1)', fill: 'backwards' },
        )
        continue
      }
      const shift = from - left
      if (Math.abs(shift) < 1) continue
      card.button.animate(
        [
          { translate: `${String(shift)}px` },
          { translate: '0px' },
        ],
        { duration: STEP_SLIDE_MS, easing: 'cubic-bezier(.22, .8, .3, 1)' },
      )
    }
  }

  /**
   * The one entry point for every trigger, whichever layer delivered it.
   * A registered command and the document listener can both fire for a single
   * press; stepping twice per press is worse than ignoring the echo, so an echo
   * is dropped only while the panel is already open (a fresh press after a
   * commit must always open a new one).
   * @param direction - +1 forward, -1 backward.
   * @param source - where the trigger came from, for the debug log.
   */
  const trigger = (direction, source = 'key') => {
    const sign = direction > 0 ? 1 : -1
    const now = performance.now()
    if (phase === 'open' && sign === lastTriggerSign && now - lastTriggerAt < TRIGGER_DEDUPE_MS) return
    lastTriggerAt = now
    lastTriggerSign = sign
    console.debug('[workspace-tab-switch] trigger', source, sign)
    if (phase === 'open') stepSelection(sign)
    else openModal({ delta: sign, fromKeyboard: true })
  }

  // ---- registered commands -------------------------------------------------

  const commandDisposers = []

  /**
   * Register one DSH command. `regions` matters: without `editable` the
   * command is silent while the composer has focus, which is where this
   * gesture is most often used.
   * @param id - local command id.
   * @param label - Settings label.
   * @param keys - default combination.
   * @param direction - +1 forward, -1 backward.
   */
  const bindCommand = (id, label, keys, direction) => {
    if (shortcuts === null || typeof shortcuts.register !== 'function') return
    try {
      const off = shortcuts.register({
        id,
        label,
        keys,
        regions: ['page', 'editable'],
        run: () => trigger(direction, 'command'),
      })
      if (typeof off === 'function') commandDisposers.push(off)
      console.info(`[workspace-tab-switch] 命令已注册：${keys}`)
    } catch (cause) {
      // The Web host refuses single-modifier defaults; dsh-shape retries with
      // desktop-only defaults, but a genuine conflict lands here.
      console.warn(`[workspace-tab-switch] 命令 ${keys} 注册失败`, cause)
    }
  }

  bindCommand('next', '下一个工作区（切换面板）', 'Ctrl+Tab', 1)
  bindCommand('previous', '上一个工作区（切换面板）', 'Ctrl+Shift+Tab', -1)

  // Report what the shortcut registry actually kept: `keys: null` or an issue
  // means the default was dropped (the Web host does not admit single-modifier
  // combinations), which is the difference between "my code is broken" and
  // "this host never bound that key".
  if (shortcuts !== null && typeof shortcuts.list === 'function') {
    try {
      for (const row of shortcuts.list()) {
        console.info(
          `[workspace-tab-switch] 命令 ${String(row.id)} · keys=${String(row.keys)}`
          + (row.issue === undefined || row.issue === null ? '' : ` · issue=${String(row.issue)}`),
        )
      }
    } catch (cause) {
      console.warn('[workspace-tab-switch] shortcuts.list() failed', cause)
    }
  }

  // ---- input ---------------------------------------------------------------

  const onKeyDown = (event) => {
    if (event.isComposing || event.keyCode === 229) return
    const key = event.key
    const primary = event.ctrlKey || event.metaKey

    if (phase === 'open') {
      if (key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        closeModal()
        return
      }
      if (key === 'Enter') {
        event.preventDefault()
        event.stopPropagation()
        commit()
        return
      }
      if (key === 'Tab') {
        event.preventDefault()
        event.stopPropagation()
        trigger(event.shiftKey ? -1 : 1, 'key')
        return
      }
      if (ARROW_STEP[key] !== undefined) {
        event.preventDefault()
        event.stopPropagation()
        trigger(ARROW_STEP[key], 'key')
        return
      }
    }

    // Ctrl+Tab: the desktop window, and every browser that does not reserve it.
    const tabTrigger = key === 'Tab' && primary
    // Ctrl+Alt+Arrow: what a browser tab actually delivers, since Ctrl+Tab is
    // its own tab strip. Same hold-and-release gesture as Windows Alt+Tab.
    const arrowTrigger = ARROW_STEP[key] !== undefined && primary && event.altKey
    if (!tabTrigger && !arrowTrigger) return

    const direction = tabTrigger
      ? (event.shiftKey ? -1 : 1)
      : (event.shiftKey ? -ARROW_STEP[key] : ARROW_STEP[key])
    event.preventDefault()
    event.stopPropagation()
    trigger(direction, 'key')
  }

  const onKeyUp = (event) => {
    if (phase !== 'open' || state === null || !state.fromKeyboard) return
    // Releasing the primary modifier is the commit gesture. Shift and Alt are
    // ignored on purpose: Ctrl+Alt+→ is often released Alt-first.
    if (event.key === 'Control' || event.key === 'Meta') commit()
  }

  const onWindowBlur = () => {
    if (phase !== 'open' || state === null) return
    if (state.fromKeyboard) commit()
    else closeModal()
  }

  const onVisibilityChange = () => {
    if (document.visibilityState !== 'hidden') return
    if (phase !== 'open' || state === null) return
    if (state.fromKeyboard) commit()
    else closeModal()
  }

  scrim.addEventListener('click', () => {
    if (phase === 'open') closeModal()
  })

  for (const card of cards) {
    card.button.addEventListener('click', (event) => {
      event.preventDefault()
      if (phase !== 'open' || state === null) return
      const index = Number(card.button.dataset.index)
      if (!Number.isInteger(index) || index < 0 || index >= state.list.length) return
      if (state.selected !== index) {
        state.selected = index
        render({ direction: 0, animate: false })
      }
      commit()
    })
  }

  triggerButton.addEventListener('click', () => {
    if (phase === 'open') closeModal()
    else openModal({ delta: 0, fromKeyboard: false })
  })

  document.addEventListener('keydown', onKeyDown, true)
  document.addEventListener('keyup', onKeyUp, true)
  document.addEventListener('visibilitychange', onVisibilityChange)
  window.addEventListener('blur', onWindowBlur)

  // ---- entry point in the session header ----------------------------------

  let offTrigger = null
  try {
    offTrigger = api.mount('conversation.session.header.utilities', (container) => {
      container.append(triggerButton)
      return () => {
        triggerButton.remove()
      }
    })
  } catch (cause) {
    // The keys remain the primary entry point; a host without this slot simply
    // gets no chip.
    console.warn('[workspace-tab-switch] header trigger unavailable', cause)
  }

  // A host that renders the header late (or not at all) must still offer a way
  // in: park the same chip in the corner instead of shipping no entry point.
  let fallbackWrap = null
  const fallbackTimer = window.setTimeout(() => {
    if (fallbackWrap !== null || triggerButton.isConnected) return
    fallbackWrap = el('div', 'wts-fallback')
    fallbackWrap.append(triggerButton)
    document.body.append(fallbackWrap)
    console.info('[workspace-tab-switch] 会话头部入口未渲染，已把入口放到右下角')
  }, FALLBACK_MS)

  console.info('[workspace-tab-switch] 已激活', {
    commands: commandDisposers.length,
    keys: 'Ctrl+Tab / Ctrl+Shift+Tab（命令，可在设置里改键）· Ctrl+Alt+→（键盘监听）',
  })

  return () => {
    document.removeEventListener('keydown', onKeyDown, true)
    document.removeEventListener('keyup', onKeyUp, true)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    window.removeEventListener('blur', onWindowBlur)
    window.clearTimeout(closeTimer)
    window.clearTimeout(toastTimer)
    window.clearTimeout(watchdogTimer)
    window.clearTimeout(fallbackTimer)
    for (const off of commandDisposers) {
      try {
        off()
      } catch {
        // Already released by the runtime; nothing to undo.
      }
    }
    if (typeof offTrigger === 'function') offTrigger()
    state = null
    if (fallbackWrap !== null) fallbackWrap.remove()
    triggerButton.remove()
    root.remove()
    style.remove()
  }
}
