/**
 * Example shape tool. The first dsh-shape version discovers this module but
 * does not execute it yet.
 * @param {{ name?: string }} input
 * @returns {string}
 */
export function greet(input) {
  return `Hello, ${input.name ?? 'world'}!`
}
