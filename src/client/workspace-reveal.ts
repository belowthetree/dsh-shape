/** Reveal one Workspace group in the sidebar after workspace navigation. */

import type { WorkspaceId, WorkspaceView } from '@deepseek-ai/dsh-api-workspace-controller/client'

/** Sidebar row marker for one Workspace group. */
const ROW_KEY_PREFIX = 'workspace:'
/** Sidebar row identity carried by every rendered Workspace group. */
const WORKSPACE_ROW_SELECTOR = '[data-row-key^="workspace:"]'
/** Upper bound on animation frames spent waiting for a row to mount. */
const MAX_REVEAL_FRAMES = 20
/** Clearance kept between the revealed row and the lowest uncovered line. */
const REVEAL_BOTTOM_GAP = 40
/** How far an overlay may reach up from the scroller's bottom edge. */
const OVERLAY_PROBE_DEPTH = 240
/** Vertical step of the overlay probe. */
const OVERLAY_PROBE_STEP = 4

/** Normalize one Workspace directory for nesting comparison. */
function folderPath(path: string): string {
  const windows = /^[A-Za-z]:[/\\]/.test(path) || path.startsWith('\\\\')
  return (windows ? path.replaceAll('\\', '/') : path).replace(/\/+$/, '')
}

/**
 * Find the nearest registered Workspace directory containing `path`.
 * Mirrors the browser's tree nesting so the same ancestors open.
 * @param path - Workspace directory to place.
 * @param candidates - every registered Workspace directory.
 * @returns the nearest containing directory, when one is registered.
 */
function parentFolder(path: string, candidates: readonly string[]): string | undefined {
  const child = folderPath(path)
  let owner: string | undefined
  let length = -1
  for (const candidate of candidates) {
    const root = folderPath(candidate)
    if (root.length > length && child !== root && child.startsWith(`${root}/`)) {
      owner = candidate
      length = root.length
    }
  }
  return owner
}

/**
 * Workspace ids from the outermost registered ancestor down to `workspaceId`.
 * @param workspaces - Workspace registry snapshot.
 * @param workspaceId - target Workspace.
 * @returns ancestors in tree order, excluding the target itself.
 */
function ancestorIds(workspaces: readonly WorkspaceView[], workspaceId: WorkspaceId): WorkspaceId[] {
  const idByPath = new Map(workspaces.map(workspace => [workspace.path, workspace.workspaceId]))
  const paths = [...idByPath.keys()]
  const workspaceById = new Map(workspaces.map(workspace => [workspace.workspaceId, workspace]))
  const chain: WorkspaceId[] = []
  const seen = new Set<WorkspaceId>([workspaceId])
  let current = workspaceById.get(workspaceId)
  while (current !== undefined) {
    const path = parentFolder(current.path, paths)
    const parentId = path === undefined ? undefined : idByPath.get(path)
    if (parentId === undefined || seen.has(parentId)) break
    seen.add(parentId)
    chain.unshift(parentId)
    current = workspaceById.get(parentId)
  }
  return chain
}

/**
 * Find the sidebar row of one Workspace group, preferring a mounted copy over
 * a hidden one when the shell renders more than one sidebar surface.
 *
 * Only the session sidebar renders `workspace:` rows, and the list viewport
 * itself has no marker every supported DSH build carries, so the search spans
 * the document.
 */
function findWorkspaceRow(workspaceId: WorkspaceId): HTMLElement | undefined {
  const key = `${ROW_KEY_PREFIX}${workspaceId}`
  let hidden: HTMLElement | undefined
  for (const row of document.querySelectorAll<HTMLElement>(WORKSPACE_ROW_SELECTOR)) {
    if (row.dataset.rowKey !== key) continue
    if (row.offsetParent !== null) return row
    hidden ??= row
  }
  return hidden
}

/** Wait one animation frame, or a timer where `requestAnimationFrame` is unavailable. */
function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => { resolve() })
    else setTimeout(resolve, 16)
  })
}

/**
 * Wait a bounded number of frames for a Workspace row to mount.
 * @param workspaceId - row to find.
 * @param frames - frames to wait before giving up.
 * @param cancelled - whether a later reveal superseded this one.
 * @returns the row, or undefined when it did not mount in time.
 */
