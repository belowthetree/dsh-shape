// Generate the bundled capability fallback from the shipped client bundle.
//
// `shape_capabilities` reads the catalog the running client mirrors to disk.
// That mirror is missing before the first boot of a version and stale after an
// upgrade, so the tool falls back to this generated file and says so.
//
// Usage:
//   node scripts/gen-capability-fallback.mjs           # rewrite the file
//   node scripts/gen-capability-fallback.mjs --check   # fail when it drifted
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..')
const bundlePath = path.join(root, 'client.js')
const targetPath = path.join(root, 'skills/shape-development/reference/capabilities.generated.json')
const checkOnly = process.argv.includes('--check')

/** Minimal DOM surface the bundle touches before anything renders. */
function fakeElement() {
  return {
    style: {},
    dataset: {},
    children: [],
    append() {},
    appendChild() {},
    remove() {},
    replaceChildren() {},
    addEventListener() {},
    removeEventListener() {},
    querySelector: () => null,
    querySelectorAll: () => [],
    setAttribute() {},
    getAttribute: () => null,
  }
}

const documentStub = {
  body: fakeElement(),
  head: fakeElement(),
  documentElement: fakeElement(),
  createElement: fakeElement,
  createTextNode: fakeElement,
  querySelector: () => null,
  querySelectorAll: () => [],
  addEventListener() {},
  removeEventListener() {},
}

const windowStub = {
  document: documentStub,
  addEventListener() {},
  removeEventListener() {},
  localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
  setTimeout,
  clearTimeout,
}

globalThis.window = windowStub
globalThis.document = documentStub
globalThis.HTMLElement = class HTMLElement {}
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })

let loaded
windowStub.__ModuleLoader__ = { load(entry) { loaded = entry } }

new Function('window', readFileSync(bundlePath, 'utf8'))(windowStub)
if (loaded === undefined) throw new Error('client.js never called window.__ModuleLoader__.load')

const noopComponent = () => null
const stubs = {
  react: {
    createElement: noopComponent,
    Fragment: 'Fragment',
    useState: (initial) => [typeof initial === 'function' ? initial() : initial, () => {}],
    useEffect: () => {},
    useRef: () => ({ current: null }),
    useCallback: (fn) => fn,
    useMemo: (fn) => fn(),
  },
  'react/jsx-runtime': { jsx: noopComponent, jsxs: noopComponent, Fragment: 'Fragment' },
  'react-dom': { createPortal: noopComponent },
  '@deepseek-ai/dsh-client-ui-primitives': { Button: noopComponent },
}
const exported = loaded.factory((name) => {
  if (!(name in stubs)) throw new Error(`client.js requires an unexpected module: ${name}`)
  return stubs[name]
})

/** Capture the capability registry the client provides. */
let registry
const noop = () => () => {}
const host = {
  effect: (callback) => {
    const off = callback()
    return typeof off === 'function' ? off : noop()
  },
  slots: { inject: (name, callback) => { const off = callback(); return typeof off === 'function' ? off : noop() }, register: () => noop() },
  get: () => undefined,
  on: () => noop(),
  provide: (name, value) => { if (name === 'shapeCapabilities') registry = value },
}
const ctx = new Proxy(host, { get: (target, key) => (key in target ? target[key] : noop()) })
exported.apply(ctx)
if (registry === undefined) throw new Error('client.js provided no shapeCapabilities registry')

/** Describe one provider API the way the client mirrors it. */
function describeApi(api) {
  const record = typeof api === 'object' && api !== null ? api : {}
  const scoped = typeof record.forShape === 'function' ? record.forShape('shape') : record
  const view = typeof scoped === 'object' && scoped !== null ? scoped : {}
  const methods = []
  const fields = []
  for (const [key, value] of Object.entries(view)) {
    if (typeof value === 'function') methods.push(key)
    else fields.push(`${key}:${typeof value}`)
  }
  return { methods: methods.sort(), fields: fields.sort() }
}

const pkg = JSON.parse(readFileSync(path.join(root, 'package.json'), 'utf8'))
const capabilities = registry.list().map((entry) => {
  const { methods, fields } = describeApi(entry.api)
  return {
    plugin: entry.plugin,
    capability: entry.capability,
    version: entry.version,
    ...(entry.description === undefined ? {} : { description: entry.description }),
    ...(entry.usage === undefined ? {} : { usage: entry.usage }),
    methods,
    fields,
  }
})

const generated = `${JSON.stringify({ packageVersion: pkg.version, capabilities }, null, 2)}\n`

if (checkOnly) {
  const current = existsSync(targetPath) ? readFileSync(targetPath, 'utf8') : ''
  const normalize = (text) => {
    try {
      const parsed = JSON.parse(text)
      return JSON.stringify({ capabilities: parsed.capabilities })
    } catch {
      return text
    }
  }
  if (normalize(current) !== normalize(generated)) {
    console.error('capabilities.generated.json is out of date; run node scripts/gen-capability-fallback.mjs')
    process.exit(1)
  }
  console.log(`capabilities.generated.json is current (${String(capabilities.length)} capabilities)`)
} else {
  writeFileSync(targetPath, generated, 'utf8')
  console.log(`wrote ${String(capabilities.length)} capabilities for dsh-shape ${pkg.version}`)
}
