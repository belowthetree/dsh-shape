/**
 * Built-in MCP capability: read and edit the MCP servers configured for this
 * harness. The rows themselves are owned by the `dsh-mcp-setting` plugin, which
 * mounts the admin API edited here; this module only speaks that HTTP contract.
 *
 * Module-level identifiers carry the `mcp` prefix because this file is spliced
 * into `client.js`, where every region shares one factory scope.
 */

/** Admin API prefix dsh-mcp-setting mounts. */
const MCP_API = '/dsh-mcp-setting/api'

/**
 * How one server participates: loaded once per process, mounted into matching
 * Sessions only, or turned off.
 */
export type ShapeMcpMode = 'global' | 'workspace' | 'disabled'

/** One MCP server row as shapes see it. */
export interface ShapeMcpServer {
  /** Loader row id, unique across the home and profile patch files. */
  id: string
  /** Process-wide tool namespace, the `mcp__<serverName>__` prefix. */
  serverName: string
  /** Transport kind read from the stored config, or null when unreadable. */
  transport: string | null
  /** Command line for stdio rows, URL for streamable-http rows. */
  endpoint: string
  /** Whether the loader row carries `disabled: true`. */
  disabled: boolean
  /** Participation mode derived from the row flag and its workspace rule. */
  mode: ShapeMcpMode
  /** Workspace patterns the row matches; empty unless `mode` is `workspace`. */
  workspacePatterns: string[]
  /** Sessions currently mounting this workspace-scoped row. */
  workspaceSessions: number
  /** Live connection status inferred from the loader and the tool registry. */
  status: { state: string, toolCount: number }
  /** Patch file scope: `home` or `profile:<name>`. */
  scope: string
  /** Absolute path of the patch file this row lives in. */
  file: string
  /** Stored config, including advanced fields the settings form does not render. */
  config: Record<string, unknown>
}

/** One server declared by a workspace `.dsh/mcp.json`. */
export interface ShapeMcpProjectEntry {
  /** Declaration key; also the server's tool namespace. */
  serverName: string
  /** Transport derived from the declaration. */
  transport: string
  /** Command line (stdio) or URL (http), for review before trusting. */
  summary: string
  /** Absolute working directory of a stdio entry, when the declaration sets one. */
  cwd: string | null
}

/** One discovered workspace configuration file. */
export interface ShapeMcpProject {
  /** Directory holding `.dsh/mcp.json`. */
  dir: string
  /** Absolute path of the configuration file. */
  file: string
  /** Whether the workspace's declarations may mount into its Sessions. */
  trusted: boolean
  /** Declared servers; empty when the file cannot be read or parsed. */
  entries: ShapeMcpProjectEntry[]
  /** Parse or validation failure text, or null when the file is usable. */
  error: string | null
  /** Epoch ms of the newest Session created in this workspace; null when unknown. */
  lastSeen: number | null
}

/** The full MCP configuration snapshot a mutation returns. */
export interface ShapeMcpState {
  /** Absolute path of the home patch file new servers are added to. */
  homeFile: string
  /** Absolute path of the workspace-rule file. */
  workspaceFile: string
  /** Whether workspace `.dsh/mcp.json` detection is on. */
  projectsEnabled: boolean
  /** Every discovered workspace configuration. */
  projects: ShapeMcpProject[]
  /** Every MCP server row across the home patch and all profile patches. */
  servers: ShapeMcpServer[]
}

/** Where one server visible to a Session comes from. */
export type ShapeMcpSource = 'global' | 'workspace' | 'project'

/** One MCP server visible to a Session. */
export interface ShapeMcpSessionServer {
  /** Server name; also the tool namespace. */
  serverName: string
  /** Which mechanism put the server in this Session. */
  source: ShapeMcpSource
  /** Stored transport, or null when the declaration is not readable here. */
  transport: string | null
  /** Command line (stdio) or URL (http) summary. */
  summary: string
  /** Tools registered under this Session's `mcp__<serverName>__` namespace. */
  toolCount: number
  /** Whether this Session owns a scoped mount. */
  mounted: boolean
}

/** The MCP inventory one Session sees. */
export interface ShapeMcpSession {
  /** Session the inventory was computed for. */
  sessionId: string
  /** The Session's effective working directory, or null when unknown. */
  cwd: string | null
  /** Whether `.dsh/mcp.json` detection is on. */
  projectsEnabled: boolean
  /** Servers visible to the Session, globals first, then workspace, then project. */
  servers: ShapeMcpSessionServer[]
}

