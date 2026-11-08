/**
 * Re-export of the shared logic for `shape_test`.
 *
 * The implementation lives in `client/actions.js` because the browser loads the
 * client module from `/dsh-shape/client/<id>/…`; a relative import of `../actions.js`
 * resolves to `/dsh-shape/client/actions.js`, which the host does not serve.
 */

export { actions, tests } from './client/actions.js'
