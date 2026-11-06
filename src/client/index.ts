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
} from '../capabilities.ts'
import { ShapeChatCards } from './ShapeChatCards.tsx'
import { ShapeButton } from './ShapeButton.tsx'
import { createShapeRuntime } from './shape-runtime.ts'
import { createWorkspaceSwitch } from './workspace.ts'

/** The leading header seat and composer dock are owned by the conversation client. */
export const inject = ['slots', 'workspaces', 'sessions', 'uiWorkspace']

/**
 * Describe one capability API without serializing its values.
 * @param api - provider API object.
 * @returns method names and typed field names.
 */
function describeApi(api: unknown): { methods: string[], fields: string[] } {
  const record = typeof api === 'object' && api !== null ? api as Record<string, unknown> : {}
  const methods: string[] = []
  const fields: string[] = []
  for (const [key, value] of Object.entries(record)) {
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
    usage: 'Call next() or previous() to switch with wrap-around. list() returns { id, title } entries and current() returns the active workspace id or null. Switching opens the target workspace\'s most recent Session, or its blank Session when none exists.',
    api: createWorkspaceSwitch(ctx),
  }), 'dsh-shape: workspace capability')

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
  ctx.slots.inject('conversation.input.dock', () => ctx.slots.register({
    name: 'conversation.input.dock',
    id: 'dsh-shape-chat-cards',
    order: 20,
    inject: () => ({ resolveShape }),
  }, ShapeChatCards))
}