/** Fields a shape fills in to create or edit one MCP server row. */
export interface ShapeMcpDraft {
  /** Tool namespace, 1–32 characters of letters, digits, `-`, or `_`. */
  serverName: string
  /** `stdio` runs a local command; `streamable-http` talks to a URL. */
  transport: 'stdio' | 'streamable-http'
  /** stdio only: the executable to run. */
  command?: string
  /** stdio only: one argument per entry. */
  args?: readonly string[]
  /** stdio only: working directory for the command. */
  cwd?: string
  /** stdio only: environment variables added to the child process. */
  env?: Readonly<Record<string, string>>
  /** streamable-http only: the MCP endpoint URL. */
  url?: string
  /** streamable-http only: request headers, for example an authorization token. */
  headers?: Readonly<Record<string, string>>
}

/** API passed to shapes that require `dsh-shape#mcp`. */
export interface ShapeMcpApi {
  /**
   * Probe whether the MCP admin API answers.
   * @returns true when dsh-mcp-setting is installed and reachable.
   */
  available(): Promise<boolean>
  /**
   * List every configured server.
   * @returns rows in patch-file order, home layer first.
   */
  list(): Promise<ShapeMcpServer[]>
  /**
   * List the workspace configurations the plugin has discovered.
   * @returns the detection flag and one entry per known workspace.
   */
  projects(): Promise<{ projectsEnabled: boolean, projects: ShapeMcpProject[] }>
  /**
   * Read one server by loader row id.
   * @param id - loader row id.
   * @returns the row, or null when no row has that id.
   */
  get(id: string): Promise<ShapeMcpServer | null>
  /**
   * Add one server row to the home patch file.
   * @param draft - row id plus the server fields.
   * @returns the configuration snapshot after the write.
   */
  add(draft: ShapeMcpDraft & { id: string }): Promise<ShapeMcpState>
  /**
   * Rewrite one server's config in the file that holds it.
   * @param id - loader row id.
   * @param draft - the complete draft; omitted fields are cleared.
   * @returns the configuration snapshot after the write.
   */
  update(id: string, draft: ShapeMcpDraft): Promise<ShapeMcpState>
  /**
   * Delete one server row, its workspace rule, and its patch entry when empty.
   * @param id - loader row id.
   * @returns the configuration snapshot after the write.
   */
  remove(id: string): Promise<ShapeMcpState>
  /**
   * Set how one server participates.
   * @param id - loader row id.
   * @param mode - `global`, `workspace`, or `disabled`.
   * @param patterns - workspace path patterns; required when mode is `workspace`.
   * @returns the configuration snapshot after the write.
   */
  setMode(id: string, mode: ShapeMcpMode, patterns?: readonly string[]): Promise<ShapeMcpState>
  /**
   * Trust or revoke one workspace's `.dsh/mcp.json`.
   * @param dir - absolute workspace directory.
   * @param trusted - whether its declarations may mount.
   * @returns the configuration snapshot after the write.
   */
  setProjectTrusted(dir: string, trusted: boolean): Promise<ShapeMcpState>
  /**
   * List the MCP servers one Session can see.
   * @param sessionId - Session identity, for example from composer.sessionId().
   * @returns the Session inventory.
   */
  session(sessionId: string): Promise<ShapeMcpSession>
}

/**
 * Build the MCP capability.
 * @returns the API shapes receive.
 */
