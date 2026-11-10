/** Built-in files capability: read, write, and list inside the current workspace. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-api-workspace-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'

/** Current workspace of the active Session. */
export interface ShapeWorkspaceRef {
  /** Workspace id. */
  id: string
  /** Absolute workspace directory. */
  path: string
}

/** One directory entry returned by `list()`. */
export interface ShapeFileEntry {
  /** File or directory name. */
  name: string
  /** Entry kind. */
  type: 'file' | 'directory' | 'other'
  /** Byte size of a file. */
  size?: number
}

/** Options accepted by `read()`. */
export interface ShapeReadOptions {
  /** Zero-based start line (or byte) offset; defaults to 0. */
  offset?: number
  /** Maximum number of lines (or bytes) to return; omit for the rest of the file. */
  limit?: number
  /** Slice by lines (default) or bytes. */
  unit?: 'line' | 'byte'
}

/** Options accepted by `write()`. */
export interface ShapeWriteOptions {
  /** `replace` overwrites the file (default); `append` adds to its end. */
  mode?: 'replace' | 'append'
}

/** Options accepted by `replace()`. */
export interface ShapeReplaceOptions {
  /** Replacements to perform; defaults to 1, `0` replaces every occurrence. */
  limit?: number
}

/** API passed to shapes that require `dsh-shape#files`. */
export interface ShapeFilesApi {
  /** Workspace of the active Session, or null when none is selected. */
  workspace(): ShapeWorkspaceRef | null
  /** Read one UTF-8 text file, or a line/byte range of it. */
  read(path: string, options?: ShapeReadOptions): Promise<string>
  /** Write one UTF-8 text file (whole-file replace by default), creating parent directories. */
  write(path: string, content: string, options?: ShapeWriteOptions): Promise<{ bytes: number, total: number }>
  /** Append UTF-8 text to one file, creating it and its parent directories when missing. */
  append(path: string, content: string): Promise<{ bytes: number, total: number }>
  /** Replace text inside one file; returns the replacement count and the resulting size. */
  replace(path: string, search: string, replacement: string, options?: ShapeReplaceOptions): Promise<{ replaced: number, bytes: number }>
  /** List one directory relative to the workspace root; defaults to the root. */
  list(path?: string): Promise<readonly ShapeFileEntry[]>
}

/**
 * Workspace of the active Session, or null when none is selected.
 * @param ctx - Client context with workspace and session registries.
 * @returns the workspace id and absolute path.
 */
export function activeWorkspace(ctx: Context): ShapeWorkspaceRef | null {
  const sessions = ctx.sessions.list.getSnapshot()
  const active = Object.values(sessions.byId).find(row => (row.retainedBy?.mainView ?? 0) > 0)
  if (active === undefined) return null
  const workspace = ctx.workspaces.list.getSnapshot().items
    .find(item => item.sessionIds.includes(active.id))
  if (workspace === undefined) return null
  return { id: workspace.workspaceId, path: workspace.path }
}

/**
 * Build the files capability.
 * @param ctx - Client context with workspace and session registries.
 * @returns the capability API.
 */
export function createWorkspaceFiles(ctx: Context): ShapeFilesApi {
  const currentWorkspace = (): ShapeWorkspaceRef | null => activeWorkspace(ctx)

  /** Request deadline; a wedged Host request must surface as an error, never a freeze. */
  const REQUEST_TIMEOUT_MS = 30_000

  /** Active workspace, or a clear error when none is open. */
  const requireWorkspace = (): ShapeWorkspaceRef => {
    const workspace = currentWorkspace()
    if (workspace === null) throw new Error('dsh-shape#files: no workspace is currently open')
    return workspace
  }

  /** Fetch one JSON reply with a deadline and the shared error envelope. */
  const fetchJson = async (input: string, init?: RequestInit): Promise<Record<string, unknown>> => {
    const controller = new AbortController()
    const timer = setTimeout(() => { controller.abort() }, REQUEST_TIMEOUT_MS)
    try {
      const response = await fetch(input, {
        credentials: 'same-origin',
        headers: { accept: 'application/json' },
        signal: controller.signal,
        ...init,
      })
      const payload = await response.json().catch(() => null) as
        { ok?: boolean, error?: { message?: unknown }, [key: string]: unknown } | null
      if (!response.ok || payload?.ok !== true) {
        const message = typeof payload?.error?.message === 'string'
          ? payload.error.message
          : `dsh-shape#files: HTTP ${String(response.status)}`
        throw new Error(message)
      }
      return payload
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`dsh-shape#files: request timed out after ${String(REQUEST_TIMEOUT_MS)} ms`)
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  /** Read-only operations use GET so a stalled POST path cannot freeze the tree. */
  const get = (op: 'read' | 'list', params: Record<string, string | number | undefined>): Promise<Record<string, unknown>> => {
    const workspace = requireWorkspace()
    const query = new URLSearchParams({ op, root: workspace.path })
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) query.set(key, String(value))
    }
    return fetchJson(`/dsh-shape/api/files?${query.toString()}`)
  }

  /** Mutating operations use POST with a JSON body. */
  const post = (body: Record<string, unknown>): Promise<Record<string, unknown>> => {
    const workspace = requireWorkspace()
    return fetchJson('/dsh-shape/api/files', {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify({ root: workspace.path, ...body }),
    })
  }

  return {
    workspace: currentWorkspace,
    async read(path, options) {
      const result = await get('read', {
        path,
        offset: options?.offset,
        limit: options?.limit,
        unit: options?.unit,
      })
      return typeof result.content === 'string' ? result.content : ''
    },
    async write(path, content, options) {
      const result = await post({
        op: 'write',
        path,
        content,
        ...(options?.mode === undefined ? {} : { mode: options.mode }),
      })
      return {
        bytes: typeof result.bytes === 'number' ? result.bytes : 0,
        total: typeof result.total === 'number' ? result.total : 0,
      }
    },
    async append(path, content) {
      const result = await post({ op: 'write', path, content, mode: 'append' })
      return {
        bytes: typeof result.bytes === 'number' ? result.bytes : 0,
        total: typeof result.total === 'number' ? result.total : 0,
      }
    },
    async replace(path, search, replacement, options) {
      const result = await post({
        op: 'replace',
        path,
        search,
        replacement,
        ...(options?.limit === undefined ? {} : { limit: options.limit }),
      })
      return {
        replaced: typeof result.replaced === 'number' ? result.replaced : 0,
        bytes: typeof result.bytes === 'number' ? result.bytes : 0,
      }
    },
    async list(path = '.') {
      const result = await get('list', { path })
      return Array.isArray(result.entries) ? result.entries as ShapeFileEntry[] : []
    },
  }
}
