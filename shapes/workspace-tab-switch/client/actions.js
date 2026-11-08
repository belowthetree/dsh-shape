/**
 * DOM-free logic for the workspace switcher, kept here so shape_test can run it
 * without a browser.
 *
 * The switcher is a circular strip: the registry is a list, the current
 * workspace is a position in it, and every Tab press moves one step around it.
 * Everything below is a pure function of (list, currentId, selected), which is
 * what makes the wrap-around edges testable.
 */

export const actions = {
  /**
   * Keep the entries the workspace capability can actually navigate to.
   * @param raw - whatever list() returned.
   * @returns [{ id, title }] in registry order, duplicates dropped.
   */
  normalize(raw) {
    const out = []
    const seen = new Set()
    for (const entry of Array.isArray(raw) ? raw : []) {
      if (entry === null || typeof entry !== 'object') continue
      const id = typeof entry.id === 'string' ? entry.id.trim() : ''
      if (id === '' || seen.has(id)) continue
      seen.add(id)
      const title = typeof entry.title === 'string' && entry.title.trim() !== ''
        ? entry.title.trim()
        : id
      out.push({ id, title })
    }
    return out
  },

  /**
   * Find one workspace by id.
   * @param list - normalized registry.
   * @param id - workspace id, possibly null.
   * @returns its index, or -1 when it is not in the list.
   */
  indexOf(list, id) {
    if (!Array.isArray(list) || typeof id !== 'string') return -1
    return list.findIndex((item) => item.id === id)
  },

  /**
   * Fold any integer into 0..total-1.
   * @param index - possibly negative or past the end.
   * @param total - list length.
   * @returns the wrapped index, 0 for an empty list.
   */
  wrap(index, total) {
    if (!Number.isInteger(total) || total <= 0) return 0
    const at = Number.isFinite(index) ? Math.trunc(index) : 0
    return ((at % total) + total) % total
  },

  /**
   * Signed step count to walk the circle in the shorter direction.
   * @param from - source index.
   * @param to - destination index.
   * @param total - list length.
   * @returns a delta in -(total/2)..total/2.
   */
  shortestDelta(from, to, total) {
    if (!Number.isInteger(total) || total <= 1) return 0
    const start = actions.wrap(from, total)
    const end = actions.wrap(to, total)
    let delta = end - start
    if (delta > total / 2) delta -= total
    if (delta < -total / 2) delta += total
    return delta
  },

  /**
   * Choose the cards the strip shows: a window of span*2+1 entries centred on
   * the selection, or the whole registry when it is short enough to fit.
   * @param total - list length.
   * @param selected - selected index.
   * @param span - neighbours on each side; 2 gives five cards.
   * @returns { items: [{ index, offset }], hidden }.
   */
  strip(total, selected, span = 2) {
    const count = Number.isInteger(total) && total > 0 ? total : 0
    if (count === 0) return { items: [], hidden: 0 }
    const width = Math.max(1, Math.trunc(span) || 2) * 2 + 1
    const at = actions.wrap(selected, count)
    if (count <= width) {
      const items = []
      for (let index = 0; index < count; index += 1) items.push({ index, offset: index - at })
      return { items, hidden: 0 }
    }
    const items = []
    for (let offset = -Math.trunc(width / 2); offset <= Math.trunc(width / 2); offset += 1) {
      items.push({ index: actions.wrap(at + offset, count), offset })
    }
    return { items, hidden: count - width }
  },

  /**
   * A glyph for the window's title bar: one CJK character, otherwise initials.
   * @param title - workspace title.
   * @returns one or two characters.
   */
  monogram(title) {
    const text = typeof title === 'string' ? title.trim() : ''
    if (text === '') return '·'
    if (/[\u3400-\u9fff\uf900-\ufaff\u3040-\u30ff\uac00-\ud7af]/u.test(text[0])) {
      return text.slice(0, 1).toUpperCase()
    }
    const words = text.split(/[\s_\-./\\]+/u).filter((word) => word !== '')
    if (words.length >= 2) return (words[0][0] + words[1][0]).toUpperCase()
    return text.slice(0, 2).toUpperCase()
  },

  /**
   * Stable hue per workspace, so the same workspace keeps its colour.
   * @param seed - workspace id.
   * @returns 0..359.
   */
  accentHue(seed) {
    const text = typeof seed === 'string' ? seed : String(seed ?? '')
    let hash = 0
    for (let index = 0; index < text.length; index += 1) {
      hash = (hash * 31 + text.charCodeAt(index)) % 100003
    }
    return hash % 360
  },

  /**
   * Deterministic skeleton line widths, so each mini window looks different.
   * @param seed - workspace id.
   * @returns three percentages.
   */
  skeletonRows(seed) {
    const text = typeof seed === 'string' ? seed : String(seed ?? '')
    let hash = 7
    for (let index = 0; index < text.length; index += 1) {
      hash = (hash * 17 + text.charCodeAt(index)) % 100003
    }
    return [
      52 + (hash % 32),
      24 + ((hash >> 3) % 22),
      34 + ((hash >> 6) % 28),
    ]
  },

  /**
   * One line describing where a release would land.
   * @param delta - signed step count.
   * @param total - list length.
   * @returns short Chinese label.
   */
  directionText(delta, total) {
    if (total <= 1) return '只有一个工作区'
    if (!Number.isFinite(delta) || delta === 0) return '保持当前工作区'
    const steps = Math.abs(delta)
    return delta > 0 ? `→ 前进 ${steps} 个` : `← 后退 ${steps} 个`
  },

  /**
   * Everything the modal header and the strip need for one render.
   * @param list - normalized registry.
   * @param currentId - active workspace id.
   * @param selected - selected index.
   * @returns titles, position, delta and the direction label.
   */
  describe(list, currentId, selected) {
    const items = Array.isArray(list) ? list : []
    const total = items.length
    const currentIndex = actions.indexOf(items, currentId)
    const at = actions.wrap(selected, total)
    const selectedEntry = total > 0 ? items[at] : null
    const delta = currentIndex < 0 ? 0 : actions.shortestDelta(currentIndex, at, total)
    return {
      total,
      position: total === 0 ? 0 : at + 1,
      currentTitle: currentIndex < 0 ? '' : items[currentIndex].title,
      selectedId: selectedEntry === null ? null : selectedEntry.id,
      selectedTitle: selectedEntry === null ? '' : selectedEntry.title,
      delta,
      same: delta === 0,
      directionText: actions.directionText(delta, total),
    }
  },
}

