import { mkdir, readFile, readdir } from "node:fs/promises";
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
	const valid = error === void 0 && typeof rawId === "string" && rawId.trim().length > 0;
	return {
		id,
		title,
		description,
		version,
		origin,
		dir,
		views: await listFiles(path.join(dir, "views")),
		slots: await listFiles(path.join(dir, "slots")),
		tools: await listFiles(path.join(dir, "tools")),
		input: manifest.input ?? [],
		output,
		valid,
		...error === void 0 ? {} : { error }
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
* Mount the shape browser and scan folder-based shapes at boot.
* @param ctx - host context carrying `webServer`.
* @param config - optional user shape root.
*/
async function apply(ctx, config = {}) {
	const bundledDir = fileURLToPath(new URL("./shapes/", import.meta.url));
	const userDir = config.dir === void 0 ? path.join(process.env.DSH_HOME ?? path.join(homedir(), ".dsh"), "dsh-shape", "shapes") : path.resolve(config.dir);
	try {
		await mkdir(userDir, { recursive: true });
	} catch {}
	let shapes = [];
	const refresh = async () => {
		const bundled = await readRoot(bundledDir, "bundled");
		const user = await readRoot(userDir, "user");
		const byId = new Map(bundled.map((shape) => [shape.id, shape]));
		for (const shape of user) byId.set(shape.id, shape);
		shapes = [...byId.values()].sort((left, right) => left.id.localeCompare(right.id));
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
		const shape = shapes.find((candidate) => candidate.id === id && candidate.valid);
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
				roots: {
					bundled: bundledDir,
					user: userDir
				}
			});
			return;
		}
		if (req.method === "POST" && url.pathname === `${API}/refresh`) {
			await refresh();
			json(res, 200, snapshot());
			return;
		}
		if (req.method === "GET" && url.pathname.startsWith(`${VIEW}/`)) {
			await serveView(url, res);
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
