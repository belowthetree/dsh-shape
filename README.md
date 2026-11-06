# dsh-shape

[中文](README.md) | [English](README.en.md)

dsh-shape 是 DeepSeek Harness 插件，用 shape 文件夹扩展 DSH 的界面、聊天卡片和工作区快捷操作。

## 能做什么

- **Shape 浏览器**：在对话顶栏打开应用网格，浏览所有 shape；按 `Ctrl + .` 快速打开
- **独立视图**：点击 shape 卡片，在第二个窗口展示该 shape 自己的界面
- **聊天卡片**：把 shape 提供的卡片注入聊天输入区上方，按钮可显示问候或提示内容
- **单个开关**：每个 shape 独立启停；关闭后它的视图、聊天卡片和客户端逻辑一起失效
- **客户端逻辑**：shape 可以注册页面级行为和快捷键，并按需读取已声明能力的接口
- **工作区切换**：内置上一个/下一个工作区快捷键，分别为 `Ctrl + Alt + ←` 和 `Ctrl + Alt + →`
- **能力依赖**：shape 声明需要的插件能力与版本，缺少依赖时不会启动，也不会显示聊天卡片
- **能力目录**：可以查看当前有哪些 shape 可用能力、版本和 API 方法名
- **即时生效**：新增或修改 shape 文件夹后刷新即可，不需要重启 DSH

## Shape Studio 预设

安装后新增 **Shape Studio** 预设，用于开发 shape 和扩展插件：

- 提供查看、检查、创建和校验 shape 的工具，以及可查询 shape 能力目录的工具
- 附带 shape 开发 skill，并可按主题读取完整接口与规范
- 提供 Cordis 检查、插件安装与管理、插件市场
- 附带插件开发与预设编辑相关的 skill

这些工具和 skill 只在 Shape Studio 中可见，其他预设不会看到。

## 安装

- CLI：`dsh plugin --profile <profile> add github:belowthetree/dsh-shape`
- 本地开发：`dsh plugin --profile <profile> add link:/path/to/dsh-shape`
- 也可以在 DSH 的插件管理器中安装 GitHub 仓库 `belowthetree/dsh-shape`

安装后重启对应的 DSH profile。要求 DSH `>= 0.2.2-rc.1`。

启动后点击对话顶栏的 **Shapes**，或按 `Ctrl + .` 打开。
