/**
 * dsh-shape Client half: shape browser, composer cards, and the capability
 * registry providers use to extend shapes.
 * @module @deepseek-ai/dsh-shape/client
 */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import {
  createShapeCapabilityRegistry,
  type ShapeCapabilityRegistry,
  type ShapeRequirement,
  type ShapeResolution,
} from '../shared/capabilities.ts'
import { SHAPE_SLOTS, registerShapeMount } from './shape-slots.ts'
import { ShapeSlotEntries } from './ShapeSlotEntries.tsx'
import { ShapeButton } from './ShapeButton.tsx'
import { createShapeRuntime } from './shape-runtime.ts'
import { createShapeEvents } from './shape-events.ts'
import { createShapeShortcuts } from './shortcut-commands.ts'
import { createShapeSlots } from './slot-access.ts'
import { createShapeStorage } from './shape-storage.ts'
import { ShapeComposerBridge } from './ShapeComposerBridge.tsx'
import { createComposer } from './shape-composer.ts'
import { createConversation } from './shape-conversation.ts'
import { ShapeOverlay } from './ShapeOverlay.tsx'
import { createTabComponent, createTabTitleComponent } from './ShapeTabHost.tsx'
import {
  setShapePanelOpener,
  setShapeTabOpener,
  shapePanels,
  shapeTabs,
  subscribeShapePanels,
  subscribeShapeTabs,
} from './shape-surfaces.ts'
import { createUiControl } from './ui-control.ts'
import { createWorkspaceSwitch } from './workspace.ts'

/** The leading header seat and composer dock are owned by the conversation client. */
export const inject = ['slots', 'workspaces', 'sessions', 'uiWorkspace']

/** Surface registration failures, readable from the page for diagnosis. */
const surfaceErrors: string[] = []

/**
 * Record one surface registration failure.
 * @param label - what failed to register.
 * @param cause - thrown value.
 */
function recordSurfaceError(label: string, cause: unknown): void {
  surfaceErrors.push(`${label}: ${cause instanceof Error ? cause.message : String(cause)}`)
  ;(globalThis as { __dshShapeSurfaceErrors?: string[] }).__dshShapeSurfaceErrors = surfaceErrors
  console.warn('dsh-shape:', label, cause)
}

/**
 * Describe one capability API without serializing its values.
 * @param api - provider API object.
 * @returns method names and typed field names.
 */
function describeApi(api: unknown): { methods: string[], fields: string[] } {
  const record = typeof api === 'object' && api !== null ? api as Record<string, unknown> : {}
  // Providers with a per-shape view describe the view the shape actually receives.
  const scoped = typeof record.forShape === 'function'
    ? (record.forShape as (shapeId: string) => unknown)('shape')
    : record
  const view = (typeof scoped === 'object' && scoped !== null ? scoped : {}) as Record<string, unknown>
  const methods: string[] = []
  const fields: string[] = []
  for (const [key, value] of Object.entries(view)) {
    if (typeof value === 'function') methods.push(key)
    else fields.push(`${key}:${typeof value}`)
  }
  return { methods: methods.sort(), fields: fields.sort() }
}

/**
 * Mirror the Client capability registry to the Host so shape tools can list it.
 * @param registry - live client registry.
 * @returns nothing.
 */
async function syncCapabilities(registry: ShapeCapabilityRegistry): Promise<void> {
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
  try {
    await fetch('/dsh-shape/api/capabilities', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ capabilities }),
    })
  } catch {
    // The host may not have the mirror route yet; shapes still resolve locally.
  }
}

/**
 * Register shape surfaces and expose the shape capability registry.
 * @param ctx - client root context.
 */
