// Load the shipped client bundle the way the DSH client does, so a broken
// factory (for example a `}` that closes `apply` early, leaving `ctx` out of
// scope) fails here instead of in a user's renderer.
//
// Usage: node scripts/check-client-bundle.mjs [path/to/client.js]
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const bundlePath = process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'client.js')

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
  __ModuleLoader__: undefined,
}

globalThis.window = windowStub
globalThis.document = documentStub
globalThis.HTMLElement = class HTMLElement {}
// The capability mirror posts to a relative URL; a stub keeps the process alive.
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true }) })

let loaded
windowStub.__ModuleLoader__ = {
  load(entry) {
    loaded = entry
  },
}

const source = readFileSync(bundlePath, 'utf8')
// eslint-disable-next-line no-new-func -- the bundle is a module factory, not an ES module.
new Function('window', source)(windowStub)

if (loaded === undefined) throw new Error('client.js never called window.__ModuleLoader__.load')
if (typeof loaded.factory !== 'function') throw new Error('client.js registered no factory')

/** Stub modules the factory requires at load time. */
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

if (typeof exported.apply !== 'function') throw new Error('client.js does not export apply()')
if (!Array.isArray(exported.inject)) throw new Error('client.js does not export an inject list')

const registrations = []
const noop = () => () => {}
const host = {
  effect: (callback) => {
    const off = callback()
    registrations.push('effect')
    return typeof off === 'function' ? off : noop()
  },
  slots: {
    inject: (name, callback) => {
      registrations.push(`slot:${String(name)}`)
      const off = callback()
      return typeof off === 'function' ? off : noop()
    },
    register: (options) => {
      registrations.push(`register:${String(options?.name)}`)
      return noop()
    },
  },
  get: () => undefined,
  on: () => noop(),
}
const ctx = new Proxy(host, { get: (target, key) => (key in target ? target[key] : noop()) })

try {
  exported.apply(ctx)
} catch (cause) {
  throw new Error(`client.js apply(ctx) threw: ${cause instanceof Error ? cause.message : String(cause)}`)
}

if (registrations.length === 0) throw new Error('client.js apply(ctx) registered nothing')

console.log(`client bundle OK: ${String(registrations.length)} registrations`)
