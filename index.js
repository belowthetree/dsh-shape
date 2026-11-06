import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
//#region lib/types/index.js
/**
* dsh-shape Host half: discover folder-based shape packages and expose their
* public artifacts to the Web client.
*
* A shape is a directory with a `package.json` plus optional `views/`,
* `slots/`, and `tools/` subdirectories. This first version discovers and
* lists those artifacts; it does not execute shape code.
* @module @deepseek-ai/dsh-shape
*/
/** Plugin name shown in the Loader. */
const name = "dsh-shape";
/** The shape browser mounts beside the Web server. */
const inject = ["webServer"];
const ROUTE = "/dsh-shape";
const API = `${ROUTE}/api`;
const VIEW = `${ROUTE}/view`;
const CLIENT = `${ROUTE}/client`;
const CONTENT_TYPES = {
	".html": "text/html; charset=utf-8",
	".htm": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "text/javascript; charset=utf-8",
	".mjs": "text/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".svg": "image/svg+xml",
	".png": "image/png",
	".jpg": "image/jpeg",
	".jpeg": "image/jpeg",
	".webp": "image/webp",
	".gif": "image/gif",
	".ico": "image/x-icon",
	".woff": "font/woff",
	".woff2": "font/woff2",
	".ttf": "font/ttf",
	".txt": "text/plain; charset=utf-8",
	".md": "text/plain; charset=utf-8",
	".wasm": "application/wasm"
};
/**
* List files below one directory, relative to it and using `/` separators.
* Missing directories are an empty list.
* @param dir - directory to walk.
* @returns sorted relative file paths.
*/
async function listFiles(dir) {
	let entries;
	try {
		entries = await readdir(dir, { withFileTypes: true });
	} catch {
		return [];
	}
	const files = [];
	for (const entry of entries) {
		if (entry.name.startsWith(".")) continue;
		if (entry.isDirectory()) for (const child of await listFiles(path.join(dir, entry.name))) files.push(path.posix.join(entry.name, child));
		else if (entry.isFile()) files.push(entry.name);
	}
	return files.sort();
}
/**
* Read one optional string field from a slot descriptor.
* @param value - raw JSON value.
* @returns the string, or undefined.
*/
function optionalString(value) {
	return typeof value === "string" ? value : void 0;
}
/**
* Parse slot descriptors below one shape's `slots/` directory.
* @param dir - the shape's slots directory.
* @param files - already listed relative files.
* @returns valid descriptors; malformed files are ignored.
*/
async function readSlotData(dir, files) {
	const descriptors = [];
	for (const file of files) {
		if (!file.toLowerCase().endsWith(".json")) continue;
		let parsed;
		try {
			parsed = JSON.parse(await readFile(path.join(dir, file), "utf8"));
		} catch {
			continue;
		}
		if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) continue;
		const record = parsed;
		if (typeof record.slot !== "string" || record.slot.trim().length === 0) continue;
		const title = optionalString(record.title);
		const text = optionalString(record.text);
		const button = optionalString(record.button);
		const greeting = optionalString(record.greeting);
		descriptors.push({
			slot: record.slot.trim(),
			...title === void 0 ? {} : { title },
			...text === void 0 ? {} : { text },
			...button === void 0 ? {} : { button },
			...greeting === void 0 ? {} : { greeting }
		});
	}
	return descriptors;
}
/**
* Parse a shape's optional `shape` manifest object.
* @param manifest - raw package manifest.
* @returns validated ABI and requirements, or a configuration error.
*/
function readShapeConfig(manifest) {
	if (manifest.shape === void 0) return {
		apiVersion: 1,
		requirements: []
	};
	if (typeof manifest.shape !== "object" || manifest.shape === null || Array.isArray(manifest.shape)) return {
		apiVersion: 1,
		requirements: [],
		error: "shape must be an object"
	};
	const config = manifest.shape;
	const apiVersion = config.apiVersion ?? 1;
	if (typeof apiVersion !== "number" || !Number.isInteger(apiVersion) || apiVersion < 1) return {
		apiVersion: 1,
		requirements: [],
		error: "shape.apiVersion must be a positive integer"
	};
	const rawRequires = config.requires ?? [];
	if (!Array.isArray(rawRequires)) return {
		apiVersion,
		requirements: [],
		error: "shape.requires must be an array"
	};
	const requirements = [];
	for (const entry of rawRequires) {
		if (typeof entry !== "object" || entry === null || Array.isArray(entry)) return {
			apiVersion,
			requirements: [],
			error: "each shape requirement must be an object"
		};
		const record = entry;
		const plugin = record.plugin;
		const capability = record.capability;
		const version = record.version;
		const optional = record.optional;
		if (typeof plugin !== "string" || plugin.trim().length === 0 || typeof capability !== "string" || capability.trim().length === 0 || typeof version !== "string" || version.trim().length === 0 || optional !== void 0 && typeof optional !== "boolean") return {
			apiVersion,
			requirements: [],
			error: "requirement needs plugin, capability, version, and optional boolean"
		};
		requirements.push({
			plugin: plugin.trim(),
			capability: capability.trim(),
			version: version.trim(),
			...optional === true ? { optional: true } : {}
		});
	}
	return {
		apiVersion,
		requirements
	};
}
/**
* Read one shape folder.
* @param dir - the shape folder.
* @param origin - which root discovered it.
* @returns the public entry, including errors instead of throwing.
*/
async function readShape(dir, origin) {
	const fallbackId = path.basename(dir);
	let manifest = {};
	let error;
	try {
		manifest = JSON.parse(await readFile(path.join(dir, "package.json"), "utf8"));
	} catch (cause) {
		error = cause instanceof Error ? cause.message : String(cause);
	}
	const rawId = typeof manifest.id === "string" ? manifest.id : manifest.name;
	const id = typeof rawId === "string" && rawId.trim().length > 0 ? rawId.trim() : fallbackId;
	const title = typeof manifest.title === "string" && manifest.title.trim().length > 0 ? manifest.title.trim() : id;
	const description = typeof manifest.description === "string" ? manifest.description : "";
	const version = typeof manifest.version === "string" ? manifest.version : "0.0.0";
	const output = typeof manifest.output === "string" ? manifest.output : "text";
	const shapeConfig = readShapeConfig(manifest);
	const valid = error === void 0 && shapeConfig.error === void 0 && typeof rawId === "string" && rawId.trim().length > 0;
	const slots = await listFiles(path.join(dir, "slots"));
	const slotData = await readSlotData(path.join(dir, "slots"), slots);
	const clientFiles = await listFiles(path.join(dir, "client"));
	const clientEntry = clientFiles.includes("index.js") ? "index.js" : void 0;
	return {
		id,
		title,
		description,
		version,
		origin,
		dir,
		shapeApiVersion: shapeConfig.apiVersion,
		requirements: shapeConfig.requirements,
		views: await listFiles(path.join(dir, "views")),
		clientFiles,
		...clientEntry === void 0 ? {} : { clientEntry },
		slots,
		slotData,
		tools: await listFiles(path.join(dir, "tools")),
		input: manifest.input ?? [],
		output,
		valid,
		enabled: true,
		...error !== void 0 ? { error } : shapeConfig.error !== void 0 ? { error: shapeConfig.error } : {}
	};
}
/**
* Read every shape folder below one root.
* @param root - directory containing shape folders.
* @param origin - which root this is.
* @returns discovered entries.
*/
async function readRoot(root, origin) {
	let entries;
	try {
		entries = await readdir(root, { withFileTypes: true });
	} catch {
		return [];
	}
	const shapes = [];
	for (const entry of entries) {
		if (!entry.isDirectory() || entry.name.startsWith(".")) continue;
		shapes.push(await readShape(path.join(root, entry.name), origin));
	}
	return shapes;
}
/**
* Write one JSON response.
* @param res - server response.
* @param status - HTTP status.
* @param body - JSON body.
*/
function json(res, status, body) {
	const text = JSON.stringify(body);
	res.writeHead(status, {
		"content-type": "application/json; charset=utf-8",
		"cache-control": "no-store",
		"content-length": Buffer.byteLength(text)
	});
	res.end(text);
}
/**
* Validate a Client capability catalog payload.
* @param value - decoded JSON value.
* @returns validated entries.
*/
function readCapabilityCatalog(value) {
	if (!Array.isArray(value) || value.length > 256) throw new Error("capabilities must be an array");
	return value.map((entry) => {
		if (typeof entry !== "object" || entry === null || Array.isArray(entry)) throw new Error("invalid capability entry");
		const record = entry;
		const plugin = record.plugin;
		const capability = record.capability;
		const version = record.version;
		const methods = record.methods;
		const fields = record.fields;
		if (typeof plugin !== "string" || plugin.length === 0 || plugin.length > 200) throw new Error("invalid capability plugin");
		if (typeof capability !== "string" || capability.length === 0 || capability.length > 200) throw new Error("invalid capability name");
		if (typeof version !== "string" || version.length === 0 || version.length > 100) throw new Error("invalid capability version");
		if (!Array.isArray(methods) || methods.some((item) => typeof item !== "string" || item.length > 200)) throw new Error("invalid capability methods");
		if (!Array.isArray(fields) || fields.some((item) => typeof item !== "string" || item.length > 300)) throw new Error("invalid capability fields");
		return {
			plugin,
			capability,
			version,
			methods,
			fields
		};
	});
}
/**
* Read a small JSON request body.
* @param req - incoming request.
* @returns the parsed value.
*/
async function readJsonBody(req) {
	const chunks = [];
	let size = 0;
	for await (const chunk of req) {
		const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
		size += buffer.byteLength;
		if (size > 32768) throw new Error("request body too large");
		chunks.push(buffer);
	}
	if (size === 0) throw new Error("empty request body");
	return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}
