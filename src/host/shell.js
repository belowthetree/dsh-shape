/**
 * The `/api/shell` route: run one command line inside the workspace of the
 * requesting shape, confined by the host's sandbox policy.
 *
 * Execution goes through the host `shell` service rather than `child_process`,
 * so the command inherits DSH's process sandbox, output caps, spill files, and
 * teardown semantics. A host without that service fails loud instead of
 * falling back to an unconfined spawn.
 * @module @belowthetree/dsh-shape/host/shell
 */
import { realpath, stat } from 'node:fs/promises'
import path from 'node:path'
import { json, readJsonBody } from './http.js'
import { fail, realInside, resolveInside } from './paths.js'

/** Request body ceiling, leaving room for JSON framing around `stdin`. */
const BODY_LIMIT = 1024 * 1024
/** Command deadline when the caller names none. */
const DEFAULT_TIMEOUT_MS = 30_000
/** Shortest deadline a caller may ask for. */
const MIN_TIMEOUT_MS = 1000
/** Longest deadline a caller may ask for. */
const MAX_TIMEOUT_MS = 300_000
/** Captured bytes of standard output when the caller names no cap. */
const DEFAULT_MAX_BYTES = 256 * 1024
/** Smallest per-stream cap a caller may ask for. */
const MIN_MAX_BYTES = 4 * 1024
/** Largest per-stream cap a caller may ask for. */
const MAX_MAX_BYTES = 1024 * 1024
/** Longest command line accepted. */
const MAX_COMMAND_LENGTH = 8192
/** Largest text piped to the command's stdin. */
const MAX_STDIN_BYTES = 64 * 1024
/** Environment entries one request may add. */
const MAX_ENV_ENTRIES = 32
/** Longest single environment value. */
const MAX_ENV_VALUE_LENGTH = 4096
/** Environment names accepted; values are never interpreted by a shell. */
const ENV_NAME = /^[A-Za-z_][A-Za-z0-9_]*$/
/** Sandbox modes a shape may request. */
const MODES = new Set(['workspace-write', 'read-only'])

/**
 * Tell a plain object apart from arrays and null.
 * @param value - value to inspect.
 * @returns true for a record.
 */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Read one non-negative integer request field.
 * @param value - caller-supplied value.
 * @param fallback - value used when the field is absent.
 * @param min - smallest accepted value.
 * @param max - largest accepted value.
 * @returns the clamped integer, or null when the field is malformed.
 */
function readInteger(value, fallback, min, max) {
  if (value === undefined || value === null)
    return Math.min(Math.max(fallback, min), max)
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0)
    return null
  return Math.min(Math.max(Math.trunc(value), min), max)
}

/**
 * Validate the optional environment overlay.
 * @param value - caller-supplied record.
 * @returns the overlay, or null when it is malformed.
 */
function readEnv(value) {
  if (!isRecord(value))
    return null
  const entries = Object.entries(value)
  if (entries.length > MAX_ENV_ENTRIES)
    return null
  const env = {}
  for (const [key, entry] of entries) {
    if (!ENV_NAME.test(key) || typeof entry !== 'string' || entry.length > MAX_ENV_VALUE_LENGTH)
      return null
    env[key] = entry
  }
  return env
}

/**
 * Send one reply unless the client already went away.
 * @param res - server response.
 * @param status - HTTP status.
 * @param body - JSON body.
 */
function reply(res, status, body) {
  if (res.writableEnded || res.destroyed)
    return
  try {
    json(res, status, body)
  }
  catch {
    // The connection dropped while the command was running; nobody reads this.
  }
}

/**
 * Project one collected stream for JSON.
 * @param value - collected output from the shell service.
 * @returns `{ text, truncated, spillPath? }`.
 */
function streamOf(value) {
  const record = isRecord(value) ? value : {}
  return {
    text: typeof record.text === 'string' ? record.text : '',
    truncated: record.truncated === true,
    ...(typeof record.spillPath === 'string' ? { spillPath: record.spillPath } : {}),
  }
}

/**
 * Project the sandbox facts reported by the shell service.
 * @param value - sandbox info, when the implementation reported any.
 * @returns the sandbox record, or null.
 */
function sandboxOf(value) {
  if (!isRecord(value))
    return null
  return {
    mode: typeof value.mode === 'string' ? value.mode : 'unknown',
    denied: value.denied === true,
    ...(typeof value.enforcement === 'string' ? { enforcement: value.enforcement } : {}),
    ...(value.runnerFailed === true ? { runnerFailed: true } : {}),
  }
}

/**
 * Serve one shell request: `POST { root, command, cwd?, timeoutMs?, maxBytes?, env?, stdin?, mode? }`.
 * @param req - incoming request.
 * @param res - server response.
 * @param shellOf - returns the host `shell` service, when one is mounted.
 */
