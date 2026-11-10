# 开发与发布

改这个包本身时，在本仓库里工作的 agent 会自动看到 `.dsh/skills/dsh-shape-contribution/` 这份项目级 skill（DSH 会扫描 `<projectRoot>/.dsh/skills`）：它把下面这些规则按「动手前 / 三道门 / 拼接 / 预设 / 发布」组织好了。本文档保留同样的信息，供人直接翻阅。

## 本地联调

```sh
# 装到某个 profile（web / desktop / tui）
dsh plugin --profile web add link:E:/Project/dsh-plugins/dsh-shape

# 起一个 web 实例（--port 0 让系统分配端口）
dsh web --no-open --port 0
```

`link:` 在 Windows 上可能因为权限失败（`EPERM: operation not permitted, symlink`）。退路是把包内容复制进 profile 的 `node_modules/@belowthetree/dsh-shape/`，跳过 `node_modules`、`.git`、`demo`。

改动生效方式：

| 改了 | 需要做什么 |
| --- | --- |
| `client.js` | 重新加载页面 |
| `index.js` / `tools.js` / `cordis.patch.yml` | 重启 `dsh web` |
| 形态目录（`~/.dsh/dsh-shape/shapes/…`） | 在形态面板点刷新（或 `POST /dsh-shape/api/refresh`）；只有变了的形态在页内重启，页面不重载 |

确认宿主插件真的起来了：

```sh
curl http://127.0.0.1:<port>/dsh-shape/api/health
# {"ok":true,"count":6,"capabilities":12,"roots":{...}}
```

`ok` 为真但 `count` 或 `capabilities` 为 0，说明形态目录没扫到或客户端还没同步能力。

## 目录与源码

只有 `client.js` 需要构建，其余入口都是手写 ESM：

| 入口 | 组成 |
| --- | --- |
| `index.js` | 八行 re-export，指向 `src/host/plugin.js` |
| `src/host/` | `plugin`（装配与路由分派）、`http`（JSON 与静态文件）、`shapes`（扫描与清单解析）、`data`（`/api/data`）、`files`（`/api/files` 工作区读写）、`shell`（`/api/shell` 命令行）、`paths`（两个路由共用的路径包含校验）、`state`（启停开关与能力镜像） |
| `client.js` | 由 `src/client/**` 与 `src/shared/**` 构建，按 `//#region` 分区 |
| `tools.js`、`skill.js` | 手写 |

`src/shared/` 被两侧共用：`capabilities.ts` 定义 ABI 与能力注册表，`version-range.ts` 是能力版本匹配用的 semver 子集。它替代了原先内联进 bundle 的 semver——那份占 `client.js` 的 28%，现在换成约 500 行自写实现，逐例行为由差分测试对齐。

宿主改成手写 JavaScript 之前，`src/host/index.ts` 与 `index.js` 是两份：`/api/data` 只进了产物，源码缺 148 行。现在只有一份，`src/host/*.js` 就是真相，改行为改这里即可。

## 发布前的三道检查

```sh
node scripts/check-client-bundle.mjs              # 整包加载 client.js 并调用 apply(ctx)
node scripts/gen-capability-fallback.mjs --check  # 静态能力清单与 bundle 一致
node scripts/check-tool-schemas.mjs               # 工具 schema 在 DSH 支持的子集内
```

三条都在 `.github/workflows/publish.yml` 里，版本未发布时依次执行后发布到 npm。

### 为什么需要这三道

- **整包加载**：`client.js` 是手工维护的 rolldown 产物，历史上出现过拼接把代码放到 `apply` 外面，导致工厂期 `ReferenceError`、客户端插件整体不可用。
- **能力清单一致**：`skills/shape-development/reference/capabilities.generated.json` 是 `shape_capabilities` 的兜底数据，和 bundle 里的能力定义必须同步。
- **工具 schema**：DSH 只接受 JSON Schema 的一个子集，`type` 必须是**单个字符串**。写了 `type: ['string', 'null']` 不会在加载时报错，而是让挂载该工具的预设行被判为不可用，整个 Shape Studio 预设从选择器消失。

## client.js 的维护方式

`client.js` 由 `src/client/*.ts(x)` 编译后按 `//#region ../../dsh-plugins/dsh-shape/src/client/<file>` 分区拼进 bundle。手工拼接时必须注意三件事，否则运行时报 `xxx is not defined`：

1. bundle 里 React 是**命名空间导入**（`let react = require("react")`），钩子要写成 `react.useRef(...)`，不能是裸 `useRef(...)`；
2. JSX 运行时是 `react_jsx_runtime.jsx(...)`，不是裸 `jsx(...)`；
3. 区域里不要留 `createElement` 这类未绑定的标识符——需要元素时从对应 Host 模块导出绑定组件（`createPanelComponent`、`createTabComponent`）。

拼接后必须跑 `node --check client.js` 和 `check-client-bundle.mjs`。

## 版本与发布

- 版本写在 `package.json`；发布由 GitHub Actions 在 `main` 上检测到未发布版本时自动执行。
- 只改文档或脚本也要递增版本，否则流水线会跳过发布。
- 查询发布结果以 registry 为准，npm CLI 缓存可能滞后：

```sh
curl https://registry.npmjs.org/@belowthetree%2Fdsh-shape/0.4.31
```

## 包内容

`files` 决定发布内容。随包发布的只有根目录的四个入口、`cordis.patch.yml`、`src/shared/capabilities.ts`、`shapes/` 与 `skills/`；`docs/`、`demo/`、`scripts/`、`.dsh/` 都不发布。新增目录时确认它被上面这条覆盖。

`shapes/` 里的内置形态随包发布，用户目录里的同名形态会覆盖它——调试内置形态时注意这一点，改的是哪一份。
