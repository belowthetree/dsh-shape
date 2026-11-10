// Regression test for the shape runtime's module refresh:
//   * a shape is imported from `/dsh-shape/client/<id>/@<clientHash>/<entry>`;
//   * a refresh re-imports only the shapes whose hash changed;
//   * `dsh-shape:restart` re-imports one shape with a counter suffix.
//
// The bundle is loaded the way the DSH client loads it, and `import()` calls are
// answered by a loader hook, so no browser or HTTP server is involved.
//
// Usage: node scripts/check-runtime-refresh.mjs [path/to/client.js]
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const bundlePath = process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'client.js')

globalThis.__imports = []
globalThis.__activated = []
globalThis.__disposed = []

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith('/dsh-shape/client/')) {
      globalThis.__imports.push(specifier)
      return { url: `dsh-shape-synthetic:${encodeURIComponent(specifier)}`, shortCircuit: true }
    }
    return nextResolve(specifier, context)
  },
  load(url, context, nextLoad) {
    if (url.startsWith('dsh-shape-synthetic:')) {
      const specifier = decodeURIComponent(url.slice('dsh-shape-synthetic:'.length))
      const id = specifier.split('/')[3] ?? ''
      const source = `export function activate(api) {
        globalThis.__activated.push(${JSON.stringify(id)})
        api.mount('conversation.input.left', () => () => {})
        return () => { globalThis.__disposed.push(${JSON.stringify(id)}) }
      }`
      return { format: 'module', source, shortCircuit: true }
    }
    return nextLoad(url, context)
  },
})

/** Window stub with real event dispatch, which the runtime subscribes to. */
function windowStub() {
  const listeners = new Map()
  return {
    addEventListener(type, handler) {
      if (!listeners.has(type)) listeners.set(type, new Set())
      listeners.get(type).add(handler)
    },
    removeEventListener(type, handler) {
      listeners.get(type)?.delete(handler)
    },
    dispatchEvent(event) {
      for (const handler of [...(listeners.get(event.type) ?? [])]) handler(event)
      return true
    },
  }
}

const fakeElement = () => ({
  style: {}, dataset: {}, children: [], append() {}, appendChild() {}, remove() {},
  replaceChildren() {}, addEventListener() {}, removeEventListener() {},
  querySelector: () => null, querySelectorAll: () => [], setAttribute() {}, getAttribute: () => null,
})
const documentStub = {
  body: fakeElement(), head: fakeElement(), documentElement: fakeElement(),
  createElement: fakeElement, createTextNode: fakeElement,
  querySelector: () => null, querySelectorAll: () => [],
  addEventListener() {}, removeEventListener() {},
}
const stubWindow = windowStub()
globalThis.window = stubWindow
globalThis.document = documentStub
globalThis.HTMLElement = class HTMLElement {}
globalThis.CustomEvent = class CustomEvent {
  constructor(type, init) {
    this.type = type
    this.detail = init?.detail
  }
}

let shapes = []
globalThis.fetch = async () => ({ ok: true, status: 200, json: async () => ({ ok: true, shapes }) })

let loaded
stubWindow.__ModuleLoader__ = { load(entry) { loaded = entry } }
// eslint-disable-next-line no-new-func -- the bundle is a module factory, not an ES module.
new Function('window', readFileSync(bundlePath, 'utf8'))(stubWindow)
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
const noop = () => () => {}
const host = {
  effect: (callback) => {
    const off = callback()
    return typeof off === 'function' ? off : noop()
  },
  slots: {
    inject: (name, callback) => {
      const off = callback()
      return typeof off === 'function' ? off : noop()
    },
    register: noop,
  },
  get: () => undefined,
  on: () => noop(),
}
exported.apply(new Proxy(host, { get: (target, key) => (key in target ? target[key] : noop) }))

const settle = () => new Promise(resolve => setTimeout(resolve, 60))
const settleAll = async () => { await settle(); await settle() }
const failures = []
const check = (label, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures.push(label)
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${label}: ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}
const shape = (id, hash) => ({
  id, title: id, version: '1.0.0', valid: true, enabled: true, clientEntry: 'index.js', clientHash: hash,
})

shapes = [shape('alpha', 'aaaaaaaaaa'), shape('beta', 'bbbbbbbbbb')]
stubWindow.dispatchEvent({ type: 'dsh-shape:refresh' })
await settleAll()
check('initial refresh imports versioned entries', globalThis.__imports, [
  '/dsh-shape/client/alpha/@aaaaaaaaaa/index.js',
  '/dsh-shape/client/beta/@bbbbbbbbbb/index.js',
])
check('initial refresh activates both shapes', globalThis.__activated, ['alpha', 'beta'])

globalThis.__imports = []
stubWindow.dispatchEvent({ type: 'dsh-shape:refresh' })
await settleAll()
check('unchanged shapes are not re-imported', globalThis.__imports, [])
check('unchanged shapes keep running', globalThis.__disposed, [])

shapes = [shape('alpha', 'cccccccccc'), shape('beta', 'bbbbbbbbbb')]
stubWindow.dispatchEvent({ type: 'dsh-shape:refresh' })
await settleAll()
check('only the changed shape is re-imported', globalThis.__imports, ['/dsh-shape/client/alpha/@cccccccccc/index.js'])
check('only the changed shape was disposed', globalThis.__disposed, ['alpha'])

globalThis.__imports = []
globalThis.__disposed = []
stubWindow.dispatchEvent(new CustomEvent('dsh-shape:restart', { detail: { id: 'beta' } }))
await settleAll()
check('restart re-imports one shape with a counter suffix', globalThis.__imports, ['/dsh-shape/client/beta/@bbbbbbbbbb.1/index.js'])
check('restart disposes only that shape', globalThis.__disposed, ['beta'])

shapes = [{ ...shape('alpha', 'cccccccccc'), enabled: false }]
globalThis.__imports = []
globalThis.__disposed = []
stubWindow.dispatchEvent({ type: 'dsh-shape:refresh' })
await settleAll()
check('disabling a shape stops it without importing anything', [globalThis.__disposed, globalThis.__imports], [['alpha', 'beta'], []])

if (failures.length > 0) {
  console.error(`runtime refresh FAILED (${String(failures.length)}): ${failures.join(', ')}`)
  process.exit(1)
}
console.log('runtime refresh OK: 9 checks')
