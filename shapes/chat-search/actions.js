/** DOM-free actions and their tests; run them with shape_test. */

export const actions = {
  /**
   * Return its input unchanged.
   * @param input - caller-provided value.
   * @returns the same value.
   */
  echo(input) {
    return input
  },
}

export const tests = {
  'echo returns its input': ({ actions, assert }) => {
    assert.equal(actions.echo('ok'), 'ok')
  },
}