async function rowWithin(
  workspaceId: WorkspaceId,
  frames: number,
  cancelled: () => boolean,
): Promise<HTMLElement | undefined> {
  for (let frame = 0; frame < frames; frame++) {
    if (cancelled()) return undefined
    const row = findWorkspaceRow(workspaceId)
    if (row !== undefined) return row
    await nextFrame()
  }
  return undefined
}

/**
 * Nearest ancestor that scrolls vertically.
 * @param row - revealed row.
 * @returns the scroll container holding the row, when there is one.
 */
function scrollParent(row: HTMLElement): HTMLElement | undefined {
  for (let node = row.parentElement; node !== null; node = node.parentElement) {
    if (node.scrollHeight <= node.clientHeight) continue
    const overflowY = getComputedStyle(node).overflowY
    if (overflowY === 'auto' || overflowY === 'scroll' || overflowY === 'overlay') return node
  }
  return undefined
}

/**
 * Lowest line of one scroller that the sidebar does not cover.
 *
 * The shell paints its bottom fade and its footer buttons over the list, and
 * `scrollIntoView` aligns to the scrollport, so a revealed row lands underneath
 * them. Hit-testing upward from the bottom finds where the list still shows.
 * @param scroller - scroll container holding the revealed row.
 * @returns the viewport coordinate of the lowest uncovered line.
 */
function uncoveredBottom(scroller: HTMLElement): number {
  const rect = scroller.getBoundingClientRect()
  const x = rect.left + rect.width / 2
  const floor = Math.max(rect.top, rect.bottom - OVERLAY_PROBE_DEPTH)
  for (let y = rect.bottom - 1; y > floor; y -= OVERLAY_PROBE_STEP) {
    const hit = document.elementFromPoint(x, y)
    if (hit !== null && scroller.contains(hit)) return y + 1
  }
  return floor
}

/**
 * Scroll one row fully into view, clear of the sidebar footer that overlays the
 * list. The uncovered line decides where the row lands, so a reveal never hides
 * the row under the footer buttons.
 * @param row - revealed row.
 */
function scrollRowIntoView(row: HTMLElement): void {
  const scroller = scrollParent(row)
  if (scroller === undefined) {
    row.scrollIntoView({ block: 'nearest', inline: 'nearest' })
    return
  }
  const rowRect = row.getBoundingClientRect()
  const viewRect = scroller.getBoundingClientRect()
  const bottom = Math.min(viewRect.bottom, uncoveredBottom(scroller)) - REVEAL_BOTTOM_GAP
  if (rowRect.bottom > bottom) scroller.scrollTop += rowRect.bottom - bottom
  else if (rowRect.top < viewRect.top) scroller.scrollTop += rowRect.top - viewRect.top
}

/**
 * Create the post-navigation sidebar reveal.
 *
 * Expanding through the rendered row keeps the browser's own persisted view
 * state and row animations authoritative; a later call supersedes any pending
 * frames from an earlier one.
 * @returns a function that expands and scrolls one Workspace group.
 */
export function createWorkspaceReveal(): (workspaces: readonly WorkspaceView[], workspaceId: WorkspaceId) => void {
  let generation = 0
  return (workspaces, workspaceId) => {
    if (typeof document === 'undefined') return
    // No Workspace row means the sidebar is collapsed, or the browser shows the
    // flat or search result list; there is no group to expand.
    if (document.querySelector(WORKSPACE_ROW_SELECTOR) === null) return
    const current = ++generation
    const cancelled = (): boolean => current !== generation
    void (async () => {
      // A root Workspace row is normally mounted already. Only a nested
      // Workspace hidden under collapsed ancestors needs the ancestor pass.
      let target = await rowWithin(workspaceId, 2, cancelled)
      if (target === undefined) {
        for (const ancestorId of ancestorIds(workspaces, workspaceId)) {
          const row = await rowWithin(ancestorId, MAX_REVEAL_FRAMES, cancelled)
          if (row === undefined) return
          if (row.getAttribute('aria-expanded') !== 'false') continue
          row.click()
          await nextFrame()
          if (cancelled()) return
        }
        target = await rowWithin(workspaceId, MAX_REVEAL_FRAMES, cancelled)
      }
      if (target === undefined) return
      if (target.getAttribute('aria-expanded') === 'false') {
        target.click()
        await nextFrame()
        if (cancelled()) return
      }
      scrollRowIntoView(findWorkspaceRow(workspaceId) ?? target)
    })().catch((error: unknown) => {
      console.warn('dsh-shape: workspace reveal failed', error)
    })
  }
}