/**
* Mount the shape browser and scan folder-based shapes at boot.
* @param ctx - host context carrying `webServer`.
* @param config - optional user shape root.
*/
async function apply(ctx, config = {}) {
	const bundledDir = fileURLToPath(new URL("./shapes/", import.meta.url));
	const userDir = config.dir === void 0 ? path.join(process.env.DSH_HOME ?? path.join(homedir(), ".dsh"), "dsh-shape", "shapes") : path.resolve(config.dir);
	const stateDir = path.join(process.env.DSH_HOME ?? path.join(homedir(), ".dsh"), "dsh-shape");
	const stateFile = path.join(stateDir, "state.json");
	const capabilityFile = path.join(stateDir, "capabilities.json");
	let capabilityCatalog = [];
	try {
		capabilityCatalog = readCapabilityCatalog(JSON.parse(await readFile(capabilityFile, "utf8")));
	} catch {}
	const enabledById = /* @__PURE__ */ new Map();
	try {
		const saved = JSON.parse(await readFile(stateFile, "utf8"));
		if (typeof saved === "object" && saved !== null && !Array.isArray(saved)) {
			for (const [id, enabled] of Object.entries(saved)) if (typeof enabled === "boolean") enabledById.set(id, enabled);
		}
	} catch {}
	const saveEnabled = async () => {
		await mkdir(stateDir, { recursive: true });
		const state = Object.fromEntries([...enabledById.entries()].sort(([left], [right]) => left.localeCompare(right)));
		await writeFile(stateFile, `${JSON.stringify(state, null, 2)}\n`, "utf8");
	};
	try {
		await mkdir(userDir, { recursive: true });
	} catch {}
	let shapes = [];
	const refresh = async () => {
		const bundled = await readRoot(bundledDir, "bundled");
		const user = await readRoot(userDir, "user");
		const byId = new Map(bundled.map((shape) => [shape.id, shape]));
		for (const shape of user) byId.set(shape.id, shape);
		shapes = [...byId.values()].map((shape) => ({
			...shape,
			enabled: enabledById.get(shape.id) !== false
		})).sort((left, right) => left.id.localeCompare(right.id));
		return shapes;
	};
	const snapshot = () => ({
		ok: true,
		shapes,
		roots: {
			bundled: bundledDir,
			user: userDir
		}
	});
	const serveView = async (url, res) => {
		const rest = url.pathname.slice(`${VIEW}/`.length);
		const separator = rest.indexOf("/");
		if (separator === -1) {
			res.writeHead(308, { location: `${url.pathname}/` });
			res.end();
			return;
		}
		let id;
		try {
			id = decodeURIComponent(rest.slice(0, separator));
		} catch {
			json(res, 404, {
				ok: false,
				error: {
					code: "not-found",
					message: "unknown shape"
				}
			});
			return;
		}
		const shape = shapes.find((candidate) => candidate.id === id && candidate.valid && candidate.enabled);
		if (shape === void 0) {
			json(res, 404, {
				ok: false,
				error: {
					code: "not-found",
					message: "unknown shape"
				}
			});
			return;
		}
		let requested = rest.slice(separator + 1);
		try {
			requested = decodeURIComponent(requested);
		} catch {
			json(res, 404, {
				ok: false,
				error: {
					code: "not-found",
					message: "unknown view"
				}
			});
			return;
		}
		if (requested === "" || requested.endsWith("/")) requested += "index.html";
		const normalized = path.posix.normalize(requested);
		if (normalized.startsWith("..") || normalized.startsWith("/") || normalized.includes("\\") || normalized.includes("\0")) {
			json(res, 404, {
				ok: false,
				error: {
					code: "not-found",
					message: "unknown view"
				}
			});
			return;
		}
		let entry = shape.views.includes(normalized) ? normalized : void 0;
		if (entry === void 0 && normalized === "index.html") entry = shape.views.find((file) => !file.includes("/") && /\.html?$/i.test(file));
		if (entry === void 0) {
			json(res, 404, {
				ok: false,
				error: {
					code: "not-found",
					message: "unknown view"
				}
			});
			return;
		}
		let body;
		try {
			body = await readFile(path.join(shape.dir, "views", entry));
		} catch {
			json(res, 404, {
				ok: false,
				error: {
					code: "not-found",
					message: "unknown view"
				}
			});
			return;
		}
		res.writeHead(200, {
			"content-type": CONTENT_TYPES[path.extname(entry).toLowerCase()] ?? "application/octet-stream",
			"content-length": body.byteLength,
			"cache-control": "no-store",
			"x-content-type-options": "nosniff"
		});
		res.end(body);
	};
	const serveClient = async (url, res) => {
		const rest = url.pathname.slice(`${CLIENT}/`.length);
		const separator = rest.indexOf("/");
		if (separator === -1) {
			json(res, 404, {
				ok: false,
				error: {
					code: "not-found",
					message: "unknown client module"
				}
			});
			return;
		}
		let id;
		try {
			id = decodeURIComponent(rest.slice(0, separator));
		} catch {
			json(res, 404, {
				ok: false,
				error: {
					code: "not-found",
					message: "unknown shape"
				}
			});
			return;
		}
		const shape = shapes.find((candidate) => candidate.id === id && candidate.valid && candidate.enabled);
		if (shape === void 0 || shape.clientFiles.length === 0) {
			json(res, 404, {
				ok: false,
				error: {
					code: "not-found",
					message: "unknown shape"
				}
			});
			return;
		}
		let requested;
		try {
			requested = decodeURIComponent(rest.slice(separator + 1));
		} catch {
			json(res, 404, {
				ok: false,
				error: {
					code: "not-found",
					message: "unknown client module"
				}
			});
			return;
		}
		const normalized = path.posix.normalize(requested);
		if (normalized.startsWith("..") || normalized.startsWith("/") || normalized.includes("\\") || normalized.includes("\0") || !shape.clientFiles.includes(normalized)) {
			json(res, 404, {
				ok: false,
				error: {
					code: "not-found",
					message: "unknown client module"
				}
			});
			return;
		}
		let body;
		try {
			body = await readFile(path.join(shape.dir, "client", normalized));
		} catch {
			json(res, 404, {
				ok: false,
				error: {
					code: "not-found",
					message: "unknown client module"
				}
			});
			return;
		}
		res.writeHead(200, {
			"content-type": CONTENT_TYPES[path.extname(normalized).toLowerCase()] ?? "text/javascript; charset=utf-8",
			"content-length": body.byteLength,
			"cache-control": "no-store",
			"x-content-type-options": "nosniff"
		});
		res.end(body);
	};
	const handler = async (req, res) => {
		const url = new URL(req.url ?? "/", "http://dsh.invalid");
		if (req.method === "GET" && url.pathname === `${API}/shapes`) {
			json(res, 200, snapshot());
			return;
		}
		if (req.method === "GET" && url.pathname === `${API}/health`) {
			json(res, 200, {
				ok: true,
				count: shapes.length,
				capabilities: capabilityCatalog.length,
				roots: {
					bundled: bundledDir,
					user: userDir
				}
			});
			return;
		}
		if (req.method === "GET" && url.pathname === `${API}/capabilities`) {
			json(res, 200, {
				ok: true,
				capabilities: capabilityCatalog
			});
			return;
		}
		if (req.method === "POST" && url.pathname === `${API}/capabilities`) {
			let body;
			try {
				body = await readJsonBody(req);
			} catch {
				json(res, 400, {
					ok: false,
					error: {
						code: "bad-request",
						message: "invalid JSON body"
					}
				});
				return;
			}
			const record = typeof body === "object" && body !== null && !Array.isArray(body) ? body : void 0;
			try {
				const catalog = readCapabilityCatalog(record?.capabilities);
				await mkdir(stateDir, { recursive: true });
				await writeFile(capabilityFile, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
				capabilityCatalog = catalog;
				json(res, 200, {
					ok: true,
					capabilities: capabilityCatalog
				});
			} catch (cause) {
				json(res, 400, {
					ok: false,
					error: {
						code: "invalid-capabilities",
						message: cause instanceof Error ? cause.message : String(cause)
					}
				});
			}
			return;
		}
		if (req.method === "POST" && url.pathname === `${API}/refresh`) {
			await refresh();
			json(res, 200, snapshot());
			return;
		}
		if (req.method === "POST" && url.pathname === `${API}/toggle`) {
			let body;
			try {
				body = await readJsonBody(req);
			} catch {
				json(res, 400, {
					ok: false,
					error: {
						code: "bad-request",
						message: "invalid JSON body"
					}
				});
				return;
			}
			const record = typeof body === "object" && body !== null && !Array.isArray(body) ? body : void 0;
			const id = record?.id;
			const enabled = record?.enabled;
			if (typeof id !== "string" || typeof enabled !== "boolean") {
				json(res, 400, {
					ok: false,
					error: {
						code: "bad-request",
						message: "id and enabled are required"
					}
				});
				return;
			}
			if (shapes.find((candidate) => candidate.id === id) === void 0) {
				json(res, 404, {
					ok: false,
					error: {
						code: "not-found",
						message: "unknown shape"
					}
				});
				return;
			}
			const previous = enabledById.get(id);
			enabledById.set(id, enabled);
			try {
				await saveEnabled();
			} catch (cause) {
				if (previous === void 0) enabledById.delete(id);
				else enabledById.set(id, previous);
				json(res, 500, {
					ok: false,
					error: {
						code: "state-write-failed",
						message: cause instanceof Error ? cause.message : String(cause)
					}
				});
				return;
			}
			shapes = shapes.map((candidate) => candidate.id === id ? {
				...candidate,
				enabled
			} : candidate);
			json(res, 200, snapshot());
			return;
		}
		if (req.method === "GET" && url.pathname.startsWith(`${VIEW}/`)) {
			await serveView(url, res);
			return;
		}
		if (req.method === "GET" && url.pathname.startsWith(`${CLIENT}/`)) {
			await serveClient(url, res);
			return;
		}
		json(res, 404, {
			ok: false,
			error: {
				code: "not-found",
				message: "unknown dsh-shape route"
			}
		});
	};
	await refresh();
	ctx.effect(() => ctx.webServer.register({
		kind: "prefix",
		path: ROUTE,
		handler
	}), "dsh-shape: shape browser route");
}
//#endregion
export { apply, inject, name };
