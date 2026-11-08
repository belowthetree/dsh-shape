# 已知问题

按影响面排序。修好一条就删一条。

## api.panel() 在 Web 宿主不渲染正文

- **现象**：侧栏出现条目，点击后主区域被选中（高亮），但正文是空白；`open()` 不抛错。
- **证据**：`slots.entries('main')` 里有该 key；包装组件被 React 调用多次；但 `ShapePanelBody` 的 `useEffect` 一次都没执行——子树在提交前被丢弃。
- **已排除**：补 `locale`、补 `inject`、用 `ctx.effect` 包裹注册、去掉 `id`/`label`，都无效。
- **状态**：未修复。要定位需要在 `ui-renderer` 的 keyed 分发里打点，而这台机器重建客户端 bundle 会因 ACL 报 `os error 5`。
- **绕法**：把面板内容挂到 `api.mount('conversation.input.overlay', …)`（已验证可用）。

## 工具 schema 只支持单一 type

DSH 的 JSON Schema 子集不接受 `type: ['string', 'null']`。写了不会在加载时报错，而是让挂载该工具的预设行不可用，**整个 Shape Studio 预设从选择器消失**。可空字段一律用 `string` + 空串表示未知。`scripts/check-tool-schemas.mjs` 会在发布前拦住。

## Web 组合键限制

`web:linux` 只接受 `Ctrl+/`、`Ctrl+Shift+,`、`Ctrl+Shift+.`。其他组合在注册时会被拒（`Unsupported Web shortcut`）。插件会跳过该 profile，并在注册失败时回退为只注册桌面默认值，所以命令仍存在、仍可手动绑定，但 Web 上默认不生效。

## bundle 条目不等于插件行

`dsh.profile.bundles` 里的条目**只应用该包的 `cordis.patch.yml`**，不加载包本身。补丁里必须有 `insert: - id: dsh-shape, name: '@belowthetree/dsh-shape'`，否则插件（含客户端）根本不加载，`/dsh-shape/api/health` 返回 404、顶栏没有 Shapes 按钮。

## 内置形态与用户形态同名

用户目录（`~/.dsh/dsh-shape/shapes/`）里同 id 的形态会覆盖 `shapes/` 里的内置形态。调试内置示例时先确认改的是哪一份。

## 只在已渲染的内容里搜索

`dsh-shape#conversation` 读的是 DOM（`[data-chat-anchor-key]`），只能看到当前渲染出来的轮次；更早的历史要等对话自己加载。折叠的消息行需要先展开才能被高亮。