export async function serveShell(req, res, shellOf) {
  if (req.method !== 'POST') {
    fail(res, 405, 'method-not-allowed', 'POST is required')
    return
  }
  let body
  try {
    body = await readJsonBody(req, BODY_LIMIT)
  }
  catch {
    fail(res, 400, 'bad-request', 'invalid JSON body')
    return
  }
  const record = isRecord(body) ? body : undefined
  if (record === undefined) {
    fail(res, 400, 'bad-request', 'body must be a JSON object')
    return
  }
  const command = record.command
  if (typeof command !== 'string' || command.trim().length === 0) {
    fail(res, 400, 'bad-request', 'command must be a non-empty string')
    return
  }
  if (command.length > MAX_COMMAND_LENGTH) {
    fail(res, 400, 'bad-request', `command exceeds ${String(MAX_COMMAND_LENGTH)} characters`)
    return
  }
  const root = record.root
  if (typeof root !== 'string' || !path.isAbsolute(root)) {
    fail(res, 400, 'bad-request', 'root must be an absolute workspace path')
    return
  }
  const resolvedRoot = path.resolve(root)
  let rootStat
  try {
    rootStat = await stat(resolvedRoot)
  }
  catch {
    fail(res, 404, 'not-found', 'workspace root does not exist')
    return
  }
  if (!rootStat.isDirectory()) {
    fail(res, 400, 'bad-request', 'workspace root is not a directory')
    return
  }
  let realRoot
  try {
    realRoot = await realpath(resolvedRoot)
  }
  catch {
    fail(res, 404, 'not-found', 'workspace root does not exist')
    return
  }
  const relative = record.cwd ?? '.'
  if (typeof relative !== 'string') {
    fail(res, 400, 'bad-request', 'cwd must be a string')
    return
  }
  const workdir = resolveInside(resolvedRoot, relative)
  if (workdir === null) {
    fail(res, 400, 'bad-request', 'cwd must stay inside the workspace')
    return
  }
  let workdirStat
  try {
    workdirStat = await stat(workdir)
  }
  catch {
    fail(res, 400, 'bad-request', 'cwd does not exist')
    return
  }
  if (!workdirStat.isDirectory()) {
    fail(res, 400, 'bad-request', 'cwd is not a directory')
    return
  }
  if (!await realInside(realRoot, workdir, false)) {
    fail(res, 400, 'bad-request', 'cwd must stay inside the workspace')
    return
  }
  const timeoutMs = readInteger(record.timeoutMs, DEFAULT_TIMEOUT_MS, MIN_TIMEOUT_MS, MAX_TIMEOUT_MS)
  if (timeoutMs === null) {
    fail(res, 400, 'bad-request', 'timeoutMs must be a non-negative number')
    return
  }
  const maxBytes = readInteger(record.maxBytes, DEFAULT_MAX_BYTES, MIN_MAX_BYTES, MAX_MAX_BYTES)
  if (maxBytes === null) {
    fail(res, 400, 'bad-request', 'maxBytes must be a non-negative number')
    return
  }
  const mode = record.mode ?? 'workspace-write'
  if (typeof mode !== 'string' || !MODES.has(mode)) {
    fail(res, 400, 'bad-request', 'mode must be workspace-write or read-only')
    return
  }
  let env
  if (record.env !== undefined) {
    const parsed = readEnv(record.env)
    if (parsed === null) {
      fail(res, 400, 'bad-request', 'env must be an object of string values')
      return
    }
    env = parsed
  }
  let stdin
  if (record.stdin !== undefined) {
    if (typeof record.stdin !== 'string') {
      fail(res, 400, 'bad-request', 'stdin must be a string')
      return
    }
    if (Buffer.byteLength(record.stdin, 'utf8') > MAX_STDIN_BYTES) {
      fail(res, 413, 'too-large', `stdin exceeds ${String(MAX_STDIN_BYTES)} bytes`)
      return
    }
    stdin = record.stdin
  }
  const shell = shellOf()
  if (shell === undefined || typeof shell.resolve !== 'function' || typeof shell.execute !== 'function') {
    fail(res, 501, 'shell-unavailable', 'the host has no shell service; commands cannot run here')
    return
  }
  // `sandboxMode` is the executor's own statement that it confines commands. A
  // bare local executor reports none, and running there would silently break the
  // workspace-write promise, so refuse instead of degrading.
  if (typeof shell.sandboxMode !== 'string') {
    fail(res, 501, 'shell-unconfined', 'the host shell service does not apply a sandbox; refusing to run unconfined commands')
    return
  }
  // A shape that navigates away must not leave a build running: an abandoned
  // response aborts the shell call, which kills the process at the host seam.
  const controller = new AbortController()
  const onClose = () => {
    if (!res.writableEnded)
      controller.abort()
  }
  res.on('close', onClose)
  const started = Date.now()
  try {
    const spec = shell.resolve({
      command,
      workdir,
      timeoutMs,
      onExpiry: 'kill',
      stdoutMaxBytes: maxBytes,
      signal: controller.signal,
      ...(stdin === undefined ? {} : { stdin }),
      ...(env === undefined ? {} : { env }),
      sandboxPolicy: { mode, workspaceRoot: resolvedRoot },
    })
    const execution = await shell.execute(spec)
    const result = await execution.result()
    reply(res, 200, {
      ok: true,
      command: spec.command,
      workdir: spec.workdir,
      mode,
      platform: process.platform,
      timeoutMs: spec.timeoutMs,
      maxBytes: spec.stdoutMaxBytes,
      durationMs: Date.now() - started,
      exitCode: typeof result?.exitCode === 'number' ? result.exitCode : null,
      signal: typeof result?.signal === 'string' ? result.signal : null,
      timedOut: result?.timedOut === true,
      aborted: result?.aborted === true,
      stdout: streamOf(result?.stdout),
      stderr: streamOf(result?.stderr),
      sandbox: sandboxOf(result?.sandbox),
    })
  }
  catch (cause) {
    reply(res, 500, {
      ok: false,
      error: { code: 'shell-failed', message: cause instanceof Error ? cause.message : String(cause) },
    })
  }
  finally {
    res.off?.('close', onClose)
  }
}
