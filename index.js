/**
 * Package entry. The host plugin lives in `src/host/`: discovery in
 * `shapes.js`, HTTP plumbing in `http.js`, storage in `data.js`, persisted
 * state in `state.js`, and the wiring in `plugin.js`.
 * @module @belowthetree/dsh-shape
 */

export { apply, inject, name } from './src/host/plugin.js'
