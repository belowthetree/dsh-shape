# dsh-shape

[中文](README.md) | [English](README.en.md)

[![dsh-shape 海报](https://raw.githubusercontent.com/belowthetree/dsh-shape/main/demo/poster.png)](https://github.com/belowthetree/dsh-shape/blob/main/demo/dsh-shape-demo.mp4)

dsh-shape 是 DeepSeek Harness 插件，提供一种**动态轻量扩展形态**：一个 shape（形态）就是一份清单加可选脚本，即时给 DSH 加上界面、聊天卡片和页面级快捷操作。

## 能做什么

- **Shape 浏览器**：在对话顶栏打开应用网格，浏览所有形态；按 `Ctrl + .` 快速打开
- **独立视图**：点击形态卡片，在第二个窗口展示该形态自己的界面
- **会话槽位**：10 个槽位可选——输入框上方的卡片栈、下方的信息条、上方的浮窗（可固定、可自由浮动、靠近屏幕边缘自动吸附）、输入条左右与顶栏的状态 chip、New Session 选项、View 菜单行，以及覆盖全应用的全屏层（片头、命令面板这类）；客户端模块还能用 `api.mount()` 在受支持槽位里渲染自己的 DOM
- **侧栏面板**：`api.panel()` 把面板挂到左侧栏，点一下就在主区域打开，随形态启停一起出现和消失
- **右侧页签**：`api.tab()` 往右侧栏加一种页面，`open()` 打开，同一页重复打开只聚焦不重复
- **单个开关**：每个形态独立启停；关闭后它的视图、槽位条目和客户端逻辑一起失效
- **客户端逻辑**：形态可以注册页面级行为和快捷键，并按需读取已声明能力的接口
- **删除形态**：卡片右上角的删除按钮，确认后把该形态目录从磁盘移除
- **能力依赖**：形态声明需要的插件能力与版本，缺少依赖时不会启动，也不会显示槽位条目
- **能力目录**：可以查看当前有哪些形态可用能力、版本、用途、用法和 API 方法名
- **内置能力**：9 个内置能力覆盖工作区切换、界面控制、快捷键、槽位、事件、存储、输入框与对话读取，见下文[内置能力](#内置能力)
- **即时生效**：新增或修改形态目录后刷新即可，不需要重启 DSH

## 内置能力

形态在 `package.json` 的 `shape.requires` 里声明需要的能力，再用 `api.require('dsh-shape', '<能力>')` 取用；缺少能力或版本不匹配时形态不会启动。

| 能力 | 版本 | 方法 | 用途 |
| --- | --- | --- | --- |
| `dsh-shape#core` | 1.0.0 | 字段 `apiVersion` | 判断形态 ABI |
| `dsh-shape#workspace` | 1.0.0 | `list` `current` `next` `previous` | 切换工作区，并展开、滚动到目标分组 |
| `dsh-shape#ui` | 1.0.0 | `openSession` `openWorkspace` `toggleSidebar` `selectPanel` `getTheme` `setTheme` `send` `cancelTurn` `notify` `openShapeBrowser` | 控制 DSH 界面：导航、面板、主题、对话、通知、打开 Shapes |
| `dsh-shape#shortcuts` | 1.0.0 | `register` `list` | 把形态动作注册成 DSH 命令，用户可在设置里重绑；`regions` 决定输入框聚焦时是否也触发 |
| `dsh-shape#slots` | 1.0.0 | `list` `mount` `entries` | 查询 10 个槽位、运行时挂载、统计占用 |
| `dsh-shape#events` | 1.0.0 | `emit` `on` | 形态之间收发事件 |
| `dsh-shape#storage` | 1.0.0 | `get` `set` `remove` `keys` | JSON 数据存到形态目录的 `data/` 下 |
| `dsh-shape#composer` | 1.0.0 | `getText` `setText` `insert` `submit` `sessionId` | 读写当前输入框草稿，可插入或直接发送 |
| `dsh-shape#conversation` | 1.0.0 | `messages` `find` `reveal` `subscribe` | 读取已渲染的对话、搜索并跳转到某条消息 |

```js
const ui = api.require('dsh-shape', 'ui')
const shortcuts = api.require('dsh-shape', 'shortcuts')
const store = api.require('dsh-shape', 'storage')

shortcuts.register({ id: 'summary', label: '显示 MCP 摘要', keys: 'Ctrl+Alt+M', run: () => ui.notify('3 个服务器') })
await store.set('collapsed', true)   // → <shape>/data/collapsed.json
```

`shape_capabilities` 工具会列出当前所有能力、版本、用途、用法和 API 方法名。

## 演示

![dsh-shape 演示](https://raw.githubusercontent.com/belowthetree/dsh-shape/main/demo/dsh-shape-demo.gif)

36 秒功能演示：[1080p MP4](https://github.com/belowthetree/dsh-shape/blob/main/demo/dsh-shape-demo.mp4) · [演示源码与复现步骤](https://github.com/belowthetree/dsh-shape/tree/main/demo)

## Shape Studio 预设

安装后新增 **Shape Studio** 预设，用于开发形态和扩展插件：

- 提供查看、检查、创建和校验形态的工具，以及可查询形态能力目录的工具
- 附带形态开发 skill，并可按主题读取完整接口与规范
- 提供 Cordis 检查、插件安装与管理、插件市场
- 附带插件开发与预设编辑相关的 skill

这些工具和 skill 只在 Shape Studio 中可见，其他预设不会看到。

## 安装

npm 包名：**`@belowthetree/dsh-shape`**

```sh
dsh plugin --profile <profile> add @belowthetree/dsh-shape
```

把 `<profile>` 换成要安装的 profile（如 `desktop`、`web`），然后重启该 profile。

其他安装方式：

- GitHub 仓库：`dsh plugin --profile <profile> add github:belowthetree/dsh-shape`
- 本地开发：`dsh plugin --profile <profile> add link:/path/to/dsh-shape`
- 插件管理器：在 DSH 的插件管理器中按包名 `@belowthetree/dsh-shape` 或仓库 `belowthetree/dsh-shape` 安装

要求 DSH `>= 0.2.2-rc.1`。安装后点击对话顶栏的 **Shapes**，或按 `Ctrl + .` 打开。

> 从旧的无作用域包名 `dsh-shape` 升级：先 `dsh plugin --profile <profile> remove dsh-shape`，再按上面的命令安装，最后把 profile 的 `dsh.profile.bundles` 里的 `dsh-shape` 改成 `@belowthetree/dsh-shape`。
