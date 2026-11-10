/** Built-in shell capability: run one command line on the Host inside the workspace. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-api-session-controller/client'
import type {} from '@deepseek-ai/dsh-api-workspace-controller/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { activeWorkspace, type ShapeWorkspaceRef } from './workspace-files.ts'

/** Options accepted by `run()`. */
export interface ShapeShellOptions {
  /** Directory relative to the workspace root; defaults to the root. */
  cwd?: string
  /** Deadline in milliseconds; defaults to 30000, capped at 300000. */
  timeoutMs?: number
  /** Captured bytes for standard output; defaults to 256 KB, capped at 1 MB. */
  maxBytes?: number
  /** Extra environment entries for this command. */
  env?: Record<string, string>
  /** Text piped to the command's standard input. */
  stdin?: string
  /** File-effect policy: `workspace-write` (default) or `read-only`. */
  mode?: 'workspace-write' | 'read-only'
}

/** One captured stream, possibly truncated at the requested cap. */
export interface ShapeShellOutput {
  /** Captured text. */
  text: string
  /** True when the stream exceeded the cap and only its head was captured. */
  truncated: boolean
  /** Host-side file holding the complete stream, when the Host spooled one. */
  spillPath?: string
}

/** Sandbox facts reported for one command. */
export interface ShapeShellSandbox {
  /** Policy the command ran under. */
  mode: string
  /** True when the sandbox itself refused the command. */
  denied: boolean
  /** `full` when the backend confines every effect, `partial` otherwise. */
  enforcement?: string
  /** True when the sandbox runner failed rather than the command. */
  runnerFailed?: boolean
}

/** Result of one `run()`. */
export interface ShapeShellResult {
  /** Command line that ran. */
  command: string
  /** Absolute directory it ran in. */
  workdir: string
  /** Sandbox mode that applied. */
  mode: string
  /** Host platform: `win32`, `darwin`, or `linux`. */
  platform: string
  /** Exit code, or null when the process was killed before exiting. */
  exitCode: number | null
  /** Signal that ended the process, or null. */
  signal: string | null
  /** True when the deadline killed the command. */
  timedOut: boolean
  /** True when the call was cancelled because the page went away. */
  aborted: boolean
  /** Deadline that applied, in milliseconds. */
  timeoutMs: number
  /** Per-stream capture cap that applied. */
  maxBytes: number
  /** Wall-clock duration, in milliseconds. */
  durationMs: number
  /** Captured standard output. */
  stdout: ShapeShellOutput
  /** Captured standard error. */
  stderr: ShapeShellOutput
  /** Sandbox facts, or null when the Host reported none. */
  sandbox: ShapeShellSandbox | null
}

/** API passed to shapes that require `dsh-shape#shell`. */
export interface ShapeShellApi {
  /** Workspace of the active Session, or null when none is selected. */
  workspace(): ShapeWorkspaceRef | null
  /** Run one command line in the host's default shell and resolve with its outcome; non-zero exits resolve too. */
  run(command: string, options?: ShapeShellOptions): Promise<ShapeShellResult>
}

/** Deadline applied when the caller names none. */
const DEFAULT_TIMEOUT_MS = 30_000
/** Longest deadline the Host accepts. */
const MAX_TIMEOUT_MS = 300_000
/** Shortest deadline the Host accepts. */
const MIN_TIMEOUT_MS = 1_000
/** Extra wait on top of the command deadline before the request itself fails. */
const REQUEST_SLACK_MS = 15_000

/**
 * Project one captured stream without trusting the Host's shape.
 * @param value - raw stream value.
 * @returns a well-formed output record.
 */
function outputOf(value: unknown): ShapeShellOutput {
  const record = typeof value === 'object' && value !== null ? value as Record<string, unknown> : {}
  return {
    text: typeof record.text === 'string' ? record.text : '',
    truncated: record.truncated === true,
    ...(typeof record.spillPath === 'string' ? { spillPath: record.spillPath } : {}),
  }
}

