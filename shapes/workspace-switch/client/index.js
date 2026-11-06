/**
 * Workspace Switch shape.
 *
 * The built-in dsh-shape#workspace capability performs the navigation; this
 * module owns the shortcut bindings and their lifetime.
 */
export function activate(api) {
  const workspace = api.require('dsh-shape', 'workspace')
  const offNext = api.shortcuts.register({
    id: 'workspace.next',
    keys: 'Ctrl+Alt+ArrowRight',
    run: () => workspace.next(),
  })
  const offPrevious = api.shortcuts.register({
    id: 'workspace.previous',
    keys: 'Ctrl+Alt+ArrowLeft',
    run: () => workspace.previous(),
  })
  return () => {
    offNext()
    offPrevious()
  }
}