export function createMcp(): ShapeMcpApi {
  return {
    async available(): Promise<boolean> {
      try {
        await mcpRead('/servers')
        return true
      }
      catch {
        return false
      }
    },
    async list(): Promise<ShapeMcpServer[]> {
      return mcpStateOf(await mcpRead('/servers')).servers
    },
    async projects(): Promise<{ projectsEnabled: boolean, projects: ShapeMcpProject[] }> {
      const state = mcpStateOf(await mcpRead('/servers'))
      return { projectsEnabled: state.projectsEnabled, projects: state.projects }
    },
    async get(id: string): Promise<ShapeMcpServer | null> {
      mcpRequireId(id, 'server')
      const state = mcpStateOf(await mcpRead('/servers'))
      return state.servers.find(server => server.id === id) ?? null
    },
    async add(draft: ShapeMcpDraft & { id: string }): Promise<ShapeMcpState> {
      const id = mcpRequireId(draft?.id, 'server')
      const body = { id, ...mcpBodyOf(draft) }
      return mcpStateOf(await mcpRead('/servers', { method: 'POST', body: JSON.stringify(body) }))
    },
    async update(id: string, draft: ShapeMcpDraft): Promise<ShapeMcpState> {
      const target = mcpRequireId(id, 'server')
      const body = mcpBodyOf(draft)
      return mcpStateOf(await mcpRead(`/servers/${encodeURIComponent(target)}`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }))
    },
    async remove(id: string): Promise<ShapeMcpState> {
      const target = mcpRequireId(id, 'server')
      return mcpStateOf(await mcpRead(`/servers/${encodeURIComponent(target)}`, { method: 'DELETE' }))
    },
    async setMode(id: string, mode: ShapeMcpMode, patterns?: readonly string[]): Promise<ShapeMcpState> {
      const target = mcpRequireId(id, 'server')
      const list = Array.isArray(patterns) ? patterns.filter(entry => typeof entry === 'string') : []
      const body = mode === 'workspace' ? { mode, patterns: list } : { mode }
      return mcpStateOf(await mcpRead(`/servers/${encodeURIComponent(target)}/scope`, {
        method: 'PUT',
        body: JSON.stringify(body),
      }))
    },
    async setProjectTrusted(dir: string, trusted: boolean): Promise<ShapeMcpState> {
      if (typeof dir !== 'string' || dir.trim() === '') {
        throw new Error('dsh-shape#mcp: a project directory is required')
      }
      const body = { dir, trusted: trusted === true }
      return mcpStateOf(await mcpRead('/projects', { method: 'PUT', body: JSON.stringify(body) }))
    },
    async session(sessionId: string): Promise<ShapeMcpSession> {
      const target = mcpRequireId(sessionId, 'session')
      return mcpSessionOf(await mcpRead(`/sessions/${encodeURIComponent(target)}/mcp`))
    },
  }
}

/**
 * Serialize one draft into the admin API's form field names.
 * @param draft - the shape-facing draft.
 * @returns the JSON body the routes expect.
 */
function mcpBodyOf(draft: ShapeMcpDraft): Record<string, unknown> {
  const text = (value: unknown): string => typeof value === 'string' ? value : ''
  const args = draft?.args
  const list = Array.isArray(args) ? args.filter(entry => typeof entry === 'string') : []
  return {
    serverName: text(draft?.serverName),
    transport: draft?.transport,
    command: text(draft?.command),
    args: list.join('\n'),
    cwd: text(draft?.cwd),
    envJson: JSON.stringify(mcpIsRecord(draft?.env) ? draft.env : {}),
    url: text(draft?.url),
    headersJson: JSON.stringify(mcpIsRecord(draft?.headers) ? draft.headers : {}),
  }
}

/**
 * Reject a missing identity before it reaches the route.
 * @param value - candidate row or session id.
 * @param label - what the id names, for the error text.
 * @returns the same id when usable.
 */
function mcpRequireId(value: unknown, label: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`dsh-shape#mcp: a ${label} id is required`)
  }
  return value
}

/**
 * Whether a value is a plain object.
 * @param value - candidate value.
 * @returns true for non-array objects.
 */
function mcpIsRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/**
 * Read one string field with a fallback.
 * @param value - raw field.
 * @param fallback - value used when the field is not a string.
 * @returns the string field.
 */
function mcpText(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback
}

/**
 * Read one string array field, dropping other entries.
 * @param value - raw field.
 * @returns the string entries.
 */
function mcpStrings(value: unknown): string[] {
  return Array.isArray(value) ? value.filter(entry => typeof entry === 'string') : []
}

/**
 * Read one wire server row into the shape-facing row.
 * @param value - one `servers` entry from the admin API.
 * @returns the normalized row.
 */
function mcpNormalizeServer(value: unknown): ShapeMcpServer {
  const row = mcpIsRecord(value) ? value : {}
  const config = mcpIsRecord(row.config) ? row.config : {}
  const status = mcpIsRecord(row.status) ? row.status : {}
  const transport = typeof config.transport === 'string' ? config.transport : null
  const mode = row.mode === 'global' || row.mode === 'workspace' || row.mode === 'disabled'
    ? row.mode
    : row.disabled === true ? 'disabled' : 'global'
  return {
    id: mcpText(row.id),
    serverName: mcpText(config.serverName, mcpText(row.id)),
    transport,
    endpoint: mcpEndpointOf(transport, config),
    disabled: row.disabled === true,
    mode,
    workspacePatterns: mcpStrings(row.workspacePatterns),
    workspaceSessions: typeof row.workspaceSessions === 'number' ? row.workspaceSessions : 0,
    status: {
      state: mcpText(status.state, 'unknown'),
      toolCount: typeof status.toolCount === 'number' ? status.toolCount : 0,
    },
    scope: mcpText(row.scope),
    file: mcpText(row.file),
    config: { ...config },
  }
}