/**
 * Project the sandbox facts of one run.
 * @param value - raw sandbox value.
 * @returns the sandbox record, or null.
 */
function sandboxOf(value: unknown): ShapeShellSandbox | null {
  if (typeof value !== 'object' || value === null) return null
  const record = value as Record<string, unknown>
  return {
    mode: typeof record.mode === 'string' ? record.mode : 'unknown',
    denied: record.denied === true,
    ...(typeof record.enforcement === 'string' ? { enforcement: record.enforcement } : {}),
    ...(record.runnerFailed === true ? { runnerFailed: true } : {}),
  }
}

/**
 * Build the shell capability.
 * @param ctx - Client context with workspace and session registries.
 * @returns the capability API.
 */
export function createShapeShell(ctx: Context): ShapeShellApi {
  const workspace = (): ShapeWorkspaceRef | null => activeWorkspace(ctx)

  /** Active workspace, or a clear error when none is open. */
  const requireWorkspace = (): ShapeWorkspaceRef => {
    const current = workspace()
    if (current === null) throw new Error('dsh-shape#shell: no workspace is currently open')
    return current
  }

  /** Post one JSON request with a deadline and the shared error envelope. */
  const fetchJson = async (input: string, init: RequestInit, deadlineMs: number): Promise<Record<string, unknown>> => {
    const controller = new AbortController()
    const timer = setTimeout(() => { controller.abort() }, deadlineMs)
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
          : `dsh-shape#shell: HTTP ${String(response.status)}`
        throw new Error(message)
      }
      return payload
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error(`dsh-shape#shell: request timed out after ${String(deadlineMs)} ms`)
      }
      throw error
    } finally {
      clearTimeout(timer)
    }
  }

  return {
    workspace,
    async run(command, options) {
      if (typeof command !== 'string' || command.trim().length === 0) {
        throw new Error('dsh-shape#shell: command must be a non-empty string')
      }
      const current = requireWorkspace()
      const requested = typeof options?.timeoutMs === 'number' && Number.isFinite(options.timeoutMs)
        ? options.timeoutMs
        : DEFAULT_TIMEOUT_MS
      const deadline = Math.min(Math.max(Math.trunc(requested), MIN_TIMEOUT_MS), MAX_TIMEOUT_MS)
      const body: Record<string, unknown> = { root: current.path, command }
      if (options?.cwd !== undefined) body.cwd = options.cwd
      if (options?.timeoutMs !== undefined) body.timeoutMs = options.timeoutMs
      if (options?.maxBytes !== undefined) body.maxBytes = options.maxBytes
      if (options?.env !== undefined) body.env = options.env
      if (options?.stdin !== undefined) body.stdin = options.stdin
      if (options?.mode !== undefined) body.mode = options.mode
      const result = await fetchJson('/dsh-shape/api/shell', {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(body),
      }, deadline + REQUEST_SLACK_MS)
      return {
        command: typeof result.command === 'string' ? result.command : command,
        workdir: typeof result.workdir === 'string' ? result.workdir : current.path,
        mode: typeof result.mode === 'string' ? result.mode : 'workspace-write',
        platform: typeof result.platform === 'string' ? result.platform : 'unknown',
        exitCode: typeof result.exitCode === 'number' ? result.exitCode : null,
        signal: typeof result.signal === 'string' ? result.signal : null,
        timedOut: result.timedOut === true,
        aborted: result.aborted === true,
        timeoutMs: typeof result.timeoutMs === 'number' ? result.timeoutMs : deadline,
        maxBytes: typeof result.maxBytes === 'number' ? result.maxBytes : 0,
        durationMs: typeof result.durationMs === 'number' ? result.durationMs : 0,
        stdout: outputOf(result.stdout),
        stderr: outputOf(result.stderr),
        sandbox: sandboxOf(result.sandbox),
      }
    },
  }
}