export function apply(ctx: Context): void {
  const capabilities = createShapeCapabilityRegistry()
  ctx.provide('shapeCapabilities', capabilities)
  ctx.effect(() => capabilities.provide({
    plugin: 'dsh-shape',
    capability: 'core',
    version: '1.0.0',
    description: 'Shape ABI metadata provided by the dsh-shape runtime itself.',
    usage: 'Read apiVersion to branch on the shape ABI. Version 1 is the current ABI; no methods are exposed.',
    api: { apiVersion: 1 },
  }), 'dsh-shape: core capability')

  ctx.effect(() => capabilities.provide({
    plugin: 'dsh-shape',
    capability: 'workspace',
    version: '1.0.0',
    description: 'Navigate between DSH workspaces in registry order.',
    usage: 'Call next() or previous() to switch with wrap-around. list() returns { id, title } entries and current() returns the active workspace id or null. Switching opens the target workspace\'s most recent Session, or its blank Session when none exists, then expands and scrolls that workspace group into view in the sidebar.',
    api: createWorkspaceSwitch(ctx),
  }), 'dsh-shape: workspace capability')

  ctx.effect(() => capabilities.provide({
    plugin: 'dsh-shape',
    capability: 'ui',
    version: '1.0.0',
    description: 'Control the DSH surface: navigate Sessions and Workspaces, toggle panels, read and switch the theme, send or cancel turns, show toasts, and open the shape browser.',
    usage: 'openSession(id) and openWorkspace(id) navigate; toggleSidebar() and selectPanel(id|null) move the layout; getTheme() returns { id, preference } and setTheme(id) switches it; send(text) and cancelTurn() act on the scoped Session; notify(text, { tone, timeout }) shows a toast; openShapeBrowser() raises the shape browser. Methods throw when the host lacks the underlying service.',
    api: createUiControl(ctx),
  }), 'dsh-shape: ui capability')

  ctx.effect(() => capabilities.provide({
    plugin: 'dsh-shape',
    capability: 'shortcuts',
    version: '1.0.0',
    description: 'Register DSH keyboard commands that users can rebind, so shape actions appear in the shortcut settings and reference.',
    usage: 'register({ id, label, aliases, keys, run }) registers one command as shape:<shapeId>:<id>; keys is a combination such as "Ctrl+Alt+M" (Ctrl/Alt/Shift/Meta/Mod plus a letter, digit, F-key, or named key), and omitting it leaves the command unbound. list() returns this shape\'s catalog rows with keys, modified, conflicts, and issue. Registration throws on duplicate ids and overlapping defaults.',
    api: createShapeShortcuts(ctx),
  }), 'dsh-shape: shortcuts capability')

  ctx.effect(() => capabilities.provide({
    plugin: 'dsh-shape',
    capability: 'slots',
    version: '1.0.0',
    description: 'Discover the conversation slots this host renders, mount into them, and count the mounts a shape owns.',
    usage: 'list() returns every supported slot with its presentation, whether this host renders it, and how many mounts this shape and all shapes own. mount(slot, render, options) renders into a slot and returns a disposer; options.placement is anchored (default) or floating for conversation.input.overlay, and options.snap defaults to true. entries(slot) returns how many mounts this shape owns in that slot.',
    api: createShapeSlots(ctx),
  }), 'dsh-shape: slots capability')

  ctx.effect(() => capabilities.provide({
    plugin: 'dsh-shape',
    capability: 'events',
    version: '1.0.0',
    description: 'Publish and subscribe to events shared by every running shape.',
    usage: 'emit(type, payload) publishes to every subscriber; on(type, handler) subscribes and returns an unsubscribe function. Names are plain strings namespaced by convention, for example "mcp-manager/servers-changed". Handler failures are contained and logged. A shape\'s subscriptions are released when it is disabled or reloaded.',
    api: createShapeEvents(),
  }), 'dsh-shape: events capability')

  ctx.effect(() => capabilities.provide({
    plugin: 'dsh-shape',
    capability: 'storage',
    version: '1.0.0',
    description: 'Persist JSON values in the shape\'s own data/ directory.',
    usage: 'get(key) returns the stored value or null; set(key, value) writes JSON; remove(key) deletes; keys() lists stored keys. Keys match [a-z0-9][a-z0-9._-]{0,63} and each value is limited to 256 KB. Files live under the shape directory as data/<key>.json; bundled shapes are read-only.',
    api: createShapeStorage(),
  }), 'dsh-shape: storage capability')

  ctx.effect(() => capabilities.provide({
    plugin: 'dsh-shape',
    capability: 'composer',
    version: '1.0.0',
    description: 'Read and write the active composer draft.',
    usage: 'getText() returns the draft, setText(text) replaces it, insert(text) adds text at the caret, submit() sends it, and sessionId() names the attached Session. The API follows the composer currently mounted in the conversation; calls throw when no composer is mounted.',
    api: createComposer(),
  }), 'dsh-shape: composer capability')

  ctx.effect(() => capabilities.provide({
    plugin: 'dsh-shape',
    capability: 'conversation',
    version: '1.0.0',
    description: 'Read the rendered conversation and reveal a message.',
    usage: 'messages() lists the rendered rows with { id, turn, text }; find(text, { caseSensitive, limit }) returns { messageId, index, preview } matches; reveal(messageId) scrolls that row into view; subscribe(listener) reports transcript changes. Only loaded turns are readable — older history appears after the conversation loads it.',
    api: createConversation(),
  }), 'dsh-shape: conversation capability')

  capabilities.subscribe(() => {
    window.dispatchEvent(new CustomEvent('dsh-shape:capabilities'))
    void syncCapabilities(capabilities)
  })
  void syncCapabilities(capabilities)

  const runtime = createShapeRuntime(capabilities)
  ctx.effect(() => runtime.start(), 'dsh-shape: shape client runtime')

  const resolveShape = (requirements: readonly ShapeRequirement[]): ShapeResolution =>
    capabilities.resolve(requirements)

  ctx.slots.inject('conversation.header.leading', () => ctx.slots.register({
    name: 'conversation.header.leading',
    inject: () => ({ resolveShape }),
  }, ShapeButton))
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
        }, ShapeOverlay)
      })
      continue
    }
    ctx.slots.inject(spec.name, () => ctx.slots.register({
      name: spec.name,
      id: `dsh-shape-${spec.name.replaceAll('.', '-')}`,
      order: 20,
      inject: () => ({ resolveShape, slot: spec.name }),
    }, ShapeSlotEntries))
  }

  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'dsh-shape-composer-bridge',
    order: 0,
  }, ShapeComposerBridge))

  // A panel is a floating window in the conversation input overlay: the `main`
  // slot does not commit a shape entry's subtree, so panels render through the
  // slot that already hosts floating mounts.
  const panelWindows = new Map<string, () => void>()
  const closePanelWindow = (id: string): void => {
    const close = panelWindows.get(id)
    if (close === undefined) return
    panelWindows.delete(id)
    close()
  }
  ctx.effect(() => {
    setShapePanelOpener((id) => {
      const panel = shapePanels().find(candidate => candidate.id === id)
      if (panel === undefined) throw new Error(`dsh-shape: no panel "${id}" is registered`)
      closePanelWindow(id)
      try {
        const off = registerShapeMount({
          slot: 'conversation.input.overlay',
          shapeId: id,
          title: panel.title,
          placement: 'floating',
          snap: true,
          render: panel.render,
        })
        panelWindows.set(id, off)
      } catch (cause) {
        recordSurfaceError(`panel ${id}`, cause)
        throw cause
      }
    })
    return () => {
      setShapePanelOpener(() => { throw new Error('dsh-shape: panel opening is unavailable in this host') })
      for (const id of [...panelWindows.keys()]) closePanelWindow(id)
    }
  }, 'dsh-shape: panel opener')

  ctx.effect(() => {
    const sync = (): void => {
      const live = new Set(shapePanels().map(panel => panel.id))
      for (const id of [...panelWindows.keys()]) {
        if (!live.has(id)) closePanelWindow(id)
      }
    }
    sync()
    const off = subscribeShapePanels(sync)
    return () => {
      off()
      for (const id of [...panelWindows.keys()]) closePanelWindow(id)
    }
  }, 'dsh-shape: shape panels')

  ctx.effect(() => {
    setShapeTabOpener((id) => {
      const service = ctx.get('sidebarRight')
      if (service === undefined) throw new Error('dsh-shape: the sidebarRight service is unavailable in this host')
      service.openTab(id)
    })
    return () => { setShapeTabOpener(() => { throw new Error('dsh-shape: tab opening is unavailable in this host') }) }
  }, 'dsh-shape: tab opener')

  const tabSlots = new Map<string, Array<() => void>>()
  const syncTabs = (): void => {
    const live = new Set(shapeTabs().map(tab => tab.id))
    for (const [id, disposers] of tabSlots) {
      if (live.has(id)) continue
      for (const off of disposers) off()
      tabSlots.delete(id)
    }
    for (const tab of shapeTabs()) {
      if (tabSlots.has(tab.id)) continue
      const disposers: Array<() => void> = []
      const registry = ctx.get('sidebarRightTabs')
      if (registry !== undefined) {
        disposers.push(registry.register({ id: tab.id, kind: tab.id, title: () => tab.title }))
      }
      disposers.push(ctx.slots.inject('sidebar.right.pane.tab', () => ctx.slots.register({
        name: 'sidebar.right.pane.tab', key: tab.id,
      }, createTabComponent(tab))))
      disposers.push(ctx.slots.inject('sidebar.right.pane.tab.title', () => ctx.slots.register({
        name: 'sidebar.right.pane.tab.title', key: tab.id,
      }, createTabTitleComponent(tab))))
      tabSlots.set(tab.id, disposers)
    }
  }
  ctx.effect(() => {
    syncTabs()
    const off = subscribeShapeTabs(syncTabs)
    return () => {
      off()
      for (const disposers of tabSlots.values()) {
        for (const dispose of disposers) dispose()
      }
      tabSlots.clear()
    }
  }, 'dsh-shape: shape tabs')
}
