# 形态目录

一个形态就是一个目录。除了 `package.json` 全部可选，按需要加。

```
<shape-id>/
├── package.json      清单（必需）
├── views/            独立视图：index.html 及其资源
├── slots/            槽位声明：每个 *.json 描述一个槽位条目
├── client/           客户端模块：index.js，导出 activate(api)
├── actions.js        无 DOM 的行为与测试，可被 shape_test 直接跑
├── tools/            工具元数据（当前不执行）
└── data/             形态自己的数据（由 storage 能力写入，勿手工维护）
```

## 清单

```json
{
  "name": "my-shape",
  "version": "0.1.0",
  "type": "module",
  "title": "My Shape",
  "description": "一句话说明这个形态做什么。",
  "output": "text",
  "shape": {
    "apiVersion": 1,
    "requires": [
      { "plugin": "dsh-shape", "capability": "core", "version": "^1.0.0" }
    ]
  }
}
```

| 字段 | 必需 | 说明 |
| --- | --- | --- |
| `name` | 是 | 形态 id，同时是目录名；小写字母、数字、连字符 |
| `version` | 否 | 展示用版本，默认 `0.0.0` |
| `type` | 有 `client/` 时 | 写 `module`，客户端模块按 ESM 加载 |
| `title` | 否 | 显示名，默认等于 id |
| `description` | 否 | 卡片上的说明 |
| `output` | 否 | `text`（默认） |
| `shape.apiVersion` | 否 | 默认 1；ABI 版本 |
| `shape.requires` | 否 | 能力依赖列表 |

`shape.requires` 的每一项是 `{ plugin, capability, version, optional? }`：`plugin` 目前固定 `dsh-shape`，`capability` 取[能力参考](capabilities.md)里的名字，`version` 是 semver 范围。缺能力或版本不匹配时形态不启动，槽位条目也不会显示。

## 视图（views/）

`views/index.html` 是这个形态的独立页面，通过 `/dsh-shape/view/<id>/` 提供。视图是普通网页，**拿不到客户端 API**；需要读宿主数据时用 `fetch('/dsh-shape/api/…')`。

## 槽位条目（slots/）

每个 JSON 文件声明一个槽位条目，例如聊天卡片：

```json
{
  "slot": "conversation.input.dock",
  "title": "对话内搜索",
  "text": "Ctrl+F 在聊天记录里搜索",
  "button": "开始",
  "icon": "search"
}
```

10 个受支持槽位：

| 槽位 | 表现 |
| --- | --- |
| `conversation.input.dock` | 输入框上方的卡片栈 |
| `conversation.input.overlay` | 输入框上方的浮窗（可固定、可自由浮动、边缘吸附） |
| `conversation.composer.dock` | 输入框下方的信息条 |
| `conversation.input.left` / `.right` | 输入条两侧的 chip |
| `conversation.session.header.actions` | 会话头部操作区 |
| `conversation.session.header.utilities` | 会话头部右侧工具区 |
| `conversation.hero.options` | New Session 页面的选项行 |
| `conversation.session.header.views.actions` | View 菜单行 |
| `shell.overlay` | 覆盖整个应用的浮层（片头、命令面板） |

## 客户端（client/）

`client/index.js` 必须导出 `activate(api)`，返回的函数会在形态关闭时调用：

```js
export function activate(api) {
  const ui = api.require('dsh-shape', 'ui')
  const off = api.mount('conversation.input.left', (container) => {
    const chip = document.createElement('span')
    chip.textContent = '就绪'
    container.append(chip)
    return () => chip.remove()
  })
  ui.notify('hello 已启用')
  return () => off()
}
```

- `api.shape` 是 `{ id, title, version }`；
- `api.require(plugin, capability)` 返回能力对象，未声明或版本不符时抛错；
- `api.mount(slot, render, options?)` 往槽位挂 DOM，`render(container)` 返回清理函数；
- `api.panel(...)` 注册一个浮动面板，`open()` 后在会话输入区上方显示；`api.tab(...)` 注册右侧页签（见[已知问题](known-issues.md)）。

## 行为与测试（actions.js）

把不依赖 DOM 的逻辑放这里，并用 `shape_test` 跑：

```js
export function summarize(servers) {
  return `${servers.length} 个服务器`
}

export const tests = [
  { name: '空列表', run: () => summarize([]) === '0 个服务器' },
]
```

`shape_test` 在 Node 里执行 `tests`，不需要浏览器。

## 数据（data/）

`dsh-shape#storage` 把值写成 `<形态目录>/data/<key>.json`。键匹配 `[a-z0-9][a-z0-9._-]{0,63}`，单值上限 256 KB。内置形态只读，写入会失败。
