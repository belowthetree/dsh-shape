# 能力参考

11 个内置能力都由 `dsh-shape` 插件提供，版本 `1.0.0`。形态在清单里声明需要哪些能力，再用 `api.require('dsh-shape', '<能力>')` 取用。

```json
{ "plugin": "dsh-shape", "capability": "conversation", "version": "^1.0.0" }
```

## core

| 成员 | 类型 | 说明 |
| --- | --- | --- |
| `apiVersion` | `number` | 形态 ABI 版本，当前 `1` |

没有方法。用来在形态里分支处理 ABI 差异。

## workspace

| 方法 | 返回 | 说明 |
| --- | --- | --- |
| `list()` | `{ id, title }[]` | 按侧栏顺序列出工作区 |
| `current()` | `string \| null` | 当前工作区 id |
| `next()` / `previous()` | `string \| null` | 循环切换，返回切换后的 id |

切换会打开目标工作区最近的一次会话（没有就开一个空白会话），并展开、滚动到该分组。

## files

读写当前工作区里的文件，并读取当前工作区路径。所有路径都相对于工作区根目录，绝对路径与含 `..` 的路径会被拒绝。

| 方法 | 返回 | 说明 |
| --- | --- | --- |
| `workspace()` | `{ id, path } \| null` | 当前会话所在工作区；没有选中会话时为 `null` |
| `read(path, { offset, limit, unit })` | `string` | 读整文件或片段；`unit` 为 `line`（默认，0 基行偏移）或 `byte`；整文件上限 1 MB |
| `write(path, content, { mode })` | `{ bytes, total }` | `mode: 'replace'`（默认，整体覆盖）或 `'append'`（追加）；自动建父目录，结果上限 1 MB |
| `append(path, content)` | `{ bytes, total }` | 追加到文件末尾，等价 `write(..., { mode: 'append' })`；文件不存在则创建 |
| `replace(path, search, replacement, { limit })` | `{ replaced, bytes }` | 文本替换；`limit` 默认 `1`，`0` 表示全部；空 `search` 被拒绝；无命中不写盘 |
| `list(path = '.')` | `{ name, type, size? }[]` | 列目录，目录在前、名字排序，一次最多 2000 项 |

```js
const files = api.require('dsh-shape', 'files')
const workspace = files.workspace()          // { id, path } 或 null

await files.write('notes/todo.md', '# 任务\n')          // 整体覆盖
await files.append('notes/todo.md', '- 第二行\n')        // 追加
await files.replace('notes/todo.md', '任务', '待办')      // 只替换第一处
await files.replace('notes/todo.md', 'todo', 'done', { limit: 0 })  // 全部替换
await files.read('notes/todo.md')                        // 整文件
await files.read('notes/todo.md', { offset: 1, limit: 10 })         // 第 2 行起 10 行
await files.read('notes/todo.md', { offset: 0, limit: 64, unit: 'byte' })
await files.list('notes')
```

`write()` 默认是**整体覆盖**（截断后写入），不是追加；需要追加用 `append()` 或 `write(..., { mode: 'append' })`。`replace()` 基于当前文件内容做文本替换，写回时同样是整体写回。

文件操作由宿主侧的 `/dsh-shape/api/files` 路由执行，写入只会落在 `workspace().path` 之内；读取和列目录会校验解析后的真实路径，防止符号链接逃出工作区。没有打开工作区时调用文件方法会抛 `dsh-shape#files: no workspace is currently open`。

## ui

| 方法 | 说明 |
| --- | --- |
| `openSession(id)` / `openWorkspace(id)` | 导航 |
| `toggleSidebar()` / `selectPanel(id \| null)` | 布局 |
| `getTheme()` / `setTheme(id)` | 读 `{ id, preference }`、切主题 |
| `send(text)` / `cancelTurn()` | 对当前会话发消息、取消本轮 |
| `notify(text, { tone, timeout })` | 弹一条提示 |
| `openShapeBrowser()` | 打开形态浏览器 |

