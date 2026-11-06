window.__ModuleLoader__.load({
	id: "dsh-shape",
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
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/internal/constants.js
		var require_constants = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SEMVER_SPEC_VERSION = "2.0.0";
			const MAX_LENGTH = 256;
			const MAX_SAFE_INTEGER = Number.MAX_SAFE_INTEGER || 9007199254740991;
			module.exports = {
				MAX_LENGTH,
				MAX_SAFE_COMPONENT_LENGTH: 16,
				MAX_SAFE_BUILD_LENGTH: MAX_LENGTH - 6,
				MAX_SAFE_INTEGER,
				RELEASE_TYPES: [
					"major",
					"premajor",
					"minor",
					"preminor",
					"patch",
					"prepatch",
					"prerelease"
				],
				SEMVER_SPEC_VERSION,
				FLAG_INCLUDE_PRERELEASE: 1,
				FLAG_LOOSE: 2
			};
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/internal/debug.js
		var require_debug = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			module.exports = typeof process === "object" && process.env && process.env.NODE_DEBUG && /\bsemver\b/i.test(process.env.NODE_DEBUG) ? (...args) => console.error("SEMVER", ...args) : () => {};
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/internal/re.js
		var require_re = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const { MAX_SAFE_COMPONENT_LENGTH, MAX_SAFE_BUILD_LENGTH, MAX_LENGTH } = require_constants();
			const debug = require_debug();
			exports = module.exports = {};
			const re = exports.re = [];
			const safeRe = exports.safeRe = [];
			const src = exports.src = [];
			const safeSrc = exports.safeSrc = [];
			const t = exports.t = {};
			let R = 0;
			const LETTERDASHNUMBER = "[a-zA-Z0-9-]";
			const safeRegexReplacements = [
				["\\s", 1],
				["\\d", MAX_LENGTH],
				[LETTERDASHNUMBER, MAX_SAFE_BUILD_LENGTH]
			];
			const makeSafeRegex = (value) => {
				for (const [token, max] of safeRegexReplacements) value = value.split(`${token}*`).join(`${token}{0,${max}}`).split(`${token}+`).join(`${token}{1,${max}}`);
				return value;
			};
			const createToken = (name, value, isGlobal) => {
				const safe = makeSafeRegex(value);
				const index = R++;
				debug(name, index, value);
				t[name] = index;
				src[index] = value;
				safeSrc[index] = safe;
				re[index] = new RegExp(value, isGlobal ? "g" : void 0);
				safeRe[index] = new RegExp(safe, isGlobal ? "g" : void 0);
			};
			createToken("NUMERICIDENTIFIER", "0|[1-9]\\d*");
			createToken("NUMERICIDENTIFIERLOOSE", "\\d+");
			createToken("NONNUMERICIDENTIFIER", `\\d*[a-zA-Z-]${LETTERDASHNUMBER}*`);
			createToken("MAINVERSION", `(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})\\.(${src[t.NUMERICIDENTIFIER]})`);
			createToken("MAINVERSIONLOOSE", `(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})\\.(${src[t.NUMERICIDENTIFIERLOOSE]})`);
			createToken("PRERELEASEIDENTIFIER", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIER]})`);
			createToken("PRERELEASEIDENTIFIERLOOSE", `(?:${src[t.NONNUMERICIDENTIFIER]}|${src[t.NUMERICIDENTIFIERLOOSE]})`);
			createToken("PRERELEASE", `(?:-(${src[t.PRERELEASEIDENTIFIER]}(?:\\.${src[t.PRERELEASEIDENTIFIER]})*))`);
			createToken("PRERELEASELOOSE", `(?:-?(${src[t.PRERELEASEIDENTIFIERLOOSE]}(?:\\.${src[t.PRERELEASEIDENTIFIERLOOSE]})*))`);
			createToken("BUILDIDENTIFIER", `${LETTERDASHNUMBER}+`);
			createToken("BUILD", `(?:\\+(${src[t.BUILDIDENTIFIER]}(?:\\.${src[t.BUILDIDENTIFIER]})*))`);
			createToken("FULLPLAIN", `v?${src[t.MAINVERSION]}${src[t.PRERELEASE]}?${src[t.BUILD]}?`);
			createToken("FULL", `^${src[t.FULLPLAIN]}$`);
			createToken("LOOSEPLAIN", `[v=\\s]*${src[t.MAINVERSIONLOOSE]}${src[t.PRERELEASELOOSE]}?${src[t.BUILD]}?`);
			createToken("LOOSE", `^${src[t.LOOSEPLAIN]}$`);
			createToken("GTLT", "((?:<|>)?=?)");
			createToken("XRANGEIDENTIFIERLOOSE", `${src[t.NUMERICIDENTIFIERLOOSE]}|x|X|\\*`);
			createToken("XRANGEIDENTIFIER", `${src[t.NUMERICIDENTIFIER]}|x|X|\\*`);
			createToken("XRANGEPLAIN", `[v=\\s]*(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:\\.(${src[t.XRANGEIDENTIFIER]})(?:${src[t.PRERELEASE]})?${src[t.BUILD]}?)?)?`);
			createToken("XRANGEPLAINLOOSE", `[v=\\s]*(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:\\.(${src[t.XRANGEIDENTIFIERLOOSE]})(?:${src[t.PRERELEASELOOSE]})?${src[t.BUILD]}?)?)?`);
			createToken("XRANGE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAIN]}$`);
			createToken("XRANGELOOSE", `^${src[t.GTLT]}\\s*${src[t.XRANGEPLAINLOOSE]}$`);
			createToken("COERCEPLAIN", `(^|[^\\d])(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}})(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?(?:\\.(\\d{1,${MAX_SAFE_COMPONENT_LENGTH}}))?`);
			createToken("COERCE", `${src[t.COERCEPLAIN]}(?:$|[^\\d])`);
			createToken("COERCEFULL", src[t.COERCEPLAIN] + `(?:${src[t.PRERELEASE]})?(?:${src[t.BUILD]})?(?:$|[^\\d])`);
			createToken("COERCERTL", src[t.COERCE], true);
			createToken("COERCERTLFULL", src[t.COERCEFULL], true);
			createToken("LONETILDE", "(?:~>?)");
			createToken("TILDETRIM", `(\\s*)${src[t.LONETILDE]}\\s+`, true);
			exports.tildeTrimReplace = "$1~";
			createToken("TILDE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAIN]}$`);
			createToken("TILDELOOSE", `^${src[t.LONETILDE]}${src[t.XRANGEPLAINLOOSE]}$`);
			createToken("LONECARET", "(?:\\^)");
			createToken("CARETTRIM", `(\\s*)${src[t.LONECARET]}\\s+`, true);
			exports.caretTrimReplace = "$1^";
			createToken("CARET", `^${src[t.LONECARET]}${src[t.XRANGEPLAIN]}$`);
			createToken("CARETLOOSE", `^${src[t.LONECARET]}${src[t.XRANGEPLAINLOOSE]}$`);
			createToken("COMPARATORLOOSE", `^${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]})$|^$`);
			createToken("COMPARATOR", `^${src[t.GTLT]}\\s*(${src[t.FULLPLAIN]})$|^$`);
			createToken("COMPARATORTRIM", `(\\s*)${src[t.GTLT]}\\s*(${src[t.LOOSEPLAIN]}|${src[t.XRANGEPLAIN]})`, true);
			exports.comparatorTrimReplace = "$1$2$3";
			createToken("HYPHENRANGE", `^\\s*(${src[t.XRANGEPLAIN]})\\s+-\\s+(${src[t.XRANGEPLAIN]})\\s*$`);
			createToken("HYPHENRANGELOOSE", `^\\s*(${src[t.XRANGEPLAINLOOSE]})\\s+-\\s+(${src[t.XRANGEPLAINLOOSE]})\\s*$`);
			createToken("STAR", "(<|>)?=?\\s*\\*");
			createToken("GTE0", "^\\s*>=\\s*0\\.0\\.0\\s*$");
			createToken("GTE0PRE", "^\\s*>=\\s*0\\.0\\.0-0\\s*$");
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/internal/parse-options.js
		var require_parse_options = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const looseOption = Object.freeze({ loose: true });
			const emptyOpts = Object.freeze({});
			const parseOptions = (options) => {
				if (!options) return emptyOpts;
				if (typeof options !== "object") return looseOption;
				return options;
			};
			module.exports = parseOptions;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/internal/identifiers.js
		var require_identifiers = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const numeric = /^[0-9]+$/;
			const compareIdentifiers = (a, b) => {
				if (typeof a === "number" && typeof b === "number") return a === b ? 0 : a < b ? -1 : 1;
				const anum = numeric.test(a);
				const bnum = numeric.test(b);
				if (anum && bnum) {
					a = +a;
					b = +b;
				}
				return a === b ? 0 : anum && !bnum ? -1 : bnum && !anum ? 1 : a < b ? -1 : 1;
			};
			const rcompareIdentifiers = (a, b) => compareIdentifiers(b, a);
			module.exports = {
				compareIdentifiers,
				rcompareIdentifiers
			};
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/classes/semver.js
		var require_semver$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const debug = require_debug();
			const { MAX_LENGTH, MAX_SAFE_INTEGER } = require_constants();
			const { safeRe: re, t } = require_re();
			const parseOptions = require_parse_options();
			const { compareIdentifiers } = require_identifiers();
			const isPrereleaseIdentifier = (prerelease, identifier) => {
				const identifiers = identifier.split(".");
				if (identifiers.length > prerelease.length) return false;
				for (let i = 0; i < identifiers.length; i++) if (compareIdentifiers(prerelease[i], identifiers[i]) !== 0) return false;
				return true;
			};
			module.exports = class SemVer {
				constructor(version, options) {
					options = parseOptions(options);
					if (version instanceof SemVer) if (version.loose === !!options.loose && version.includePrerelease === !!options.includePrerelease) return version;
					else version = version.version;
					else if (typeof version !== "string") throw new TypeError(`Invalid version. Must be a string. Got type "${typeof version}".`);
					if (version.length > MAX_LENGTH) throw new TypeError(`version is longer than ${MAX_LENGTH} characters`);
					debug("SemVer", version, options);
					this.options = options;
					this.loose = !!options.loose;
					this.includePrerelease = !!options.includePrerelease;
					const m = version.trim().match(options.loose ? re[t.LOOSE] : re[t.FULL]);
					if (!m) throw new TypeError(`Invalid Version: ${version}`);
					this.raw = version;
					this.major = +m[1];
					this.minor = +m[2];
					this.patch = +m[3];
					if (this.major > MAX_SAFE_INTEGER || this.major < 0) throw new TypeError("Invalid major version");
					if (this.minor > MAX_SAFE_INTEGER || this.minor < 0) throw new TypeError("Invalid minor version");
					if (this.patch > MAX_SAFE_INTEGER || this.patch < 0) throw new TypeError("Invalid patch version");
					if (!m[4]) this.prerelease = [];
					else this.prerelease = m[4].split(".").map((id) => {
						if (/^[0-9]+$/.test(id)) {
							const num = +id;
							if (num >= 0 && num < MAX_SAFE_INTEGER) return num;
						}
						return id;
					});
					this.build = m[5] ? m[5].split(".") : [];
					this.format();
				}
				format() {
					this.version = `${this.major}.${this.minor}.${this.patch}`;
					if (this.prerelease.length) this.version += `-${this.prerelease.join(".")}`;
					return this.version;
				}
				toString() {
					return this.version;
				}
				compare(other) {
					debug("SemVer.compare", this.version, this.options, other);
					if (!(other instanceof SemVer)) {
						if (typeof other === "string" && other === this.version) return 0;
						other = new SemVer(other, this.options);
					}
					if (other.version === this.version) return 0;
					return this.compareMain(other) || this.comparePre(other);
				}
				compareMain(other) {
					if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
					if (this.major < other.major) return -1;
					if (this.major > other.major) return 1;
					if (this.minor < other.minor) return -1;
					if (this.minor > other.minor) return 1;
					if (this.patch < other.patch) return -1;
					if (this.patch > other.patch) return 1;
					return 0;
				}
				comparePre(other) {
					if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
					if (this.prerelease.length && !other.prerelease.length) return -1;
					else if (!this.prerelease.length && other.prerelease.length) return 1;
					else if (!this.prerelease.length && !other.prerelease.length) return 0;
					let i = 0;
					do {
						const a = this.prerelease[i];
						const b = other.prerelease[i];
						debug("prerelease compare", i, a, b);
						if (a === void 0 && b === void 0) return 0;
						else if (b === void 0) return 1;
						else if (a === void 0) return -1;
						else if (a === b) continue;
						else return compareIdentifiers(a, b);
					} while (++i);
				}
				compareBuild(other) {
					if (!(other instanceof SemVer)) other = new SemVer(other, this.options);
					let i = 0;
					do {
						const a = this.build[i];
						const b = other.build[i];
						debug("build compare", i, a, b);
						if (a === void 0 && b === void 0) return 0;
						else if (b === void 0) return 1;
						else if (a === void 0) return -1;
						else if (a === b) continue;
						else return compareIdentifiers(a, b);
					} while (++i);
				}
				inc(release, identifier, identifierBase) {
					if (release.startsWith("pre")) {
						if (!identifier && identifierBase === false) throw new Error("invalid increment argument: identifier is empty");
						if (identifier) {
							const match = `-${identifier}`.match(this.options.loose ? re[t.PRERELEASELOOSE] : re[t.PRERELEASE]);
							if (!match || match[1] !== identifier) throw new Error(`invalid identifier: ${identifier}`);
						}
					}
					switch (release) {
						case "premajor":
							this.prerelease.length = 0;
							this.patch = 0;
							this.minor = 0;
							this.major++;
							this.inc("pre", identifier, identifierBase);
							break;
						case "preminor":
							this.prerelease.length = 0;
							this.patch = 0;
							this.minor++;
							this.inc("pre", identifier, identifierBase);
							break;
						case "prepatch":
							this.prerelease.length = 0;
							this.inc("patch", identifier, identifierBase);
							this.inc("pre", identifier, identifierBase);
							break;
						case "prerelease":
							if (this.prerelease.length === 0) this.inc("patch", identifier, identifierBase);
							this.inc("pre", identifier, identifierBase);
							break;
						case "release":
							if (this.prerelease.length === 0) throw new Error(`version ${this.raw} is not a prerelease`);
							this.prerelease.length = 0;
							break;
						case "major":
							if (this.minor !== 0 || this.patch !== 0 || this.prerelease.length === 0) this.major++;
							this.minor = 0;
							this.patch = 0;
							this.prerelease = [];
							break;
						case "minor":
							if (this.patch !== 0 || this.prerelease.length === 0) this.minor++;
							this.patch = 0;
							this.prerelease = [];
							break;
						case "patch":
							if (this.prerelease.length === 0) this.patch++;
							this.prerelease = [];
							break;
						case "pre": {
							const base = Number(identifierBase) ? 1 : 0;
							if (this.prerelease.length === 0) this.prerelease = [base];
							else {
								let i = this.prerelease.length;
								while (--i >= 0) if (typeof this.prerelease[i] === "number") {
									this.prerelease[i]++;
									i = -2;
								}
								if (i === -1) {
									if (identifier === this.prerelease.join(".") && identifierBase === false) throw new Error("invalid increment argument: identifier already exists");
									this.prerelease.push(base);
								}
							}
							if (identifier) {
								let prerelease = [identifier, base];
								if (identifierBase === false) prerelease = [identifier];
								if (isPrereleaseIdentifier(this.prerelease, identifier)) {
									const prereleaseBase = this.prerelease[identifier.split(".").length];
									if (isNaN(prereleaseBase)) this.prerelease = prerelease;
								} else this.prerelease = prerelease;
							}
							break;
						}
						default: throw new Error(`invalid increment argument: ${release}`);
					}
					this.raw = this.format();
					if (this.build.length) this.raw += `+${this.build.join(".")}`;
					return this;
				}
			};
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/parse.js
		var require_parse = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SemVer = require_semver$1();
			const parse = (version, options, throwErrors = false) => {
				if (version instanceof SemVer) return version;
				try {
					return new SemVer(version, options);
				} catch (er) {
					if (!throwErrors) return null;
					throw er;
				}
			};
			module.exports = parse;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/valid.js
		var require_valid$1 = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const parse = require_parse();
			const valid = (version, options) => {
				const v = parse(version, options);
				return v ? v.version : null;
			};
			module.exports = valid;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/clean.js
		var require_clean = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const parse = require_parse();
			const clean = (version, options) => {
				const s = parse(version.trim().replace(/^[=v]+/, ""), options);
				return s ? s.version : null;
			};
			module.exports = clean;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/inc.js
		var require_inc = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SemVer = require_semver$1();
			const inc = (version, release, options, identifier, identifierBase) => {
				if (typeof options === "string") {
					identifierBase = identifier;
					identifier = options;
					options = void 0;
				}
				try {
					return new SemVer(version instanceof SemVer ? version.version : version, options).inc(release, identifier, identifierBase).version;
				} catch (er) {
					return null;
				}
			};
			module.exports = inc;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/diff.js
		var require_diff = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const parse = require_parse();
			const diff = (version1, version2) => {
				const v1 = parse(version1, null, true);
				const v2 = parse(version2, null, true);
				const comparison = v1.compare(v2);
				if (comparison === 0) return null;
				const v1Higher = comparison > 0;
				const highVersion = v1Higher ? v1 : v2;
				const lowVersion = v1Higher ? v2 : v1;
				const highHasPre = !!highVersion.prerelease.length;
				if (!!lowVersion.prerelease.length && !highHasPre) {
					if (!lowVersion.patch && !lowVersion.minor) return "major";
					if (lowVersion.compareMain(highVersion) === 0) {
						if (lowVersion.minor && !lowVersion.patch) return "minor";
						return "patch";
					}
				}
				const prefix = highHasPre ? "pre" : "";
				if (v1.major !== v2.major) return prefix + "major";
				if (v1.minor !== v2.minor) return prefix + "minor";
				if (v1.patch !== v2.patch) return prefix + "patch";
				return "prerelease";
			};
			module.exports = diff;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/major.js
		var require_major = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SemVer = require_semver$1();
			const major = (a, loose) => new SemVer(a, loose).major;
			module.exports = major;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/minor.js
		var require_minor = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SemVer = require_semver$1();
			const minor = (a, loose) => new SemVer(a, loose).minor;
			module.exports = minor;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/patch.js
		var require_patch = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SemVer = require_semver$1();
			const patch = (a, loose) => new SemVer(a, loose).patch;
			module.exports = patch;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/prerelease.js
		var require_prerelease = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const parse = require_parse();
			const prerelease = (version, options) => {
				const parsed = parse(version, options);
				return parsed && parsed.prerelease.length ? parsed.prerelease : null;
			};
			module.exports = prerelease;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/compare.js
		var require_compare = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SemVer = require_semver$1();
			const compare = (a, b, loose) => new SemVer(a, loose).compare(new SemVer(b, loose));
			module.exports = compare;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/rcompare.js
		var require_rcompare = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const compare = require_compare();
			const rcompare = (a, b, loose) => compare(b, a, loose);
			module.exports = rcompare;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/compare-loose.js
		var require_compare_loose = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const compare = require_compare();
			const compareLoose = (a, b) => compare(a, b, true);
			module.exports = compareLoose;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/compare-build.js
		var require_compare_build = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SemVer = require_semver$1();
			const compareBuild = (a, b, loose) => {
				const versionA = new SemVer(a, loose);
				const versionB = new SemVer(b, loose);
				return versionA.compare(versionB) || versionA.compareBuild(versionB);
			};
			module.exports = compareBuild;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/sort.js
		var require_sort = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const compareBuild = require_compare_build();
			const sort = (list, loose) => list.sort((a, b) => compareBuild(a, b, loose));
			module.exports = sort;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/rsort.js
		var require_rsort = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const compareBuild = require_compare_build();
			const rsort = (list, loose) => list.sort((a, b) => compareBuild(b, a, loose));
			module.exports = rsort;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/gt.js
		var require_gt = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const compare = require_compare();
			const gt = (a, b, loose) => compare(a, b, loose) > 0;
			module.exports = gt;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/lt.js
		var require_lt = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const compare = require_compare();
			const lt = (a, b, loose) => compare(a, b, loose) < 0;
			module.exports = lt;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/eq.js
		var require_eq = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const compare = require_compare();
			const eq = (a, b, loose) => compare(a, b, loose) === 0;
			module.exports = eq;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/neq.js
		var require_neq = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const compare = require_compare();
			const neq = (a, b, loose) => compare(a, b, loose) !== 0;
			module.exports = neq;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/gte.js
		var require_gte = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const compare = require_compare();
			const gte = (a, b, loose) => compare(a, b, loose) >= 0;
			module.exports = gte;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/lte.js
		var require_lte = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const compare = require_compare();
			const lte = (a, b, loose) => compare(a, b, loose) <= 0;
			module.exports = lte;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/cmp.js
		var require_cmp = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const eq = require_eq();
			const neq = require_neq();
			const gt = require_gt();
			const gte = require_gte();
			const lt = require_lt();
			const lte = require_lte();
			const cmp = (a, op, b, loose) => {
				switch (op) {
					case "===":
						if (typeof a === "object") a = a.version;
						if (typeof b === "object") b = b.version;
						return a === b;
					case "!==":
						if (typeof a === "object") a = a.version;
						if (typeof b === "object") b = b.version;
						return a !== b;
					case "":
					case "=":
					case "==": return eq(a, b, loose);
					case "!=": return neq(a, b, loose);
					case ">": return gt(a, b, loose);
					case ">=": return gte(a, b, loose);
					case "<": return lt(a, b, loose);
					case "<=": return lte(a, b, loose);
					default: throw new TypeError(`Invalid operator: ${op}`);
				}
			};
			module.exports = cmp;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/coerce.js
		var require_coerce = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SemVer = require_semver$1();
			const parse = require_parse();
			const { safeRe: re, t } = require_re();
			const coerce = (version, options) => {
				if (version instanceof SemVer) return version;
				if (typeof version === "number") version = String(version);
				if (typeof version !== "string") return null;
				options = options || {};
				let match = null;
				if (!options.rtl) match = version.match(options.includePrerelease ? re[t.COERCEFULL] : re[t.COERCE]);
				else {
					const coerceRtlRegex = options.includePrerelease ? re[t.COERCERTLFULL] : re[t.COERCERTL];
					let next;
					while ((next = coerceRtlRegex.exec(version)) && (!match || match.index + match[0].length !== version.length)) {
						if (!match || next.index + next[0].length !== match.index + match[0].length) match = next;
						coerceRtlRegex.lastIndex = next.index + next[1].length + next[2].length;
					}
					coerceRtlRegex.lastIndex = -1;
				}
				if (match === null) return null;
				const major = match[2];
				return parse(`${major}.${match[3] || "0"}.${match[4] || "0"}${options.includePrerelease && match[5] ? `-${match[5]}` : ""}${options.includePrerelease && match[6] ? `+${match[6]}` : ""}`, options);
			};
			module.exports = coerce;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/truncate.js
		var require_truncate = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const parse = require_parse();
			const constants = require_constants();
			const SemVer = require_semver$1();
			const truncate = (version, truncation, options) => {
				if (!constants.RELEASE_TYPES.includes(truncation)) return null;
				const clonedVersion = cloneInputVersion(version, options);
				return clonedVersion && doTruncation(clonedVersion, truncation);
			};
			const cloneInputVersion = (version, options) => {
				return parse(version instanceof SemVer ? version.version : version, options);
			};
			const doTruncation = (version, truncation) => {
				if (isPrerelease(truncation)) return version.version;
				version.prerelease = [];
				switch (truncation) {
					case "major":
						version.minor = 0;
						version.patch = 0;
						break;
					case "minor":
						version.patch = 0;
						break;
				}
				return version.format();
			};
			const isPrerelease = (type) => {
				return type.startsWith("pre");
			};
			module.exports = truncate;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/internal/lrucache.js
		var require_lrucache = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			var LRUCache = class {
				constructor() {
					this.max = 1e3;
					this.map = /* @__PURE__ */ new Map();
				}
				get(key) {
					const value = this.map.get(key);
					if (value === void 0) return;
					else {
						this.map.delete(key);
						this.map.set(key, value);
						return value;
					}
				}
				delete(key) {
					return this.map.delete(key);
				}
				set(key, value) {
					if (!this.delete(key) && value !== void 0) {
						if (this.map.size >= this.max) {
							const firstKey = this.map.keys().next().value;
							this.delete(firstKey);
						}
						this.map.set(key, value);
					}
					return this;
				}
			};
			module.exports = LRUCache;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/classes/range.js
		var require_range = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SPACE_CHARACTERS = /\s+/g;
			module.exports = class Range {
				constructor(range, options) {
					options = parseOptions(options);
					if (range instanceof Range) if (range.loose === !!options.loose && range.includePrerelease === !!options.includePrerelease) return range;
					else return new Range(range.raw, options);
					if (range instanceof Comparator) {
						this.raw = range.value;
						this.set = [[range]];
						this.formatted = void 0;
						return this;
					}
					this.options = options;
					this.loose = !!options.loose;
					this.includePrerelease = !!options.includePrerelease;
					this.raw = range.trim().replace(SPACE_CHARACTERS, " ");
					this.set = this.raw.split("||").map((r) => this.parseRange(r.trim())).filter((c) => c.length);
					if (!this.set.length) throw new TypeError(`Invalid SemVer Range: ${this.raw}`);
					if (this.set.length > 1) {
						const first = this.set[0];
						this.set = this.set.filter((c) => !isNullSet(c[0]));
						if (this.set.length === 0) this.set = [first];
						else if (this.set.length > 1) {
							for (const c of this.set) if (c.length === 1 && isAny(c[0])) {
								this.set = [c];
								break;
							}
						}
					}
					this.formatted = void 0;
				}
				get range() {
					if (this.formatted === void 0) {
						this.formatted = "";
						for (let i = 0; i < this.set.length; i++) {
							if (i > 0) this.formatted += "||";
							const comps = this.set[i];
							for (let k = 0; k < comps.length; k++) {
								if (k > 0) this.formatted += " ";
								this.formatted += comps[k].toString().trim();
							}
						}
					}
					return this.formatted;
				}
				format() {
					return this.range;
				}
				toString() {
					return this.range;
				}
				parseRange(range) {
					range = range.replace(BUILDSTRIPRE, "");
					const memoKey = ((this.options.includePrerelease && FLAG_INCLUDE_PRERELEASE) | (this.options.loose && FLAG_LOOSE)) + ":" + range;
					const cached = cache.get(memoKey);
					if (cached) return cached;
					const loose = this.options.loose;
					const hr = loose ? re[t.HYPHENRANGELOOSE] : re[t.HYPHENRANGE];
					range = range.replace(hr, hyphenReplace(this.options.includePrerelease));
					debug("hyphen replace", range);
					range = range.replace(re[t.COMPARATORTRIM], comparatorTrimReplace);
					debug("comparator trim", range);
					range = range.replace(re[t.TILDETRIM], tildeTrimReplace);
					debug("tilde trim", range);
					range = range.replace(re[t.CARETTRIM], caretTrimReplace);
					debug("caret trim", range);
					let rangeList = range.split(" ").map((comp) => parseComparator(comp, this.options)).join(" ").split(/\s+/).map((comp) => replaceGTE0(comp, this.options));
					if (loose) rangeList = rangeList.filter((comp) => {
						debug("loose invalid filter", comp, this.options);
						return !!comp.match(re[t.COMPARATORLOOSE]);
					});
					debug("range list", rangeList);
					const rangeMap = /* @__PURE__ */ new Map();
					const comparators = rangeList.map((comp) => new Comparator(comp, this.options));
					for (const comp of comparators) {
						if (isNullSet(comp)) return [comp];
						rangeMap.set(comp.value, comp);
					}
					if (rangeMap.size > 1 && rangeMap.has("")) rangeMap.delete("");
					const result = [...rangeMap.values()];
					cache.set(memoKey, result);
					return result;
				}
				intersects(range, options) {
					if (!(range instanceof Range)) throw new TypeError("a Range is required");
					return this.set.some((thisComparators) => {
						return isSatisfiable(thisComparators, options) && range.set.some((rangeComparators) => {
							return isSatisfiable(rangeComparators, options) && thisComparators.every((thisComparator) => {
								return rangeComparators.every((rangeComparator) => {
									return thisComparator.intersects(rangeComparator, options);
								});
							});
						});
					});
				}
				test(version) {
					if (!version) return false;
					if (typeof version === "string") try {
						version = new SemVer(version, this.options);
					} catch (er) {
						return false;
					}
					for (let i = 0; i < this.set.length; i++) if (testSet(this.set[i], version, this.options)) return true;
					return false;
				}
			};
			const cache = new (require_lrucache())();
			const parseOptions = require_parse_options();
			const Comparator = require_comparator();
			const debug = require_debug();
			const SemVer = require_semver$1();
			const { safeRe: re, src, t, comparatorTrimReplace, tildeTrimReplace, caretTrimReplace } = require_re();
			const { FLAG_INCLUDE_PRERELEASE, FLAG_LOOSE } = require_constants();
			const BUILDSTRIPRE = new RegExp(src[t.BUILD], "g");
			const isNullSet = (c) => c.value === "<0.0.0-0";
			const isAny = (c) => c.value === "";
			const isSatisfiable = (comparators, options) => {
				let result = true;
				const remainingComparators = comparators.slice();
				let testComparator = remainingComparators.pop();
				while (result && remainingComparators.length) {
					result = remainingComparators.every((otherComparator) => {
						return testComparator.intersects(otherComparator, options);
					});
					testComparator = remainingComparators.pop();
				}
				return result;
			};
			const parseComparator = (comp, options) => {
				comp = comp.replace(re[t.BUILD], "");
				debug("comp", comp, options);
				comp = replaceCarets(comp, options);
				debug("caret", comp);
				comp = replaceTildes(comp, options);
				debug("tildes", comp);
				comp = replaceXRanges(comp, options);
				debug("xrange", comp);
				comp = replaceStars(comp, options);
				debug("stars", comp);
				return comp;
			};
			const isX = (id) => !id || id.toLowerCase() === "x" || id === "*";
			const invalidXRangeOrder = (M, m, p) => isX(M) && !isX(m) || isX(m) && p && !isX(p);
			const replaceTildes = (comp, options) => {
				return comp.trim().split(/\s+/).map((c) => replaceTilde(c, options)).join(" ");
			};
			const replaceTilde = (comp, options) => {
				const r = options.loose ? re[t.TILDELOOSE] : re[t.TILDE];
				const z = options.includePrerelease ? "-0" : "";
				return comp.replace(r, (_, M, m, p, pr) => {
					debug("tilde", comp, _, M, m, p, pr);
					let ret;
					if (isX(M)) ret = "";
					else if (isX(m)) ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
					else if (isX(p)) ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
					else if (pr) {
						debug("replaceTilde pr", pr);
						ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
					} else ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
					debug("tilde return", ret);
					return ret;
				});
			};
			const replaceCarets = (comp, options) => {
				return comp.trim().split(/\s+/).map((c) => replaceCaret(c, options)).join(" ");
			};
			const replaceCaret = (comp, options) => {
				debug("caret", comp, options);
				const r = options.loose ? re[t.CARETLOOSE] : re[t.CARET];
				const z = options.includePrerelease ? "-0" : "";
				return comp.replace(r, (_, M, m, p, pr) => {
					debug("caret", comp, _, M, m, p, pr);
					let ret;
					if (isX(M)) ret = "";
					else if (isX(m)) ret = `>=${M}.0.0${z} <${+M + 1}.0.0-0`;
					else if (isX(p)) if (M === "0") ret = `>=${M}.${m}.0${z} <${M}.${+m + 1}.0-0`;
					else ret = `>=${M}.${m}.0${z} <${+M + 1}.0.0-0`;
					else if (pr) {
						debug("replaceCaret pr", pr);
						if (M === "0") if (m === "0") ret = `>=${M}.${m}.${p}-${pr} <${M}.${m}.${+p + 1}-0`;
						else ret = `>=${M}.${m}.${p}-${pr} <${M}.${+m + 1}.0-0`;
						else ret = `>=${M}.${m}.${p}-${pr} <${+M + 1}.0.0-0`;
					} else {
						debug("no pr");
						if (M === "0") if (m === "0") ret = `>=${M}.${m}.${p} <${M}.${m}.${+p + 1}-0`;
						else ret = `>=${M}.${m}.${p} <${M}.${+m + 1}.0-0`;
						else ret = `>=${M}.${m}.${p} <${+M + 1}.0.0-0`;
					}
					debug("caret return", ret);
					return ret;
				});
			};
			const replaceXRanges = (comp, options) => {
				debug("replaceXRanges", comp, options);
				return comp.split(/\s+/).map((c) => replaceXRange(c, options)).join(" ");
			};
			const replaceXRange = (comp, options) => {
				comp = comp.trim();
				const r = options.loose ? re[t.XRANGELOOSE] : re[t.XRANGE];
				return comp.replace(r, (ret, gtlt, M, m, p, pr) => {
					debug("xRange", comp, ret, gtlt, M, m, p, pr);
					if (invalidXRangeOrder(M, m, p)) return comp;
					const xM = isX(M);
					const xm = xM || isX(m);
					const xp = xm || isX(p);
					const anyX = xp;
					if (gtlt === "=" && anyX) gtlt = "";
					pr = options.includePrerelease ? "-0" : "";
					if (xM) if (gtlt === ">" || gtlt === "<") ret = "<0.0.0-0";
					else ret = "*";
					else if (gtlt && anyX) {
						if (xm) m = 0;
						p = 0;
						if (gtlt === ">") {
							gtlt = ">=";
							if (xm) {
								M = +M + 1;
								m = 0;
								p = 0;
							} else {
								m = +m + 1;
								p = 0;
							}
						} else if (gtlt === "<=") {
							gtlt = "<";
							if (xm) M = +M + 1;
							else m = +m + 1;
						}
						if (gtlt === "<") pr = "-0";
						ret = `${gtlt + M}.${m}.${p}${pr}`;
					} else if (xm) ret = `>=${M}.0.0${pr} <${+M + 1}.0.0-0`;
					else if (xp) ret = `>=${M}.${m}.0${pr} <${M}.${+m + 1}.0-0`;
					debug("xRange return", ret);
					return ret;
				});
			};
			const replaceStars = (comp, options) => {
				debug("replaceStars", comp, options);
				return comp.trim().replace(re[t.STAR], "");
			};
			const replaceGTE0 = (comp, options) => {
				debug("replaceGTE0", comp, options);
				return comp.trim().replace(re[options.includePrerelease ? t.GTE0PRE : t.GTE0], "");
			};
			const hyphenReplace = (incPr) => ($0, from, fM, fm, fp, fpr, fb, to, tM, tm, tp, tpr) => {
				if (isX(fM)) from = "";
				else if (isX(fm)) from = `>=${fM}.0.0${incPr ? "-0" : ""}`;
				else if (isX(fp)) from = `>=${fM}.${fm}.0${incPr ? "-0" : ""}`;
				else if (fpr) from = `>=${from}`;
				else from = `>=${from}${incPr ? "-0" : ""}`;
				if (isX(tM)) to = "";
				else if (isX(tm)) to = `<${+tM + 1}.0.0-0`;
				else if (isX(tp)) to = `<${tM}.${+tm + 1}.0-0`;
				else if (tpr) to = `<=${tM}.${tm}.${tp}-${tpr}`;
				else if (incPr) to = `<${tM}.${tm}.${+tp + 1}-0`;
				else to = `<=${to}`;
				return `${from} ${to}`.trim();
			};
			const testSet = (set, version, options) => {
				for (let i = 0; i < set.length; i++) if (!set[i].test(version)) return false;
				if (version.prerelease.length && !options.includePrerelease) {
					for (let i = 0; i < set.length; i++) {
						debug(set[i].semver);
						if (set[i].semver === Comparator.ANY) continue;
						if (set[i].semver.prerelease.length > 0) {
							const allowed = set[i].semver;
							if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) return true;
						}
					}
					return false;
				}
				return true;
			};
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/classes/comparator.js
		var require_comparator = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const ANY = Symbol("SemVer ANY");
			module.exports = class Comparator {
				static get ANY() {
					return ANY;
				}
				constructor(comp, options) {
					options = parseOptions(options);
					if (comp instanceof Comparator) if (comp.loose === !!options.loose) return comp;
					else comp = comp.value;
					comp = comp.trim().split(/\s+/).join(" ");
					debug("comparator", comp, options);
					this.options = options;
					this.loose = !!options.loose;
					this.parse(comp);
					if (this.semver === ANY) this.value = "";
					else this.value = this.operator + this.semver.version;
					debug("comp", this);
				}
				parse(comp) {
					const r = this.options.loose ? re[t.COMPARATORLOOSE] : re[t.COMPARATOR];
					const m = comp.match(r);
					if (!m) throw new TypeError(`Invalid comparator: ${comp}`);
					this.operator = m[1] !== void 0 ? m[1] : "";
					if (this.operator === "=") this.operator = "";
					if (!m[2]) this.semver = ANY;
					else this.semver = new SemVer(m[2], this.options.loose);
				}
				toString() {
					return this.value;
				}
				test(version) {
					debug("Comparator.test", version, this.options.loose);
					if (this.semver === ANY || version === ANY) return true;
					if (typeof version === "string") try {
						version = new SemVer(version, this.options);
					} catch (er) {
						return false;
					}
					return cmp(version, this.operator, this.semver, this.options);
				}
				intersects(comp, options) {
					if (!(comp instanceof Comparator)) throw new TypeError("a Comparator is required");
					if (this.operator === "") {
						if (this.value === "") return true;
						return new Range(comp.value, options).test(this.value);
					} else if (comp.operator === "") {
						if (comp.value === "") return true;
						return new Range(this.value, options).test(comp.semver);
					}
					options = parseOptions(options);
					if (options.includePrerelease && (this.value === "<0.0.0-0" || comp.value === "<0.0.0-0")) return false;
					if (!options.includePrerelease && (this.value.startsWith("<0.0.0") || comp.value.startsWith("<0.0.0"))) return false;
					if (this.operator.startsWith(">") && comp.operator.startsWith(">")) return true;
					if (this.operator.startsWith("<") && comp.operator.startsWith("<")) return true;
					if (this.semver.version === comp.semver.version && this.operator.includes("=") && comp.operator.includes("=")) return true;
					if (cmp(this.semver, "<", comp.semver, options) && this.operator.startsWith(">") && comp.operator.startsWith("<")) return true;
					if (cmp(this.semver, ">", comp.semver, options) && this.operator.startsWith("<") && comp.operator.startsWith(">")) return true;
					return false;
				}
			};
			const parseOptions = require_parse_options();
			const { safeRe: re, t } = require_re();
			const cmp = require_cmp();
			const debug = require_debug();
			const SemVer = require_semver$1();
			const Range = require_range();
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/functions/satisfies.js
		var require_satisfies = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const Range = require_range();
			const satisfies = (version, range, options) => {
				try {
					range = new Range(range, options);
				} catch (er) {
					return false;
				}
				return range.test(version);
			};
			module.exports = satisfies;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/to-comparators.js
		var require_to_comparators = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const Range = require_range();
			const toComparators = (range, options) => new Range(range, options).set.map((comp) => comp.map((c) => c.value).join(" ").trim().split(" "));
			module.exports = toComparators;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/max-satisfying.js
		var require_max_satisfying = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SemVer = require_semver$1();
			const Range = require_range();
			const maxSatisfying = (versions, range, options) => {
				let max = null;
				let maxSV = null;
				let rangeObj = null;
				try {
					rangeObj = new Range(range, options);
				} catch (er) {
					return null;
				}
				versions.forEach((v) => {
					if (rangeObj.test(v)) {
						if (!max || maxSV.compare(v) === -1) {
							max = v;
							maxSV = new SemVer(max, options);
						}
					}
				});
				return max;
			};
			module.exports = maxSatisfying;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/min-satisfying.js
		var require_min_satisfying = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SemVer = require_semver$1();
			const Range = require_range();
			const minSatisfying = (versions, range, options) => {
				let min = null;
				let minSV = null;
				let rangeObj = null;
				try {
					rangeObj = new Range(range, options);
				} catch (er) {
					return null;
				}
				versions.forEach((v) => {
					if (rangeObj.test(v)) {
						if (!min || minSV.compare(v) === 1) {
							min = v;
							minSV = new SemVer(min, options);
						}
					}
				});
				return min;
			};
			module.exports = minSatisfying;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/min-version.js
		var require_min_version = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SemVer = require_semver$1();
			const Range = require_range();
			const gt = require_gt();
			const minVersion = (range, loose) => {
				range = new Range(range, loose);
				let minver = new SemVer("0.0.0");
				if (range.test(minver)) return minver;
				minver = new SemVer("0.0.0-0");
				if (range.test(minver)) return minver;
				minver = null;
				for (let i = 0; i < range.set.length; ++i) {
					const comparators = range.set[i];
					let setMin = null;
					comparators.forEach((comparator) => {
						const compver = new SemVer(comparator.semver.version);
						switch (comparator.operator) {
							case ">":
								if (compver.prerelease.length === 0) compver.patch++;
								else compver.prerelease.push(0);
								compver.raw = compver.format();
							case "":
							case ">=":
								if (!setMin || gt(compver, setMin)) setMin = compver;
								break;
							case "<":
							case "<=": break;
							/* istanbul ignore next */
							default: throw new Error(`Unexpected operation: ${comparator.operator}`);
						}
					});
					if (setMin && (!minver || gt(minver, setMin))) minver = setMin;
				}
				if (minver && range.test(minver)) return minver;
				return null;
			};
			module.exports = minVersion;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/valid.js
		var require_valid = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const Range = require_range();
			const validRange = (range, options) => {
				try {
					return new Range(range, options).range || "*";
				} catch (er) {
					return null;
				}
			};
			module.exports = validRange;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/outside.js
		var require_outside = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const SemVer = require_semver$1();
			const Comparator = require_comparator();
			const { ANY } = Comparator;
			const Range = require_range();
			const satisfies = require_satisfies();
			const gt = require_gt();
			const lt = require_lt();
			const lte = require_lte();
			const gte = require_gte();
			const outside = (version, range, hilo, options) => {
				version = new SemVer(version, options);
				range = new Range(range, options);
				let gtfn, ltefn, ltfn, comp, ecomp;
				switch (hilo) {
					case ">":
						gtfn = gt;
						ltefn = lte;
						ltfn = lt;
						comp = ">";
						ecomp = ">=";
						break;
					case "<":
						gtfn = lt;
						ltefn = gte;
						ltfn = gt;
						comp = "<";
						ecomp = "<=";
						break;
					default: throw new TypeError("Must provide a hilo val of \"<\" or \">\"");
				}
				if (satisfies(version, range, options)) return false;
				for (let i = 0; i < range.set.length; ++i) {
					const comparators = range.set[i];
					let high = null;
					let low = null;
					comparators.forEach((comparator) => {
						if (comparator.semver === ANY) comparator = new Comparator(">=0.0.0");
						high = high || comparator;
						low = low || comparator;
						if (gtfn(comparator.semver, high.semver, options)) high = comparator;
						else if (ltfn(comparator.semver, low.semver, options)) low = comparator;
					});
					if (high.operator === comp || high.operator === ecomp) return false;
					if ((!low.operator || low.operator === comp) && ltefn(version, low.semver)) return false;
					else if (low.operator === ecomp && ltfn(version, low.semver)) return false;
				}
				return true;
			};
			module.exports = outside;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/gtr.js
		var require_gtr = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const outside = require_outside();
			const gtr = (version, range, options) => outside(version, range, ">", options);
			module.exports = gtr;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/ltr.js
		var require_ltr = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const outside = require_outside();
			const ltr = (version, range, options) => outside(version, range, "<", options);
			module.exports = ltr;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/intersects.js
		var require_intersects = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const Range = require_range();
			const intersects = (r1, r2, options) => {
				r1 = new Range(r1, options);
				r2 = new Range(r2, options);
				return r1.intersects(r2, options);
			};
			module.exports = intersects;
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/simplify.js
		var require_simplify = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const satisfies = require_satisfies();
			const compare = require_compare();
			module.exports = (versions, range, options) => {
				const set = [];
				let first = null;
				let prev = null;
				const v = versions.sort((a, b) => compare(a, b, options));
				for (const version of v) if (satisfies(version, range, options)) {
					prev = version;
					if (!first) first = version;
				} else {
					if (prev) set.push([first, prev]);
					prev = null;
					first = null;
				}
				if (first) set.push([first, null]);
				const ranges = [];
				for (const [min, max] of set) if (min === max) ranges.push(min);
				else if (!max && min === v[0]) ranges.push("*");
				else if (!max) ranges.push(`>=${min}`);
				else if (min === v[0]) ranges.push(`<=${max}`);
				else ranges.push(`${min} - ${max}`);
				const simplified = ranges.join(" || ");
				const original = typeof range.raw === "string" ? range.raw : String(range);
				return simplified.length < original.length ? simplified : range;
			};
		}));
		//#endregion
		//#region ../node_modules/.pnpm/semver@7.8.5/node_modules/semver/ranges/subset.js
		var require_subset = /* @__PURE__ */ __commonJSMin(((exports, module) => {
			const Range = require_range();
			const Comparator = require_comparator();
			const { ANY } = Comparator;
			const satisfies = require_satisfies();
			const compare = require_compare();
			const subset = (sub, dom, options = {}) => {
				if (sub === dom) return true;
				sub = new Range(sub, options);
				dom = new Range(dom, options);
				let sawNonNull = false;
				OUTER: for (const simpleSub of sub.set) {
					for (const simpleDom of dom.set) {
						const isSub = simpleSubset(simpleSub, simpleDom, options);
						sawNonNull = sawNonNull || isSub !== null;
						if (isSub) continue OUTER;
					}
					if (sawNonNull) return false;
				}
				return true;
			};
			const minimumVersionWithPreRelease = [new Comparator(">=0.0.0-0")];
			const minimumVersion = [new Comparator(">=0.0.0")];
			const simpleSubset = (sub, dom, options) => {
				if (sub === dom) return true;
				if (sub.length === 1 && sub[0].semver === ANY) if (dom.length === 1 && dom[0].semver === ANY) return true;
				else if (options.includePrerelease) sub = minimumVersionWithPreRelease;
				else sub = minimumVersion;
				if (dom.length === 1 && dom[0].semver === ANY) if (options.includePrerelease) return true;
				else dom = minimumVersion;
				const eqSet = /* @__PURE__ */ new Set();
				let gt, lt;
				for (const c of sub) if (c.operator === ">" || c.operator === ">=") gt = higherGT(gt, c, options);
				else if (c.operator === "<" || c.operator === "<=") lt = lowerLT(lt, c, options);
				else eqSet.add(c.semver);
				if (eqSet.size > 1) return null;
				let gtltComp;
				if (gt && lt) {
					gtltComp = compare(gt.semver, lt.semver, options);
					if (gtltComp > 0) return null;
					else if (gtltComp === 0 && (gt.operator !== ">=" || lt.operator !== "<=")) return null;
				}
				for (const eq of eqSet) {
					if (gt && !satisfies(eq, String(gt), options)) return null;
					if (lt && !satisfies(eq, String(lt), options)) return null;
					for (const c of dom) if (!satisfies(eq, String(c), options)) return false;
					return true;
				}
				let higher, lower;
				let hasDomLT, hasDomGT;
				let needDomLTPre = lt && !options.includePrerelease && lt.semver.prerelease.length ? lt.semver : false;
				let needDomGTPre = gt && !options.includePrerelease && gt.semver.prerelease.length ? gt.semver : false;
				if (needDomLTPre && needDomLTPre.prerelease.length === 1 && lt.operator === "<" && needDomLTPre.prerelease[0] === 0) needDomLTPre = false;
				for (const c of dom) {
					hasDomGT = hasDomGT || c.operator === ">" || c.operator === ">=";
					hasDomLT = hasDomLT || c.operator === "<" || c.operator === "<=";
					if (gt) {
						if (needDomGTPre) {
							if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomGTPre.major && c.semver.minor === needDomGTPre.minor && c.semver.patch === needDomGTPre.patch) needDomGTPre = false;
						}
						if (c.operator === ">" || c.operator === ">=") {
							higher = higherGT(gt, c, options);
							if (higher === c && higher !== gt) return false;
						} else if (gt.operator === ">=" && !c.test(gt.semver)) return false;
					}
					if (lt) {
						if (needDomLTPre) {
							if (c.semver.prerelease && c.semver.prerelease.length && c.semver.major === needDomLTPre.major && c.semver.minor === needDomLTPre.minor && c.semver.patch === needDomLTPre.patch) needDomLTPre = false;
						}
						if (c.operator === "<" || c.operator === "<=") {
							lower = lowerLT(lt, c, options);
							if (lower === c && lower !== lt) return false;
						} else if (lt.operator === "<=" && !c.test(lt.semver)) return false;
					}
					if (!c.operator && (lt || gt) && gtltComp !== 0) return false;
				}
				if (gt && hasDomLT && !lt && gtltComp !== 0) return false;
				if (lt && hasDomGT && !gt && gtltComp !== 0) return false;
				if (needDomGTPre || needDomLTPre) return false;
				return true;
			};
			const higherGT = (a, b, options) => {
				if (!a) return b;
				const comp = compare(a.semver, b.semver, options);
				return comp > 0 ? a : comp < 0 ? b : b.operator === ">" && a.operator === ">=" ? b : a;
			};
			const lowerLT = (a, b, options) => {
				if (!a) return b;
				const comp = compare(a.semver, b.semver, options);
				return comp < 0 ? a : comp > 0 ? b : b.operator === "<" && a.operator === "<=" ? b : a;
			};
			module.exports = subset;
		}));
		//#endregion
		//#region ../../dsh-plugins/dsh-shape/src/capabilities.ts
		var import_semver = (/* @__PURE__ */ __commonJSMin(((exports, module) => {
			const internalRe = require_re();
			const constants = require_constants();
			const SemVer = require_semver$1();
			const identifiers = require_identifiers();
			module.exports = {
				parse: require_parse(),
				valid: require_valid$1(),
				clean: require_clean(),
				inc: require_inc(),
				diff: require_diff(),
				major: require_major(),
				minor: require_minor(),
				patch: require_patch(),
				prerelease: require_prerelease(),
				compare: require_compare(),
				rcompare: require_rcompare(),
				compareLoose: require_compare_loose(),
				compareBuild: require_compare_build(),
				sort: require_sort(),
				rsort: require_rsort(),
				gt: require_gt(),
				lt: require_lt(),
				eq: require_eq(),
				neq: require_neq(),
				gte: require_gte(),
				lte: require_lte(),
				cmp: require_cmp(),
				coerce: require_coerce(),
				truncate: require_truncate(),
				Comparator: require_comparator(),
				Range: require_range(),
				satisfies: require_satisfies(),
				toComparators: require_to_comparators(),
				maxSatisfying: require_max_satisfying(),
				minSatisfying: require_min_satisfying(),
				minVersion: require_min_version(),
				validRange: require_valid(),
				outside: require_outside(),
				gtr: require_gtr(),
				ltr: require_ltr(),
				intersects: require_intersects(),
				simplifyRange: require_simplify(),
				subset: require_subset(),
				SemVer,
				re: internalRe.re,
				src: internalRe.src,
				tokens: internalRe.t,
				SEMVER_SPEC_VERSION: constants.SEMVER_SPEC_VERSION,
				RELEASE_TYPES: constants.RELEASE_TYPES,
				compareIdentifiers: identifiers.compareIdentifiers,
				rcompareIdentifiers: identifiers.rcompareIdentifiers
			};
		})))();
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
					if (!(0, import_semver.valid)(capability.version)) throw new Error(`invalid capability version: ${capability.version}`);
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
						if ((0, import_semver.validRange)(requirement.version) === null) {
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
						if (!(0, import_semver.satisfies)(found.version, requirement.version, { includePrerelease: true })) {
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
					const api = {
						shape: {
							id: shape.id,
							title: shape.title,
							version: shape.version
						},
						capabilities: resolution.capabilities,
						require(plugin, capability) {
							const key = `${plugin}#${capability}`;
							if (!(key in resolution.capabilities)) throw new Error(`capability not declared: ${key}`);
							return resolution.capabilities[key];
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
							}
						});
					} catch (cause) {
						for (const off of state.mounts) off();
						for (const off of state.shortcuts) off();
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
		//#region ../../dsh-plugins/dsh-shape/src/client/index.ts
		/** The leading header seat and composer dock are owned by the conversation client. */
		const inject = [
			"slots",
			"workspaces",
			"sessions",
			"uiWorkspace"
		];
		/**
		* Describe one capability API without serializing its values.
		* @param api - provider API object.
		* @returns method names and typed field names.
		*/
		function describeApi(api) {
			const record = typeof api === "object" && api !== null ? api : {};
			const methods = [];
			const fields = [];
			for (const [key, value] of Object.entries(record)) if (typeof value === "function") methods.push(key);
			else fields.push(`${key}:${typeof value}`);
			return {
				methods: methods.sort(),
				fields: fields.sort()
			};
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
					...entry.description === void 0 ? {} : { description: entry.description },
					...entry.usage === void 0 ? {} : { usage: entry.usage },
					methods,
					fields
				};
			});
			try {
				await fetch("/dsh-shape/api/capabilities", {
					method: "POST",
					credentials: "same-origin",
					headers: { "content-type": "application/json" },
					body: JSON.stringify({ capabilities })
				});
			} catch {}
		}
		/**
		* Register shape surfaces and expose the shape capability registry.
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			const capabilities = createShapeCapabilityRegistry();
			ctx.provide("shapeCapabilities", capabilities);
			ctx.effect(() => capabilities.provide({
				plugin: "dsh-shape",
				capability: "core",
				version: "1.0.0",
				description: "Shape ABI metadata provided by the dsh-shape runtime itself.",
				usage: "Read apiVersion to branch on the shape ABI. Version 1 is the current ABI; no methods are exposed.",
				api: { apiVersion: 1 }
			}), "dsh-shape: core capability");
			ctx.effect(() => capabilities.provide({
				plugin: "dsh-shape",
				capability: "workspace",
				version: "1.0.0",
				description: "Navigate between DSH workspaces in registry order.",
				usage: "Call next() or previous() to switch with wrap-around. list() returns { id, title } entries and current() returns the active workspace id or null. Switching opens the target workspace's most recent Session, or its blank Session when none exists, then expands and scrolls that workspace group into view in the sidebar.",
				api: createWorkspaceSwitch(ctx)
			}), "dsh-shape: workspace capability");
			capabilities.subscribe(() => {
				window.dispatchEvent(new CustomEvent("dsh-shape:capabilities"));
				syncCapabilities(capabilities);
			});
			syncCapabilities(capabilities);
			const runtime = createShapeRuntime(capabilities);
			ctx.effect(() => runtime.start(), "dsh-shape: shape client runtime");
			const resolveShape = (requirements) => capabilities.resolve(requirements);
			ctx.slots.inject("conversation.header.leading", () => ctx.slots.register({
				name: "conversation.header.leading",
				inject: () => ({ resolveShape })
			}, ShapeButton));
			for (const spec of SHAPE_SLOTS) ctx.slots.inject(spec.name, () => ctx.slots.register({
				name: spec.name,
				id: `dsh-shape-${spec.name.replaceAll(".", "-")}`,
				order: 20,
				inject: () => ({ resolveShape, slot: spec.name })
			}, ShapeSlotEntries));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
