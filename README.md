# dsh-shape

dsh-shape 是 DeepSeek Harness 的插件：把 shape 作为可安装的文件夹管理，并在对话顶栏提供 Shape 浏览器。

## 能力

- 扫描内置和用户 shape 文件夹
- 在对话顶栏显示 **Shapes** 按钮，点击打开大窗口，以应用网格展示所有 shape
- `Ctrl + .` 可从页面任意位置快速打开
- 展示 shape 的 title、id、description、来源、版本，以及 `views` / `slots` / `tools` 文件数量
- 点击任意 shape 卡片，在第二个窗口打开它的 `views/` 界面
- shape 的 `slots/*.json` 可以注入聊天输入区上方的卡片
- 每张 shape 卡片带开关，停用后隐藏它的聊天卡片并拒绝打开它的 view
- 支持刷新重扫，新 shape 放进目录后无需重启 DSH

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

`views/` 通过第二个模态窗展示；`tools/` 目前只登记、不执行。

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

## 安装

```sh
dsh plugin --profile <profile> add link:E:/Project/dsh-plugins/dsh-shape
```

启动 profile 后，在对话顶栏点击 **Shapes**。插件要求 `dsh >= 0.2.2-rc.1`。

测试 profile：`dsh-shape-test`，端口 3904。

## 开发

- `index.js`：Host 入口，负责扫描 shape 文件夹、解析 slot 描述并提供 `/dsh-shape/api`
- `client.js`：Client 入口，负责顶栏按钮、Shape 浏览器、view 窗口和聊天卡片
- `src/`：原始 TypeScript 源码

`index.js` 和 `client.js` 是预构建产物；当前没有独立的本地构建脚本，修改源码后需要重新生成这两个入口文件。
