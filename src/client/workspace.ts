/** Built-in workspace switching capability exposed to shapes. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-api-workspace-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'

/** Public workspace summary. */
export interface WorkspaceSummary {
  id: string
  title: string
}

/** API passed to shapes that require `dsh-shape#workspace`. */
export interface WorkspaceSwitchApi {
  /** Workspace registry order. */
  list(): readonly WorkspaceSummary[]
  /** Current workspace id, when a Session is selected. */
  current(): string | null
  /** Switch to the next workspace, wrapping at the end. */
  next(): Promise<void>
  /** Switch to the previous workspace, wrapping at the start. */
  previous(): Promise<void>
}

/**
 * Build the workspace switching capability.
 * @param ctx - Client context with workspace, session, and navigation services.
 * @returns the capability API.
 */
export function createWorkspaceSwitch(ctx: Context): WorkspaceSwitchApi {
  const workspaceSnapshot = () => ctx.workspaces.list.getSnapshot()
  const sessionSnapshot = () => ctx.sessions.list.getSnapshot()

  const currentWorkspaceId = (): string | null => {
    const sessions = sessionSnapshot()
    const current = Object.values(sessions.byId).find(row => (row.retainedBy.mainView ?? 0) > 0)
    if (current === undefined) return null
    return workspaceSnapshot().items.find(item => item.sessionIds.includes(current.id))?.workspaceId ?? null
  }

  const switchBy = async (delta: 1 | -1): Promise<void> => {
    const workspace = workspaceSnapshot()
    const items = workspace.items
    if (items.length === 0) return
    const current = currentWorkspaceId()
    if (items.length === 1) return

    const index = current === null ? -1 : items.findIndex(item => item.workspaceId === current)
    const targetIndex = index === -1
      ? (delta === 1 ? 0 : items.length - 1)
      : (index + delta + items.length) % items.length
    const target = items[targetIndex]
    if (target === undefined || target.workspaceId === current) return

    const sessions = sessionSnapshot()
    const archived = new Set(workspace.archivedSessionIds)
    const targetSession = target.sessionIds
      .filter(sessionId => !archived.has(sessionId))
      .map(sessionId => sessions.byId[sessionId])
      .filter(row => row !== undefined)
      .sort((left, right) => right.updatedAt - left.updatedAt)[0]

    if (targetSession !== undefined) {
      ctx.uiWorkspace.openSession(targetSession.id)
      return
    }
    await ctx.uiWorkspace.openWorkspace(target.workspaceId)
  }

  return {
    list() {
      return workspaceSnapshot().items.map(item => ({ id: item.workspaceId, title: item.title ?? item.path ?? item.workspaceId }))
    },
    current: currentWorkspaceId,
    next: () => switchBy(1),
    previous: () => switchBy(-1),
  }
}
