/** Built-in storage capability: per-shape JSON files under the shape's `data/` directory. */

const ENDPOINT = '/dsh-shape/api/data'

/** API passed to shapes that require `dsh-shape#storage`. */
export interface ShapeStorageApi {
  /**
   * Read one stored value.
   * @param key - storage key.
   * @returns the stored value, or null when absent.
   */
  get<T = unknown>(key: string): Promise<T | null>
  /**
   * Write one JSON value.
   * @param key - storage key.
   * @param value - JSON-serializable value.
   * @returns completion after the file is written.
   */
  set(key: string, value: unknown): Promise<void>
  /**
   * Delete one stored value; missing keys are not an error.
   * @param key - storage key.
   * @returns completion after the file is removed.
   */
  remove(key: string): Promise<void>
  /**
   * List every stored key.
   * @returns sorted keys.
   */
  keys(): Promise<readonly string[]>
}

/** Provider that the runtime scopes to one shape. */
export interface ShapeStorageProvider {
  /** Bind the API to one shape so reads and writes target its own directory. */
  forShape(shapeId: string): ShapeStorageApi
}

/**
 * Build the storage capability provider.
 * @returns the provider the runtime scopes per shape.
 */
export function createShapeStorage(): ShapeStorageProvider {
  return {
    forShape(shapeId) {
      return {
        async get<T = unknown>(key: string): Promise<T | null> {
          const body = await request({ id: shapeId, op: 'get', key })
          return (body.value ?? null) as T | null
        },
        async set(key: string, value: unknown): Promise<void> {
          await request({ id: shapeId, op: 'set', key, value })
        },
        async remove(key: string): Promise<void> {
          await request({ id: shapeId, op: 'remove', key })
        },
        async keys(): Promise<readonly string[]> {
          const body = await request({ id: shapeId, op: 'keys' })
          return body.keys ?? []
        },
      }
    },
  }
}

/**
 * Call the host data endpoint.
 * @param payload - shape id, operation, and arguments.
 * @returns the response body.
 */
async function request(payload: Record<string, unknown>): Promise<{ value?: unknown, keys?: string[] }> {
  const response = await fetch(ENDPOINT, {
    method: 'POST',
    credentials: 'same-origin',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await response.json().catch(() => null) as
    | { ok?: boolean, value?: unknown, keys?: string[], error?: { message?: string } }
    | null
  if (!response.ok || body?.ok !== true) {
    const message = body?.error?.message ?? `request failed (${String(response.status)})`
    throw new Error(`dsh-shape#storage: ${message}`)
  }
  return body
}
