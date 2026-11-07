/** Built-in event capability: one shared bus with per-shape subscription cleanup. */

/** Listener signature for one event. */
export type ShapeEventHandler = (payload: unknown) => void

interface Subscription {
  readonly shapeId: string
  readonly handler: ShapeEventHandler
}

const subscriptions = new Map<string, Set<Subscription>>()

/** API passed to shapes that require `dsh-shape#events`. */
export interface ShapeEventsApi {
  /**
   * Publish one event to every subscriber.
   * @param type - event name, namespaced by convention such as `mcp-manager/servers-changed`.
   * @param payload - JSON-friendly value handed to listeners.
   */
  emit(type: string, payload?: unknown): void
  /**
   * Subscribe to one event type.
   * @param type - event name.
   * @param handler - listener; failures are contained and logged.
   * @returns an idempotent unsubscribe function.
   */
  on(type: string, handler: ShapeEventHandler): () => void
}

/** Provider that the runtime scopes to one shape. */
export interface ShapeEventProvider {
  /** Bind the API to one shape so its subscriptions are released with it. */
  forShape(shapeId: string): ShapeEventsApi
}

/**
 * Build the event capability provider.
 * @returns the provider the runtime scopes per shape.
 */
export function createShapeEvents(): ShapeEventProvider {
  return {
    forShape(shapeId) {
      return {
        emit(type, payload) {
          assertType(type)
          for (const subscription of subscriptions.get(type) ?? []) {
            try {
              subscription.handler(payload)
            } catch (cause) {
              console.warn(`dsh-shape: event handler failed (${type})`, cause)
            }
          }
        },
        on(type, handler) {
          assertType(type)
          if (typeof handler !== 'function') throw new Error('dsh-shape#events: handler must be a function')
          const subscription: Subscription = { shapeId, handler }
          let set = subscriptions.get(type)
          if (set === undefined) {
            set = new Set()
            subscriptions.set(type, set)
          }
          set.add(subscription)
          return () => {
            set.delete(subscription)
            if (set.size === 0) subscriptions.delete(type)
          }
        },
      }
    },
  }
}

/**
 * Release every subscription one shape owns.
 * @param shapeId - owning shape.
 */
export function disposeShapeEvents(shapeId: string): void {
  for (const [type, set] of subscriptions) {
    for (const subscription of [...set]) {
      if (subscription.shapeId !== shapeId) continue
      set.delete(subscription)
    }
    if (set.size === 0) subscriptions.delete(type)
  }
}

/**
 * Reject event names that cannot be matched or are unusable as keys.
 * @param type - candidate event name.
 */
function assertType(type: string): void {
  if (typeof type !== 'string' || !/^[a-z0-9][a-z0-9./-]*$/i.test(type) || type.length > 80) {
    throw new Error(`dsh-shape#events: invalid event type: ${String(type)}`)
  }
}
