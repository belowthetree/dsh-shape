/** Open-request bridge so capabilities can raise the shape browser. */

const browserListeners = new Set<() => void>()

/**
 * Ask the mounted shape browser to open.
 */
export function requestShapeBrowser(): void {
  for (const listener of browserListeners) listener()
}

/**
 * Observe open requests.
 * @param listener - invoked for every request.
 * @returns an unsubscribe function.
 */
export function subscribeShapeBrowser(listener: () => void): () => void {
  browserListeners.add(listener)
  return () => { browserListeners.delete(listener) }
}
