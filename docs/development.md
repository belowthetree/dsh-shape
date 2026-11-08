# 开发与发布

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
| 形态目录（`~/.dsh/dsh-shape/shapes/…`） | 刷新页面即可，或 `POST /dsh-shape/api/refresh` |

确认宿主插件真的起来了：

```sh
curl http://127.0.0.1:<port>/dsh-shape/api/health
# {"ok":true,"count":6,"capabilities":9,"roots":{...}}
```

`ok` 为真但 `count` 或 `capabilities` 为 0，说明形态目录没扫到或客户端还没同步能力。

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
curl https://registry.npmjs.org/@belowthetree%2Fdsh-shape/0.4.13
```

## 包内容

`files` 决定发布内容。新增目录时确认它被覆盖：`client.js`、`index.js`、`tools.js`、`skill.js`、`cordis.patch.yml`、`src/`、`shapes/`、`skills/`。

`shapes/` 里的内置形态随包发布，用户目录里的同名形态会覆盖它——调试内置形态时注意这一点，改的是哪一份。
