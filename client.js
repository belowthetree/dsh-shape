window.__ModuleLoader__.load({
	id: "dsh-shape",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		//#region src/client/ShapeDialog.tsx
		/** Shape browser dialog: the Host's folder-based registry, read-only. */
		const panel = {
			display: "grid",
			gap: "12px",
			width: "100%",
			maxHeight: "62vh",
			overflow: "auto",
			paddingRight: "4px"
		};
		const toolbar = {
			display: "flex",
			alignItems: "center",
			justifyContent: "space-between",
			gap: "12px"
		};
		const card = {
			display: "grid",
			gap: "8px",
			padding: "12px 14px",
			border: "1px solid var(--dsw-alias-border-secondary, rgba(120, 200, 170, 0.22))",
			borderRadius: "10px",
			background: "var(--dsw-alias-bg-layer-3, #16261f)"
		};
		const line = {
			display: "flex",
			alignItems: "baseline",
			justifyContent: "space-between",
			gap: "12px"
		};
		const muted = {
			color: "var(--dsw-alias-label-secondary, rgba(220, 240, 232, 0.66))",
			fontSize: "12px",
			lineHeight: 1.5
		};
		const badges = {
			display: "flex",
			flexWrap: "wrap",
			gap: "6px",
			fontSize: "11px"
		};
		const badge = {
			padding: "2px 7px",
			borderRadius: "999px",
			border: "1px solid var(--dsw-alias-border-secondary, rgba(120, 200, 170, 0.2))",
			color: "var(--dsw-alias-label-secondary, rgba(220, 240, 232, 0.66))"
		};
		/**
		* Read the current shape list.
		* @param refresh - ask the Host to rescan the shape roots first.
		* @returns the snapshot.
		*/
		async function readShapes(refresh) {
			if (refresh) {
				const rescan = await fetch("/dsh-shape/api/refresh", {
					method: "POST",
					credentials: "same-origin",
					headers: { accept: "application/json" }
				});
				if (!rescan.ok) throw new Error(`refresh failed (${String(rescan.status)})`);
			}
			const response = await fetch("/dsh-shape/api/shapes", {
				credentials: "same-origin",
				cache: "no-store",
				headers: { accept: "application/json" }
			});
			if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
			const payload = await response.json();
			if (payload.ok !== true || !Array.isArray(payload.shapes)) throw new Error("invalid shape response");
			return {
				shapes: payload.shapes,
				...payload.roots === void 0 ? {} : { roots: payload.roots }
			};
		}
		/**
		* Render the read-only list of registered folder-based shapes.
		* @param props.open - whether the dialog is showing.
		* @param props.onClose - closes the dialog.
		* @returns the dialog, or null while closed.
		*/
		function ShapeDialog({ open, onClose }) {
			const [status, setStatus] = (0, react.useState)("loading");
			const [shapes, setShapes] = (0, react.useState)([]);
			const [roots, setRoots] = (0, react.useState)();
			const [error, setError] = (0, react.useState)("");
			const load = (0, react.useCallback)(async (refresh) => {
				setStatus("loading");
				setError("");
				try {
					const snapshot = await readShapes(refresh);
					setShapes(snapshot.shapes);
					setRoots(snapshot.roots);
					setStatus("ready");
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
					setStatus("error");
				}
			}, []);
			(0, react.useEffect)(() => {
				if (!open) return;
				load(false);
			}, [load, open]);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Modal, {
				open,
				onClose,
				title: "Shapes",
				closeLabel: "关闭",
				children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
					style: panel,
					"data-testid": "dsh-shape-dialog",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: toolbar,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								style: muted,
								children: status === "ready" ? `${String(shapes.length)} 个已注册 shape` : status === "loading" ? "正在读取 shape…" : "读取失败"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								size: "sm",
								variant: "outline",
								"data-testid": "dsh-shape-refresh",
								onClick: () => {
									load(true);
								},
								children: "刷新"
							})]
						}),
						status === "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: {
								...card,
								borderColor: "rgba(255, 120, 120, 0.4)"
							},
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "无法读取 shape" }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: muted,
									children: error
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
									size: "sm",
									variant: "outline",
									onClick: () => {
										load(false);
									},
									children: "重试"
								})
							]
						}),
						status === "loading" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
							style: muted,
							children: "扫描 `package.json`、`views/`、`slots/`、`tools/`…"
						}),
						status === "ready" && shapes.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: card,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "还没有 shape" }),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: muted,
									children: "把 shape 文件夹放进用户目录，然后点刷新。"
								}),
								roots !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
									style: muted,
									children: roots.user
								})
							]
						}),
						status === "ready" && shapes.map((shape) => /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							style: card,
							"data-testid": "dsh-shape-card",
							"data-shape-id": shape.id,
							children: [
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: line,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: shape.title }), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
										style: muted,
										children: shape.id
									})]
								}),
								shape.description.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									style: muted,
									children: shape.description
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									style: badges,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: badge,
											children: shape.origin === "bundled" ? "内置" : "用户"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											style: badge,
											children: ["v", shape.version]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											style: badge,
											children: ["views ", String(shape.views.length)]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											style: badge,
											children: ["slots ", String(shape.slots.length)]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
											style: badge,
											children: ["tools ", String(shape.tools.length)]
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											style: badge,
											children: shape.output
										})
									]
								}),
								!shape.valid && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									style: {
										...muted,
										color: "var(--dsw-alias-label-error, #ff9b9b)"
									},
									children: ["无效 package.json：", shape.error ?? "缺少 id 或 name"]
								}),
								/* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
									style: {
										...muted,
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap"
									},
									children: shape.dir
								})
							]
						}, shape.id)),
						roots !== void 0 && status === "ready" && shapes.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
							style: {
								...muted,
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap"
							},
							children: ["用户目录：", roots.user]
						})
					]
				})
			});
		}
		//#endregion
		//#region src/client/ShapeButton.tsx
		/** Top-bar action that opens the registered-shape browser. */
		/**
		* Render the header action and own the dialog's open state.
		* @returns the button plus its dialog.
		*/
		function ShapeButton() {
			const [open, setOpen] = (0, react.useState)(false);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				"data-testid": "dsh-shape-open",
				size: "sm",
				variant: "ghost",
				title: "Shapes",
				"aria-haspopup": "dialog",
				onClick: () => {
					setOpen(true);
				},
				children: "Shapes"
			}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(ShapeDialog, {
				open,
				onClose: () => {
					setOpen(false);
				}
			})] });
		}
		//#endregion
		//#region src/client/index.ts
		/** The leading header seat is owned by the conversation client. */
		const inject = ["slots"];
		/**
		* Register the shape browser button in the always-visible conversation header.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.slots.inject("conversation.header.leading", () => ctx.slots.register({ name: "conversation.header.leading" }, ShapeButton));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