宿主缺对应服务时方法会抛错。

## shortcuts

| 方法 | 说明 |
| --- | --- |
| `register({ id, label, aliases?, keys?, regions?, modals?, run })` | 注册一个 `shape.<shapeId>.<id>` 命令，返回注销函数 |
| `list()` | 本形态的命令目录（含按键、是否改过、冲突、问题） |

- `keys` 形如 `Ctrl+Alt+M`，省略则命令存在但默认不绑定；
- `regions` 决定生效范围：`page`（默认）、`editable`（输入框聚焦时）、`terminal`；
- 重复 id 或与已有默认键冲突时抛错；
- **Web 宿主对组合键有额外限制**：`web:linux` 只接受 `Ctrl+/`、`Ctrl+Shift+,`、`Ctrl+Shift+.`。插件会跳过该 profile 的默认值，并在注册被拒时回退为只注册桌面默认值。

## slots

| 方法 | 说明 |
| --- | --- |
| `list()` | 每个槽位的表现、宿主是否渲染、当前占用数 |
| `mount(slot, render, options?)` | 往槽位挂载，返回注销函数；`options.placement` 为 `anchored`（默认）或 `floating`（仅 `conversation.input.overlay`），`options.snap` 默认 `true` |
| `entries(slot)` | 本形态在该槽位的占用数 |

## events

| 方法 | 说明 |
| --- | --- |
| `emit(type, payload)` | 广播给所有订阅者 |
| `on(type, handler)` | 订阅，返回退订函数 |

名字用普通字符串、按约定加命名空间（如 `mcp-manager/servers-changed`）。处理函数抛错会被隔离并记录；形态关闭时它的订阅自动释放。

## storage

| 方法 | 说明 |
| --- | --- |
| `get(key)` | 读，没有则 `null` |
| `set(key, value)` | 写 JSON |
| `remove(key)` | 删 |
| `keys()` | 列出键 |

键匹配 `[a-z0-9][a-z0-9._-]{0,63}`，单值上限 256 KB，文件落在 `<形态目录>/data/<key>.json`。内置形态只读。

## composer

| 方法 | 说明 |
| --- | --- |
| `getText()` | 当前草稿 |
| `setText(text)` | 整体替换 |
| `insert(text)` | 在光标处插入 |
| `submit()` | 发送当前草稿 |
| `sessionId()` | 当前挂载的会话 id |

跟随当前挂载的输入框；没有输入框时调用会抛 `dsh-shape#composer: no composer is mounted`。

## conversation

| 方法 | 说明 |
| --- | --- |
| `messages()` | 已渲染的消息行 `{ id, turn, text }` |
| `find(text, { caseSensitive, limit })` | 返回 `{ messageId, index, preview }[]`，默认不区分大小写、上限 100 |
| `reveal(messageId)` | 滚动到该行（`block: 'center'`） |
| `subscribe(listener)` | 会话内容变化时回调，返回退订函数 |

只能读到**已渲染**的轮次；更早的历史要等对话自己加载出来。底层读的是 DOM 上的 `[data-chat-anchor-key]`，所以它反映的是屏幕上的内容，而不是完整会话记录。

## mcp

读写 DSH 的 MCP 服务器配置：服务器行、工作区作用域、工作区 `.dsh/mcp.json` 的信任，以及单个会话实际能看到的服务器。数据由 `dsh-mcp-setting` 插件管理，本能力通过它的 `/dsh-mcp-setting/api` 接口读写 `cordis.patch.yml` 与工作区规则文件。

