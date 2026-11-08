window.__ModuleLoader__.load({
	id: "@belowthetree/dsh-shape",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		//#region \0rolldown/runtime.js
		var __commonJSMin = (cb, mod) => () => (mod || (cb((mod = { exports: {} }).exports, mod), cb = null), mod.exports);
		//#endregion
		let react = require("react");
		let _deepseek_ai_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
		let react_jsx_runtime = require("react/jsx-runtime");
		let react_dom = require("react-dom");
		//#region ../../dsh-plugins/dsh-shape/src/shared/version-range.ts
		/**
		 * Semver subset for capability versions.
		 *
		 * The capability registry needs three things: validate an exact version, accept
		 * or reject a range, and test whether a version falls inside a range. Pulling
		 * semver's full API into the browser bundle cost ~1300 lines for those three
		 * calls, so this file implements exactly them: strict versions, comparators,
		 * caret, tilde, x-ranges, hyphen ranges, and `||`. Expansion mirrors semver
		 * 7.8.5, including its `includePrerelease` widening of lower bounds, and is
		 * pinned by a differential test against that version.
		 */
		/** Largest accepted input, matching semver's own ceiling. */
		const MAX_LENGTH = 256;
		const EXACT = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/;
		const NUMERIC = /^\d+$/;
		const WILDCARD = /^(?:x|X|\*)$/;
		/**
		 * Read one numeric part with semver's leading-zero rule.
		 * @param text - digits, or undefined when the part was omitted.
		 * @returns the number, undefined when absent, or null when malformed.
		 */
		function numericPart(text) {
				if (text === undefined)
						return undefined;
				if (!NUMERIC.test(text))
						return null;
				if (text.length > 1 && text.startsWith('0'))
						return null;
				const value = Number(text);
				return Number.isSafeInteger(value) ? value : null;
		}
		/**
		 * Split a prerelease suffix into identifiers.
		 * @param text - suffix without the leading dash.
		 * @returns identifiers, or null when one is malformed.
		 */
		function readPrerelease(text) {
				const identifiers = [];
				for (const identifier of text.split('.')) {
						if (identifier.length === 0)
								return null;
						if (NUMERIC.test(identifier)) {
								if (identifier.length > 1 && identifier.startsWith('0'))
										return null;
								identifiers.push(Number(identifier));
						}
						else {
								identifiers.push(identifier);
						}
				}
				return identifiers;
		}
		/**
		 * Parse an exact version.
		 * @param text - candidate version text; surrounding space and a `v` prefix are accepted.
		 * @returns the version, or null when it is not an exact version.
		 */
		function parseVersion(text) {
				if (typeof text !== 'string')
						return null;
				const trimmed = text.trim();
				const body = trimmed.startsWith('v') ? trimmed.slice(1) : trimmed;
				if (body.length === 0 || body.length > MAX_LENGTH)
						return null;
				const match = EXACT.exec(body);
				if (match === null)
						return null;
				const major = numericPart(match[1]);
				const minor = numericPart(match[2]);
				const patch = numericPart(match[3]);
				if (typeof major !== 'number' || typeof minor !== 'number' || typeof patch !== 'number')
						return null;
				const prereleaseText = match[4] ?? '';
				const prerelease = prereleaseText === '' ? [] : readPrerelease(prereleaseText);
				if (prerelease === null)
						return null;
				return { major, minor, patch, prerelease };
		}
		/**
		 * Parse a possibly partial version, treating `x`, `X`, and `*` as wildcards.
		 * @param text - version text such as `1`, `1.2.x`, or `1.2.3-rc.1`.
		 * @returns the parsed parts, or null when the text is not a version.
		 */
		function parseWildcard(text) {
				const trimmed = text.trim();
				const body = trimmed.startsWith('v') ? trimmed.slice(1) : trimmed;
				if (body.length === 0 || body.length > MAX_LENGTH)
						return null;
				const withoutBuild = body.split('+')[0] ?? '';
				const dash = withoutBuild.indexOf('-');
				const core = dash === -1 ? withoutBuild : withoutBuild.slice(0, dash);
				const prereleaseText = dash === -1 ? '' : withoutBuild.slice(dash + 1);
				const segments = core.split('.');
				if (segments.length > 3)
						return null;
				const values = [];
				let wildcardSeen = false;
				for (const segment of segments) {
						if (WILDCARD.test(segment)) {
								wildcardSeen = true;
								values.push(null);
								continue;
						}
						if (wildcardSeen)
								return null;
						const value = numericPart(segment);
						if (value === null || value === undefined)
								return null;
						values.push(value);
				}
				const prerelease = prereleaseText === '' ? [] : readPrerelease(prereleaseText);
				if (prerelease === null)
						return null;
				return {
						major: values[0] ?? null,
						minor: values[1] ?? null,
						patch: values[2] ?? null,
						prerelease,
						prereleaseText,
				};
		}
		/**
		 * Build a concrete version from a partial one, filling wildcards with zero.
		 * @param partial - parsed partial version.
		 * @param prerelease - identifiers to attach.
		 * @returns a concrete version.
		 */
		function concrete(partial, prerelease) {
				return {
						major: partial.major ?? 0,
						minor: partial.minor ?? 0,
						patch: partial.patch ?? 0,
						prerelease,
				};
		}
		/**
		 * Parse a version that must be exact.
		 * @param text - version text.
		 * @returns the version.
		 */
		function exactVersion(text) {
				const version = parseVersion(text);
				if (version === null)
						throw new Error(`internal: bad version ${text}`);
				return version;
		}
		/**
		 * Parse a comparator bound.
		 * @param operator - comparison operator.
		 * @param text - version text.
		 * @returns the comparator.
		 */
		function bound(operator, text) {
				return { operator, version: exactVersion(text) };
		}
		/**
		 * Compare two prerelease identifier lists.
		 * @param left - left identifiers.
		 * @param right - right identifiers.
		 * @returns negative, zero, or positive like a sort comparator.
		 */
		function comparePrerelease(left, right) {
				if (left.length === 0 && right.length === 0)
						return 0;
				if (left.length === 0)
						return 1;
				if (right.length === 0)
						return -1;
				const length = Math.min(left.length, right.length);
				for (let index = 0; index < length; index += 1) {
						const a = left[index];
						const b = right[index];
						if (a === b)
								continue;
						const aNumeric = typeof a === 'number';
						const bNumeric = typeof b === 'number';
						if (aNumeric && !bNumeric)
								return -1;
						if (!aNumeric && bNumeric)
								return 1;
						return a < b ? -1 : 1;
				}
				return left.length === right.length ? 0 : left.length < right.length ? -1 : 1;
		}
		/**
		 * Compare two concrete versions.
		 * @param left - left version.
		 * @param right - right version.
		 * @returns negative when left sorts first, zero when equal.
		 */
		function compareVersions(left, right) {
				if (left.major !== right.major)
						return left.major < right.major ? -1 : 1;
				if (left.minor !== right.minor)
						return left.minor < right.minor ? -1 : 1;
				if (left.patch !== right.patch)
						return left.patch < right.patch ? -1 : 1;
				return comparePrerelease(left.prerelease, right.prerelease);
		}
		/**
		 * Render one version back to text.
		 * @param version - version to render.
		 * @returns the canonical text.
		 */
		function format(version) {
				const core = `${String(version.major)}.${String(version.minor)}.${String(version.patch)}`;
				return version.prerelease.length === 0 ? core : `${core}-${version.prerelease.join('.')}`;
		}
		/**
		 * Validate an exact version.
		 * @param text - candidate version text.
		 * @returns the canonical version, or null when invalid.
		 */
		function valid(text) {
				const version = parseVersion(text);
				return version === null ? null : format(version);
		}
		/**
		 * Expand one caret range.
		 * @param partial - parsed partial version.
		 * @param z - `-0` when prereleases are included, otherwise empty.
		 * @returns comparators.
		 */
		function expandCaret(partial, z) {
				const { major, minor, patch, prerelease, prereleaseText } = partial;
				if (major === null)
						return [];
				if (minor === null) {
						return [bound('>=', `${String(major)}.0.0${z}`), bound('<', `${String(major + 1)}.0.0-0`)];
				}
				if (patch === null) {
						const upper = major === 0 ? `${String(major)}.${String(minor + 1)}.0-0` : `${String(major + 1)}.0.0-0`;
						return [bound('>=', `${String(major)}.${String(minor)}.0${z}`), bound('<', upper)];
				}
				const pre = prereleaseText === '' ? '' : `-${prereleaseText}`;
				const upper = major === 0
						? (minor === 0 ? `${String(major)}.${String(minor)}.${String(patch + 1)}-0` : `${String(major)}.${String(minor + 1)}.0-0`)
						: `${String(major + 1)}.0.0-0`;
				return [bound('>=', `${String(major)}.${String(minor)}.${String(patch)}${pre}`), bound('<', upper)];
		}
		/**
		 * Expand one tilde range.
		 * @param partial - parsed partial version.
		 * @param z - `-0` when prereleases are included, otherwise empty.
		 * @returns comparators.
		 */
		function expandTilde(partial, z) {
				const { major, minor, patch, prereleaseText } = partial;
				if (major === null)
						return [];
				if (minor === null) {
						return [bound('>=', `${String(major)}.0.0${z}`), bound('<', `${String(major + 1)}.0.0-0`)];
				}
				if (patch === null) {
						return [bound('>=', `${String(major)}.${String(minor)}.0${z}`), bound('<', `${String(major)}.${String(minor + 1)}.0-0`)];
				}
				const pre = prereleaseText === '' ? '' : `-${prereleaseText}`;
				return [
						bound('>=', `${String(major)}.${String(minor)}.${String(patch)}${pre}`),
						bound('<', `${String(major)}.${String(minor + 1)}.0-0`),
				];
		}
		/**
		 * Expand one x-range or plain comparator.
		 * @param operator - comparison operator, possibly empty.
		 * @param partial - parsed partial version.
		 * @param includePrerelease - whether lower bounds widen to `-0`.
		 * @returns comparators.
		 */
		function expandXRange(operator, partial, includePrerelease) {
				const { major, minor, patch, prereleaseText } = partial;
				const wildMinor = major === null || minor === null;
				const wildPatch = wildMinor || patch === null;
				let op = operator === '=' && wildPatch ? '' : operator;
				const pr = includePrerelease ? '-0' : '';
				if (major === null) {
						return op === '>' || op === '<' ? [bound('<', '0.0.0-0')] : [];
				}
				if (op !== '' && op !== '=' && wildPatch) {
						let nextMajor = major;
						let nextMinor = minor ?? 0;
						if (op === '>') {
								if (wildMinor) {
										nextMajor = major + 1;
										nextMinor = 0;
								}
								else {
										nextMinor += 1;
								}
								return [bound('>=', `${String(nextMajor)}.${String(nextMinor)}.0${pr}`)];
						}
						if (op === '<=') {
								if (wildMinor)
										nextMajor = major + 1;
								else
										nextMinor += 1;
								return [bound('<', `${String(nextMajor)}.${String(nextMinor)}.0-0`)];
						}
						if (op === '>=') {
								return [bound('>=', `${String(major)}.${String(nextMinor)}.0${pr}`)];
						}
						return [bound('<', `${String(major)}.${String(nextMinor)}.0-0`)];
				}
				if (wildMinor) {
						return [bound('>=', `${String(major)}.0.0${pr}`), bound('<', `${String(major + 1)}.0.0-0`)];
				}
				if (wildPatch) {
						return [bound('>=', `${String(major)}.${String(minor)}.0${pr}`), bound('<', `${String(major)}.${String(minor + 1)}.0-0`)];
				}
				const pre = prereleaseText === '' ? '' : `-${prereleaseText}`;
				const equality = (op === '=' ? '' : op);
				return [{ operator: equality, version: exactVersion(`${String(major)}.${String(minor)}.${String(patch)}${pre}`) }];
		}
		/**
		 * Expand one comparator token.
		 * @param token - token such as `>=1.2.3`, `1.2.x`, `^1.2.3`, or `~1.2`.
		 * @param includePrerelease - whether lower bounds widen to `-0`.
		 * @returns comparators, or null when the token is malformed.
		 */
		function expandToken(token, includePrerelease) {
				if (token === '' || WILDCARD.test(token))
						return [];
				const match = /^(>=|<=|>|<|=|\^|~)?(.*)$/.exec(token);
				if (match === null)
						return null;
				const operator = (match[1] ?? '');
				const body = match[2] ?? '';
				const partial = parseWildcard(body);
				if (partial === null)
						return null;
				const z = includePrerelease ? '-0' : '';
				if (operator === '^')
						return expandCaret(partial, z);
				if (operator === '~')
						return expandTilde(partial, z);
				return expandXRange(operator, partial, includePrerelease);
		}
		/**
		 * Expand one hyphen range.
		 * @param text - set text containing `A - B`.
		 * @param includePrerelease - whether lower bounds widen to `-0`.
		 * @returns comparators, or null when malformed.
		 */
		function expandHyphen(text, includePrerelease) {
				const match = /^(\S+)\s+-\s+(\S+)$/.exec(text.trim());
				if (match === null)
						return null;
				const from = parseWildcard(match[1] ?? '');
				const to = parseWildcard(match[2] ?? '');
				if (from === null || to === null)
						return null;
				const comparators = [];
				if (from.major !== null) {
						const lower = concrete(from, from.prerelease);
						comparators.push({
								operator: '>=',
								version: { ...lower, prerelease: from.prerelease.length > 0 ? from.prerelease : (includePrerelease ? [0] : []) },
						});
				}
				if (to.major !== null) {
						if (to.minor === null) {
								comparators.push(bound('<', `${String(to.major + 1)}.0.0-0`));
						}
						else if (to.patch === null) {
								comparators.push(bound('<', `${String(to.major)}.${String(to.minor + 1)}.0-0`));
						}
						else if (to.prerelease.length > 0) {
								comparators.push({ operator: '<=', version: concrete(to, to.prerelease) });
						}
						else if (includePrerelease) {
								comparators.push(bound('<', `${String(to.major)}.${String(to.minor)}.${String(to.patch + 1)}-0`));
						}
						else {
								comparators.push({ operator: '<=', version: concrete(to, []) });
						}
				}
				return comparators;
		}
		/**
		 * Normalize operator spacing and the `~>` alias.
		 * @param text - raw range text.
		 * @returns range text with tight operators.
		 */
		function normalizeOperators(text) {
				return text
						.trim()
						.replace(/~>/g, '~')
						.replace(/(>=|<=|>|<|=|\^|~)\s+/g, '$1');
		}
		/**
		 * Parse one comparator set.
		 * @param text - set text such as `>=1.0.0 <2.0.0`.
		 * @param includePrerelease - whether lower bounds widen to `-0`.
		 * @returns comparators, or null when the set is malformed.
		 */
		function parseSet(text, includePrerelease) {
				const normalized = normalizeOperators(text);
				if (normalized === '')
						return [];
				if (/\s-\s/.test(normalized))
						return expandHyphen(normalized, includePrerelease);
				const comparators = [];
				for (const token of normalized.split(/\s+/)) {
						if (token === '')
								continue;
						const expanded = expandToken(token, includePrerelease);
						if (expanded === null)
								return null;
						for (const comparator of expanded) {
								if (comparator.operator === '>=' && comparator.version.prerelease.length === 0
										&& comparator.version.major === 0 && comparator.version.minor === 0 && comparator.version.patch === 0) {
										continue;
								}
								comparators.push(comparator);
						}
				}
				return comparators;
		}
		/**
		 * Parse a range into comparator sets.
		 * @param text - range text.
		 * @param includePrerelease - whether lower bounds widen to `-0`.
		 * @returns comparator sets, or null when the range is invalid.
		 */
		function parseRange(text, includePrerelease = false) {
				if (typeof text !== 'string' || text.length > MAX_LENGTH)
						return null;
				const sets = [];
				for (const piece of text.split('||')) {
						const parsed = parseSet(piece, includePrerelease);
						if (parsed === null)
								return null;
						sets.push(parsed);
				}
				return sets;
		}
		/**
		 * Test one comparator set against a version.
		 * @param set - comparators that must all pass.
		 * @param version - candidate version.
		 * @param includePrerelease - whether prereleases are admitted freely.
		 * @returns true when every comparator passes and the prerelease rule holds.
		 */
		function testSet(set, version, includePrerelease) {
				for (const comparator of set) {
						const order = compareVersions(version, comparator.version);
						const pass = comparator.operator === '' ? order === 0
								: comparator.operator === '>' ? order > 0
										: comparator.operator === '>=' ? order >= 0
												: comparator.operator === '<' ? order < 0
														: order <= 0;
						if (!pass)
								return false;
				}
				if (version.prerelease.length > 0 && !includePrerelease) {
						for (const comparator of set) {
								if (comparator.version.prerelease.length === 0)
										continue;
								const allowed = comparator.version;
								if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
										return true;
								}
						}
						return false;
				}
				return true;
		}
		/**
		 * Check whether a version is inside a range.
		 * @param versionText - candidate version.
		 * @param rangeText - semver range.
		 * @param options - `includePrerelease` admits prereleases without a matching opt-in.
		 * @returns true when the version satisfies the range.
		 */
		function satisfies(versionText, rangeText, options = {}) {
				const version = parseVersion(versionText);
				if (version === null)
						return false;
				const includePrerelease = options.includePrerelease === true;
				const sets = parseRange(rangeText, includePrerelease);
				if (sets === null)
						return false;
				for (const set of sets) {
						if (testSet(set, version, includePrerelease))
								return true;
				}
				return false;
		}
		/**
		 * Validate a range.
		 * @param text - candidate range text.
		 * @returns the range text when valid, otherwise null.
		 */
		function validRange(text) {
				return parseRange(text) === null ? null : String(text);
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/shared/capabilities.ts
		/**
		* Check whether a shape module ABI can run here.
		* @param version - declared shape apiVersion; absent defaults to 1.
		* @returns true when supported.
		*/
		function supportsShapeApiVersion(version) {
			return (version ?? 1) === 1;
		}
		/**
		* Build the capability registry exposed to other Client plugins.
		* @returns a registry whose entries disappear when their disposer is called.
		*/
		function createShapeCapabilityRegistry() {
			const entries = /* @__PURE__ */ new Map();
			const listeners = /* @__PURE__ */ new Set();
			const keyOf = (plugin, capability) => `${plugin}#${capability}`;
			const notify = () => {
				for (const listener of listeners) listener();
			};
			return {
				provide(capability) {
					if (capability.plugin.trim().length === 0 || capability.capability.trim().length === 0) throw new Error("capability plugin and capability must be non-empty");
					if (!valid(capability.version)) throw new Error(`invalid capability version: ${capability.version}`);
					if (capability.description !== void 0 && (typeof capability.description !== "string" || capability.description.trim().length === 0)) throw new Error("capability description must be a non-empty string");
					if (capability.usage !== void 0 && (typeof capability.usage !== "string" || capability.usage.trim().length === 0)) throw new Error("capability usage must be a non-empty string");
					const key = keyOf(capability.plugin, capability.capability);
					if (entries.has(key)) throw new Error(`capability already provided: ${key}`);
					entries.set(key, capability);
					notify();
					let disposed = false;
					return () => {
						if (disposed) return;
						disposed = true;
						if (entries.get(key) === capability) entries.delete(key);
						notify();
					};
				},
				get(plugin, capability) {
					return entries.get(keyOf(plugin, capability));
				},
				list() {
					return [...entries.values()];
				},
				subscribe(listener) {
					listeners.add(listener);
					return () => {
						listeners.delete(listener);
					};
				},
				resolve(requirements) {
					const capabilities = {};
					const missing = [];
					for (const requirement of requirements) {
						const key = keyOf(requirement.plugin, requirement.capability);
						if (validRange(requirement.version) === null) {
							missing.push({
								...requirement,
								range: requirement.version,
								reason: "invalid-range"
							});
							continue;
						}
						const found = entries.get(key);
						if (found === void 0) {
							if (requirement.optional !== true) missing.push({
								...requirement,
								range: requirement.version,
								reason: "missing"
							});
							continue;
						}
						if (!satisfies(found.version, requirement.version, { includePrerelease: true })) {
							missing.push({
								plugin: requirement.plugin,
								capability: requirement.capability,
								range: requirement.version,
								found: found.version,
								reason: "version-mismatch"
							});
							continue;
						}
						capabilities[key] = found.api;
					}
					return {
						ok: missing.length === 0,
						capabilities,
						missing
					};
				}
			};
		}
		//#endregion
		//#region \0dsh-css:shape-chat-cards.module.css.mjs
		const css$1 = ".MQAMYG_list{box-sizing:border-box;gap:8px;width:100%;max-width:860px;margin:0 auto 8px;padding:0 16px;display:grid}.MQAMYG_card{background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);box-shadow:var(--dsw-elevation-soft,0 6px 18px #00000024);border-radius:12px;align-items:center;gap:12px;padding:12px 14px;display:flex}.MQAMYG_mark{width:32px;height:32px;color:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff);background:color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 14%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 28%, transparent);border-radius:9px;flex:none;place-items:center;display:grid}.MQAMYG_markGrid{grid-template-rows:repeat(2,4px);grid-template-columns:repeat(2,4px);gap:2px;display:grid}.MQAMYG_markGrid>span{opacity:.9;background:currentColor;border-radius:1px}.MQAMYG_body{flex:1;min-width:0}.MQAMYG_heading{align-items:baseline;gap:8px;min-width:0;display:flex}.MQAMYG_title{text-overflow:ellipsis;white-space:nowrap;margin:0;font-size:13px;font-weight:500;line-height:18px;overflow:hidden}.MQAMYG_id{color:var(--dsw-alias-label-secondary,#fff9);font-family:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Consolas, monospace);flex:none;font-size:10px}.MQAMYG_text{color:var(--dsw-alias-label-secondary,#fff9);margin:2px 0 0;font-size:12px;line-height:1.5}.MQAMYG_greeting{color:var(--dsw-alias-state-success-primary,#7dd3a7);margin:4px 0 0;font-size:12px;line-height:1.5}@media (width<=720px){.MQAMYG_list{padding:0 8px}.MQAMYG_card{flex-wrap:wrap;align-items:flex-start}.MQAMYG_card button{margin-left:44px}}";
		const tagId$1 = "dsh-shape/shape-chat-cards.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId$1) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-shape";
			tag.dataset.pluginCss = tagId$1;
			tag.textContent = css$1;
			document.head.appendChild(tag);
		}
		var shape_chat_cards_module_css_default = {
			"body": "MQAMYG_body",
			"card": "MQAMYG_card",
			"greeting": "MQAMYG_greeting",
			"heading": "MQAMYG_heading",
			"id": "MQAMYG_id",
			"list": "MQAMYG_list",
			"mark": "MQAMYG_mark",
			"markGrid": "MQAMYG_markGrid",
			"text": "MQAMYG_text",
			"title": "MQAMYG_title"
		};
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/shape-slots.ts
		/** Conversation slots a shape may target, and the mounts shapes register into them. */
		/**
		 * Supported slots, in registration order.
		 *
		 * `conversation.view` is deliberately absent: its entries are tabs that must
		 * render the whole Session body, which neither a descriptor nor a bare mount
		 * container can satisfy.
		 */
		const SHAPE_SLOTS = [
			{ name: 'conversation.input.dock', presentation: 'card' },
			{ name: 'conversation.input.overlay', presentation: 'panel' },
			{ name: 'conversation.composer.dock', presentation: 'strip' },
			{ name: 'conversation.input.left', presentation: 'inline' },
			{ name: 'conversation.input.right', presentation: 'inline' },
			{ name: 'conversation.session.header.actions', presentation: 'inline' },
			{ name: 'conversation.session.header.utilities', presentation: 'inline' },
			{ name: 'conversation.hero.options', presentation: 'inline' },
			{ name: 'conversation.session.header.views.actions', presentation: 'menu-row' },
			{ name: 'shell.overlay', presentation: 'overlay' },
		];
		/**
		 * Check whether a name is a supported slot.
		 * @param slot - candidate slot name.
		 * @returns true when shapes may target it.
		 */
		function isShapeSlot(slot) {
			return SHAPE_SLOTS.some(spec => spec.name === slot);
		}
		/**
		 * Presentation of one slot.
		 * @param slot - supported slot name.
		 * @returns the declared presentation.
		 */
		function presentationOf(slot) {
			return SHAPE_SLOTS.find(spec => spec.name === slot)?.presentation ?? 'card';
		}
		const mounts = new Map();
		const listeners = new Map();
		/**
		 * Notify every listener of one slot.
		 * @param slot - slot whose mounts changed.
		 */
		function notify(slot) {
			for (const listener of listeners.get(slot) ?? [])
				listener();
		}
		/**
		 * Register one mount.
		 * @param mount - slot, owner, and render callback.
		 * @returns an idempotent disposer.
		 */
		function registerShapeMount(mount) {
			let set = mounts.get(mount.slot);
			if (set === undefined) {
				set = new Set();
				mounts.set(mount.slot, set);
			}
			set.add(mount);
			notify(mount.slot);
			let disposed = false;
			return () => {
				if (disposed)
					return;
				disposed = true;
				set.delete(mount);
				notify(mount.slot);
			};
		}
		/**
		 * Read the mounts of one slot.
		 * @param slot - slot to read.
		 * @returns a stable-ordered snapshot.
		 */
		/**
		 * Remove every mount one shape owns, across all slots.
		 * @param shapeId - owning shape.
		 */
		function disposeShapeMounts(shapeId) {
			for (const [slot, set] of mounts) {
				for (const mount of [...set]) {
					if (mount.shapeId !== shapeId) continue;
					set.delete(mount);
					notify(slot);
				}
			}
		}

		function shapeMounts(slot) {
			return [...(mounts.get(slot) ?? [])];
		}
		/**
		 * Observe mount changes of one slot.
		 * @param slot - slot to observe.
		 * @param listener - change callback.
		 * @returns an unsubscribe function.
		 */
		function subscribeShapeMounts(slot, listener) {
			let set = listeners.get(slot);
			if (set === undefined) {
				set = new Set();
				listeners.set(slot, set);
			}
			set.add(listener);
			return () => {
				set.delete(listener);
				if (set.size === 0)
					listeners.delete(slot);
			};
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/ShapeSlotEntries.tsx
		/** Shape-owned entries and mounts in the conversation slots. */
		/** Distance from a viewport edge that snaps a floating window. */
		const SNAP_DISTANCE = 24;
		/** Margin kept between a snapped window and the viewport edge. */
		const SNAP_MARGIN = 8;
		/** Key prefix for a floating window's remembered position. */
		const FLOAT_STORAGE_PREFIX = 'dsh-shape:float:';
		/** Stack positioning of anchored entries, at the composer card's top edge. */
		const PANEL_STACK = {
			position: 'absolute',
			left: 0,
			right: 0,
			bottom: 'calc(100% + 8px)',
			display: 'grid',
			gap: 6,
			maxWidth: 720,
			margin: '0 auto',
		};
		/** Compact entry chrome shared by the strip presentation. */
		const COMPACT_ENTRY = {
			gap: 8,
			padding: '4px 10px',
			borderRadius: 999,
			boxShadow: 'none',
		};
		/** One informational chip for the compact tool rows. */
		const INLINE_ENTRY = {
			display: 'inline-flex',
			alignItems: 'center',
			gap: 6,
			minWidth: 0,
			maxWidth: 240,
			height: 24,
			padding: '0 8px',
			borderRadius: 6,
			border: '1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.08))',
			background: 'var(--dsw-alias-bg-layer-2, transparent)',
			color: 'var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.6))',
			fontSize: 12,
			lineHeight: '20px',
			whiteSpace: 'nowrap',
			overflow: 'hidden',
			textOverflow: 'ellipsis',
		};
		/** One row inside a menu. */
		const MENU_ROW = {
			display: 'flex',
			alignItems: 'center',
			gap: 8,
			width: '100%',
			minWidth: 0,
			padding: '6px 10px',
			borderRadius: 6,
			fontSize: 13,
			lineHeight: '18px',
			textAlign: 'left',
		};
		/** Glyph fallback when a descriptor declares no icon path. */
		const GLYPH_FALLBACK = {
			display: 'grid',
			flex: 'none',
			placeItems: 'center',
			width: 14,
			height: 14,
			borderRadius: 3,
			background: 'color-mix(in srgb, currentColor 16%, transparent)',
			fontSize: 9,
			lineHeight: 1,
			textTransform: 'uppercase',
		};
		/** Dismiss control of one floating entry. */
		const DISMISS_STYLE = {
			flex: 'none',
			width: 24,
			height: 24,
			padding: 0,
			border: 0,
			borderRadius: 6,
			background: 'transparent',
			color: 'var(--dsw-alias-label-secondary, rgba(255, 255, 255, 0.6))',
			cursor: 'pointer',
			fontSize: 16,
			lineHeight: '24px',
		};
		/** Window chrome of a floating panel. */
		const FLOAT_WINDOW = {
			position: 'fixed',
			zIndex: 60,
			width: 320,
			maxWidth: 'min(380px, calc(100vw - 16px))',
			borderRadius: 10,
			border: '1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.12))',
			background: 'var(--dsw-alias-bg-layer-2, #1b1d22)',
			boxShadow: '0 16px 40px rgba(0, 0, 0, 0.36)',
			color: 'var(--dsw-alias-label-primary, #e6edf3)',
			overflow: 'hidden',
		};
		/** Drag bar of a floating panel. */
		const FLOAT_BAR = {
			display: 'flex',
			alignItems: 'center',
			gap: 8,
			padding: '6px 8px 6px 12px',
			cursor: 'move',
			userSelect: 'none',
			touchAction: 'none',
			background: 'var(--dsw-alias-bg-layer-3, rgba(255, 255, 255, 0.04))',
			fontSize: 12,
			lineHeight: '18px',
		};
		/** Body of a floating panel. */
		const FLOAT_BODY = {
			padding: '10px 12px 12px',
			fontSize: 12,
			lineHeight: 1.6,
		};
		/**
		 * Keep a window inside the viewport.
		 * @param position - desired top-left corner.
		 * @param size - window size.
		 * @param viewport - viewport size.
		 * @returns the clamped position.
		 */
		function clampPosition(position, size, viewport) {
			return {
				x: Math.min(Math.max(0, position.x), Math.max(0, viewport.width - size.width)),
				y: Math.min(Math.max(0, position.y), Math.max(0, viewport.height - size.height)),
			};
		}
		/**
		 * Snap a released window to the nearest viewport edge.
		 * @param position - released top-left corner.
		 * @param size - window size.
		 * @param viewport - viewport size.
		 * @param snap - whether snapping is enabled.
		 * @returns the snapped, clamped position.
		 */
		function snapPosition(position, size, viewport, snap) {
			const clamped = clampPosition(position, size, viewport);
			if (!snap)
				return clamped;
			let { x, y } = clamped;
			if (x <= SNAP_DISTANCE)
				x = SNAP_MARGIN;
			else if (x + size.width >= viewport.width - SNAP_DISTANCE)
				x = viewport.width - size.width - SNAP_MARGIN;
			if (y <= SNAP_DISTANCE)
				y = SNAP_MARGIN;
			else if (y + size.height >= viewport.height - SNAP_DISTANCE)
				y = viewport.height - size.height - SNAP_MARGIN;
			return clampPosition({ x, y }, size, viewport);
		}
		/**
		 * Place a window that has no remembered position above the composer's corner.
		 * @param size - window size.
		 * @param viewport - viewport size.
		 * @returns the default position.
		 */
		function defaultPosition(size, viewport) {
			return clampPosition({
				x: viewport.width - size.width - SNAP_MARGIN,
				y: viewport.height - size.height - 160,
			}, size, viewport);
		}
		/**
		 * Read a remembered window position.
		 * @param key - storage key.
		 * @returns the stored position, when one is readable.
		 */
		function readStoredPosition(key) {
			try {
				const raw = localStorage.getItem(key);
				if (raw === null)
					return null;
				const parsed = JSON.parse(raw);
				if (typeof parsed.x !== 'number' || typeof parsed.y !== 'number')
					return null;
				return { x: parsed.x, y: parsed.y };
			}
			catch {
				return null;
			}
		}
		/**
		 * Remember a window position.
		 * @param key - storage key.
		 * @param position - position to store.
		 */
		function storePosition(key, position) {
			try {
				localStorage.setItem(key, JSON.stringify(position));
			}
			catch {
				// Private-mode storage can refuse writes; the window still works for this mount.
			}
		}
		/** Wrapper chrome that keeps a mount inside its slot's layout. */
		function mountStyle(presentation) {
			return presentation === 'inline' || presentation === 'strip' || presentation === 'menu-row'
				? { display: 'inline-flex', alignItems: 'center', minWidth: 0 }
				: { display: 'block', width: '100%' };
		}
		/**
		 * Read shape descriptors targeting one slot.
		 * @param slot - conversation slot to collect.
		 * @returns entries contributed by valid shapes.
		 */
		async function readEntries(slot) {
			const response = await fetch('/dsh-shape/api/shapes', {
				credentials: 'same-origin',
				cache: 'no-store',
				headers: { accept: 'application/json' },
			});
			if (!response.ok)
				return [];
			const payload = await response.json();
			if (payload.ok !== true || !Array.isArray(payload.shapes))
				return [];
			const entries = [];
			for (const shape of payload.shapes) {
				if (!shape.valid || shape.enabled === false)
					continue;
				for (const card of shape.slotData ?? []) {
					if (card.slot === slot)
						entries.push({ shape, card });
				}
			}
			return entries;
		}
		/**
		 * Render one descriptor glyph.
		 * @param props.icon - SVG path data in a 16×16 view box.
		 * @param props.title - fallback letter source.
		 * @returns the glyph.
		 */
		function ShapeGlyph({ icon, title }) {
			if (icon !== undefined) {
				return (react_jsx_runtime.jsx("svg", { viewBox: "0 0 16 16", width: "14", height: "14", "aria-hidden": "true", children: react_jsx_runtime.jsx("path", { d: icon, fill: "currentColor" }) }));
			}
			return react_jsx_runtime.jsx("span", { style: GLYPH_FALLBACK, "aria-hidden": "true", children: Array.from(title.trim())[0] ?? '?' });
		}
		/**
		 * Render one mount into a container the slot host owns.
		 * @param props.mount - registered mount.
		 * @param props.style - wrapper chrome for the slot's layout.
		 * @returns the container element.
		 */
		function ShapeMountBox({ mount, style }) {
			const ref = react.useRef(null);
			react.useEffect(() => {
				const container = ref.current;
				if (container === null)
					return;
				let cleanup;
				try {
					const result = mount.render(container);
					if (typeof result === 'function')
						cleanup = result;
				}
				catch (cause) {
					console.warn('dsh-shape: slot mount failed', cause);
				}
				return () => {
					cleanup?.();
					container.replaceChildren();
				};
			}, [mount]);
			return react_jsx_runtime.jsx("div", { ref: ref, style: style, "data-shape-mount": mount.shapeId });
		}
		/**
		 * One draggable window portalled to the document body.
		 * @param props.title - bar label.
		 * @param props.storageKey - key that remembers the position.
		 * @param props.snap - whether a released window snaps to viewport edges.
		 * @param props.onClose - optional dismiss control.
		 * @param props.children - window body.
		 * @returns the window.
		 */
		function FloatingWindow({ title, storageKey, snap, onClose, children }) {
			const ref = react.useRef(null);
			const [position, setPosition] = react.useState(null);
			const drag = react.useRef(null);
			react.useEffect(() => {
				const element = ref.current;
				if (element === null || position !== null)
					return;
				const size = { width: element.offsetWidth, height: element.offsetHeight };
				const viewport = { width: window.innerWidth, height: window.innerHeight };
				const stored = readStoredPosition(storageKey);
				setPosition(stored === null ? defaultPosition(size, viewport) : clampPosition(stored, size, viewport));
			}, [position, storageKey]);
			const measure = () => {
				const element = ref.current;
				return {
					size: { width: element?.offsetWidth ?? 0, height: element?.offsetHeight ?? 0 },
					viewport: { width: window.innerWidth, height: window.innerHeight },
				};
			};
			const onPointerDown = (event) => {
				if (event.button !== 0)
					return;
				const element = ref.current;
				if (element === null)
					return;
				const rect = element.getBoundingClientRect();
				drag.current = { dx: event.clientX - rect.left, dy: event.clientY - rect.top };
				event.currentTarget.setPointerCapture(event.pointerId);
				event.preventDefault();
			};
			const onPointerMove = (event) => {
				if (drag.current === null)
					return;
				const { size, viewport } = measure();
				setPosition(clampPosition({ x: event.clientX - drag.current.dx, y: event.clientY - drag.current.dy }, size, viewport));
			};
			const onPointerUp = (event) => {
				if (drag.current === null)
					return;
				drag.current = null;
				const { size, viewport } = measure();
				setPosition((current) => {
					if (current === null)
						return current;
					const next = snapPosition(current, size, viewport, snap);
					storePosition(storageKey, next);
					return next;
				});
				if (event.currentTarget.hasPointerCapture(event.pointerId)) {
					event.currentTarget.releasePointerCapture(event.pointerId);
				}
			};
			return (react_jsx_runtime.jsxs("div", { ref: ref, style: { ...FLOAT_WINDOW, left: position?.x ?? 0, top: position?.y ?? 0, visibility: position === null ? 'hidden' : 'visible' }, "data-shape-float": storageKey, children: [react_jsx_runtime.jsxs("div", { style: FLOAT_BAR, onPointerDown: onPointerDown, onPointerMove: onPointerMove, onPointerUp: onPointerUp, onPointerCancel: onPointerUp, title: "\u62D6\u52A8", children: [react_jsx_runtime.jsx("span", { style: { flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }, children: title }), onClose !== undefined && (react_jsx_runtime.jsx("button", { type: "button", "aria-label": "\u5173\u95ED", "data-testid": "dsh-shape-float-dismiss", style: DISMISS_STYLE, onPointerDown: (event) => { event.stopPropagation(); }, onClick: onClose, children: "\u00D7" }))] }), react_jsx_runtime.jsx("div", { style: FLOAT_BODY, children: children })] }));
		}
		/**
		 * Observe the mounts registered for one slot.
		 * @param slot - slot to observe.
		 * @returns current mounts.
		 */
		function useShapeMounts(slot) {
			const [list, setList] = react.useState(() => shapeMounts(slot));
			react.useEffect(() => {
				const sync = () => { setList(shapeMounts(slot)); };
				sync();
				return subscribeShapeMounts(slot, sync);
			}, [slot]);
			return list;
		}
		/**
		 * Render the descriptors and mounts one conversation slot receives.
		 * @param props.resolveShape - resolves declared capability requirements.
		 * @param props.slot - conversation slot this host is registered for.
		 * @returns the slot content, or null when nothing contributes.
		 */
		function ShapeSlotEntries({ resolveShape, slot }) {
			const [entries, setEntries] = react.useState([]);
			const [greetings, setGreetings] = react.useState({});
			const [dismissed, setDismissed] = react.useState(() => new Set());
			const mounts = useShapeMounts(slot);
			const load = react.useCallback(async () => {
				try {
					const read = await readEntries(slot);
					setEntries(read.filter(({ shape }) => (supportsShapeApiVersion(shape.shapeApiVersion)
						&& resolveShape(shape.requirements ?? []).ok)));
				}
				catch {
					// A failed read leaves the slot empty; the shape browser still reports errors.
				}
			}, [resolveShape, slot]);
			react.useEffect(() => {
				void load();
				const reload = () => { void load(); };
				window.addEventListener('dsh-shape:refresh', reload);
				window.addEventListener('dsh-shape:capabilities', reload);
				return () => {
					window.removeEventListener('dsh-shape:refresh', reload);
					window.removeEventListener('dsh-shape:capabilities', reload);
				};
			}, [load]);
			const presentation = presentationOf(slot);
			const anchored = [];
			const floating = [];
			entries
				.map((entry, index) => ({ entry, key: `${entry.shape.id}:${String(index)}` }))
				.filter(({ key }) => !dismissed.has(key))
				.forEach(({ entry: { shape, card }, key }) => {
				const greeting = greetings[key];
				const title = card.title ?? shape.title;
				const greet = () => {
					setGreetings(current => ({ ...current, [key]: card.greeting ?? '你好！' }));
				};
				const dismiss = () => {
					setDismissed(current => new Set(current).add(key));
				};
				if (presentation === 'inline') {
					anchored.push(react_jsx_runtime.jsxs("span", { style: INLINE_ENTRY, title: card.text ?? title, "data-testid": "dsh-shape-slot-entry", "data-shape-id": shape.id, "data-slot": slot, children: [react_jsx_runtime.jsx(ShapeGlyph, { icon: card.icon, title: title }), react_jsx_runtime.jsx("span", { style: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }, children: title })] }, key));
					return;
				}
				if (presentation === 'menu-row') {
					anchored.push(react_jsx_runtime.jsxs("div", { style: MENU_ROW, "data-testid": "dsh-shape-slot-entry", "data-shape-id": shape.id, "data-slot": slot, children: [react_jsx_runtime.jsx(ShapeGlyph, { icon: card.icon, title: title }), react_jsx_runtime.jsxs("div", { style: { minWidth: 0, flex: 1 }, children: [react_jsx_runtime.jsx("div", { children: title }), card.text !== undefined && react_jsx_runtime.jsx("div", { style: { opacity: 0.7, fontSize: 12 }, children: card.text }), greeting !== undefined && react_jsx_runtime.jsx("div", { style: { opacity: 0.9, fontSize: 12 }, role: "status", children: greeting })] }), card.button !== undefined && react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", "data-testid": "dsh-shape-chat-greet", onClick: greet, children: card.button })] }, key));
					return;
				}
				const action = card.button ?? (presentation === 'strip' ? undefined : '打个招呼');
				if (presentation === 'panel' && card.placement === 'floating') {
					floating.push(react_jsx_runtime.jsxs(FloatingWindow, { title: title, storageKey: `${FLOAT_STORAGE_PREFIX}${slot}:${key}`, snap: card.snap !== false, onClose: dismiss, children: [card.text !== undefined && react_jsx_runtime.jsx("div", { children: card.text }), greeting !== undefined && react_jsx_runtime.jsx("div", { style: { marginTop: 4 }, role: "status", children: greeting }), action !== undefined && (react_jsx_runtime.jsx("div", { style: { marginTop: 8 }, children: react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", "data-testid": "dsh-shape-chat-greet", onClick: greet, children: action }) }))] }, key));
					return;
				}
				anchored.push(react_jsx_runtime.jsxs("section", { className: shape_chat_cards_module_css_default.card, style: presentation === 'strip' ? COMPACT_ENTRY : presentation === 'panel' ? { boxShadow: '0 10px 28px rgba(0, 0, 0, 0.28)' } : undefined, "data-testid": "dsh-shape-slot-entry", "data-shape-id": shape.id, "data-slot": slot, children: [presentation !== 'strip' && (react_jsx_runtime.jsx("span", { className: shape_chat_cards_module_css_default.mark, "aria-hidden": "true", children: react_jsx_runtime.jsxs("span", { className: shape_chat_cards_module_css_default.markGrid, children: [react_jsx_runtime.jsx("span", {}), react_jsx_runtime.jsx("span", {}), react_jsx_runtime.jsx("span", {}), react_jsx_runtime.jsx("span", {})] }) })), react_jsx_runtime.jsxs("div", { className: shape_chat_cards_module_css_default.body, children: [react_jsx_runtime.jsxs("div", { className: shape_chat_cards_module_css_default.heading, children: [react_jsx_runtime.jsx("h3", { className: shape_chat_cards_module_css_default.title, children: title }), presentation !== 'strip' && react_jsx_runtime.jsx("code", { className: shape_chat_cards_module_css_default.id, children: shape.id })] }), card.text !== undefined && react_jsx_runtime.jsx("p", { className: shape_chat_cards_module_css_default.text, children: card.text }), greeting !== undefined && (react_jsx_runtime.jsx("p", { className: shape_chat_cards_module_css_default.greeting, role: "status", children: greeting }))] }), action !== undefined && (react_jsx_runtime.jsx(_deepseek_ai_dsh_client_ui_primitives.Button, { size: "sm", variant: "outline", "data-testid": "dsh-shape-chat-greet", onClick: greet, children: action })), presentation === 'panel' && (react_jsx_runtime.jsx("button", { type: "button", "aria-label": "\u5173\u95ED", "data-testid": "dsh-shape-chat-dismiss", style: DISMISS_STYLE, onClick: dismiss, children: "\u00D7" }))] }, key));
			});
			for (const mount of mounts) {
				const floatingMount = presentation === 'panel' && mount.placement === 'floating';
				if (floatingMount) {
					floating.push(react_jsx_runtime.jsx(FloatingWindow, { title: mount.title, storageKey: `${FLOAT_STORAGE_PREFIX}${slot}:${mount.shapeId}`, snap: mount.snap, children: react_jsx_runtime.jsx(ShapeMountBox, { mount: mount, style: { display: 'block', width: '100%' } }) }, `mount:${mount.shapeId}`));
					continue;
				}
				anchored.push(react_jsx_runtime.jsx(ShapeMountBox, { mount: mount, style: mountStyle(presentation) }, `mount:${mount.shapeId}`));
			}
			if (anchored.length === 0 && floating.length === 0)
				return null;
			const inlineContent = anchored.length === 0
				? null
				: presentation === 'panel'
					? react_jsx_runtime.jsx("div", { style: PANEL_STACK, children: anchored })
					: presentation === 'card'
						? react_jsx_runtime.jsx("div", { className: shape_chat_cards_module_css_default.list, children: anchored })
						: react_jsx_runtime.jsx(react.Fragment, { children: anchored });
			return (react_jsx_runtime.jsxs(react.Fragment, { children: [inlineContent, floating.map(node => react_dom.createPortal(node, document.body))] }));
		}
		//#endregion
		//#region \0dsh-css:shape-dialog.module.css.mjs
		const css = ".TTllmG_backdrop{z-index:1200;background:var(--dsw-alias-bg-mask-1,#00000080);backdrop-filter:var(--dsw-mask-blur,blur(12px));animation:TTllmG_backdrop-in var(--ds-transition-duration,.16s) var(--ds-ease-in-out,ease-out);justify-content:center;align-items:center;padding:24px;display:flex;position:fixed;inset:0}.TTllmG_window{width:min(1120px,94vw);height:min(760px,90vh);max-height:calc(100dvh - 48px);color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);border-radius:var(--dsw-radius-panel,18px);box-shadow:var(--dsw-elevation-prominent,0 24px 80px #0000005c);animation:TTllmG_window-in var(--ds-transition-duration,.16s) var(--ds-ease-in-out,ease-out);flex-direction:column;display:flex;overflow:hidden}.TTllmG_window:focus{outline:none}.TTllmG_header{border-bottom:1px solid var(--dsw-alias-border-secondary,#ffffff14);background:color-mix(in srgb, var(--dsw-alias-bg-layer-2) 84%, transparent);justify-content:space-between;align-items:center;gap:20px;padding:18px 22px;display:flex}.TTllmG_heading{align-items:center;gap:12px;min-width:0;display:flex}.TTllmG_appMark{width:36px;height:36px;color:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff);background:color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 14%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 28%, transparent);border-radius:10px;flex:none;place-items:center;display:grid}.TTllmG_appMarkGrid{grid-template-rows:repeat(2,5px);grid-template-columns:repeat(2,5px);gap:2px;display:grid}.TTllmG_appMarkGrid>span{opacity:.9;background:currentColor;border-radius:1.5px}.TTllmG_headingText{min-width:0}.TTllmG_title{margin:0;font-size:17px;font-weight:500;line-height:24px}.TTllmG_subtitle{color:var(--dsw-alias-label-secondary,#fff9);text-overflow:ellipsis;white-space:nowrap;margin:1px 0 0;font-size:12px;line-height:18px;overflow:hidden}.TTllmG_actions{flex:none;gap:4px;display:flex}.TTllmG_iconButton{width:28px;height:28px;color:var(--dsw-alias-label-secondary,#fff9);border-radius:var(--dsw-radius-sm,8px);cursor:pointer;background:0 0;border:0;place-items:center;padding:0;display:grid}.TTllmG_iconButton>svg{width:16px;height:16px}@media (hover:hover){.TTllmG_iconButton:hover{color:var(--dsw-alias-label-primary);background:var(--dsw-alias-interactive-bg-hover)}}.TTllmG_iconButton:active{background:var(--dsw-alias-interactive-bg-active)}.TTllmG_iconButton:focus-visible{color:var(--dsw-alias-label-primary);box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#6ea6ff));outline:none}.TTllmG_content{flex:1;min-height:0;padding:22px;overflow:auto}.TTllmG_grid{grid-template-columns:repeat(auto-fill,minmax(220px,1fr));align-content:start;gap:12px;display:grid}.TTllmG_cardShell{min-width:0;position:relative}.TTllmG_card{width:100%;min-height:190px;color:inherit;font:inherit;text-align:left;appearance:none;cursor:pointer;background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);border-radius:14px;flex-direction:column;gap:10px;margin:0;padding:14px;transition:border-color .14s,box-shadow .14s,transform .14s,opacity .14s;display:flex}.TTllmG_card:disabled{cursor:default;opacity:.55}.TTllmG_cardShell[data-enabled=false] .TTllmG_card{opacity:.55}@media (hover:hover){.TTllmG_card:hover{border-color:color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 34%, var(--dsw-alias-border-secondary,transparent));box-shadow:var(--dsw-elevation-soft,0 8px 24px #0000002e);transform:translateY(-1px)}.TTllmG_card:disabled:hover{border-color:var(--dsw-alias-border-secondary,#ffffff14);box-shadow:none;transform:none}}.TTllmG_card:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#6ea6ff));outline:none}.TTllmG_switch{z-index:2;background:var(--dsw-alias-bg-layer-1);border:1px solid var(--dsw-alias-border-secondary,#ffffff2e);cursor:pointer;border-radius:999px;flex:none;width:32px;height:18px;padding:0;transition:background .14s,border-color .14s,opacity .14s;position:absolute;top:12px;right:12px}.TTllmG_switch:after{content:\"\";background:var(--dsw-alias-label-secondary,#ffffffa6);border-radius:50%;width:12px;height:12px;transition:transform .14s,background .14s;position:absolute;top:2px;left:2px}.TTllmG_switch[aria-checked=true]{background:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff);border-color:#0000}.TTllmG_switch[aria-checked=true]:after{background:#fff;transform:translate(14px)}.TTllmG_switch:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#6ea6ff));outline:none}.TTllmG_switch:disabled{cursor:wait;opacity:.5}.TTllmG_deleteButton{z-index:2;width:26px;height:26px;color:var(--dsw-alias-label-secondary,#fff9);cursor:pointer;opacity:.72;background:0 0;border:1px solid #0000;border-radius:8px;place-items:center;padding:0;font-size:14px;line-height:1;transition:color .14s,background .14s,border-color .14s;display:grid;position:absolute;bottom:10px;right:10px}.TTllmG_deleteButton svg{width:14px;height:14px}.TTllmG_deleteButton:hover:not(:disabled){color:var(--dsw-alias-state-error-primary,#ff9b9b);background:color-mix(in srgb, var(--dsw-alias-state-error-primary,#ff9b9b) 14%, transparent);border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary,#ff9b9b) 32%, transparent)}.TTllmG_deleteButton:focus-visible{box-shadow:0 0 0 2px var(--dsw-focus-ring-color,var(--dsw-alias-state-business-primary,#6ea6ff));outline:none}.TTllmG_deleteButton:disabled{cursor:wait;opacity:.4}@media (hover:none){.TTllmG_deleteButton{opacity:1}}.TTllmG_cardHead{align-items:flex-start;gap:10px;min-width:0;padding-right:36px;display:flex}.TTllmG_appIcon{width:42px;height:42px;color:var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff);background:color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 14%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-brand-primary-new-colorprimary-new-color,#6ea6ff) 24%, transparent);border-radius:11px;flex:none;place-items:center;font-size:17px;font-weight:500;line-height:1;display:grid}.TTllmG_cardIdentity{flex:1;min-width:0}.TTllmG_cardTitle{text-overflow:ellipsis;white-space:nowrap;margin:0;font-size:13.5px;font-weight:500;line-height:18px;overflow:hidden}.TTllmG_cardId{color:var(--dsw-alias-label-secondary,#fff9);font-family:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Consolas, monospace);text-overflow:ellipsis;white-space:nowrap;margin-top:2px;font-size:10.5px;line-height:14px;display:block;overflow:hidden}.TTllmG_origin{color:var(--dsw-alias-label-secondary,#fff9);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);border-radius:999px;flex:none;padding:1px 6px;font-size:10px;line-height:16px}.TTllmG_description{color:var(--dsw-alias-label-secondary,#fff9);-webkit-line-clamp:3;-webkit-box-orient:vertical;flex:1;margin:0;font-size:12px;line-height:1.5;display:-webkit-box;overflow:hidden}.TTllmG_cardFooter{flex-wrap:wrap;align-items:center;gap:4px;margin-top:auto;padding-right:34px;display:flex}.TTllmG_badge{color:var(--dsw-alias-label-secondary,#fff9);background:var(--dsw-alias-bg-layer-2);border-radius:5px;padding:1px 6px;font-size:10px;line-height:16px}.TTllmG_invalid{color:var(--dsw-alias-state-error-primary,#ff9b9b);font-size:11px}.TTllmG_blocked{color:var(--dsw-alias-state-warn-primary,#f0c36a);font-size:11px;line-height:1.4}.TTllmG_toggleError{color:var(--dsw-alias-state-error-primary,#ff9b9b);background:color-mix(in srgb, var(--dsw-alias-state-error-primary,#ff9b9b) 8%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-state-error-primary,#ff9b9b) 28%, transparent);border-radius:8px;margin-bottom:12px;padding:8px 10px;font-size:12px;line-height:1.5}.TTllmG_confirmBar{color:var(--dsw-alias-label-primary);background:color-mix(in srgb, var(--dsw-alias-state-warn-primary,#f0c36a) 12%, transparent);border:1px solid color-mix(in srgb, var(--dsw-alias-state-warn-primary,#f0c36a) 38%, transparent);border-radius:8px;justify-content:space-between;align-items:center;gap:12px;margin-bottom:12px;padding:10px 12px;font-size:12px;line-height:1.5;display:flex}.TTllmG_confirmText{min-width:0}.TTllmG_confirmActions{flex:none;align-items:center;gap:8px;display:flex}.TTllmG_confirmDelete{color:var(--dsw-alias-state-error-primary,#ff9b9b);border-color:color-mix(in srgb, var(--dsw-alias-state-error-primary,#ff9b9b) 42%, transparent)}.TTllmG_placeholder{min-height:320px;color:var(--dsw-alias-label-secondary,#fff9);text-align:center;flex-direction:column;justify-content:center;align-items:center;gap:8px;font-size:13px;display:flex}.TTllmG_placeholderMark{width:54px;height:54px;color:var(--dsw-alias-label-secondary,#fff9);background:var(--dsw-alias-bg-layer-3);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);border-radius:14px;place-items:center;margin-bottom:4px;font-size:22px;display:grid}.TTllmG_placeholderPath{max-width:540px;font-family:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Consolas, monospace);text-overflow:ellipsis;white-space:nowrap;font-size:11px;overflow:hidden}.TTllmG_placeholderMessage{max-width:540px;line-height:1.5}.TTllmG_skeletonCard{background:linear-gradient(100deg, var(--dsw-alias-bg-layer-3) 30%, color-mix(in srgb, var(--dsw-alias-bg-layer-3) 70%, var(--dsw-alias-label-secondary,white)) 50%, var(--dsw-alias-bg-layer-3) 70%);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);background-size:240% 100%;border-radius:14px;min-height:190px;animation:1.2s linear infinite TTllmG_shimmer}.TTllmG_viewBackdrop{z-index:1300;background:var(--dsw-alias-bg-mask-3,#0000007a);backdrop-filter:var(--dsw-mask-blur,blur(12px));animation:TTllmG_backdrop-in var(--ds-transition-duration,.16s) var(--ds-ease-in-out,ease-out);justify-content:center;align-items:center;padding:24px;display:flex;position:fixed;inset:0}.TTllmG_viewWindow{width:min(1080px,92vw);height:min(760px,88vh);max-height:calc(100dvh - 48px);color:var(--dsw-alias-label-primary);background:var(--dsw-alias-bg-layer-2);border:1px solid var(--dsw-alias-border-secondary,#ffffff14);border-radius:var(--dsw-radius-panel,18px);box-shadow:var(--dsw-elevation-prominent,0 24px 80px #0000005c);animation:TTllmG_window-in var(--ds-transition-duration,.16s) var(--ds-ease-in-out,ease-out);flex-direction:column;display:flex;overflow:hidden}.TTllmG_viewWindow:focus{outline:none}.TTllmG_viewHeader{background:var(--dsw-alias-bg-layer-2);border-bottom:1px solid var(--dsw-alias-border-secondary,#ffffff14);justify-content:space-between;align-items:center;gap:16px;padding:14px 18px;display:flex}.TTllmG_viewHeading{align-items:center;gap:10px;min-width:0;display:flex}.TTllmG_viewHeadingText{min-width:0}.TTllmG_viewTitle{text-overflow:ellipsis;white-space:nowrap;margin:0;font-size:15px;font-weight:500;line-height:20px;overflow:hidden}.TTllmG_viewSubtitle{color:var(--dsw-alias-label-secondary,#fff9);text-overflow:ellipsis;white-space:nowrap;margin:1px 0 0;font-size:11px;line-height:16px;overflow:hidden}.TTllmG_viewBody{background:var(--dsw-alias-bg-layer-1);flex:1;min-height:0;display:flex}.TTllmG_viewBody .TTllmG_placeholder{flex:1;width:100%}.TTllmG_viewFrame{background:var(--dsw-alias-bg-layer-1);color-scheme:normal;border:0;width:100%;height:100%;display:block}.TTllmG_footer{color:var(--dsw-alias-label-secondary,#fff9);border-top:1px solid var(--dsw-alias-border-secondary,#ffffff14);justify-content:space-between;align-items:center;gap:12px;padding:10px 22px;font-size:11px;line-height:16px;display:flex}.TTllmG_footerPath{min-width:0;font-family:var(--dsw-font-mono,ui-monospace, SFMono-Regular, Consolas, monospace);text-overflow:ellipsis;white-space:nowrap;overflow:hidden}.TTllmG_footerCount{flex:none}@keyframes TTllmG_backdrop-in{0%{opacity:0}to{opacity:1}}@keyframes TTllmG_window-in{0%{opacity:0;transform:translateY(6px)scale(.992)}to{opacity:1;transform:translateY(0)scale(1)}}@keyframes TTllmG_shimmer{0%{background-position:140% 0}to{background-position:-100% 0}}@media (width<=720px){.TTllmG_backdrop{padding:8px}.TTllmG_window{border-radius:14px;width:100%;height:calc(100dvh - 16px);max-height:calc(100dvh - 16px)}.TTllmG_header{padding:14px 16px}.TTllmG_content{padding:14px}.TTllmG_grid{grid-template-columns:repeat(auto-fill,minmax(152px,1fr));gap:10px}.TTllmG_card{min-height:176px;padding:12px}.TTllmG_confirmBar{flex-wrap:wrap}.TTllmG_subtitle{display:none}.TTllmG_footer{padding:8px 16px}.TTllmG_viewBackdrop{padding:8px}.TTllmG_viewWindow{border-radius:14px;width:100%;height:calc(100dvh - 16px);max-height:calc(100dvh - 16px)}.TTllmG_viewHeader{padding:12px 14px}.TTllmG_viewSubtitle{display:none}}@media (prefers-reduced-motion:reduce){.TTllmG_backdrop,.TTllmG_window,.TTllmG_skeletonCard{animation:none}.TTllmG_card{transition:none}}";
		const tagId = "dsh-shape/shape-dialog.module.css";
		if (typeof document !== "undefined" && document.querySelector("style[data-plugin-css=" + JSON.stringify(tagId) + "]") === null) {
			const tag = document.createElement("style");
			tag.dataset.plugin = "dsh-shape";
			tag.dataset.pluginCss = tagId;
			tag.textContent = css;
			document.head.appendChild(tag);
		}
		var shape_dialog_module_css_default = {
			"actions": "TTllmG_actions",
			"appIcon": "TTllmG_appIcon",
			"appMark": "TTllmG_appMark",
			"appMarkGrid": "TTllmG_appMarkGrid",
			"backdrop": "TTllmG_backdrop",
			"backdrop-in": "TTllmG_backdrop-in",
			"badge": "TTllmG_badge",
			"blocked": "TTllmG_blocked",
			"card": "TTllmG_card",
			"cardFooter": "TTllmG_cardFooter",
			"cardHead": "TTllmG_cardHead",
			"cardId": "TTllmG_cardId",
			"cardIdentity": "TTllmG_cardIdentity",
			"cardShell": "TTllmG_cardShell",
			"cardTitle": "TTllmG_cardTitle",
			"confirmActions": "TTllmG_confirmActions",
			"confirmBar": "TTllmG_confirmBar",
			"confirmDelete": "TTllmG_confirmDelete",
			"confirmText": "TTllmG_confirmText",
			"content": "TTllmG_content",
			"deleteButton": "TTllmG_deleteButton",
			"description": "TTllmG_description",
			"footer": "TTllmG_footer",
			"footerCount": "TTllmG_footerCount",
			"footerPath": "TTllmG_footerPath",
			"grid": "TTllmG_grid",
			"header": "TTllmG_header",
			"heading": "TTllmG_heading",
			"headingText": "TTllmG_headingText",
			"iconButton": "TTllmG_iconButton",
			"invalid": "TTllmG_invalid",
			"origin": "TTllmG_origin",
			"placeholder": "TTllmG_placeholder",
			"placeholderMark": "TTllmG_placeholderMark",
			"placeholderMessage": "TTllmG_placeholderMessage",
			"placeholderPath": "TTllmG_placeholderPath",
			"shimmer": "TTllmG_shimmer",
			"skeletonCard": "TTllmG_skeletonCard",
			"subtitle": "TTllmG_subtitle",
			"switch": "TTllmG_switch",
			"title": "TTllmG_title",
			"toggleError": "TTllmG_toggleError",
			"viewBackdrop": "TTllmG_viewBackdrop",
			"viewBody": "TTllmG_viewBody",
			"viewFrame": "TTllmG_viewFrame",
			"viewHeader": "TTllmG_viewHeader",
			"viewHeading": "TTllmG_viewHeading",
			"viewHeadingText": "TTllmG_viewHeadingText",
			"viewSubtitle": "TTllmG_viewSubtitle",
			"viewTitle": "TTllmG_viewTitle",
			"viewWindow": "TTllmG_viewWindow",
			"window": "TTllmG_window",
			"window-in": "TTllmG_window-in"
		};
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/ShapeDialog.tsx
		/** Shape browser: a large launcher-style window with a responsive app grid. */
		/**
		* Format one unresolved capability for the card.
		* @param item - missing requirement.
		* @returns compact diagnostic text.
		*/
		function describeMissing(item) {
			const id = `${item.plugin}#${item.capability}`;
			if (item.reason === "version-mismatch") return `${id} 需要 ${item.range}，当前 ${item.found ?? "未知"}`;
			if (item.reason === "invalid-range") return `${id} 的版本范围无效：${item.range}`;
			return `${id} ${item.range}`;
		}
		/**
		* Read the current shape list.
		* @param refresh - ask the Host to rescan the shape roots first.
		* @returns the snapshot.
		*/
		async function readShapes(refresh) {
			let changed = false;
			if (refresh) {
				const rescan = await fetch("/dsh-shape/api/refresh", {
					method: "POST",
					credentials: "same-origin",
					headers: { accept: "application/json" }
				});
				if (!rescan.ok) throw new Error(`refresh failed (${String(rescan.status)})`);
				const receipt = await rescan.json().catch(() => null);
				changed = receipt?.changed === true;
			}
			const response = await fetch("/dsh-shape/api/shapes", {
				credentials: "same-origin",
				cache: "no-store",
				headers: { accept: "application/json" }
			});
			if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
			const payload = await response.json();
			if (payload.ok !== true || !Array.isArray(payload.shapes)) throw new Error("invalid shape response");
			// A shape's client modules are imported once per page load and a module URL
			// that answered 404 keeps failing, so a changed module set needs a reload;
			// no in-page call can recover it.
			if (changed) {
				window.location.reload();
				return { shapes: [], roots: {} };
			}
			return {
				shapes: payload.shapes,
				...payload.roots === void 0 ? {} : { roots: payload.roots }
			};
		}		/**
		* Render the read-only grid of registered folder-based shapes.
		* @param props.open - whether the window is showing.
		* @param props.onClose - closes the window.
		* @param props.resolveShape - resolves declared capability requirements.
		* @returns the window, or null while closed.
		*/
		function ShapeDialog({ open, onClose, resolveShape }) {
			const [status, setStatus] = (0, react.useState)("loading");
			const [shapes, setShapes] = (0, react.useState)([]);
			const [roots, setRoots] = (0, react.useState)();
			const [error, setError] = (0, react.useState)("");
			const [selected, setSelected] = (0, react.useState)(null);
			const [viewLoading, setViewLoading] = (0, react.useState)(false);
			const [viewError, setViewError] = (0, react.useState)("");
			const [busyId, setBusyId] = (0, react.useState)("");
			const [toggleError, setToggleError] = (0, react.useState)("");
			const [pendingDelete, setPendingDelete] = (0, react.useState)(null);
			const [deleteError, setDeleteError] = (0, react.useState)("");
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
				if (shape.enabled === false) return;
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
			const toggleShape = (0, react.useCallback)(async (shape) => {
				const enabled = shape.enabled === false;
				setBusyId(shape.id);
				setToggleError("");
				try {
					const response = await fetch("/dsh-shape/api/toggle", {
						method: "POST",
						credentials: "same-origin",
						headers: {
							"content-type": "application/json",
							accept: "application/json"
						},
						body: JSON.stringify({
							id: shape.id,
							enabled
						})
					});
					if (!response.ok) throw new Error(`HTTP ${String(response.status)}`);
					const payload = await response.json();
					if (payload.ok !== true || !Array.isArray(payload.shapes)) throw new Error("invalid toggle response");
					setShapes(payload.shapes);
					window.dispatchEvent(new CustomEvent("dsh-shape:refresh"));
				} catch (cause) {
					setToggleError(cause instanceof Error ? cause.message : String(cause));
				} finally {
					setBusyId("");
				}
			}, []);
			const deleteShape = (0, react.useCallback)(async (shape) => {
				setBusyId(shape.id);
				setDeleteError("");
				try {
					const response = await fetch("/dsh-shape/api/delete", {
						method: "POST",
						credentials: "same-origin",
						headers: {
							"content-type": "application/json",
							accept: "application/json"
						},
						body: JSON.stringify({ id: shape.id })
					});
					const payload = await response.json().catch(() => null);
					if (payload?.ok !== true || !Array.isArray(payload.shapes)) {
						const message = typeof payload?.error?.message === "string" ? payload.error.message : `HTTP ${String(response.status)}`;
						throw new Error(message);
					}
					setShapes(payload.shapes);
					setPendingDelete(null);
					window.dispatchEvent(new CustomEvent("dsh-shape:refresh"));
				} catch (cause) {
					setDeleteError(cause instanceof Error ? cause.message : String(cause));
				} finally {
					setBusyId("");
				}
			}, []);
			(0, react.useEffect)(() => {
				if (!open) return;
				load(false);
			}, [load, open]);
			(0, react.useEffect)(() => {
				if (!open) return;
				const reload = () => {
					load(false);
				};
				window.addEventListener("dsh-shape:capabilities", reload);
				return () => {
					window.removeEventListener("dsh-shape:capabilities", reload);
				};
			}, [load, open]);
			(0, react.useEffect)(() => {
				if (!open) {
					setSelected(null);
					setViewError("");
					setViewLoading(false);
					setPendingDelete(null);
					setDeleteError("");
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
								toggleError !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: shape_dialog_module_css_default.toggleError,
									role: "alert",
									children: ["切换 shape 失败：", toggleError]
								}),
								deleteError !== "" && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: shape_dialog_module_css_default.toggleError,
									role: "alert",
									children: ["删除 shape 失败：", deleteError]
								}),
								pendingDelete !== null && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
									className: shape_dialog_module_css_default.confirmBar,
									role: "group",
									"aria-label": `删除 ${pendingDelete.title}`,
									children: [/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
										className: shape_dialog_module_css_default.confirmText,
										children: [
											"删除「",
											pendingDelete.title,
											"」？",
											pendingDelete.origin === "bundled" ? "内置 shape 会从插件目录移除，重新安装插件才能恢复。" : "该 shape 目录会从磁盘移除，无法撤销。"
										]
									}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
										className: shape_dialog_module_css_default.confirmActions,
										children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "ghost",
											size: "sm",
											onClick: () => {
												setPendingDelete(null);
												setDeleteError("");
											},
											children: "取消"
										}), /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.Button, {
											variant: "outline",
											size: "sm",
											className: shape_dialog_module_css_default.confirmDelete,
											disabled: busyId === pendingDelete.id,
											onClick: () => {
												deleteShape(pendingDelete);
											},
											children: busyId === pendingDelete.id ? "删除中…" : "删除"
										})]
									})]
								}),
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
										const enabled = shape.enabled !== false;
										const resolution = resolveShape?.(shape.requirements ?? []) ?? {
											ok: true,
											capabilities: {},
											missing: []
										};
										const apiSupported = supportsShapeApiVersion(shape.shapeApiVersion);
										const blocked = !resolution.ok || !apiSupported;
										return /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
											className: shape_dialog_module_css_default.cardShell,
											"data-enabled": enabled ? "true" : "false",
											"data-blocked": blocked ? "true" : "false",
											children: [
												/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("button", {
													type: "button",
													className: shape_dialog_module_css_default.card,
													"data-testid": "dsh-shape-card",
													"data-shape-id": shape.id,
													"aria-haspopup": "dialog",
													"aria-label": `打开 ${shape.title}`,
													disabled: !enabled || blocked,
													onClick: () => {
														openView(shape);
													},
													children: [
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: shape_dialog_module_css_default.cardHead,
															children: [/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																className: shape_dialog_module_css_default.appIcon,
																"aria-hidden": "true",
																children: initial.toLocaleUpperCase()
															}), /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
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
															})]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsx)("p", {
															className: shape_dialog_module_css_default.description,
															children: shape.description.length > 0 ? shape.description : "暂无描述"
														}),
														blocked && /* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
															className: shape_dialog_module_css_default.blocked,
															children: !apiSupported ? `不支持的 shape apiVersion ${String(shape.shapeApiVersion ?? 0)}（需要 ${String(1)}）` : `缺少 ${resolution.missing.map(describeMissing).join("、")}`
														}),
														!shape.valid && /* @__PURE__ */ (0, react_jsx_runtime.jsxs)("span", {
															className: shape_dialog_module_css_default.invalid,
															children: ["无效 package.json：", shape.error ?? "缺少 id 或 name"]
														}),
														/* @__PURE__ */ (0, react_jsx_runtime.jsxs)("div", {
															className: shape_dialog_module_css_default.cardFooter,
															children: [
																/* @__PURE__ */ (0, react_jsx_runtime.jsx)("span", {
																	className: shape_dialog_module_css_default.origin,
																	children: shape.origin === "bundled" ? "内置" : "用户"
																}),
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
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: shape_dialog_module_css_default.switch,
													role: "switch",
													"aria-checked": enabled,
													"aria-busy": busyId === shape.id,
													"aria-label": `${enabled ? "停用" : "启用"} ${shape.title}`,
													title: `${enabled ? "停用" : "启用"} ${shape.title}`,
													"data-testid": "dsh-shape-toggle",
													"data-toggle-shape-id": shape.id,
													disabled: busyId === shape.id,
													onClick: () => {
														toggleShape(shape);
													}
												}),
												/* @__PURE__ */ (0, react_jsx_runtime.jsx)("button", {
													type: "button",
													className: shape_dialog_module_css_default.deleteButton,
													"aria-label": `删除 ${shape.title}`,
													title: `删除 ${shape.title}`,
													"data-testid": "dsh-shape-delete",
													"data-delete-shape-id": shape.id,
													disabled: busyId === shape.id,
													onClick: () => {
														setDeleteError("");
														setPendingDelete(shape);
													},
													children: /* @__PURE__ */ (0, react_jsx_runtime.jsx)(_deepseek_ai_dsh_client_ui_primitives.IconTrashOutlineRegular, {})
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
		//#region ../../dsh-plugins/dsh-shape/src/client/ShapeButton.tsx
		/** Top-bar action that opens the registered-shape browser. */
		/**
		* Render the header action and own the dialog's open state.
		* @param props.resolveShape - capability resolver injected by the Client entry.
		* @returns the button plus its dialog.
		*/
		function ShapeButton({ resolveShape }) {
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
			(0, react.useEffect)(() => subscribeShapeBrowser(() => {
				setOpen(true);
			}), []);
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
				},
				resolveShape
			})] });
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/shape-runtime.ts
		/**
		 * Bind capability providers that expose a per-shape view to the receiving shape.
		 * @param capabilities - resolved capability map.
		 * @param shapeId - shape receiving the API.
		 * @returns the map handed to that shape.
		 */
		function scopeCapabilities(capabilities, shape) {
			const scoped = {};
			for (const [key, value] of Object.entries(capabilities)) {
				const provider = value;
				scoped[key] = typeof provider?.forShape === "function" ? provider.forShape(shape.id, { title: shape.title }) : value;
			}
			return scoped;
		}
		const KEY_ALIASES = {
			esc: "Escape",
			space: " ",
			period: ".",
			comma: ",",
			slash: "/",
			arrowleft: "ArrowLeft",
			arrowright: "ArrowRight",
			arrowup: "ArrowUp",
			arrowdown: "ArrowDown",
			enter: "Enter",
			tab: "Tab"
		};
		/**
		* Normalize one key token.
		* @param token - raw token from a shortcut string.
		* @returns browser key or code.
		*/
		function normalizeKeyToken(token) {
			if (token.length === 1) return token.toLowerCase();
			return KEY_ALIASES[token.toLowerCase()] ?? token;
		}
		/**
		* Parse one shortcut string.
		* @param spec - combination such as `Ctrl+Alt+ArrowRight`.
		* @returns normalized modifiers and key.
		*/
		function parseShortcut(spec) {
			const parts = spec.split("+").map((part) => part.trim()).filter((part) => part.length > 0);
			const key = parts.pop();
			if (key === void 0) throw new Error(`invalid shortcut: ${spec}`);
			const parsed = {
				ctrl: false,
				alt: false,
				shift: false,
				meta: false,
				key: normalizeKeyToken(key)
			};
			for (const modifier of parts) switch (modifier.toLowerCase()) {
				case "ctrl":
				case "control":
					parsed.ctrl = true;
					break;
				case "alt":
					parsed.alt = true;
					break;
				case "shift":
					parsed.shift = true;
					break;
				case "meta":
				case "cmd":
				case "command":
					parsed.meta = true;
					break;
				default: throw new Error(`unknown shortcut modifier: ${modifier}`);
			}
			return parsed;
		}
		/**
		* Check whether a keyboard event matches a parsed shortcut.
		* @param event - keyboard event.
		* @param shortcut - parsed combination.
		* @returns true on an exact modifier and key match.
		*/
		function matchesShortcut(event, shortcut) {
			if (event.ctrlKey !== shortcut.ctrl || event.altKey !== shortcut.alt || event.shiftKey !== shortcut.shift || event.metaKey !== shortcut.meta) return false;
			return (event.key.length === 1 ? event.key.toLowerCase() : event.key) === shortcut.key || event.code === shortcut.key;
		}
		/**
		* Create the shape Client runtime.
		* @param capabilities - registry used for startup dependency checks.
		* @returns a start function returning its disposer.
		*/
		function createShapeRuntime(capabilities) {
			const shortcuts = /* @__PURE__ */ new Map();
			const active = [];
			let generation = 0;
			let started = false;
			const stopAll = () => {
				for (const shape of active.splice(0)) shape.dispose();
				shortcuts.clear();
			};
			const onKeyDown = (event) => {
				if (event.defaultPrevented || event.repeat || event.isComposing) return;
				for (const shortcut of shortcuts.values()) {
					if (!matchesShortcut(event, shortcut)) continue;
					event.preventDefault();
					try {
						Promise.resolve(shortcut.run()).catch((cause) => {
							console.warn("dsh-shape: shortcut failed", cause);
						});
					} catch (cause) {
						console.warn("dsh-shape: shortcut failed", cause);
					}
					return;
				}
			};
			const refresh = async () => {
				const current = ++generation;
				stopAll();
				let shapes;
				try {
					const response = await fetch("/dsh-shape/api/shapes", {
						credentials: "same-origin",
						cache: "no-store"
					});
					if (!response.ok) return;
					const payload = await response.json();
					if (payload.ok !== true || !Array.isArray(payload.shapes)) return;
					shapes = payload.shapes;
				} catch {
					return;
				}
				for (const shape of shapes) {
					if (current !== generation) return;
					if (shape.enabled === false || !shape.valid || shape.clientEntry === void 0) continue;
					if (!supportsShapeApiVersion(shape.shapeApiVersion)) continue;
					const resolution = capabilities.resolve(shape.requirements ?? []);
					if (!resolution.ok) continue;
					const state = {
						shortcuts: [],
						mounts: [],
						cleanup: void 0
					};
					const scopedCapabilities = scopeCapabilities(resolution.capabilities, shape);
					const api = {
						shape: {
							id: shape.id,
							title: shape.title,
							version: shape.version
						},
						capabilities: scopedCapabilities,
						require(plugin, capability) {
							const key = `${plugin}#${capability}`;
							if (!(key in scopedCapabilities)) throw new Error(`capability not declared: ${key}`);
							return scopedCapabilities[key];
						},
						mount(slot, render, options) {
							if (!isShapeSlot(slot)) throw new Error(`unsupported shape slot: ${slot}`);
							const off = registerShapeMount({
								slot,
								shapeId: shape.id,
								title: shape.title,
								placement: options?.placement === "floating" ? "floating" : "anchored",
								snap: options?.snap !== false,
								render
							});
							state.mounts.push(off);
							return off;
						},
						panel(options) {
						    const id = `shape:${shape.id}:${options.id}`;
						    const off = registerShapePanel({
						        shapeId: shape.id,
						        id,
						        title: options.title,
						        order: options.order ?? 100,
						        render: options.render,
						    });
						    state.mounts.push(off);
						    return {
						        id,
						        open() {
						            openShapePanel(id);
						        },
						        dispose: off,
						    };
						},
						tab(options) {
						    const id = `shape:${shape.id}:${options.id}`;
						    const off = registerShapeTab({
						        shapeId: shape.id,
						        id,
						        title: options.title,
						        render: options.render,
						    });
						    state.mounts.push(off);
						    return {
						        id,
						        open() {
						            openShapeTab(id);
						        },
						        dispose: off,
						    };
						},
						shortcuts: { register(binding) {
							const specs = typeof binding.keys === "string" ? [binding.keys] : binding.keys;
							const disposers = [];
							for (const spec of specs) {
								const parsed = parseShortcut(spec);
								const key = `${String(parsed.ctrl)}|${String(parsed.alt)}|${String(parsed.shift)}|${String(parsed.meta)}|${parsed.key}`;
								if (shortcuts.has(key)) throw new Error(`shortcut conflict: ${spec}`);
								const registered = {
									...parsed,
									run: binding.run
								};
								shortcuts.set(key, registered);
								const off = () => {
									if (shortcuts.get(key) === registered) shortcuts.delete(key);
								};
								disposers.push(off);
								state.shortcuts.push(off);
							}
							return () => {
								for (const off of disposers) off();
							};
						} }
					};
					let url = `/dsh-shape/client/${encodeURIComponent(shape.id)}/${shape.clientEntry}`;
					url += `?v=${encodeURIComponent(shape.version)}-${String(Date.now())}`;
					try {
						const module = await import(
							/* @vite-ignore */
							url
);
						if (current !== generation) return;
						if (typeof module.activate !== "function") continue;
						const result = module.activate(api);
						if (typeof result === "function") state.cleanup = result;
						else if (result !== void 0 && typeof result.dispose === "function") state.cleanup = result.dispose;
						active.push({
							id: shape.id,
							dispose: () => {
								state.cleanup?.();
								module.deactivate?.();
								for (const off of state.mounts) off();
								for (const off of state.shortcuts) off();
								disposeShapeMounts(shape.id);
								disposeShapeEvents(shape.id);
								disposeShapePanels(shape.id);
							disposeShapeTabs(shape.id);
							}
						});
					} catch (cause) {
						for (const off of state.mounts) off();
						for (const off of state.shortcuts) off();
						disposeShapeMounts(shape.id);
						disposeShapeEvents(shape.id);
						disposeShapePanels(shape.id);
						disposeShapeTabs(shape.id);
						state.cleanup?.();
						console.warn(`dsh-shape: failed to activate ${shape.id}`, cause);
					}
				}
			};
			const start = () => {
				if (started) throw new Error("shape runtime already started");
				started = true;
				window.addEventListener("keydown", onKeyDown);
				const reload = () => {
					refresh();
				};
				window.addEventListener("dsh-shape:refresh", reload);
				window.addEventListener("dsh-shape:capabilities", reload);
				refresh();
				return () => {
					started = false;
					generation++;
					stopAll();
					window.removeEventListener("keydown", onKeyDown);
					window.removeEventListener("dsh-shape:refresh", reload);
					window.removeEventListener("dsh-shape:capabilities", reload);
				};
			};
			return { start };
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/workspace-reveal.ts
		/** Sidebar row marker for one Workspace group. */
		const ROW_KEY_PREFIX = "workspace:";
		/** Sidebar row identity carried by every rendered Workspace group. */
		const WORKSPACE_ROW_SELECTOR = '[data-row-key^="workspace:"]';
		/** Upper bound on animation frames spent waiting for a row to mount. */
		const MAX_REVEAL_FRAMES = 20;
		/** Clearance kept between the revealed row and the lowest uncovered line. */
		const REVEAL_BOTTOM_GAP = 40;
		/** How far an overlay may reach up from the scroller's bottom edge. */
		const OVERLAY_PROBE_DEPTH = 240;
		/** Vertical step of the overlay probe. */
		const OVERLAY_PROBE_STEP = 4;
		/** Normalize one Workspace directory for nesting comparison. */
		function folderPath(path) {
			return (/^[A-Za-z]:[/\\]/.test(path) || path.startsWith("\\\\") ? path.replaceAll("\\", "/") : path).replace(/\/+$/, "");
		}
		/**
		* Find the nearest registered Workspace directory containing `path`.
		* Mirrors the browser's tree nesting so the same ancestors open.
		* @param path - Workspace directory to place.
		* @param candidates - every registered Workspace directory.
		* @returns the nearest containing directory, when one is registered.
		*/
		function parentFolder(path, candidates) {
			const child = folderPath(path);
			let owner;
			let length = -1;
			for (const candidate of candidates) {
				const root = folderPath(candidate);
				if (root.length > length && child !== root && child.startsWith(`${root}/`)) {
					owner = candidate;
					length = root.length;
				}
			}
			return owner;
		}
		/**
		* Workspace ids from the outermost registered ancestor down to `workspaceId`.
		* @param workspaces - Workspace registry snapshot.
		* @param workspaceId - target Workspace.
		* @returns ancestors in tree order, excluding the target itself.
		*/
		function ancestorIds(workspaces, workspaceId) {
			const idByPath = new Map(workspaces.map((workspace) => [workspace.path, workspace.workspaceId]));
			const paths = [...idByPath.keys()];
			const workspaceById = new Map(workspaces.map((workspace) => [workspace.workspaceId, workspace]));
			const chain = [];
			const seen = new Set([workspaceId]);
			let current = workspaceById.get(workspaceId);
			while (current !== void 0) {
				const path = parentFolder(current.path, paths);
				const parentId = path === void 0 ? void 0 : idByPath.get(path);
				if (parentId === void 0 || seen.has(parentId)) break;
				seen.add(parentId);
				chain.unshift(parentId);
				current = workspaceById.get(parentId);
			}
			return chain;
		}
		/**
		* Find the sidebar row of one Workspace group, preferring a mounted copy over
		* a hidden one when the shell renders more than one sidebar surface.
		*
		* Only the session sidebar renders `workspace:` rows, and the list viewport
		* itself has no marker every supported DSH build carries, so the search spans
		* the document.
		*/
		function findWorkspaceRow(workspaceId) {
			const key = `${ROW_KEY_PREFIX}${workspaceId}`;
			let hidden;
			for (const row of document.querySelectorAll(WORKSPACE_ROW_SELECTOR)) {
				if (row.dataset.rowKey !== key) continue;
				if (row.offsetParent !== null) return row;
				hidden ??= row;
			}
			return hidden;
		}
		/** Wait one animation frame, or a timer where `requestAnimationFrame` is unavailable. */
		function nextFrame() {
			return new Promise((resolve) => {
				if (typeof requestAnimationFrame === "function") requestAnimationFrame(() => {
					resolve();
				});
				else setTimeout(resolve, 16);
			});
		}
		/**
		* Wait a bounded number of frames for a Workspace row to mount.
		* @param workspaceId - row to find.
		* @param frames - frames to wait before giving up.
		* @param cancelled - whether a later reveal superseded this one.
		* @returns the row, or undefined when it did not mount in time.
		*/
		async function rowWithin(workspaceId, frames, cancelled) {
			for (let frame = 0; frame < frames; frame++) {
				if (cancelled()) return void 0;
				const row = findWorkspaceRow(workspaceId);
				if (row !== void 0) return row;
				await nextFrame();
			}
		}
		/**
		* Nearest ancestor that scrolls vertically.
		* @param row - revealed row.
		* @returns the scroll container holding the row, when there is one.
		*/
		function scrollParent(row) {
			for (let node = row.parentElement; node !== null; node = node.parentElement) {
				if (node.scrollHeight <= node.clientHeight) continue;
				const overflowY = getComputedStyle(node).overflowY;
				if (overflowY === "auto" || overflowY === "scroll" || overflowY === "overlay") return node;
			}
		}
		/**
		* Lowest line of one scroller that the sidebar does not cover.
		*
		* The shell paints its bottom fade and its footer buttons over the list, and
		* `scrollIntoView` aligns to the scrollport, so a revealed row lands underneath
		* them. Hit-testing upward from the bottom finds where the list still shows.
		* @param scroller - scroll container holding the revealed row.
		* @returns the viewport coordinate of the lowest uncovered line.
		*/
		function uncoveredBottom(scroller) {
			const rect = scroller.getBoundingClientRect();
			const x = rect.left + rect.width / 2;
			const floor = Math.max(rect.top, rect.bottom - OVERLAY_PROBE_DEPTH);
			for (let y = rect.bottom - 1; y > floor; y -= OVERLAY_PROBE_STEP) {
				const hit = document.elementFromPoint(x, y);
				if (hit !== null && scroller.contains(hit)) return y + 1;
			}
			return floor;
		}
		/**
		* Scroll one row fully into view, clear of the sidebar footer that overlays the
		* list. The uncovered line decides where the row lands, so a reveal never hides
		* the row under the footer buttons.
		* @param row - revealed row.
		*/
		function scrollRowIntoView(row) {
			const scroller = scrollParent(row);
			if (scroller === void 0) {
				row.scrollIntoView({
					block: "nearest",
					inline: "nearest"
				});
				return;
			}
			const rowRect = row.getBoundingClientRect();
			const viewRect = scroller.getBoundingClientRect();
			const bottom = Math.min(viewRect.bottom, uncoveredBottom(scroller)) - REVEAL_BOTTOM_GAP;
			if (rowRect.bottom > bottom) scroller.scrollTop += rowRect.bottom - bottom;
			else if (rowRect.top < viewRect.top) scroller.scrollTop += rowRect.top - viewRect.top;
		}
		/**
		* Create the post-navigation sidebar reveal.
		*
		* Expanding through the rendered row keeps the browser's own persisted view
		* state and row animations authoritative; a later call supersedes any pending
		* frames from an earlier one.
		* @returns a function that expands and scrolls one Workspace group.
		*/
		function createWorkspaceReveal() {
			let generation = 0;
			return (workspaces, workspaceId) => {
				if (typeof document === "undefined") return;
				if (document.querySelector(WORKSPACE_ROW_SELECTOR) === null) return;
				const current = ++generation;
				const cancelled = () => current !== generation;
				(async () => {
					let target = await rowWithin(workspaceId, 2, cancelled);
					if (target === void 0) {
						for (const ancestorId of ancestorIds(workspaces, workspaceId)) {
							const row = await rowWithin(ancestorId, MAX_REVEAL_FRAMES, cancelled);
							if (row === void 0) return;
							if (row.getAttribute("aria-expanded") !== "false") continue;
							row.click();
							await nextFrame();
							if (cancelled()) return;
						}
						target = await rowWithin(workspaceId, MAX_REVEAL_FRAMES, cancelled);
					}
					if (target === void 0) return;
					if (target.getAttribute("aria-expanded") === "false") {
						target.click();
						await nextFrame();
						if (cancelled()) return;
					}
					scrollRowIntoView(findWorkspaceRow(workspaceId) ?? target);
				})().catch((error) => {
					console.warn("dsh-shape: workspace reveal failed", error);
				});
			};
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/workspace.ts
		/**
		* Build the workspace switching capability.
		* @param ctx - Client context with workspace, session, and navigation services.
		* @returns the capability API.
		*/
		function createWorkspaceSwitch(ctx) {
			const workspaceSnapshot = () => ctx.workspaces.list.getSnapshot();
			const sessionSnapshot = () => ctx.sessions.list.getSnapshot();
			const reveal = createWorkspaceReveal();
			const currentWorkspaceId = () => {
				const sessions = sessionSnapshot();
				const current = Object.values(sessions.byId).find((row) => (row.retainedBy.mainView ?? 0) > 0);
				if (current === void 0) return null;
				return workspaceSnapshot().items.find((item) => item.sessionIds.includes(current.id))?.workspaceId ?? null;
			};
			const switchBy = async (delta) => {
				const workspace = workspaceSnapshot();
				const items = workspace.items;
				if (items.length === 0) return;
				const current = currentWorkspaceId();
				if (items.length === 1) return;
				const index = current === null ? -1 : items.findIndex((item) => item.workspaceId === current);
				const target = items[index === -1 ? delta === 1 ? 0 : items.length - 1 : (index + delta + items.length) % items.length];
				if (target === void 0 || target.workspaceId === current) return;
				const sessions = sessionSnapshot();
				const archived = new Set(workspace.archivedSessionIds);
				const targetSession = target.sessionIds.filter((sessionId) => !archived.has(sessionId)).map((sessionId) => sessions.byId[sessionId]).filter((row) => row !== void 0).sort((left, right) => right.updatedAt - left.updatedAt)[0];
				if (targetSession !== void 0) {
					ctx.uiWorkspace.openSession(targetSession.id);
					reveal(items, target.workspaceId);
					return;
				}
				const opening = ctx.uiWorkspace.openWorkspace(target.workspaceId);
				reveal(items, target.workspaceId);
				await opening;
			};
			return {
				list() {
					return workspaceSnapshot().items.map((item) => ({
						id: item.workspaceId,
						title: item.title ?? item.path ?? item.workspaceId
					}));
				},
				current: currentWorkspaceId,
				next: () => switchBy(1),
				previous: () => switchBy(-1)
			};
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/toast.ts
		/** Toast layer for capability-driven notifications. */
		const MAX_VISIBLE = 4;
		const DEFAULT_TIMEOUT = 3200;
		const CONTAINER_ID = 'dsh-shape-toasts';
		const TONE_COLORS = {
			info: 'var(--dsw-alias-brand-primary, #6ea6ff)',
			success: 'var(--dsw-alias-status-success, #7dd3a7)',
			warn: 'var(--dsw-alias-status-warning, #f0c36a)',
			error: 'var(--dsw-alias-status-danger, #f2707a)',
		};
		const CONTAINER_STYLE = [
			'position:fixed',
			'top:16px',
			'right:16px',
			'display:grid',
			'gap:8px',
			'justify-items:end',
			'max-width:min(360px, calc(100vw - 32px))',
			'z-index:2147483000',
			'pointer-events:none',
		].join(';');
		const TOAST_STYLE = [
			'display:flex',
			'align-items:flex-start',
			'gap:8px',
			'padding:8px 12px',
			'border-radius:10px',
			'border:1px solid var(--dsw-alias-border-secondary, rgba(255, 255, 255, 0.14))',
			'background:var(--dsw-alias-bg-layer-2, #1b1d22)',
			'color:var(--dsw-alias-label-primary, #e6edf3)',
			'font-size:12.5px',
			'line-height:1.5',
			'box-shadow:0 10px 28px rgba(0, 0, 0, 0.35)',
			'opacity:0',
			'transform:translateY(-6px)',
			'transition:opacity 160ms ease, transform 160ms ease',
		].join(';');
		let container = null;
		const timers = new Set();
		/**
		 * Show one transient notification above the application surface.
		 * @param text - message body.
		 * @param options - tone and visibility duration.
		 */
		function showToast(text, options = {}) {
			if (typeof document === 'undefined')
				return;
			const host = ensureContainer();
			if (host === null)
				return;
			while (host.childElementCount >= MAX_VISIBLE) {
				host.firstElementChild?.remove();
			}
			const tone = options.tone ?? 'info';
			const toast = document.createElement('div');
			toast.setAttribute('role', 'status');
			toast.setAttribute('data-testid', 'dsh-shape-toast');
			toast.style.cssText = TOAST_STYLE;
			const dot = document.createElement('span');
			dot.setAttribute('aria-hidden', 'true');
			dot.style.cssText = [
				'flex:none',
				'width:7px',
				'height:7px',
				'margin-top:6px',
				'border-radius:50%',
				`background:${TONE_COLORS[tone] ?? TONE_COLORS.info}`,
			].join(';');
			const body = document.createElement('span');
			body.style.cssText = 'min-width:0;overflow-wrap:anywhere';
			body.textContent = text;
			toast.append(dot, body);
			host.append(toast);
			requestAnimationFrame(() => {
				toast.style.opacity = '1';
				toast.style.transform = 'translateY(0)';
			});
			const timeout = Math.max(600, options.timeout ?? DEFAULT_TIMEOUT);
			const timer = setTimeout(() => { dismiss(toast); }, timeout);
			timers.add(timer);
		}
		/**
		 * Remove every toast and the shared container.
		 */
		function disposeToasts() {
			for (const timer of timers)
				clearTimeout(timer);
			timers.clear();
			container?.remove();
			container = null;
		}
		/**
		 * Resolve the lazily created container, or null when the document cannot host it.
		 * @returns the container element.
		 */
		function ensureContainer() {
			if (container !== null && container.isConnected)
				return container;
			const existing = document.getElementById(CONTAINER_ID);
			if (existing !== null) {
				container = existing;
				return container;
			}
			const created = document.createElement('div');
			created.id = CONTAINER_ID;
			created.style.cssText = CONTAINER_STYLE;
			document.body.append(created);
			container = created;
			return container;
		}
		/**
		 * Fade one toast out and drop it from the container.
		 * @param toast - element to remove.
		 */
		function dismiss(toast) {
			toast.style.opacity = '0';
			toast.style.transform = 'translateY(-6px)';
			setTimeout(() => {
				toast.remove();
				if (container !== null && container.childElementCount === 0) {
					container.remove();
					container = null;
				}
			}, 180);
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/shape-browser.ts
		/** Open-request bridge so capabilities can raise the shape browser. */
		const browserListeners = new Set();
		/**
		 * Ask the mounted shape browser to open.
		 */
		function requestShapeBrowser() {
			for (const listener of browserListeners)
				listener();
		}
		/**
		 * Observe open requests.
		 * @param listener - invoked for every request.
		 * @returns an unsubscribe function.
		 */
		function subscribeShapeBrowser(listener) {
			browserListeners.add(listener);
			return () => { browserListeners.delete(listener); };
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/ui-control.ts
		/** Built-in UI control capability: navigation, panels, theme, conversation actions, and toasts. */
		/**
		 * Build the UI control capability.
		 * @param ctx - Client context with layout, theme, conversation, and workspace services.
		 * @returns the capability API.
		 */
		function createUiControl(ctx) {
			ctx.effect(() => () => { disposeToasts(); }, 'dsh-shape: toast layer');
			const layout = () => ctx.get('layout');
			const theme = () => ctx.get('theme');
			const conversation = () => ctx.get('conversation');
			const requireLayout = () => {
				const service = layout();
				if (service === undefined)
					throw unavailable('layout');
				return service;
			};
			const requireTheme = () => {
				const service = theme();
				if (service === undefined)
					throw unavailable('theme');
				return service;
			};
			const requireConversation = () => {
				const service = conversation();
				if (service === undefined)
					throw unavailable('conversation');
				return service;
			};
			return {
				openSession(id) {
					ctx.uiWorkspace.openSession(id);
				},
				openWorkspace(id) {
					return ctx.uiWorkspace.openWorkspace(id);
				},
				toggleSidebar() {
					requireLayout().toggleSidebar();
				},
				selectPanel(id) {
					requireLayout().selectPanel(id);
				},
				getTheme() {
					const snapshot = requireTheme().getTheme();
					return { id: snapshot.active.id, preference: snapshot.preference };
				},
				setTheme(id) {
					requireTheme().setTheme(id);
				},
				send(text) {
					return requireConversation().send(text);
				},
				cancelTurn() {
					return requireConversation().cancel();
				},
				notify(text, options) {
					showToast(text, options);
				},
				openShapeBrowser() {
					requestShapeBrowser();
				},
			};
		}
		/**
		 * Build the error raised when a host lacks the service behind one method.
		 * @param service - missing Client service name.
		 * @returns the error to throw.
		 */
		function unavailable(service) {
			return new Error(`dsh-shape#ui: the ${service} service is unavailable in this host`);
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/shortcut-commands.ts
		/** Built-in shortcut capability: DSH commands that users can rebind. */
		/** Every profile a default binding is expanded to. */
		const PROFILES = [
		    'desktop:macos',
		    'desktop:windows',
		    'desktop:linux',
		    'web:macos',
		    'web:windows',
		    'web:linux',
		];
		/** Modifier spellings accepted in `keys`. */
		const MODIFIERS = {
		    ctrl: 'control',
		    control: 'control',
		    alt: 'alt',
		    option: 'alt',
		    opt: 'alt',
		    shift: 'shift',
		    meta: 'meta',
		    cmd: 'meta',
		    command: 'meta',
		    super: 'meta',
		    win: 'meta',
		    mod: 'primary',
		    primary: 'primary',
		};
		/** Named keys accepted in `keys`; anything else must be a letter, digit, or F-key. */
		const NAMED_CODES = {
		    esc: 'Escape',
		    escape: 'Escape',
		    space: 'Space',
		    tab: 'Tab',
		    enter: 'Enter',
		    return: 'Enter',
		    backspace: 'Backspace',
		    delete: 'Delete',
		    del: 'Delete',
		    up: 'ArrowUp',
		    down: 'ArrowDown',
		    left: 'ArrowLeft',
		    right: 'ArrowRight',
		    slash: 'Slash',
		    comma: 'Comma',
		    period: 'Period',
		    dot: 'Period',
		    backslash: 'Backslash',
		    backquote: 'Backquote',
		    minus: 'Minus',
		    equal: 'Equal',
		    bracketleft: 'BracketLeft',
		    bracketright: 'BracketRight',
		    semicolon: 'Semicolon',
		    quote: 'Quote',
		};
		/** Every region a command may opt into. */
		const REGIONS = ['page', 'editable', 'terminal'];
		/**
		 * Validate and de-duplicate the regions a command asked for.
		 * @param regions - requested regions, or undefined for the page default.
		 * @returns the regions to register.
		 */
		function normalizeRegions(regions) {
		    if (regions === undefined)
		        return ['page'];
		    const seen = new Set();
		    for (const region of regions) {
		        if (!REGIONS.includes(region)) {
		            throw new Error(`shape shortcut region must be page, editable, or terminal: ${String(region)}`);
		        }
		        seen.add(region);
		    }
		    if (seen.size === 0)
		        throw new Error('shape shortcut regions must not be empty');
		    return [...seen];
		}
		/**
		 * Build the shortcut capability provider.
		 * @param ctx - Client context with the shortcuts service.
		 * @returns the provider the runtime scopes per shape.
		 */
		function createShapeShortcuts(ctx) {
		    return {
		        forShape(shapeId) {
		            const prefix = `shape:${shapeId}:`;
		            const service = () => {
		                const shortcuts = ctx.get('shortcuts');
		                if (shortcuts === undefined) {
		                    throw new Error('dsh-shape#shortcuts: the shortcuts service is unavailable in this host');
		                }
		                return shortcuts;
		            };
		            return {
		                register(command) {
		                    if (!/^[a-z0-9][a-z0-9-]*$/.test(command.id)) {
		                        throw new Error(`shape shortcut id must be lowercase letters, digits, and hyphens: ${command.id}`);
		                    }
		                    const definition = (defaults) => ({
		                        id: `${prefix}${command.id}`,
		                        label: () => command.label,
		                        aliases: command.aliases ?? [],
		                        defaults,
		                        regions: normalizeRegions(command.regions),
		                        modals: command.modals ?? [],
		                        resolve: () => ({
		                            status: 'handled',
		                            run: () => { void runAction(command.run); },
		                        }),
		                    });
		                    const all = expandDefaults(command.keys);
		                    try {
		                        return service().register(definition(all));
		                    }
		                    catch (cause) {
		                        // Web on Linux admits only a few combinations; keep the desktop
		                        // defaults so the command still exists and stays rebindable.
		                        if (!(cause instanceof Error) || !cause.message.includes('Unsupported Web shortcut'))
		                            throw cause;
		                        const desktopOnly = Object.fromEntries(Object.entries(all).filter(([profile]) => profile.startsWith('desktop:')));
		                        return service().register(definition(desktopOnly));
		                    }
		                },
		                list() {
		                    return service().catalog.getSnapshot()
		                        .filter(entry => entry.id.startsWith(prefix))
		                        .map(entry => ({
		                        id: entry.id.slice(prefix.length),
		                        label: entry.label,
		                        keys: entry.keys,
		                        modified: entry.modified,
		                        conflicts: entry.conflicts.map(value => String(value)),
		                        issue: entry.issue,
		                    }));
		                },
		            };
		        },
		    };
		}
		/**
		 * Expand one combination into the same default for every profile.
		 * @param spec - combination such as `Ctrl+Alt+M`, or undefined for no default.
		 * @returns defaults keyed by profile.
		 */
		/** Combinations DSH admits for Web on Linux; every other profile admits more. */
		const WEB_LINUX_ALLOWED = [
		    { code: 'Slash', modifiers: ['primary'] },
		    { code: 'Comma', modifiers: ['primary', 'shift'] },
		    { code: 'Period', modifiers: ['primary', 'shift'] },
		];
		/**
		 * Check one binding against the Web-on-Linux admission rule.
		 * @param binding - candidate default.
		 * @returns whether the profile accepts it.
		 */
		function webLinuxAllows(binding) {
		    const key = [...binding.modifiers].sort().join('+') + '|' + binding.code;
		    return WEB_LINUX_ALLOWED.some((candidate) => ([...candidate.modifiers].sort().join('+') + '|' + candidate.code === key));
		}
		/**
		 * Expand one combination to every profile that admits it.
		 * @param spec - combination text.
		 * @returns defaults keyed by profile; `web:linux` is omitted when it would reject the binding.
		 */
		function expandDefaults(spec) {
		    if (spec === undefined)
		        return {};
		    const binding = parseBinding(spec);
		    const defaults = {};
		    for (const profile of PROFILES) {
		        if (profile === 'web:linux' && !webLinuxAllows(binding))
		            continue;
		        defaults[profile] = binding;
		    }
		    return defaults;
		}
		/**
		 * Parse `Modifier+…+Key` into a physical binding.
		 * @param spec - combination text.
		 * @returns the binding to register as a default.
		 */
		function parseBinding(spec) {
		    const parts = spec.split('+').map(part => part.trim()).filter(part => part.length > 0);
		    const key = parts.pop();
		    if (key === undefined)
		        throw new Error(`empty shortcut: "${spec}"`);
		    const modifiers = [];
		    for (const part of parts) {
		        const modifier = MODIFIERS[part.toLowerCase()];
		        if (modifier === undefined)
		            throw new Error(`unknown modifier "${part}" in "${spec}"`);
		        modifiers.push(modifier);
		    }
		    return { code: codeOf(key, spec), modifiers };
		}
		/**
		 * Map a key name to the physical code the shortcut registry accepts.
		 * @param key - key token from the combination.
		 * @param spec - original combination, for error messages.
		 * @returns physical code.
		 */
		function codeOf(key, spec) {
		    if (/^[a-z]$/i.test(key))
		        return `Key${key.toUpperCase()}`;
		    if (/^[0-9]$/.test(key))
		        return `Digit${key}`;
		    if (/^f([1-9]|1[0-9]|2[0-4])$/i.test(key))
		        return key.toUpperCase();
		    const named = NAMED_CODES[key.toLowerCase()];
		    if (named !== undefined)
		        return named;
		    throw new Error(`unknown key "${key}" in "${spec}"`);
		}
		/**
		 * Run a shape action and contain its failure.
		 * @param run - action to invoke.
		 * @returns completion after the action settles.
		 */
		async function runAction(run) {
		    try {
		        await run();
		    }
		    catch (cause) {
		        console.warn('dsh-shape: shortcut failed', cause);
		    }
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/slot-access.ts
		/** Built-in slot capability: discover slots, mount into them, and count mounts. */
		/**
		 * Build the slot capability provider.
		 * @param ctx - Client context with the slots service.
		 * @returns the provider the runtime scopes per shape.
		 */
		function createShapeSlots(ctx) {
			return {
				forShape(shapeId, info) {
					const title = info?.title ?? shapeId;
					const owned = (slot) => shapeMounts(slot).filter(mount => mount.shapeId === shapeId).length;
					return {
						list() {
							return SHAPE_SLOTS.map(spec => ({
								name: spec.name,
								presentation: spec.presentation,
								available: rendered(spec.name),
								mounts: owned(spec.name),
								total: shapeMounts(spec.name).length,
							}));
						},
						mount(slot, render, options) {
							if (!isShapeSlot(slot))
								throw new Error(`unsupported shape slot: ${slot}`);
							return registerShapeMount({
								slot,
								shapeId,
								title,
								placement: options?.placement === 'floating' ? 'floating' : 'anchored',
								snap: options?.snap !== false,
								render,
							});
						},
						entries(slot) {
							if (!isShapeSlot(slot))
								throw new Error(`unsupported shape slot: ${slot}`);
							return owned(slot);
						},
					};
				},
			};
			/**
			 * Report whether this host renders a slot.
			 * @param slot - supported slot name.
			 * @returns true when at least one entry is registered for the slot.
			 */
			function rendered(slot) {
				const entries = ctx.slots.entries;
				return entries(slot).length > 0;
			}
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/shape-events.ts
		/** Built-in event capability: one shared bus with per-shape subscription cleanup. */
		const subscriptions = new Map();
		/**
		 * Build the event capability provider.
		 * @returns the provider the runtime scopes per shape.
		 */
		function createShapeEvents() {
			return {
				forShape(shapeId) {
					return {
						emit(type, payload) {
							assertType(type);
							for (const subscription of subscriptions.get(type) ?? []) {
								try {
									subscription.handler(payload);
								}
								catch (cause) {
									console.warn(`dsh-shape: event handler failed (${type})`, cause);
								}
							}
						},
						on(type, handler) {
							assertType(type);
							if (typeof handler !== 'function')
								throw new Error('dsh-shape#events: handler must be a function');
							const subscription = { shapeId, handler };
							let set = subscriptions.get(type);
							if (set === undefined) {
								set = new Set();
								subscriptions.set(type, set);
							}
							set.add(subscription);
							return () => {
								set.delete(subscription);
								if (set.size === 0)
									subscriptions.delete(type);
							};
						},
					};
				},
			};
		}
		/**
		 * Release every subscription one shape owns.
		 * @param shapeId - owning shape.
		 */
		function disposeShapeEvents(shapeId) {
			for (const [type, set] of subscriptions) {
				for (const subscription of [...set]) {
					if (subscription.shapeId !== shapeId)
						continue;
					set.delete(subscription);
				}
				if (set.size === 0)
					subscriptions.delete(type);
			}
		}
		/**
		 * Reject event names that cannot be matched or are unusable as keys.
		 * @param type - candidate event name.
		 */
		function assertType(type) {
			if (typeof type !== 'string' || !/^[a-z0-9][a-z0-9./-]*$/i.test(type) || type.length > 80) {
				throw new Error(`dsh-shape#events: invalid event type: ${String(type)}`);
			}
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/shape-storage.ts
		/** Built-in storage capability: per-shape JSON files under the shape's `data/` directory. */
		const ENDPOINT = '/dsh-shape/api/data';
		/**
		 * Build the storage capability provider.
		 * @returns the provider the runtime scopes per shape.
		 */
		function createShapeStorage() {
			return {
				forShape(shapeId) {
					return {
						async get(key) {
							const body = await request({ id: shapeId, op: 'get', key });
							return (body.value ?? null);
						},
						async set(key, value) {
							await request({ id: shapeId, op: 'set', key, value });
						},
						async remove(key) {
							await request({ id: shapeId, op: 'remove', key });
						},
						async keys() {
							const body = await request({ id: shapeId, op: 'keys' });
							return body.keys ?? [];
						},
					};
				},
			};
		}
		/**
		 * Call the host data endpoint.
		 * @param payload - shape id, operation, and arguments.
		 * @returns the response body.
		 */
		async function request(payload) {
			const response = await fetch(ENDPOINT, {
				method: 'POST',
				credentials: 'same-origin',
				headers: { 'content-type': 'application/json' },
				body: JSON.stringify(payload),
			});
			const body = await response.json().catch(() => null);
			if (!response.ok || body?.ok !== true) {
				const message = body?.error?.message ?? `request failed (${String(response.status)})`;
				throw new Error(`dsh-shape#storage: ${message}`);
			}
			return body;
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/ShapeOverlay.tsx
		/** Full-screen layer that hosts `shell.overlay` mounts. */
		/** The layer ignores pointer events; each mount re-enables them for its own content. */
		const LAYER = {
		    position: 'fixed',
		    inset: 0,
		    zIndex: 2147483000,
		    display: 'block',
		    pointerEvents: 'none',
		};
		const ENTRY = { pointerEvents: 'auto' };
		/**
		 * Render every `shell.overlay` mount into one fixed layer above the app.
		 * @param props.slot - overlay slot name; defaults to the only overlay slot.
		 * @returns the portal, or null when nothing is mounted.
		 */
		function ShapeOverlay({ slot = 'shell.overlay' }) {
		    const [list, setList] = react.useState(() => shapeMounts(slot));
		    react.useEffect(() => {
		        const sync = () => { setList(shapeMounts(slot)); };
		        sync();
		        return subscribeShapeMounts(slot, sync);
		    }, [slot]);
		    if (list.length === 0)
		        return null;
		    return react.createPortal(react_jsx_runtime.react_jsx_runtime.jsx("div", { style: LAYER, "data-shape-overlay": slot, children: list.map(mount => (react_jsx_runtime.react_jsx_runtime.jsx(ShapeMountBox, { mount: mount, style: ENTRY }, `mount:${mount.shapeId}`))) }), document.body);
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/shape-surfaces.ts
		/** Shape-owned surfaces that are not conversation slots: left sidebar panels. */
		const panels = new Map();
		const panelListeners = new Set();
		let opener;
		/**
		 * Install the function that shows a panel.
		 * @param open - receives a namespaced panel id.
		 */
		function setShapePanelOpener(open) {
		    opener = open;
		}
		/**
		 * Show one registered panel.
		 * @param id - namespaced panel id.
		 */
		function openShapePanel(id) {
		    if (opener === undefined)
		        throw new Error('dsh-shape: panel opening is unavailable in this host');
		    opener(id);
		}
		/**
		 * Register one panel.
		 * @param panel - panel definition.
		 * @returns an idempotent disposer.
		 */
		function registerShapePanel(panel) {
		    panels.set(panel.id, panel);
		    notify();
		    let disposed = false;
		    return () => {
		        if (disposed)
		            return;
		        disposed = true;
		        if (panels.get(panel.id) === panel) {
		            panels.delete(panel.id);
		            notify();
		        }
		    };
		}
		/**
		 * Read every registered panel.
		 * @returns panels in registration order.
		 */
		function shapePanels() {
		    return [...panels.values()];
		}
		/**
		 * Observe panel registration changes.
		 * @param listener - change callback.
		 * @returns an unsubscribe function.
		 */
		function subscribeShapePanels(listener) {
		    panelListeners.add(listener);
		    return () => { panelListeners.delete(listener); };
		}
		/**
		 * Remove every panel one shape owns.
		 * @param shapeId - owning shape.
		 */
		function disposeShapePanels(shapeId) {
		    let changed = false;
		    for (const [id, panel] of panels) {
		        if (panel.shapeId !== shapeId)
		            continue;
		        panels.delete(id);
		        changed = true;
		    }
		    if (changed)
		        notify();
		}
		/**
		 * Notify every observer.
		 */
		function notify() {
		    for (const listener of panelListeners)
		        listener();
		}
		const tabs = new Map();
		const tabListeners = new Set();
		let tabOpener;
		/**
		 * Register one tab.
		 * @param tab - tab definition.
		 * @returns an idempotent disposer.
		 */
		function registerShapeTab(tab) {
		    tabs.set(tab.id, tab);
		    notifyTabs();
		    let disposed = false;
		    return () => {
		        if (disposed)
		            return;
		        disposed = true;
		        if (tabs.get(tab.id) === tab) {
		            tabs.delete(tab.id);
		            notifyTabs();
		        }
		    };
		}
		/**
		 * Read every registered tab.
		 * @returns tabs in registration order.
		 */
		function shapeTabs() {
		    return [...tabs.values()];
		}
		/**
		 * Observe tab registration changes.
		 * @param listener - change callback.
		 * @returns an unsubscribe function.
		 */
		function subscribeShapeTabs(listener) {
		    tabListeners.add(listener);
		    return () => { tabListeners.delete(listener); };
		}
		/**
		 * Remove every tab one shape owns.
		 * @param shapeId - owning shape.
		 */
		function disposeShapeTabs(shapeId) {
		    let changed = false;
		    for (const [id, tab] of tabs) {
		        if (tab.shapeId !== shapeId)
		            continue;
		        tabs.delete(id);
		        changed = true;
		    }
		    if (changed)
		        notifyTabs();
		}
		/**
		 * Install the function that opens a tab in the right sidebar.
		 * @param open - receives a namespaced tab id.
		 */
		function setShapeTabOpener(open) {
		    tabOpener = open;
		}
		/**
		 * Open one registered tab.
		 * @param id - namespaced tab id.
		 */
		function openShapeTab(id) {
		    if (tabOpener === undefined)
		        throw new Error('dsh-shape: tab opening is unavailable in this host');
		    tabOpener(id);
		}
		/**
		 * Notify every tab observer.
		 */
		function notifyTabs() {
		    for (const listener of tabListeners)
		        listener();
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/shape-composer.ts
		/** Built-in composer capability: read and write the active composer draft. */
		const bridges = new Map();
		let active;
		/**
		 * Attach one mounted composer.
		 * @param bridge - session id, draft reader, and actions.
		 * @returns a detacher that only removes its own bridge.
		 */
		function attachComposer(bridge) {
		    bridges.set(bridge.sessionId, bridge);
		    active = bridge.sessionId;
		    return () => {
		        if (bridges.get(bridge.sessionId) !== bridge)
		            return;
		        bridges.delete(bridge.sessionId);
		        if (active === bridge.sessionId)
		            active = bridges.keys().next().value;
		    };
		}
		/**
		 * Build the composer capability.
		 * @returns the API shapes receive.
		 */
		function createComposer() {
		    const current = () => {
		        const id = active;
		        return id === undefined ? undefined : bridges.get(id);
		    };
		    return {
		        sessionId: () => current()?.sessionId ?? null,
		        getText: () => current()?.readText() ?? '',
		        setText(text) {
		            const bridge = current();
		            if (bridge === undefined)
		                throw new Error('dsh-shape#composer: no composer is mounted');
		            bridge.actions.setDraft(text);
		        },
		        insert(text) {
		            const bridge = current();
		            if (bridge === undefined)
		                throw new Error('dsh-shape#composer: no composer is mounted');
		            const span = bridge.actions.captureInsertion?.();
		            if (span !== undefined && bridge.actions.insertText?.(text, span) === true)
		                return true;
		            bridge.actions.setDraft(`${bridge.readText()}${text}`);
		            return true;
		        },
		        submit() {
		            const bridge = current();
		            if (bridge === undefined)
		                throw new Error('dsh-shape#composer: no composer is mounted');
		            bridge.actions.submit?.();
		        },
		    };
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/ShapeComposerBridge.tsx
		/** Bridge that publishes one mounted composer to the `dsh-shape#composer` capability. */
		/**
		 * Publish the composer of the session this entry is mounted in.
		 * @param props.session - session snapshot of the slot scope.
		 * @param props.input - current input state.
		 * @param props.inputActions - composer actions.
		 * @returns nothing; the entry renders no DOM.
		 */
		function ShapeComposerBridge({ session, input, inputActions }) {
		    const sessionId = session?.sessionId;
		    react.useEffect(() => {
		        if (sessionId === undefined || inputActions === undefined)
		            return;
		        return attachComposer({
		            sessionId,
		            readText: () => input?.draft ?? '',
		            actions: inputActions,
		        });
		    }, [sessionId, inputActions, input]);
		    return null;
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/ShapeTabHost.tsx
		/** Hosts for shape-owned right sidebar tabs. */
		const TAB_BODY_STYLE = { display: 'block', width: '100%', height: '100%', overflow: 'auto' };
		const TAB_TITLE_STYLE = { display: 'inline-flex', alignItems: 'center', gap: 6, minWidth: 0 };
		/**
		 * Render one shape tab body.
		 * @param props.tab - tab registered by the shape.
		 * @returns the tab container.
		 */
		function ShapeTabBody({ tab }) {
		    const ref = react.useRef(null);
		    react.useEffect(() => {
		        const container = ref.current;
		        if (container === null)
		            return;
		        let cleanup;
		        try {
		            const result = tab.render(container);
		            if (typeof result === 'function')
		                cleanup = result;
		        }
		        catch (cause) {
		            console.warn('dsh-shape: tab render failed', cause);
		        }
		        return () => {
		            cleanup?.();
		            container.replaceChildren();
		        };
		    }, [tab]);
		    return react_jsx_runtime.react_jsx_runtime.jsx("div", { ref: ref, "data-shape-tab": tab.id, style: TAB_BODY_STYLE });
		}
		/**
		 * Render one shape tab's chip label.
		 * @param props.tab - tab registered by the shape.
		 * @returns the label element.
		 */
		function ShapeTabTitle({ tab }) {
		    return react_jsx_runtime.react_jsx_runtime.jsx("span", { "data-shape-tab-label": tab.id, style: TAB_TITLE_STYLE, children: tab.title });
		}
		/**
		 * Bind one tab to a slot component without an element factory in the caller.
		 * @param tab - tab registered by the shape.
		 * @returns component rendering that tab's body.
		 */
		function createTabComponent(tab) {
		    return function ShapeTabSlotBody() {
		        return react_jsx_runtime.react_jsx_runtime.jsx(ShapeTabBody, { tab: tab });
		    };
		}
		/**
		 * Bind one tab to a title component.
		 * @param tab - tab registered by the shape.
		 * @returns component rendering that tab's chip label.
		 */
		function createTabTitleComponent(tab) {
		    return function ShapeTabSlotTitle() {
		        return react_jsx_runtime.react_jsx_runtime.jsx(ShapeTabTitle, { tab: tab });
		    };
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/shape-conversation.ts
		/** Built-in conversation capability: read the rendered transcript and reveal one message. */
		/** Selector of the transcript flow container. */
		const FLOW_SELECTOR = '[data-chat-flow]';
		/** Selector of one rendered message anchor. */
		const ANCHOR_SELECTOR = '[data-chat-anchor-key]';
		/**
		 * Read one rendered message.
		 * @param element - anchor element.
		 * @returns its message record.
		 */
		function readMessage(element) {
		    const turn = Number.parseInt(element.getAttribute('data-chat-turn') ?? '', 10);
		    return {
		        id: element.getAttribute('data-chat-anchor-key') ?? '',
		        turn: Number.isFinite(turn) ? turn : 0,
		        text: (element.textContent ?? '').replace(/\s+/gu, ' ').trim(),
		    };
		}
		/**
		 * Build the conversation capability.
		 * @returns the API shapes receive.
		 */
		function createConversation() {
		    const messages = () => {
		        const seen = new Set();
		        const rows = [];
		        for (const element of document.querySelectorAll(ANCHOR_SELECTOR)) {
		            const message = readMessage(element);
		            if (message.id === '' || message.text === '' || seen.has(message.id))
		                continue;
		            seen.add(message.id);
		            rows.push(message);
		        }
		        return rows;
		    };
		    return {
		        messages,
		        find(text, options) {
		            const needle = options?.caseSensitive === true ? text : text.toLowerCase();
		            if (needle === '')
		                return [];
		            const limit = options?.limit ?? 100;
		            const matches = [];
		            for (const message of messages()) {
		                const haystack = options?.caseSensitive === true ? message.text : message.text.toLowerCase();
		                let index = haystack.indexOf(needle);
		                while (index >= 0 && matches.length < limit) {
		                    const start = Math.max(0, index - 24);
		                    matches.push({
		                        messageId: message.id,
		                        index,
		                        preview: message.text.slice(start, Math.min(message.text.length, index + needle.length + 24)),
		                    });
		                    index = haystack.indexOf(needle, index + needle.length);
		                }
		                if (matches.length >= limit)
		                    break;
		            }
		            return matches;
		        },
		        reveal(messageId) {
		            const escaped = typeof CSS !== 'undefined' && typeof CSS.escape === 'function'
		                ? CSS.escape(messageId)
		                : messageId.replace(/["\\]/gu, '\\$&');
		            const element = document.querySelector(`[data-chat-anchor-key="${escaped}"]`);
		            if (element === null || typeof element.scrollIntoView !== 'function')
		                return false;
		            element.scrollIntoView({ block: 'center' });
		            return true;
		        },
		        subscribe(listener) {
		            if (typeof MutationObserver === 'undefined')
		                return () => { };
		            const target = document.querySelector(FLOW_SELECTOR) ?? document.body;
		            const observer = new MutationObserver(() => listener());
		            observer.observe(target, { childList: true, subtree: true, characterData: true });
		            return () => observer.disconnect();
		        },
		    };
		}
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/client/index.ts
		/**
		 * dsh-shape Client half: shape browser, composer cards, and the capability
		 * registry providers use to extend shapes.
		 * @module @deepseek-ai/dsh-shape/client
		 */
		/** The leading header seat and composer dock are owned by the conversation client. */
		const inject = ['slots', 'workspaces', 'sessions', 'uiWorkspace'];
		/** Surface registration failures, readable from the page for diagnosis. */
		const surfaceErrors = [];
		/**
		 * Record one surface registration failure.
		 * @param label - what failed to register.
		 * @param cause - thrown value.
		 */
		function recordSurfaceError(label, cause) {
		    surfaceErrors.push(`${label}: ${cause instanceof Error ? cause.message : String(cause)}`);
		    globalThis.__dshShapeSurfaceErrors = surfaceErrors;
		    console.warn('dsh-shape:', label, cause);
		}
		/**
		 * Describe one capability API without serializing its values.
		 * @param api - provider API object.
		 * @returns method names and typed field names.
		 */
		function describeApi(api) {
		    const record = typeof api === 'object' && api !== null ? api : {};
		    // Providers with a per-shape view describe the view the shape actually receives.
		    const scoped = typeof record.forShape === 'function'
		        ? record.forShape('shape')
		        : record;
		    const view = (typeof scoped === 'object' && scoped !== null ? scoped : {});
		    const methods = [];
		    const fields = [];
		    for (const [key, value] of Object.entries(view)) {
		        if (typeof value === 'function')
		            methods.push(key);
		        else
		            fields.push(`${key}:${typeof value}`);
		    }
		    return { methods: methods.sort(), fields: fields.sort() };
		}
		/**
		 * Mirror the Client capability registry to the Host so shape tools can list it.
		 * @param registry - live client registry.
		 * @returns nothing.
		 */
		async function syncCapabilities(registry) {
		    const capabilities = registry.list().map((entry) => {
		        const { methods, fields } = describeApi(entry.api);
		        return {
		            plugin: entry.plugin,
		            capability: entry.capability,
		            version: entry.version,
		            ...(entry.description === undefined ? {} : { description: entry.description }),
		            ...(entry.usage === undefined ? {} : { usage: entry.usage }),
		            methods,
		            fields,
		        };
		    });
		    try {
		        await fetch('/dsh-shape/api/capabilities', {
		            method: 'POST',
		            credentials: 'same-origin',
		            headers: { 'content-type': 'application/json' },
		            body: JSON.stringify({ capabilities }),
		        });
		    }
		    catch {
		        // The host may not have the mirror route yet; shapes still resolve locally.
		    }
		}
		/**
		 * Register shape surfaces and expose the shape capability registry.
		 * @param ctx - client root context.
		 */
		function apply(ctx) {
		    const capabilities = createShapeCapabilityRegistry();
		    ctx.provide('shapeCapabilities', capabilities);
		    ctx.effect(() => capabilities.provide({
		        plugin: 'dsh-shape',
		        capability: 'core',
		        version: '1.0.0',
		        description: 'Shape ABI metadata provided by the dsh-shape runtime itself.',
		        usage: 'Read apiVersion to branch on the shape ABI. Version 1 is the current ABI; no methods are exposed.',
		        api: { apiVersion: 1 },
		    }), 'dsh-shape: core capability');
		    ctx.effect(() => capabilities.provide({
		        plugin: 'dsh-shape',
		        capability: 'workspace',
		        version: '1.0.0',
		        description: 'Navigate between DSH workspaces in registry order.',
		        usage: 'Call next() or previous() to switch with wrap-around. list() returns { id, title } entries and current() returns the active workspace id or null. Switching opens the target workspace\'s most recent Session, or its blank Session when none exists, then expands and scrolls that workspace group into view in the sidebar.',
		        api: createWorkspaceSwitch(ctx),
		    }), 'dsh-shape: workspace capability');
		    ctx.effect(() => capabilities.provide({
		        plugin: 'dsh-shape',
		        capability: 'ui',
		        version: '1.0.0',
		        description: 'Control the DSH surface: navigate Sessions and Workspaces, toggle panels, read and switch the theme, send or cancel turns, show toasts, and open the shape browser.',
		        usage: 'openSession(id) and openWorkspace(id) navigate; toggleSidebar() and selectPanel(id|null) move the layout; getTheme() returns { id, preference } and setTheme(id) switches it; send(text) and cancelTurn() act on the scoped Session; notify(text, { tone, timeout }) shows a toast; openShapeBrowser() raises the shape browser. Methods throw when the host lacks the underlying service.',
		        api: createUiControl(ctx),
		    }), 'dsh-shape: ui capability');
		    ctx.effect(() => capabilities.provide({
		        plugin: 'dsh-shape',
		        capability: 'shortcuts',
		        version: '1.0.0',
		        description: 'Register DSH keyboard commands that users can rebind, so shape actions appear in the shortcut settings and reference.',
		        usage: 'register({ id, label, aliases, keys, run }) registers one command as shape:<shapeId>:<id>; keys is a combination such as "Ctrl+Alt+M" (Ctrl/Alt/Shift/Meta/Mod plus a letter, digit, F-key, or named key), and omitting it leaves the command unbound. list() returns this shape\'s catalog rows with keys, modified, conflicts, and issue. Registration throws on duplicate ids and overlapping defaults.',
		        api: createShapeShortcuts(ctx),
		    }), 'dsh-shape: shortcuts capability');
		    ctx.effect(() => capabilities.provide({
		        plugin: 'dsh-shape',
		        capability: 'slots',
		        version: '1.0.0',
		        description: 'Discover the conversation slots this host renders, mount into them, and count the mounts a shape owns.',
		        usage: 'list() returns every supported slot with its presentation, whether this host renders it, and how many mounts this shape and all shapes own. mount(slot, render, options) renders into a slot and returns a disposer; options.placement is anchored (default) or floating for conversation.input.overlay, and options.snap defaults to true. entries(slot) returns how many mounts this shape owns in that slot.',
		        api: createShapeSlots(ctx),
		    }), 'dsh-shape: slots capability');
		    ctx.effect(() => capabilities.provide({
		        plugin: 'dsh-shape',
		        capability: 'events',
		        version: '1.0.0',
		        description: 'Publish and subscribe to events shared by every running shape.',
		        usage: 'emit(type, payload) publishes to every subscriber; on(type, handler) subscribes and returns an unsubscribe function. Names are plain strings namespaced by convention, for example "mcp-manager/servers-changed". Handler failures are contained and logged. A shape\'s subscriptions are released when it is disabled or reloaded.',
		        api: createShapeEvents(),
		    }), 'dsh-shape: events capability');
		    ctx.effect(() => capabilities.provide({
		        plugin: 'dsh-shape',
		        capability: 'storage',
		        version: '1.0.0',
		        description: 'Persist JSON values in the shape\'s own data/ directory.',
		        usage: 'get(key) returns the stored value or null; set(key, value) writes JSON; remove(key) deletes; keys() lists stored keys. Keys match [a-z0-9][a-z0-9._-]{0,63} and each value is limited to 256 KB. Files live under the shape directory as data/<key>.json; bundled shapes are read-only.',
		        api: createShapeStorage(),
		    }), 'dsh-shape: storage capability');
		    ctx.effect(() => capabilities.provide({
		        plugin: 'dsh-shape',
		        capability: 'composer',
		        version: '1.0.0',
		        description: 'Read and write the active composer draft.',
		        usage: 'getText() returns the draft, setText(text) replaces it, insert(text) adds text at the caret, submit() sends it, and sessionId() names the attached Session. The API follows the composer currently mounted in the conversation; calls throw when no composer is mounted.',
		        api: createComposer(),
		    }), 'dsh-shape: composer capability');
		    ctx.effect(() => capabilities.provide({
		        plugin: 'dsh-shape',
		        capability: 'conversation',
		        version: '1.0.0',
		        description: 'Read the rendered conversation and reveal a message.',
		        usage: 'messages() lists the rendered rows with { id, turn, text }; find(text, { caseSensitive, limit }) returns { messageId, index, preview } matches; reveal(messageId) scrolls that row into view; subscribe(listener) reports transcript changes. Only loaded turns are readable — older history appears after the conversation loads it.',
		        api: createConversation(),
		    }), 'dsh-shape: conversation capability');
		    capabilities.subscribe(() => {
		        window.dispatchEvent(new CustomEvent('dsh-shape:capabilities'));
		        void syncCapabilities(capabilities);
		    });
		    void syncCapabilities(capabilities);
		    const runtime = createShapeRuntime(capabilities);
		    ctx.effect(() => runtime.start(), 'dsh-shape: shape client runtime');
		    const resolveShape = (requirements) => capabilities.resolve(requirements);
		    ctx.slots.inject('conversation.header.leading', () => ctx.slots.register({
		        name: 'conversation.header.leading',
		        inject: () => ({ resolveShape }),
		    }, ShapeButton));
		    // One bridge per conversation slot a shape descriptor or mount may target:
		    // the composer dock, its statistics row and floating anchor, the compact
		    // tool rows, the Session header, and the New Session options.
		    for (const spec of SHAPE_SLOTS) {
		        if (spec.name === 'shell.overlay') {
		            // Overlay mounts render into one fixed layer above the app, not inline.
		            ctx.slots.inject('shell.overlay', () => {
		                return ctx.slots.register({
		                    name: 'shell.overlay',
		                    id: 'dsh-shape-shell-overlay',
		                    order: 20,
		                    inject: () => ({ slot: spec.name }),
		                }, ShapeOverlay);
		            });
		            continue;
		        }
		        ctx.slots.inject(spec.name, () => ctx.slots.register({
		            name: spec.name,
		            id: `dsh-shape-${spec.name.replaceAll('.', '-')}`,
		            order: 20,
		            inject: () => ({ resolveShape, slot: spec.name }),
		        }, ShapeSlotEntries));
		    }
		    ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
		        name: 'conversation.input.dock',
		        id: 'dsh-shape-composer-bridge',
		        order: 0,
		    }, ShapeComposerBridge));
		    // A panel is a floating window in the conversation input overlay: the `main`
		    // slot does not commit a shape entry's subtree, so panels render through the
		    // slot that already hosts floating mounts.
		    const panelWindows = new Map();
		    const closePanelWindow = (id) => {
		        const close = panelWindows.get(id);
		        if (close === undefined)
		            return;
		        panelWindows.delete(id);
		        close();
		    };
		    ctx.effect(() => {
		        setShapePanelOpener((id) => {
		            const panel = shapePanels().find(candidate => candidate.id === id);
		            if (panel === undefined)
		                throw new Error(`dsh-shape: no panel "${id}" is registered`);
		            closePanelWindow(id);
		            try {
		                const off = registerShapeMount({
		                    slot: 'conversation.input.overlay',
		                    shapeId: id,
		                    title: panel.title,
		                    placement: 'floating',
		                    snap: true,
		                    render: panel.render,
		                });
		                panelWindows.set(id, off);
		            }
		            catch (cause) {
		                recordSurfaceError(`panel ${id}`, cause);
		                throw cause;
		            }
		        });
		        return () => {
		            setShapePanelOpener(() => { throw new Error('dsh-shape: panel opening is unavailable in this host'); });
		            for (const id of [...panelWindows.keys()])
		                closePanelWindow(id);
		        };
		    }, 'dsh-shape: panel opener');
		    ctx.effect(() => {
		        const sync = () => {
		            const live = new Set(shapePanels().map(panel => panel.id));
		            for (const id of [...panelWindows.keys()]) {
		                if (!live.has(id))
		                    closePanelWindow(id);
		            }
		        };
		        sync();
		        const off = subscribeShapePanels(sync);
		        return () => {
		            off();
		            for (const id of [...panelWindows.keys()])
		                closePanelWindow(id);
		        };
		    }, 'dsh-shape: shape panels');
		    ctx.effect(() => {
		        setShapeTabOpener((id) => {
		            const service = ctx.get('sidebarRight');
		            if (service === undefined)
		                throw new Error('dsh-shape: the sidebarRight service is unavailable in this host');
		            service.openTab(id);
		        });
		        return () => { setShapeTabOpener(() => { throw new Error('dsh-shape: tab opening is unavailable in this host'); }); };
		    }, 'dsh-shape: tab opener');
		    const tabSlots = new Map();
		    const syncTabs = () => {
		        const live = new Set(shapeTabs().map(tab => tab.id));
		        for (const [id, disposers] of tabSlots) {
		            if (live.has(id))
		                continue;
		            for (const off of disposers)
		                off();
		            tabSlots.delete(id);
		        }
		        for (const tab of shapeTabs()) {
		            if (tabSlots.has(tab.id))
		                continue;
		            const disposers = [];
		            const registry = ctx.get('sidebarRightTabs');
		            if (registry !== undefined) {
		                disposers.push(registry.register({ id: tab.id, kind: tab.id, title: () => tab.title }));
		            }
		            disposers.push(ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
		                name: 'sidebar.right.pane.tab', key: tab.id,
		            }, createTabComponent(tab))));
		            disposers.push(ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
		                name: 'sidebar.right.pane.tab.title', key: tab.id,
		            }, createTabTitleComponent(tab))));
		            tabSlots.set(tab.id, disposers);
		        }
		    };
		    ctx.effect(() => {
		        syncTabs();
		        const off = subscribeShapeTabs(syncTabs);
		        return () => {
		            off();
		            for (const disposers of tabSlots.values()) {
		                for (const dispose of disposers)
		                    dispose();
		            }
		            tabSlots.clear();
		        };
		    }, 'dsh-shape: shape tabs');
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
