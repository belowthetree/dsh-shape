# dsh-shape

dsh-shape 是 DeepSeek Harness 的插件：把 shape 作为可安装的文件夹管理，并在对话顶栏提供 Shape 浏览器。

## 能力

- 扫描内置和用户 shape 文件夹
- 在对话顶栏显示 **Shapes** 按钮，点击打开大窗口，以应用网格展示所有 shape
- `Ctrl + .` 可从页面任意位置快速打开
- 展示 shape 的 title、id、description、来源、版本，以及 `views` / `slots` / `tools` 文件数量
- 点击任意 shape 卡片，在第二个窗口打开它的 `views/` 界面
- 支持刷新重扫，新 shape 放进目录后无需重启 DSH

## Shape 文件夹

```text
shapes/hello/
  package.json
  views/index.html
  slots/header.json
  tools/greet.js
```

`package.json` 当前读取 `name`（shape id）、`version`、`title`、`description`、`input` 和 `output`。

扫描位置：

- 插件内置的 `shapes/`
- `$DSH_HOME/dsh-shape/shapes/`

当前版本只做发现和展示：不执行 `tools/`，不渲染 `views/`，也不挂载 `slots/`。

## 安装

```sh
dsh plugin --profile <profile> add link:E:/Project/dsh-plugins/dsh-shape
```

启动 profile 后，在对话顶栏点击 **Shapes**。插件要求 `dsh >= 0.2.2-rc.1`。

测试 profile：`dsh-shape-test`，端口 3904。

## 开发

- `index.js`：Host 入口，负责扫描 shape 文件夹并提供 `/dsh-shape/api`
- `client.js`：Client 入口，负责顶栏按钮和模态窗
- `src/`：原始 TypeScript 源码

`index.js` 和 `client.js` 是预构建产物；当前没有独立的本地构建脚本，修改源码后需要重新生成这两个入口文件。
