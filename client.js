window.__ModuleLoader__.load({
	id: "dsh-shape",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom = require("react-dom");
		//#region \0dsh-css:E:\Project\dsh-shape\packages\experimental\dsh-shape-build\src\client\shape-chat-cards.module.css.mjs
		const css$1 = ".cX5DZa_list{box-sizing:border-box;gap:8px;width:100%;max-width:860px;margin:0 auto 8px;padding:0 16px;display:grid}.cX5DZa_card{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);box-shadow:var(--dsw-elevation-soft,0 6px 18px #00000024);border-radius:12px;align-items:center;gap:12px;padding:12px 14px;display:flex}.cX5DZa_mark{width:32px;height:32px;color:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff);background:color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 14%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 28%, transparent);border-radius:9px;flex:none;place-items:center;display:grid}.cX5DZa_markGrid{grid-template-rows:repeat(2,4px);grid-template-columns:repeat(2,4px);gap:2px;display:grid}.cX5DZa_markGrid>span{opacity:.9;background:currentColor;border-radius:1px}.cX5DZa_body{flex:1;min-width:0}.cX5DZa_heading{align-items:baseline;gap:8px;min-width:0;display:flex}.cX5DZa_title{text-overflow:ellipsis;white-space:nowrap;margin:0;font-size:13px;font-weight:500;line-height:18px;overflow:hidden}.cX5DZa_id{color:var(--dsw-alias-label-secondary,#fff9);font-family:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Consolas, monospace);flex:none;font-size:10px}.cX5DZa_text{color:var(--dsw-alias-label-secondary,#fff9);margin:2px 0 0;font-size:12px;line-height:1.5}.cX5DZa_greeting{color:var(--dsw-alias-state-success-primary,#7dd3a7);margin:4px 0 0;font-size:12px;line-height:1.5}@media (width<=720px){.cX5DZa_list{padding:0 8px}.cX5DZa_card{flex-wrap:wrap;align-items:flex-start}.cX5DZa_card button{margin-left:44px}}";
		const tagId$1 = "dsh-shape/shape-chat-cards.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-shape";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var shape_chat_cards_module_css_default = {
			"body": "cX5DZa_body",
			"card": "cX5DZa_card",
			"greeting": "cX5DZa_greeting",
			"heading": "cX5DZa_heading",
			"id": "cX5DZa_id",
			"list": "cX5DZa_list",
			"mark": "cX5DZa_mark",
			"markGrid": "cX5DZa_markGrid",
			"text": "cX5DZa_text",
			"title": "cX5DZa_title"
		};
		//#endregion
		//#region src/client/ShapeChatCards.tsx
		/** Shape-owned cards mounted above the chat composer. */
		const SLOT = "conversation.input.dock";
		/**
		* Read shape slot descriptors for the chat input dock.
		* @returns cards contributed by valid shapes.
		*/
		async function readCards() {
			const response = await fetch("/dsh-shape/api/shapes", {
				credentials: "same-origin",
				cache: "no-store",
				headers: { accept: "application/json" }
			});
			if (!response.ok) return [];
			const payload = await response.json();
			if (payload.ok !== true || !Array.isArray(payload.shapes)) return [];
			const cards = [];
			for (const shape of payload.shapes) {
				if (!shape.valid) continue;
				for (const card of shape.slotData ?? []) if (card.slot === SLOT) cards.push({
					shape,
					card
				});
			}
			return cards;
		}
		/**
		* Render descriptor-driven shape cards above the composer.
		* @returns the card list, or null when no shape contributes one.
		*/
		function ShapeChatCards() {
			const [cards, setCards] = (0, react.useState)([]);
			const [greetings, setGreetings] = (0, react.useState)({});
			const load = (0, react.useCallback)(async () => {
				try {
					setCards(await readCards());
				} catch {}
			}, []);
			(0, react.useEffect)(() => {
				load();
				const reload = () => {
					load();
				};
				window.addEventListener("dsh-shape:refresh", reload);
				return () => {
					window.removeEventListener("dsh-shape:refresh", reload);
				};
			}, [load]);
			if (cards.length === 0) return null;
			return /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
				className: shape_chat_cards_module_css_default.list,
				children: cards.map(({ shape, card }, index) => {
					const key = `${shape.id}:${String(index)}`;
					const greeting = greetings[key];
					return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						className: shape_chat_cards_module_css_default.card,
						"data-testid": "dsh-shape-chat-card",
						"data-shape-id": shape.id,
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: shape_chat_cards_module_css_default.mark,
								"aria-hidden": "true",
								children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
									className: shape_chat_cards_module_css_default.markGrid,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {})
									]
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: shape_chat_cards_module_css_default.body,
								children: [
									/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: shape_chat_cards_module_css_default.heading,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
											className: shape_chat_cards_module_css_default.title,
											children: card.title ?? shape.title
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
											className: shape_chat_cards_module_css_default.id,
											children: shape.id
										})]
									}),
									card.text !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: shape_chat_cards_module_css_default.text,
										children: card.text
									}),
									greeting !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: shape_chat_cards_module_css_default.greeting,
										role: "status",
										children: greeting
									})
								]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
								size: "sm",
								variant: "outline",
								"data-testid": "dsh-shape-chat-greet",
								onClick: () => {
									setGreetings((current) => ({
										...current,
										[key]: card.greeting ?? "你好！"
									}));
								},
								children: card.button ?? "打个招呼"
							})
						]
					}, key);
				})
			});
		}
		//#endregion
		//#region \0dsh-css:E:\Project\dsh-shape\packages\experimental\dsh-shape-build\src\client\shape-dialog.module.css.mjs
		const css = ".g_Pq1W_backdrop{z-index:1200;background:var(--dsw-alias-bg-mask-1,#00000080);backdrop-filter:var(--dsw-mask-blur,blur(12px));animation:g_Pq1W_backdrop-in var(--ds-transition-duration,.16s) var(--ds-ease-in-out,ease-out);justify-content:center;align-items:center;padding:24px;display:flex;position:fixed;inset:0}.g_Pq1W_window{width:min(1120px,94vw);height:min(760px,90vh);max-height:calc(100dvh - 48px);color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);border-radius:var(--dsw-radius-panel,18px);box-shadow:var(--dsw-elevation-prominent,0 24px 80px #0000005c);animation:g_Pq1W_window-in var(--ds-transition-duration,.16s) var(--ds-ease-in-out,ease-out);flex-direction:column;display:flex;overflow:hidden}.g_Pq1W_window:focus{outline:none}.g_Pq1W_header{border-bottom:1px solid var(--dsw-alias-border-secondary,#ffffff14);background:color-mix(in srgb, var(--dsw-alias-bg-layer-2) 84%, transparent);justify-content:space-between;align-items:center;gap:20px;padding:18px 22px;display:flex}.g_Pq1W_heading{align-items:center;gap:12px;min-width:0;display:flex}.g_Pq1W_appMark{width:36px;height:36px;color:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff);background:color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 14%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 28%, transparent);border-radius:10px;flex:none;place-items:center;display:grid}.g_Pq1W_appMarkGrid{grid-template-rows:repeat(2,5px);grid-template-columns:repeat(2,5px);gap:2px;display:grid}.g_Pq1W_appMarkGrid>span{opacity:.9;background:currentColor;border-radius:1.5px}.g_Pq1W_headingText{min-width:0}.g_Pq1W_title{margin:0;font-size:17px;font-weight:500;line-height:24px}.g_Pq1W_subtitle{color:var(--dsw-alias-label-secondary,#fff9);text-overflow:ellipsis;white-space:nowrap;margin:1px 0 0;font-size:12px;line-height:18px;overflow:hidden}.g_Pq1W_actions{flex:none;gap:4px;display:flex}.g_Pq1W_iconButton{width:28px;height:28px;color:var(--dsw-alias-label-secondary,#fff9);border-radius:var(--dsw-radius-sm,8px);cursor:pointer;background:0 0;border:0;place-items:center;padding:0;display:grid}.g_Pq1W_iconButton>svg{width:16px;height:16px}@media (hover:hover){.g_Pq1W_iconButton:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}}.g_Pq1W_iconButton:active{background:var(--dsw-alias-interactive-bg-active)}.g_Pq1W_iconButton:focus-visible{color:var(--dsw-alias-label-primary);box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#6ea6ff));outline:none}.g_Pq1W_content{flex:1;min-height:0;padding:22px;overflow:auto}.g_Pq1W_grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));align-content:start;gap:12px;display:grid}.g_Pq1W_card{width:100%;min-height:190px;color:inherit;font:inherit;text-align:left;appearance:none;cursor:pointer;background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);border-radius:14px;flex-direction:column;gap:10px;margin:0;padding:14px;transition:border-color .14s,box-shadow .14s,transform .14s;display:flex}@media (hover:hover){.g_Pq1W_card:hover{border-color:color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 34%, var(--dsw-alias-border-secondary,transparent));box-shadow:var(--dsw-elevation-soft,0 8px 24px #0000002e);transform:translateY(-1px)}}.g_Pq1W_card:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#6ea6ff));outline:none}.g_Pq1W_cardHead{align-items:flex-start;gap:10px;min-width:0;display:flex}.g_Pq1W_appIcon{width:42px;height:42px;color:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff);background:color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 14%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 24%, transparent);border-radius:11px;flex:none;place-items:center;font-size:17px;font-weight:500;line-height:1;display:grid}.g_Pq1W_cardIdentity{flex:1;min-width:0}.g_Pq1W_cardTitle{text-overflow:ellipsis;white-space:nowrap;margin:0;font-size:13.5px;font-weight:500;line-height:18px;overflow:hidden}.g_Pq1W_cardId{color:var(--dsw-alias-label-secondary,#fff9);font-family:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Consolas, monospace);text-overflow:ellipsis;white-space:nowrap;margin-top:2px;font-size:10.5px;line-height:14px;display:block;overflow:hidden}.g_Pq1W_origin{color:var(--dsw-alias-label-secondary,#fff9);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);border-radius:999px;flex:none;padding:1px 6px;font-size:10px;line-height:16px}.g_Pq1W_description{color:var(--dsw-alias-label-secondary,#fff9);-webkit-line-clamp:3;-webkit-box-orient:vertical;flex:1;margin:0;font-size:12px;line-height:1.5;display:-webkit-box;overflow:hidden}.g_Pq1W_cardFooter{flex-wrap:wrap;align-items:center;gap:4px;margin-top:auto;display:flex}.g_Pq1W_badge{color:var(--dsw-alias-label-secondary,#fff9);background:var(--dsw-alias-bg-layer-2);border-radius:5px;padding:1px 6px;font-size:10px;line-height:16px}.g_Pq1W_invalid{color:var(--dsw-alias-state-error-primary,#ff9b9b);font-size:11px}.g_Pq1W_placeholder{min-height:320px;color:var(--dsw-alias-label-secondary,#fff9);text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:8px;font-size:13px;display:flex}.g_Pq1W_placeholderMark{width:54px;height:54px;color:var(--dsw-alias-label-secondary,#fff9);background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);border-radius:14px;place-items:center;margin-bottom:4px;font-size:22px;display:grid}.g_Pq1W_placeholderPath{max-width:540px;font-family:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Consolas, monospace);text-overflow:ellipsis;white-space:nowrap;font-size:11px;overflow:hidden}.g_Pq1W_placeholderMessage{max-width:540px;line-height:1.5}.g_Pq1W_skeletonCard{background:linear-gradient(100deg, var(--dsw-alias-bg-layer-3) 30%, color-mix(in srgb, var(--dsw-alias-bg-layer-3) 70%, var(--dsw-alias-label-secondary,white)) 50%, var(--dsw-alias-bg-layer-3) 70%);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);background-size:240% 100%;border-radius:14px;min-height:190px;animation:1.2s linear infinite g_Pq1W_shimmer}.g_Pq1W_viewBackdrop{z-index:1300;background:var(--dsw-alias-bg-mask-3,#0000007a);backdrop-filter:var(--dsw-mask-blur,blur(12px));animation:g_Pq1W_backdrop-in var(--ds-transition-duration,.16s) var(--ds-ease-in-out,ease-out);justify-content:center;align-items:center;padding:24px;display:flex;position:fixed;inset:0}.g_Pq1W_viewWindow{width:min(1080px,92vw);height:min(760px,88vh);max-height:calc(100dvh - 48px);color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);border-radius:var(--dsw-radius-panel,18px);box-shadow:var(--dsw-elevation-prominent,0 24px 80px #0000005c);animation:g_Pq1W_window-in var(--ds-transition-duration,.16s) var(--ds-ease-in-out,ease-out);flex-direction:column;display:flex;overflow:hidden}.g_Pq1W_viewWindow:focus{outline:none}.g_Pq1W_viewHeader{background:var(--dsw-alias-bg-layer-2);border-bottom:1px solid var(--dsw-alias-border-secondary,#ffffff14);justify-content:space-between;align-items:center;gap:16px;padding:14px 18px;display:flex}.g_Pq1W_viewHeading{align-items:center;gap:10px;min-width:0;display:flex}.g_Pq1W_viewHeadingText{min-width:0}.g_Pq1W_viewTitle{text-overflow:ellipsis;white-space:nowrap;margin:0;font-size:15px;font-weight:500;line-height:20px;overflow:hidden}.g_Pq1W_viewSubtitle{color:var(--dsw-alias-label-secondary,#fff9);text-overflow:ellipsis;white-space:nowrap;margin:1px 0 0;font-size:11px;line-height:16px;overflow:hidden}.g_Pq1W_viewBody{background:var(--dsw-alias-bg-layer-1);flex:1;min-height:0;display:flex}.g_Pq1W_viewBody .g_Pq1W_placeholder{flex:1;width:100%}.g_Pq1W_viewFrame{background:var(--dsw-alias-bg-layer-1);color-scheme:normal;border:0;width:100%;height:100%;display:block}.g_Pq1W_footer{color:var(--dsw-alias-label-secondary,#fff9);border-top:1px solid var(--dsw-alias-border-secondary,#ffffff14);justify-content:space-between;align-items:center;gap:12px;padding:10px 22px;font-size:11px;line-height:16px;display:flex}.g_Pq1W_footerPath{min-width:0;font-family:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Consolas, monospace);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.g_Pq1W_footerCount{flex:none}@keyframes g_Pq1W_backdrop-in{0%{opacity:0}to{opacity:1}}@keyframes g_Pq1W_window-in{0%{opacity:0;transform:translateY(6px)scale(.992)}to{opacity:1;transform:translateY(0)scale(1)}}@keyframes g_Pq1W_shimmer{0%{background-position:140% 0}to{background-position:-100% 0}}@media (width<=720px){.g_Pq1W_backdrop{padding:8px}.g_Pq1W_window{border-radius:14px;width:100%;height:calc(100dvh - 16px);max-height:calc(100dvh - 16px)}.g_Pq1W_header{padding:14px 16px}.g_Pq1W_content{padding:14px}.g_Pq1W_grid{grid-template-columns:repeat(auto-fill,minmax(152px,1fr));gap:10px}.g_Pq1W_card{min-height:176px;padding:12px}.g_Pq1W_subtitle{display:none}.g_Pq1W_footer{padding:8px 16px}.g_Pq1W_viewBackdrop{padding:8px}.g_Pq1W_viewWindow{border-radius:14px;width:100%;height:calc(100dvh - 16px);max-height:calc(100dvh - 16px)}.g_Pq1W_viewHeader{padding:12px 14px}.g_Pq1W_viewSubtitle{display:none}}@media (prefers-reduced-motion:reduce){.g_Pq1W_backdrop,.g_Pq1W_window,.g_Pq1W_skeletonCard{animation:none}.g_Pq1W_card{transition:none}}";
		const tagId = "dsh-shape/shape-dialog.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-shape";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var shape_dialog_module_css_default = {
			"actions": "g_Pq1W_actions",
			"appIcon": "g_Pq1W_appIcon",
			"appMark": "g_Pq1W_appMark",
			"appMarkGrid": "g_Pq1W_appMarkGrid",
			"backdrop": "g_Pq1W_backdrop",
			"backdrop-in": "g_Pq1W_backdrop-in",
			"badge": "g_Pq1W_badge",
			"card": "g_Pq1W_card",
			"cardFooter": "g_Pq1W_cardFooter",
			"cardHead": "g_Pq1W_cardHead",
			"cardId": "g_Pq1W_cardId",
			"cardIdentity": "g_Pq1W_cardIdentity",
			"cardTitle": "g_Pq1W_cardTitle",
			"content": "g_Pq1W_content",
			"description": "g_Pq1W_description",
			"footer": "g_Pq1W_footer",
			"footerCount": "g_Pq1W_footerCount",
			"footerPath": "g_Pq1W_footerPath",
			"grid": "g_Pq1W_grid",
			"header": "g_Pq1W_header",
			"heading": "g_Pq1W_heading",
			"headingText": "g_Pq1W_headingText",
			"iconButton": "g_Pq1W_iconButton",
			"invalid": "g_Pq1W_invalid",
			"origin": "g_Pq1W_origin",
			"placeholder": "g_Pq1W_placeholder",
			"placeholderMark": "g_Pq1W_placeholderMark",
			"placeholderMessage": "g_Pq1W_placeholderMessage",
			"placeholderPath": "g_Pq1W_placeholderPath",
			"shimmer": "g_Pq1W_shimmer",
			"skeletonCard": "g_Pq1W_skeletonCard",
			"subtitle": "g_Pq1W_subtitle",
			"title": "g_Pq1W_title",
			"viewBackdrop": "g_Pq1W_viewBackdrop",
			"viewBody": "g_Pq1W_viewBody",
			"viewFrame": "g_Pq1W_viewFrame",
			"viewHeader": "g_Pq1W_viewHeader",
			"viewHeading": "g_Pq1W_viewHeading",
			"viewHeadingText": "g_Pq1W_viewHeadingText",
			"viewSubtitle": "g_Pq1W_viewSubtitle",
			"viewTitle": "g_Pq1W_viewTitle",
			"viewWindow": "g_Pq1W_viewWindow",
			"window": "g_Pq1W_window",
			"window-in": "g_Pq1W_window-in"
		};
		//#endregion
		//#region src/client/ShapeDialog.tsx
		/** Shape browser: a large launcher-style window with a responsive app grid. */
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
		* Render the read-only grid of registered folder-based shapes.
		* @param props.open - whether the window is showing.
		* @param props.onClose - closes the window.
		* @returns the window, or null while closed.
		*/
		function ShapeDialog({ open, onClose }) {
			const [status, setStatus] = (0, react.useState)("loading");
			const [shapes, setShapes] = (0, react.useState)([]);
			const [roots, setRoots] = (0, react.useState)();
			const [error, setError] = (0, react.useState)("");
			const [selected, setSelected] = (0, react.useState)(null);
			const [viewLoading, setViewLoading] = (0, react.useState)(false);
			const [viewError, setViewError] = (0, react.useState)("");
			const windowRef = (0, react.useRef)(null);
			const viewRef = (0, react.useRef)(null);
			const onCloseRef = (0, react.useRef)(onClose);
			const selectedRef = (0, react.useRef)(selected);
			onCloseRef.current = onClose;
			selectedRef.current = selected;
			const load = (0, react.useCallback)(async (refresh) => {
				setStatus("loading");
				setError("");
				try {
					const snapshot = await readShapes(refresh);
					setShapes(snapshot.shapes);
					setRoots(snapshot.roots);
					setStatus("ready");
					window.dispatchEvent(new CustomEvent("dsh-shape:refresh"));
				} catch (cause) {
					setError(cause instanceof Error ? cause.message : String(cause));
					setStatus("error");
				}
			}, []);
			const openView = (0, react.useCallback)(async (shape) => {
				setSelected(shape);
				setViewError("");
				if (shape.views.length === 0) {
					setViewLoading(false);
					return;
				}
				setViewLoading(true);
				try {
					const response = await fetch(`/dsh-shape/view/${encodeURIComponent(shape.id)}/`, { cache: "no-store" });
					if (!response.ok) {
						let message = `Host 返回 HTTP ${String(response.status)}。`;
						if (response.status === 404) message = (await response.json().catch(() => null))?.error?.message === "unknown dsh-shape route" ? "Host 视图路由未加载（HTTP 404）。请重启 DSH 后重试。" : "这个 shape 没有可打开的 views/index.html。";
						throw new Error(message);
					}
					if (!(response.headers.get("content-type") ?? "").includes("text/html")) throw new Error("Host 返回的不是 HTML 页面。");
					setViewError("");
				} catch (cause) {
					setViewError(cause instanceof Error ? cause.message : String(cause));
				} finally {
					setViewLoading(false);
				}
			}, []);
			const closeView = (0, react.useCallback)(() => {
				setSelected(null);
				setViewError("");
				setViewLoading(false);
			}, []);
			(0, react.useEffect)(() => {
				if (!open) return;
				load(false);
			}, [load, open]);
			(0, react.useEffect)(() => {
				if (!open) {
					setSelected(null);
					setViewError("");
					setViewLoading(false);
				}
			}, [open]);
			(0, react.useEffect)(() => {
				if (!open) return;
				if (selected === null) windowRef.current?.focus();
				else viewRef.current?.focus();
			}, [open, selected]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
				const previousOverflow = document.body.style.overflow;
				document.body.style.overflow = "hidden";
				const onKeyDown = (event) => {
					if (event.key !== "Escape") return;
					event.preventDefault();
					if (selectedRef.current !== null) {
						closeView();
						return;
					}
					onCloseRef.current();
				};
				document.addEventListener("keydown", onKeyDown);
				return () => {
					document.removeEventListener("keydown", onKeyDown);
					document.body.style.overflow = previousOverflow;
					previous?.focus();
				};
			}, [closeView, open]);
			if (!open) return null;
			const subtitle = status === "loading" ? "正在读取 shape…" : status === "error" ? "读取失败" : `${String(shapes.length)} 个 shape`;
			return (0, react_dom.createPortal)(/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
				className: shape_dialog_module_css_default.backdrop,
				role: "presentation",
				onMouseDown: (event) => {
					if (event.target === event.currentTarget) onClose();
				},
				children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
					ref: windowRef,
					tabIndex: -1,
					className: shape_dialog_module_css_default.window,
					role: "dialog",
					"aria-modal": "true",
					"aria-labelledby": "dsh-shape-title",
					"data-testid": "dsh-shape-dialog",
					children: [
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
							className: shape_dialog_module_css_default.header,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: shape_dialog_module_css_default.heading,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: shape_dialog_module_css_default.appMark,
									"aria-hidden": "true",
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: shape_dialog_module_css_default.appMarkGrid,
										children: [
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {}),
											/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {})
										]
									})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: shape_dialog_module_css_default.headingText,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h2", {
										className: shape_dialog_module_css_default.title,
										id: "dsh-shape-title",
										children: "Shapes"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
										className: shape_dialog_module_css_default.subtitle,
										children: subtitle
									})]
								})]
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
								className: shape_dialog_module_css_default.actions,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: shape_dialog_module_css_default.iconButton,
									"aria-label": "刷新",
									title: "刷新",
									"data-testid": "dsh-shape-refresh",
									onClick: () => {
										load(true);
									},
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconRefreshOutlineRegular, {})
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: shape_dialog_module_css_default.iconButton,
									"aria-label": "关闭",
									title: "关闭",
									"data-testid": "dsh-shape-close",
									onClick: onClose,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineRegular, {})
								})]
							})]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
							className: shape_dialog_module_css_default.content,
							children: [
								status === "loading" && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: shape_dialog_module_css_default.grid,
									"aria-label": "正在读取 shape",
									children: Array.from({ length: 8 }, (_, index) => /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", { className: shape_dialog_module_css_default.skeletonCard }, index))
								}),
								status === "error" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: shape_dialog_module_css_default.placeholder,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: shape_dialog_module_css_default.placeholderMark,
											"aria-hidden": "true",
											children: "!"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "无法读取 shape" }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: error }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											onClick: () => {
												load(false);
											},
											children: "重试"
										})
									]
								}),
								status === "ready" && shapes.length === 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: shape_dialog_module_css_default.placeholder,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: shape_dialog_module_css_default.placeholderMark,
											"aria-hidden": "true",
											children: "＋"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "还没有 shape" }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "把 shape 文件夹放进用户目录，然后点刷新。" }),
										roots !== void 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
											className: shape_dialog_module_css_default.placeholderPath,
											children: roots.user
										})
									]
								}),
								status === "ready" && shapes.length > 0 && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
									className: shape_dialog_module_css_default.grid,
									"data-testid": "dsh-shape-grid",
									children: shapes.map((shape) => {
										const initial = Array.from(shape.title.trim())[0] ?? "?";
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
											type: "button",
											className: shape_dialog_module_css_default.card,
											"data-testid": "dsh-shape-card",
											"data-shape-id": shape.id,
											"aria-haspopup": "dialog",
											"aria-label": `打开 ${shape.title}`,
											onClick: () => {
												openView(shape);
											},
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: shape_dialog_module_css_default.cardHead,
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: shape_dialog_module_css_default.appIcon,
															"aria-hidden": "true",
															children: initial.toLocaleUpperCase()
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: shape_dialog_module_css_default.cardIdentity,
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
																className: shape_dialog_module_css_default.cardTitle,
																title: shape.title,
																children: shape.title
															}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("code", {
																className: shape_dialog_module_css_default.cardId,
																title: shape.id,
																children: shape.id
															})]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: shape_dialog_module_css_default.origin,
															children: shape.origin === "bundled" ? "内置" : "用户"
														})
													]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
													className: shape_dialog_module_css_default.description,
													children: shape.description.length > 0 ? shape.description : "暂无描述"
												}),
												!shape.valid && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
													className: shape_dialog_module_css_default.invalid,
													children: ["无效 package.json：", shape.error ?? "缺少 id 或 name"]
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
													className: shape_dialog_module_css_default.cardFooter,
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: shape_dialog_module_css_default.badge,
															children: ["v", shape.version]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: shape_dialog_module_css_default.badge,
															children: [String(shape.views.length), " views"]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: shape_dialog_module_css_default.badge,
															children: [String(shape.slots.length), " slots"]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: shape_dialog_module_css_default.badge,
															children: [String(shape.tools.length), " tools"]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: shape_dialog_module_css_default.badge,
															children: shape.output
														})
													]
												})
											]
										}, shape.id);
									})
								})
							]
						}),
						/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
							className: shape_dialog_module_css_default.footer,
							children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
								className: shape_dialog_module_css_default.footerPath,
								title: roots?.user,
								children: roots?.user ?? "shape 目录"
							}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
								className: shape_dialog_module_css_default.footerCount,
								children: [String(shapes.length), " registered"]
							})]
						})
					]
				}), selected !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
					className: shape_dialog_module_css_default.viewBackdrop,
					role: "presentation",
					onMouseDown: (event) => {
						if (event.target === event.currentTarget) closeView();
					},
					children: /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("section", {
						ref: viewRef,
						tabIndex: -1,
						className: shape_dialog_module_css_default.viewWindow,
						role: "dialog",
						"aria-modal": "true",
						"aria-labelledby": "dsh-shape-view-title",
						"data-testid": "dsh-shape-view",
						children: [
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("header", {
								className: shape_dialog_module_css_default.viewHeader,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: shape_dialog_module_css_default.viewHeading,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: shape_dialog_module_css_default.appIcon,
										"aria-hidden": "true",
										children: (Array.from(selected.title.trim())[0] ?? "?").toLocaleUpperCase()
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: shape_dialog_module_css_default.viewHeadingText,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("h3", {
											className: shape_dialog_module_css_default.viewTitle,
											id: "dsh-shape-view-title",
											children: selected.title
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("p", {
											className: shape_dialog_module_css_default.viewSubtitle,
											children: [
												selected.id,
												" · ",
												String(selected.views.length),
												" views"
											]
										})]
									})]
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
									type: "button",
									className: shape_dialog_module_css_default.iconButton,
									"aria-label": "关闭",
									title: "关闭",
									"data-testid": "dsh-shape-view-close",
									onClick: closeView,
									children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconCloseOutlineRegular, {})
								})]
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsx)("div", {
								className: shape_dialog_module_css_default.viewBody,
								children: selected.views.length === 0 ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: shape_dialog_module_css_default.placeholder,
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: shape_dialog_module_css_default.placeholderMark,
											"aria-hidden": "true",
											children: "◇"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "这个 shape 没有 views/ 界面" }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "在 shape 目录下添加 `views/index.html` 后再试。" })
									]
								}) : viewLoading ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: shape_dialog_module_css_default.placeholder,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
										className: shape_dialog_module_css_default.placeholderMark,
										"aria-hidden": "true",
										children: "…"
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", { children: "正在打开界面…" })]
								}) : viewError !== "" ? /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: shape_dialog_module_css_default.placeholder,
									"data-testid": "dsh-shape-view-error",
									children: [
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: shape_dialog_module_css_default.placeholderMark,
											"aria-hidden": "true",
											children: "!"
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("strong", { children: "无法打开 shape 界面" }),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
											className: shape_dialog_module_css_default.placeholderMessage,
											children: viewError
										}),
										/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											onClick: () => {
												openView(selected);
											},
											children: "重试"
										})
									]
								}) : /* @__PURE__ */ (0, react_jsx_runtime.jsx)("iframe", {
									className: shape_dialog_module_css_default.viewFrame,
									title: selected.title,
									src: `/dsh-shape/view/${encodeURIComponent(selected.id)}/`,
									sandbox: "allow-scripts allow-forms allow-modals allow-popups"
								})
							}),
							/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("footer", {
								className: shape_dialog_module_css_default.footer,
								children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: shape_dialog_module_css_default.footerPath,
									title: selected.dir,
									children: selected.dir
								}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
									className: shape_dialog_module_css_default.footerCount,
									children: selected.views[0] ?? "no views"
								})]
							})
						]
					})
				})]
			}), document.body);
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
			(0, react.useEffect)(() => {
				const onKeyDown = (event) => {
					if (event.defaultPrevented || event.repeat || event.isComposing) return;
					if (!event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) return;
					if (event.key !== "." && event.code !== "Period") return;
					event.preventDefault();
					setOpen(true);
				};
				window.addEventListener("keydown", onKeyDown);
				return () => {
					window.removeEventListener("keydown", onKeyDown);
				};
			}, []);
			return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)(react_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
				"data-testid": "dsh-shape-open",
				size: "sm",
				variant: "ghost",
				title: "Shapes (Ctrl+.)",
				"aria-haspopup": "dialog",
				"aria-keyshortcuts": "Control+.",
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
		* Register the shape browser button in the always-visible conversation header,
		* plus shape-owned cards above the composer.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			ctx.slots.inject("conversation.header.leading", () => ctx.slots.register({ name: "conversation.header.leading" }, ShapeButton));
			ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
				name: "conversation.input.dock",
				id: "dsh-shape-chat-cards",
				order: 20
			}, ShapeChatCards));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
