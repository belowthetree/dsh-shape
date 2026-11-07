/** Toast layer for capability-driven notifications. */

/** Visual tone of one notification. */
export type ShapeToastTone = 'info' | 'success' | 'warn' | 'error'

/** Options for `api.require('dsh-shape', 'ui').notify()`. */
export interface ShapeToastOptions {
  /** Dot colour and emphasis; defaults to `info`. */
  tone?: ShapeToastTone
  /** Visible milliseconds before the toast fades out; defaults to 3200. */
  timeout?: number
}

const MAX_VISIBLE = 4
const DEFAULT_TIMEOUT = 3200
const CONTAINER_ID = 'dsh-shape-toasts'

const TONE_COLORS: Record<ShapeToastTone, string> = {
  info: 'var(--dsw-alias-brand-primary, #6ea6ff)',
  success: 'var(--dsw-alias-status-success, #7dd3a7)',
  warn: 'var(--dsw-alias-status-warning, #f0c36a)',
  error: 'var(--dsw-alias-status-danger, #f2707a)',
}

const CONTAINER_STYLE = [
  'position:fixed',
  'top:16px',
  'right:16px',
  'display:grid',
  'gap:8px',
  'justify-items:end',
  'max-width:min(360px, calc(100vw - 32px))',
  'z-index:2147483000',
  'pointer-events:none',
].join(';')

const TOAST_STYLE = [
  'display:flex',
  'align-items:flex-start',
  'gap:8px',
  'padding:8px 12px',
  'border-radius:10px',
  'border:1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.14))',
  'background:var(--dsw-alias-bg-layer-2, #1b1d22)',
  'color:var(--dsw-alias-label-primary, #e6edf3)',
  'font-size:12.5px',
  'line-height:1.5',
  'box-shadow:0 10px 28px rgba(0, 0, 0, 0.35)',
  'opacity:0',
  'transform:translateY(-6px)',
  'transition:opacity 160ms ease, transform 160ms ease',
].join(';')

let container: HTMLElement | null = null
const timers = new Set<ReturnType<typeof setTimeout>>()

/**
 * Show one transient notification above the application surface.
 * @param text - message body.
 * @param options - tone and visibility duration.
 */
export function showToast(text: string, options: ShapeToastOptions = {}): void {
  if (typeof document === 'undefined') return
  const host = ensureContainer()
  if (host === null) return

  while (host.childElementCount >= MAX_VISIBLE) {
    host.firstElementChild?.remove()
  }

  const tone = options.tone ?? 'info'
  const toast = document.createElement('div')
  toast.setAttribute('role', 'status')
  toast.setAttribute('data-testid', 'dsh-shape-toast')
  toast.style.cssText = TOAST_STYLE

  const dot = document.createElement('span')
  dot.setAttribute('aria-hidden', 'true')
  dot.style.cssText = [
    'flex:none',
    'width:7px',
    'height:7px',
    'margin-top:6px',
    'border-radius:50%',
    `background:${TONE_COLORS[tone] ?? TONE_COLORS.info}`,
  ].join(';')

  const body = document.createElement('span')
  body.style.cssText = 'min-width:0;overflow-wrap:anywhere'
  body.textContent = text

  toast.append(dot, body)
  host.append(toast)
  requestAnimationFrame(() => {
    toast.style.opacity = '1'
    toast.style.transform = 'translateY(0)'
  })

  const timeout = Math.max(600, options.timeout ?? DEFAULT_TIMEOUT)
  const timer = setTimeout(() => { dismiss(toast) }, timeout)
  timers.add(timer)
}

/**
 * Remove every toast and the shared container.
 */
export function disposeToasts(): void {
  for (const timer of timers) clearTimeout(timer)
  timers.clear()
  container?.remove()
  container = null
}

/**
 * Resolve the lazily created container, or null when the document cannot host it.
 * @returns the container element.
 */
function ensureContainer(): HTMLElement | null {
  if (container !== null && container.isConnected) return container
  const existing = document.getElementById(CONTAINER_ID)
  if (existing !== null) {
    container = existing
    return container
  }
  const created = document.createElement('div')
  created.id = CONTAINER_ID
  created.style.cssText = CONTAINER_STYLE
  document.body.append(created)
  container = created
  return container
}

/**
 * Fade one toast out and drop it from the container.
 * @param toast - element to remove.
 */
function dismiss(toast: HTMLElement): void {
  toast.style.opacity = '0'
  toast.style.transform = 'translateY(-6px)'
  setTimeout(() => {
    toast.remove()
    if (container !== null && container.childElementCount === 0) {
      container.remove()
      container = null
    }
  }, 180)
}
