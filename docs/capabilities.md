# 能力参考

9 个内置能力都由 `dsh-shape` 插件提供，版本 `1.0.0`。形态在清单里声明需要哪些能力，再用 `api.require('dsh-shape', '<能力>')` 取用。

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
| `register({ id, label, aliases?, keys?, regions?, modals?, run })` | 注册一个 `shape:<shapeId>:<id>` 命令，返回注销函数 |
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