export const tests = {
  'normalize drops entries without an id and keeps registry order': ({ actions, assert }) => {
    const list = actions.normalize([
      { id: 'a', title: 'Alpha' },
      { title: 'no id' },
      null,
      { id: 'b' },
    ])
    assert.deepEqual(list, [{ id: 'a', title: 'Alpha' }, { id: 'b', title: 'b' }])
  },

  'normalize drops duplicate ids': ({ actions, assert }) => {
    const list = actions.normalize([{ id: 'a', title: 'X' }, { id: 'a', title: 'Y' }])
    assert.deepEqual(list, [{ id: 'a', title: 'X' }])
  },

  'wrap folds indices in both directions': ({ actions, assert }) => {
    assert.equal(actions.wrap(-1, 5), 4)
    assert.equal(actions.wrap(5, 5), 0)
    assert.equal(actions.wrap(7, 5), 2)
    assert.equal(actions.wrap(3, 0), 0)
  },

  'shortestDelta crosses the seam with the shorter step': ({ actions, assert }) => {
    assert.equal(actions.shortestDelta(0, 4, 5), -1)
    assert.equal(actions.shortestDelta(4, 0, 5), 1)
    assert.equal(actions.shortestDelta(1, 3, 5), 2)
    assert.equal(actions.shortestDelta(2, 2, 5), 0)
    assert.equal(actions.shortestDelta(0, 0, 1), 0)
  },

  'strip shows the requested span around the selection': ({ actions, assert }) => {
    const plan = actions.strip(7, 3, 2)
    assert.deepEqual(plan.items.map((item) => item.index), [1, 2, 3, 4, 5])
    assert.deepEqual(plan.items.map((item) => item.offset), [-2, -1, 0, 1, 2])
    assert.equal(plan.hidden, 2)
  },

  'strip wraps at the ends of the registry': ({ actions, assert }) => {
    const plan = actions.strip(7, 0, 2)
    assert.deepEqual(plan.items.map((item) => item.index), [5, 6, 0, 1, 2])
  },

  'strip lists a short registry once': ({ actions, assert }) => {
    const plan = actions.strip(3, 2, 2)
    assert.deepEqual(plan.items.map((item) => item.index), [0, 1, 2])
    assert.equal(plan.hidden, 0)
    assert.equal(actions.strip(0, 0, 2).items.length, 0)
  },

  'monogram prefers one CJK glyph and two initials': ({ actions, assert }) => {
    assert.equal(actions.monogram('设计稿'), '设')
    assert.equal(actions.monogram('dsh-shape'), 'DS')
    assert.equal(actions.monogram('alpha beta'), 'AB')
    assert.equal(actions.monogram('solo'), 'SO')
    assert.equal(actions.monogram('   '), '·')
  },

  'accentHue is stable and inside the wheel': ({ actions, assert }) => {
    const hue = actions.accentHue('workspace-a')
    assert.equal(hue, actions.accentHue('workspace-a'))
    assert.ok(hue >= 0 && hue < 360)
    assert.ok(actions.accentHue('') >= 0 && actions.accentHue('') < 360)
  },

  'skeletonRows returns three usable widths': ({ actions, assert }) => {
    const widths = actions.skeletonRows('workspace-a')
    assert.equal(widths.length, 3)
    for (const width of widths) assert.ok(width >= 20 && width <= 84)
  },

  'describe reports the destination and its offset': ({ actions, assert }) => {
    const list = actions.normalize([
      { id: 'a', title: 'A' },
      { id: 'b', title: 'B' },
      { id: 'c', title: 'C' },
    ])
    const info = actions.describe(list, 'a', 2)
    assert.equal(info.selectedTitle, 'C')
    assert.equal(info.currentTitle, 'A')
    assert.equal(info.position, 3)
    assert.equal(info.delta, -1)
    assert.equal(info.directionText, '← 后退 1 个')
    const same = actions.describe(list, 'b', 1)
    assert.equal(same.delta, 0)
    assert.equal(same.directionText, '保持当前工作区')
  },

  'describe survives an unknown current workspace and an empty list': ({ actions, assert }) => {
    const list = actions.normalize([{ id: 'a', title: 'A' }])
    const info = actions.describe(list, 'missing', 0)
    assert.equal(info.delta, 0)
    assert.equal(info.currentTitle, '')
    assert.equal(info.selectedTitle, 'A')
    const empty = actions.describe([], null, 0)
    assert.equal(empty.total, 0)
    assert.equal(empty.selectedTitle, '')
    assert.equal(empty.position, 0)
  },
}
