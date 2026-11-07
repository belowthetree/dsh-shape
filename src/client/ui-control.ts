/** Built-in UI control capability: navigation, panels, theme, conversation actions, and toasts. */

import type { Context } from '@deepseek-ai/cordis'
import type {} from '@deepseek-ai/dsh-client-ui-conversation/client'
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-theme/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import { requestShapeBrowser } from './shape-browser.ts'
import { disposeToasts, showToast, type ShapeToastOptions } from './toast.ts'

/** Active theme identity exposed to shapes. */
export interface ShapeThemeInfo {
  /** Concrete theme id currently applied. */
  id: string
  /** Persisted preference, which may be `system`. */
  preference: string
}

/** API passed to shapes that require `dsh-shape#ui`. */
export interface ShapeUiApi {
  /** Open a Session by id in the Conversation. */
  openSession(id: string): void
  /** Connect a Workspace and open its Session. */
  openWorkspace(id: string): Promise<void>
  /** Toggle the sidebar panel. */
  toggleSidebar(): void
  /** Select a global main panel, or `null` to return to the Conversation. */
  selectPanel(id: string | null): void
  /** Read the active theme id and preference. */
  getTheme(): ShapeThemeInfo
  /** Switch the active theme by id. */
  setTheme(id: string): void
  /** Send a prompt into the scoped Session. */
  send(text: string): Promise<void>
  /** Cancel the scoped Session's in-flight turn. */
  cancelTurn(): Promise<void>
  /** Show a transient notification above the application surface. */
  notify(text: string, options?: ShapeToastOptions): void
  /** Open the shape browser. */
  openShapeBrowser(): void
}

type SessionTarget = Parameters<Context['uiWorkspace']['openSession']>[0]
type WorkspaceTarget = Parameters<Context['uiWorkspace']['openWorkspace']>[0]
type PanelTarget = Parameters<Context['layout']['selectPanel']>[0]

/**
 * Build the UI control capability.
 * @param ctx - Client context with layout, theme, conversation, and workspace services.
 * @returns the capability API.
 */
export function createUiControl(ctx: Context): ShapeUiApi {
  ctx.effect(() => () => { disposeToasts() }, 'dsh-shape: toast layer')

  const layout = () => ctx.get('layout')
  const theme = () => ctx.get('theme')
  const conversation = () => ctx.get('conversation')

  const requireLayout = () => {
    const service = layout()
    if (service === undefined) throw unavailable('layout')
    return service
  }
  const requireTheme = () => {
    const service = theme()
    if (service === undefined) throw unavailable('theme')
    return service
  }
  const requireConversation = () => {
    const service = conversation()
    if (service === undefined) throw unavailable('conversation')
    return service
  }

  return {
    openSession(id) {
      ctx.uiWorkspace.openSession(id as SessionTarget)
    },
    openWorkspace(id) {
      return ctx.uiWorkspace.openWorkspace(id as WorkspaceTarget)
    },
    toggleSidebar() {
      requireLayout().toggleSidebar()
    },
    selectPanel(id) {
      requireLayout().selectPanel(id as PanelTarget)
    },
    getTheme() {
      const snapshot = requireTheme().getTheme()
      return { id: snapshot.active.id, preference: snapshot.preference }
    },
    setTheme(id) {
      requireTheme().setTheme(id)
    },
    send(text) {
      return requireConversation().send(text)
    },
    cancelTurn() {
      return requireConversation().cancel()
    },
    notify(text, options) {
      showToast(text, options)
    },
    openShapeBrowser() {
      requestShapeBrowser()
    },
  }
}

/**
 * Build the error raised when a host lacks the service behind one method.
 * @param service - missing Client service name.
 * @returns the error to throw.
 */
function unavailable(service: string): Error {
  return new Error(`dsh-shape#ui: the ${service} service is unavailable in this host`)
}
