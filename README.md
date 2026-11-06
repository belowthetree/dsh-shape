# dsh-shape

[中文](README.md) | [English](README.en.md)

dsh-shape 是一个 DeepSeek Harness 插件，为 DSH 增加快速自定义界面和功能的能力：一个 shape 文件夹可以即时添加一个窗口、修改聊天 UI，或新增工具扩展。放进 `shapes/` 后刷新即可生效，不需要重启 DSH。

## 可以添加什么

| 扩展 | 目录 | 效果 |
|---|---|---|
| 窗口 | `views/` | 在第二个窗口展示 shape 自己的界面 |
| UI | `slots/` | 向聊天界面注入卡片等界面元素 |
| 工具 | `tools/` | 声明该 shape 的工具模块与入口 |

当前已可用的是窗口和 `conversation.input.dock` 聊天卡片；工具会被发现和登记，执行运行时还在接入中。

## 能力

- 在对话顶栏打开 **Shapes** 浏览器，以应用网格查看所有 shape
- `Ctrl + .` 快速打开
- 点击 shape 卡片，在第二个窗口展示它的 `views/` 界面
- 通过 `slots/*.json` 向聊天输入区上方注入卡片
- 每个 shape 带持久开关，停用后关闭它的界面、聊天卡片和逻辑
- 新增或修改 shape 文件夹后，刷新即可生效，无需重启 DSH

## Shape 文件夹

```text
shapes/greeting/
  package.json
  views/index.html
  slots/chat-card.json
  tools/greet.js
```

`package.json` 当前读取 `name`（shape id）、`version`、`title`、`description`、`input` 和 `output`。

扫描位置：

- 插件内置的 `shapes/`
- `$DSH_HOME/dsh-shape/shapes/`

## 聊天卡片

`slots/*.json` 可以声明一张聊天气泡卡片：

```json
{
  "slot": "conversation.input.dock",
  "title": "来自 Greeting Shape 的卡片",
  "text": "这个卡片由 shape 注入到聊天输入区上方。",
  "button": "打个招呼",
  "greeting": "你好！👋 这是 Greeting Shape 的问候。"
}
```

当前支持 `conversation.input.dock`，卡片显示在输入框上方；点击按钮后显示 `greeting` 文本。

## 开关

每张 shape 卡片右上角的开关控制该 shape 的全部界面和逻辑：

- 关闭后聊天卡片立即消失
- 无法再从卡片打开它的 view；直接访问 view 路由也返回 404
- 开关状态保存在 `$DSH_HOME/dsh-shape/state.json`，重启后保持
- Host 接口：`POST /dsh-shape/api/toggle`，请求体 `{ "id": "greeting", "enabled": false }`

## 即时生效

shape 文件夹的改动不需要重启 DSH：

- 新增 shape：放进 `shapes/` 后点一次刷新
- 修改 `slots/*.json`：刷新后聊天卡片同步更新
- 修改 `views/`：下次打开 view 时读取新内容
- 开关状态：切换后立即生效并持久化

> 修改 dsh-shape 插件自身的 Host / Client 代码仍需重新构建并重启 DSH。

## 安装

```sh
dsh plugin --profile <profile> add link:E:/Project/dsh-plugins/dsh-shape
```

启动 profile 后，在对话顶栏点击 **Shapes**。插件要求 `dsh >= 0.2.2-rc.1`。

测试 profile：`dsh-shape-test`，端口 3904。

## 当前边界

- `tools/` 目前只登记，不执行
- 仅实现 `conversation.input.dock` 这一种 slot 卡片
- view 运行在 sandbox iframe 中

## 开发

- `index.js`：Host 入口，负责扫描 shape 文件夹、解析 slot 描述、提供 API 和 view 路由
- `client.js`：Client 入口，负责顶栏按钮、Shape 浏览器、view 窗口和聊天卡片
- `src/`：原始 TypeScript 源码

`index.js` 和 `client.js` 是预构建产物；当前没有独立的本地构建脚本，修改源码后需要重新生成这两个入口文件。