| 方法 | 返回 | 说明 |
| --- | --- | --- |
| `available()` | `boolean` | 接口是否可达；没装 `dsh-mcp-setting` 时为 `false` |
| `list()` | `McpServer[]` | 所有服务器行，按补丁文件顺序，主配置在前 |
| `projects()` | `{ projectsEnabled, projects }` | 已发现的工作区配置，含信任状态与声明摘要 |
| `get(id)` | `McpServer \| null` | 按 loader 行 id 取一条 |
| `add({ id, ...draft })` | `McpState` | 追加到主配置文件 |
| `update(id, draft)` | `McpState` | 就地改写该行所在文件里的 config |
| `remove(id)` | `McpState` | 删除该行与它的工作区规则；`insert` 变空时整条补丁一起删 |
| `setMode(id, mode, patterns?)` | `McpState` | `global` 全局加载、`workspace` 按路径挂载、`disabled` 关闭 |
| `setProjectTrusted(dir, trusted)` | `McpState` | 信任或撤销某工作区的 `.dsh/mcp.json` |
| `session(sessionId)` | `McpSession` | 该会话能看到的服务器（全局 → 工作区 → 工作区文件） |

`McpServer` 形如：

```js
{
  id: 'mcp-fs',                  // loader 行 id
  serverName: 'fs',              // 工具命名空间前缀 mcp__<serverName>__
  transport: 'stdio',            // 或 'streamable-http'，读不出时为 null
  endpoint: 'npx -y pkg',        // stdio 是命令行，http 是 URL
  disabled: false,
  mode: 'global',                // global | workspace | disabled
  workspacePatterns: [],         // workspace 模式下的路径模式
  workspaceSessions: 0,          // 当前按规则挂载了它的会话数
  status: { state: 'connected', toolCount: 12 },
  scope: 'home',                 // 'home' 或 'profile:web'
  file: 'C:/Users/…/cordis.patch.yml',
  config: { /* 原始 config，含设置页不展示的 reconnect 等字段 */ },
}
```

`McpState` 是所有写操作回执的公共形状：`{ homeFile, workspaceFile, projectsEnabled, projects, servers }`。面板可以只凭一次写回执整页重绘。

`projects()` 的每一项是 `{ dir, file, trusted, entries, error, lastSeen }`；`entries` 里是 `{ serverName, transport, summary, cwd }`。工作区配置默认不挂载，`trusted` 为 `true` 之后其声明才会在匹配的会话里生效——`setProjectTrusted(dir, true)` 就是这个开关。

`session(sessionId)` 返回 `{ sessionId, cwd, projectsEnabled, servers }`，其中 `servers` 是 `{ serverName, source, transport, summary, toolCount, mounted }`，`source` 为 `global`、`workspace` 或 `project`。会话 id 可以用 `dsh-shape#composer` 的 `sessionId()` 取。

`draft` 用结构化字段，而不是设置页那套表单字符串：

```js
{
  serverName: 'github',
  transport: 'streamable-http',        // 或 'stdio'
  url: 'https://mcp.example.com/mcp',
  headers: { Authorization: 'Bearer …' },
}
```

stdio 用 `command`、`args`（数组）、`cwd`、`env`；streamable-http 用 `url`、`headers`。`update()` 传的是完整草稿：省略的字段会被清空，切换传输方式时另一侧的字段一并移除，但草稿之外的高级字段（`reconnect`、`toolCallTimeoutMs` 等）保留。

`setMode(id, 'workspace', patterns)` 的 `patterns` 是工作区路径模式：`*` 匹配一段、`**` 跨段、`?` 匹配一个字符，目录模式覆盖其下所有路径，Windows 上不区分大小写；`workspace` 模式至少需要一条。

所有方法都是异步的，失败时抛 `dsh-shape#mcp: …`。**没装 `dsh-mcp-setting` 时能力仍然注册**：`available()` 返回 `false`，其余方法抛错并点名该插件。字段校验在插件侧完成（id 与 serverName 唯一、stdio 必须有 command、workspace 至少一条路径等），错误信息原样带回。写入由 DSH 的配置热加载即时生效，不需要重启。
