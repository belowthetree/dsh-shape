# 架构

dsh-shape 由三部分组成：一个 DSH 宿主插件、一个浏览器端 bundle，以及磁盘上的形态目录。

## 组成

```
@belowthetree/dsh-shape
├── index.js          宿主插件：HTTP 路由、形态发现与启停、能力目录写入
├── client.js         浏览器 bundle：槽位桥接、形态客户端加载、9 个能力
├── tools.js          Shape Studio 预设的工具集（9 个工具）
├── skill.js          Shape Studio 预设的形态开发 skill
├── cordis.patch.yml  包补丁：插入插件行与 preset-shape 预设行
├── shapes/           内置形态（随包发布，只读）
└── src/client/       client.js 的源码（TypeScript/TSX）
```

`package.json` 里两处声明决定它如何被加载：

- `dsh.bundle.patch`：包补丁路径。**bundle 条目只应用补丁，不加载包本身**，所以补丁必须同时插入 `dsh-shape` 插件行和 `preset-shape` 预设行。
- `dsh.client`：浏览器端的 `platform` 与 `inject` 列表。

## 宿主侧（index.js）

宿主插件在 `apply` 中挂载 HTTP 路由，并维护形态注册表：

| 路由 | 作用 |
| --- | --- |
| `GET /dsh-shape/api/health` | `{ ok, count, capabilities, roots }`，用来确认插件真的起来了 |
| `GET /dsh-shape/api/shapes` | 全部形态的描述（origin、version、valid、views、slots、tools、clientEntry） |
| `GET /dsh-shape/api/capabilities` | 客户端写入磁盘的能力镜像 |
| `POST /dsh-shape/api/refresh` | 重新扫描两个形态根 |
| `POST /dsh-shape/api/toggle` | `{ id, enabled }` 启停一个形态 |
| `POST /dsh-shape/api/delete` | 删除用户形态目录 |
| `GET/POST /dsh-shape/api/data` | 读写形态 `data/` 下的 JSON |
| `GET /dsh-shape/view/<id>/…` | 形态视图静态文件 |
| `GET /dsh-shape/client/<id>/…` | 形态客户端模块 |

形态根有两个，用户形态覆盖同 id 的内置形态：

- 内置：`<包目录>/shapes/`
- 用户：`$DSH_HOME/dsh-shape/shapes/`（默认 `~/.dsh/dsh-shape/shapes/`）

每个形态目录被读取为：清单（`package.json`）、`views/`、`slots/`、`client/`、`tools/`、`actions.js`。清单解析失败、ABI 不认识或 id 为空时 `valid` 为 `false`，该形态不会被加载。

## 客户端（client.js）

浏览器 bundle 通过模块加载器注册，`apply(ctx)` 里做四件事：

1. **槽位桥接**：为 10 个受支持槽位各注册一个桥接组件，把该槽位里所有启用形态的条目渲染出来；`shell.overlay` 单独注册为一个固定浮层。
2. **形态客户端加载**：按 `enabled` 拉取 `/dsh-shape/client/<id>/index.js`，在隔离作用域里调用形态导出的 `activate(api)`，并保存其返回的清理函数。
3. **能力实现**：实现 9 个能力（见[能力参考](capabilities.md)），按形态声明的 `requires` 做版本校验后再暴露。
4. **能力目录同步**：把当前能力清单 `POST` 回宿主的 `/api/capabilities`，落盘为 `$DSH_HOME/dsh-shape/capabilities.json`，供 `shape_capabilities` 工具读取。

形态 ABI 是 `apiVersion: 1`；声明了不兼容的 `apiVersion` 或缺少必需能力时，形态不启动，槽位里也不会出现它的条目。

## 数据与状态

- 形态自己的数据：`<形态目录>/data/<key>.json`，由 `dsh-shape#storage` 读写，单值上限 256 KB。
- 能力镜像：`$DSH_HOME/dsh-shape/capabilities.json`，由客户端写入、工具读取。
- 形态启停状态与槽位布局存在宿主侧，不写进形态目录。

## Shape Studio 预设

`cordis.patch.yml` 额外插入一个 `preset-shape` 预设行，它组合出一套只用于形态开发的环境：9 个形态工具、形态开发 skill，以及最小化的对话工具（不含 shell、通用文件系统、网络和插件安装）。这些工具和 skill 注册在预设作用域内，其他预设看不到。

预设里的 `shape-tools` 与 `shape-skill` 都来自本包：前者是 `tools.js`，后者是 `skill.js`（注册 `shape-development` skill，依赖 `skills` 服务）。
