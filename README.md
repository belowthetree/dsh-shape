# dsh-shape

[中文](README.md) | [English](README.en.md)

[![dsh-shape 海报](https://raw.githubusercontent.com/belowthetree/dsh-shape/main/demo/poster.png)](https://github.com/belowthetree/dsh-shape/blob/main/demo/dsh-shape-demo.mp4)

dsh-shape 是 DeepSeek Harness 插件，用 shape 文件夹扩展 DSH 的界面、聊天卡片和页面级快捷操作。

## 能做什么

- **Shape 浏览器**：在对话顶栏打开应用网格，浏览所有 shape；按 `Ctrl + .` 快速打开
- **独立视图**：点击 shape 卡片，在第二个窗口展示该 shape 自己的界面
- **会话槽位**：9 个槽位可选——输入框上方的卡片栈、下方的信息条、上方的浮窗（可固定、可自由浮动、靠近屏幕边缘自动吸附）、输入条左右与顶栏的状态 chip、New Session 选项、View 菜单行；客户端模块还能用 `api.mount()` 在受支持槽位里渲染自己的 DOM
- **单个开关**：每个 shape 独立启停；关闭后它的视图、槽位条目和客户端逻辑一起失效
- **客户端逻辑**：shape 可以注册页面级行为和快捷键，并按需读取已声明能力的接口
- **删除 shape**：卡片右上角的删除按钮，确认后把该 shape 目录从磁盘移除
- **能力依赖**：shape 声明需要的插件能力与版本，缺少依赖时不会启动，也不会显示槽位条目
- **能力目录**：可以查看当前有哪些 shape 可用能力、版本、用途、用法和 API 方法名
- **即时生效**：新增或修改 shape 文件夹后刷新即可，不需要重启 DSH

## 演示

![dsh-shape 演示](https://raw.githubusercontent.com/belowthetree/dsh-shape/main/demo/dsh-shape-demo.gif)

36 秒功能演示：[1080p MP4](https://github.com/belowthetree/dsh-shape/blob/main/demo/dsh-shape-demo.mp4) · [演示源码与复现步骤](https://github.com/belowthetree/dsh-shape/tree/main/demo)

## Shape Studio 预设

安装后新增 **Shape Studio** 预设，用于开发 shape 和扩展插件：

- 提供查看、检查、创建和校验 shape 的工具，以及可查询 shape 能力目录的工具
- 附带 shape 开发 skill，并可按主题读取完整接口与规范
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
