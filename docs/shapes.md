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
| `shape.kind` | 否 | `shape`（默认）或 `workbench`；`workbench` 才能在[工作台](#工作台)里渲染 |
| `shape.requires` | 否 | 能力依赖列表 |

`shape.requires` 的每一项是 `{ plugin, capability, version, optional? }`：`plugin` 目前固定 `dsh-shape`，`capability` 取[能力参考](capabilities.md)里的名字，`version` 是 semver 范围。缺能力或版本不匹配时形态不启动，槽位条目也不会显示。

## 视图（views/）

`views/index.html` 是这个形态的独立页面，通过 `/dsh-shape/view/<id>/` 提供。视图是普通网页，**拿不到客户端 API**；需要读宿主数据时用 `fetch('/dsh-shape/api/…')`。

两处入口：在 Shape 浏览器里点形态卡片，第二个窗口会显示它；客户端模块也可以用 `api.edge({ view: 'index.html' })` 把同一个页面放进[边缘弹窗](#边缘弹窗)。

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
- `api.require('dsh-shape', 'files')` 提供工作区文件能力：`workspace()` 返回 `{ id, path }`，`read()`（可带行/字节范围）、`write()`（默认整体覆盖，可追加）、`append()`、`replace()`、`list()` 以工作区为根操作文件（见[能力参考](capabilities.md#files)）。
- `api.mount(slot, render, options?)` 往槽位挂 DOM，`render(container)` 返回清理函数；
- `api.panel(...)` 注册一个浮动面板，`open()` 后在会话输入区上方显示；`api.tab(...)` 注册右侧页签（见[已知问题](known-issues.md)）；
- `api.edge(...)` 注册一个边缘弹窗，从屏幕边缘滑入并显示 `views/` 里的页面（见下）；
- `api.workbench(...)` 注册一个工作台界面，`open()` 后显示在约占 80% 视口的「shape 工作台」窗口里（见[工作台](#工作台)）。
- 客户端模块用**相对路径**互相 import（`import './view.js'`）。宿主把内容签名放进 URL 路径段（`/client/<id>/@<hash>/index.js`），相对 import 会跟着解析到同一段，所以改文件后在面板点刷新就能生效；写成绝对路径（`/dsh-shape/client/<id>/x.js`）的文件不会被版本化，改了要重新加载页面。

## 边缘弹窗

`api.edge()` 注册一个贴着屏幕边缘的窗口，`open()` 时从该边缘居中的位置滑入，内容是形态自己的视图页面，`Esc` 关闭，拖动内边可以调整大小。

```js
export function activate(api) {
  const popup = api.edge({
    id: 'dock',
    title: '快捷面板',
    edge: 'top',            // top | right | bottom | left，默认 right
    view: 'index.html',     // views/ 下的文件，默认 index.html
    width: 'full',          // 像素或 'full'；top/bottom 写 full 即左右占满
    height: 300,            // 像素或 'full'；left/right 写 full 即上下占满
    keys: 'Ctrl+Alt+E',     // 可选；绑定一个切换窗口的页面级快捷键
    resizable: true,        // 可选；默认 true，可拖内边调整大小
    esc: true,              // 可选；默认 true
  })
  popup.open()
  return () => popup.dispose()
}
```

- 返回 `{ id, open, close, toggle, isOpen, dispose }`；`open()` 会把窗口提到最上方，多个弹窗可以同时开。
- 窗口内容是 `/dsh-shape/view/<id>/<view>` 的 `iframe`，沙箱**不带 `allow-same-origin`**：视图拿不到宿主 DOM、cookie 或客户端 API，需要交互能力就把逻辑写在 `client/` 里。
- `keys` 走页面级 `keydown`，不受 Web 组合键限制，也不会出现在设置里；要可重绑的命令，用 `dsh-shape#shortcuts` 注册并在 `run` 里调用 `popup.toggle()`。
- `esc: false` 只关掉 `Esc`：标题栏的关闭按钮始终可用，鼠标点进视图内部后 `Esc` 也不会传到宿主（沙箱 iframe 是独立文档）。
- `width`/`height` 默认按边缘取（left/right 380×560，top/bottom 640×420），可以是像素或 `'full'`；`'full'` 沿该轴占满视口（锚定边仍留 12px），例如 `edge: 'top'` + `width: 'full'` 就是一条左右占满的横条。
- 窗口默认可调整大小：拖右侧窗口的左边、左侧窗口的右边、上方窗口的下边、下方窗口的上边，最小 240×160；尺寸存在 `localStorage` 里，下次打开沿用。`resizable: false` 关闭调整；某一轴是 `'full'` 时该轴不可调整。
- 顶部区域会避开 DSH 的窗口顶栏：上方窗口从顶栏下方 12px 开始，左右窗口和上下占满的窗口也从顶栏下方开始，全屏时顶栏高度按 0 处理（`--dsh-frame-chrome-top`）。普通浏览器里没有这条顶栏，位置不受影响。
- 视图文件不存在时 `api.edge()` 直接抛错并列出可用的 `views`。

## 工作台

工作台是顶栏左侧 **shape 工作台** 按钮（或 `Ctrl + Alt + W`）打开的独立窗口，约占视口 80%。窗口没有标题栏，形态内容直接铺满整个窗口。窗口没有关闭按钮：按 `Esc`、点窗口外的空白处、或再按一次 `Ctrl + Alt + W` 关闭。

窗口打开时，**窗口下方**的标签条列出所有已注册的工作台：名称下方的圆点表示当前选中情况，空心圆是未选中，白色实心圆是当前工作台。按 `Ctrl + Alt + ←/→`（环形）切换，点击名称也可以切换；选择会被记住，下次打开仍停在上一项。窗口打开期间这个组合键只作用于工作台，不会触发布内的 `workspace-tab-switch`。

只有 `package.json` 里声明 `"shape": { "kind": "workbench" }` 的形态才能注册工作台内容。在 `client/index.js` 里：

```js
export function activate(api) {
  const workbench = api.workbench({
    id: 'main',
    title: '任务工作台',
    order: 100,
    render: (container) => {
      container.textContent = '这里由形态自己渲染'
      return () => { /* 可选清理 */ }
    },
  })
  return () => workbench.dispose()
}
```

- `render(container)` 拿到的是工作台窗口自己的容器，直接写 DOM；返回值在窗口关闭或切到别的工作台时执行。
- 工作台内容在宿主文档里渲染，不是沙箱 iframe，因此 `Esc`、`Ctrl + Alt + W` 和 `dsh-shape#shortcuts` 注册的快捷键都照常可用，也能直接使用 `api.require()` 拿到的能力。
- 每个工作台在窗口下方的标签条里占一项，`order`（默认 `100`）决定顺序；`id` 会命名空间化为 `shape:<形态 id>:<id>`，不同形态可以重名。
- 没有工作台形态时，窗口显示引导：用 Shape Studio 预设新建形态（`shape_scaffold` 传 `kind: 'workbench'` 可直接生成），或在 `shape` 块里写 `"kind": "workbench"` 并调用 `api.workbench()`。
- 形态被停用或加载失败时，它注册的工作台一起移除；窗口会在下一次打开时更新。

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