/**
 * Summarize how a shape reaches one server.
 * @param transport - stored transport kind.
 * @param config - stored config.
 * @returns the URL for HTTP rows, the command line for stdio rows.
 */
function mcpEndpointOf(transport: string | null, config: Record<string, unknown>): string {
  if (transport === 'streamable-http') return mcpText(config.url)
  const args = mcpStrings(config.args)
  return [mcpText(config.command), ...args].filter(part => part.length > 0).join(' ')
}

/**
 * Read one wire project view.
 * @param value - one `projects` entry from the admin API.
 * @returns the normalized project.
 */
function mcpNormalizeProject(value: unknown): ShapeMcpProject {
  const row = mcpIsRecord(value) ? value : {}
  const entries = Array.isArray(row.entries) ? row.entries.filter(mcpIsRecord).map((entry) => {
    return {
      serverName: mcpText(entry.serverName),
      transport: mcpText(entry.transport),
      summary: mcpText(entry.summary),
      cwd: typeof entry.cwd === 'string' ? entry.cwd : null,
    }
  }) : []
  return {
    dir: mcpText(row.dir),
    file: mcpText(row.file),
    trusted: row.trusted === true,
    entries,
    error: typeof row.error === 'string' ? row.error : null,
    lastSeen: typeof row.lastSeen === 'number' ? row.lastSeen : null,
  }
}

/**
 * Read one `/servers` receipt into the shape-facing snapshot.
 * @param body - the validated response body.
 * @returns the snapshot.
 */
function mcpStateOf(body: Record<string, unknown>): ShapeMcpState {
  return {
    homeFile: mcpText(body.homeFile),
    workspaceFile: mcpText(body.workspaceFile),
    projectsEnabled: body.projectsEnabled === true,
    projects: Array.isArray(body.projects) ? body.projects.map(mcpNormalizeProject) : [],
    servers: Array.isArray(body.servers) ? body.servers.map(mcpNormalizeServer) : [],
  }
}

/**
 * Read one `/sessions/:id/mcp` receipt.
 * @param body - the validated response body.
 * @returns the Session inventory.
 */
function mcpSessionOf(body: Record<string, unknown>): ShapeMcpSession {
  const servers = Array.isArray(body.servers) ? body.servers.filter(mcpIsRecord).map((row) => {
    const source = row.source === 'global' || row.source === 'workspace' || row.source === 'project'
      ? row.source
      : 'global'
    return {
      serverName: mcpText(row.serverName),
      source,
      transport: typeof row.transport === 'string' ? row.transport : null,
      summary: mcpText(row.summary),
      toolCount: typeof row.toolCount === 'number' ? row.toolCount : 0,
      mounted: row.mounted === true,
    }
  }) : []
  return {
    sessionId: mcpText(body.sessionId),
    cwd: typeof body.cwd === 'string' ? body.cwd : null,
    projectsEnabled: body.projectsEnabled === true,
    servers,
  }
}

/**
 * Call the admin API and validate the envelope.
 * @param path - path below the API prefix.
 * @param init - optional method and body.
 * @returns the validated response body.
 */
async function mcpRead(
  path: string,
  init?: { method?: string, body?: string },
): Promise<Record<string, unknown>> {
  const url = `${MCP_API}${path}`
  let response: Response
  try {
    response = await fetch(url, {
      credentials: 'same-origin',
      ...init,
      headers: { 'content-type': 'application/json' },
    })
  }
  catch {
    throw new Error(`dsh-shape#mcp: cannot reach ${MCP_API}; is dsh-mcp-setting installed?`)
  }
  const body = await response.json().catch(() => null) as Record<string, unknown> | null
  if (body === null) {
    throw new Error(`dsh-shape#mcp: ${url} answered ${String(response.status)} without JSON; is dsh-mcp-setting installed?`)
  }
  if (body.ok !== true) {
    const message = mcpText(body.message, `request failed (${String(response.status)})`)
    throw new Error(`dsh-shape#mcp: ${message}`)
  }
  return body
}
