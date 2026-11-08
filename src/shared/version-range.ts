/**
 * Semver subset for capability versions.
 *
 * The capability registry needs three things: validate an exact version, accept
 * or reject a range, and test whether a version falls inside a range. Pulling
 * semver's full API into the browser bundle cost ~1300 lines for those three
 * calls, so this file implements exactly them: strict versions, comparators,
 * caret, tilde, x-ranges, hyphen ranges, and `||`. Expansion mirrors semver
 * 7.8.5, including its `includePrerelease` widening of lower bounds, and is
 * pinned by a differential test against that version.
 */

/** One parsed version: the numeric triple plus its prerelease identifiers. */
export interface Version {
  major: number
  minor: number
  patch: number
  prerelease: ReadonlyArray<string | number>
}

/** One bound inside a comparator set. */
interface Comparator {
  operator: '' | '>' | '>=' | '<' | '<='
  version: Version
}

/** A parsed, possibly partial version; `null` parts are wildcards. */
interface PartialVersion {
  major: number | null
  minor: number | null
  patch: number | null
  prerelease: Array<string | number>
  prereleaseText: string
}

/** Largest accepted input, matching semver's own ceiling. */
const MAX_LENGTH = 256
const EXACT = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/
const NUMERIC = /^\d+$/
const WILDCARD = /^(?:x|X|\*)$/

/**
 * Read one numeric part with semver's leading-zero rule.
 * @param text - digits, or undefined when the part was omitted.
 * @returns the number, undefined when absent, or null when malformed.
 */
function numericPart(text: string | undefined): number | undefined | null {
  if (text === undefined) return undefined
  if (!NUMERIC.test(text)) return null
  if (text.length > 1 && text.startsWith('0')) return null
  const value = Number(text)
  return Number.isSafeInteger(value) ? value : null
}

/**
 * Split a prerelease suffix into identifiers.
 * @param text - suffix without the leading dash.
 * @returns identifiers, or null when one is malformed.
 */
function readPrerelease(text: string): Array<string | number> | null {
  const identifiers: Array<string | number> = []
  for (const identifier of text.split('.')) {
    if (identifier.length === 0) return null
    if (NUMERIC.test(identifier)) {
      if (identifier.length > 1 && identifier.startsWith('0')) return null
      identifiers.push(Number(identifier))
    } else {
      identifiers.push(identifier)
    }
  }
  return identifiers
}

/**
 * Parse an exact version.
 * @param text - candidate version text; surrounding space and a `v` prefix are accepted.
 * @returns the version, or null when it is not an exact version.
 */
export function parseVersion(text: unknown): Version | null {
  if (typeof text !== 'string') return null
  const trimmed = text.trim()
  const body = trimmed.startsWith('v') ? trimmed.slice(1) : trimmed
  if (body.length === 0 || body.length > MAX_LENGTH) return null
  const match = EXACT.exec(body)
  if (match === null) return null
  const major = numericPart(match[1])
  const minor = numericPart(match[2])
  const patch = numericPart(match[3])
  if (typeof major !== 'number' || typeof minor !== 'number' || typeof patch !== 'number') return null
  const prereleaseText = match[4] ?? ''
  const prerelease = prereleaseText === '' ? [] : readPrerelease(prereleaseText)
  if (prerelease === null) return null
  return { major, minor, patch, prerelease }
}

/**
 * Parse a possibly partial version, treating `x`, `X`, and `*` as wildcards.
 * @param text - version text such as `1`, `1.2.x`, or `1.2.3-rc.1`.
 * @returns the parsed parts, or null when the text is not a version.
 */
function parseWildcard(text: string): PartialVersion | null {
  const trimmed = text.trim()
  const body = trimmed.startsWith('v') ? trimmed.slice(1) : trimmed
  if (body.length === 0 || body.length > MAX_LENGTH) return null
  const withoutBuild = body.split('+')[0] ?? ''
  const dash = withoutBuild.indexOf('-')
  const core = dash === -1 ? withoutBuild : withoutBuild.slice(0, dash)
  const prereleaseText = dash === -1 ? '' : withoutBuild.slice(dash + 1)
  const segments = core.split('.')
  if (segments.length > 3) return null
  const values: Array<number | null> = []
  let wildcardSeen = false
  for (const segment of segments) {
    if (WILDCARD.test(segment)) {
      wildcardSeen = true
      values.push(null)
      continue
    }
    if (wildcardSeen) return null
    const value = numericPart(segment)
    if (value === null || value === undefined) return null
    values.push(value)
  }
  const prerelease = prereleaseText === '' ? [] : readPrerelease(prereleaseText)
  if (prerelease === null) return null
  return {
    major: values[0] ?? null,
    minor: values[1] ?? null,
    patch: values[2] ?? null,
    prerelease,
    prereleaseText,
  }
}

/**
 * Build a concrete version from a partial one, filling wildcards with zero.
 * @param partial - parsed partial version.
 * @param prerelease - identifiers to attach.
 * @returns a concrete version.
 */
function concrete(partial: PartialVersion, prerelease: ReadonlyArray<string | number>): Version {
  return {
    major: partial.major ?? 0,
    minor: partial.minor ?? 0,
    patch: partial.patch ?? 0,
    prerelease,
  }
}

/**
 * Parse a version that must be exact.
 * @param text - version text.
 * @returns the version.
 */
function exactVersion(text: string): Version {
  const version = parseVersion(text)
  if (version === null) throw new Error(`internal: bad version ${text}`)
  return version
}

/**
 * Parse a comparator bound.
 * @param operator - comparison operator.
 * @param text - version text.
 * @returns the comparator.
 */
function bound(operator: Comparator['operator'], text: string): Comparator {
  return { operator, version: exactVersion(text) }
}

/**
 * Compare two prerelease identifier lists.
 * @param left - left identifiers.
 * @param right - right identifiers.
 * @returns negative, zero, or positive like a sort comparator.
 */
function comparePrerelease(
  left: ReadonlyArray<string | number>,
  right: ReadonlyArray<string | number>,
): number {
  if (left.length === 0 && right.length === 0) return 0
  if (left.length === 0) return 1
  if (right.length === 0) return -1
  const length = Math.min(left.length, right.length)
  for (let index = 0; index < length; index += 1) {
    const a = left[index]
    const b = right[index]
    if (a === b) continue
    const aNumeric = typeof a === 'number'
    const bNumeric = typeof b === 'number'
    if (aNumeric && !bNumeric) return -1
    if (!aNumeric && bNumeric) return 1
    return a < b ? -1 : 1
  }
  return left.length === right.length ? 0 : left.length < right.length ? -1 : 1
}

/**
 * Compare two concrete versions.
 * @param left - left version.
 * @param right - right version.
 * @returns negative when left sorts first, zero when equal.
 */
export function compareVersions(left: Version, right: Version): number {
  if (left.major !== right.major) return left.major < right.major ? -1 : 1
  if (left.minor !== right.minor) return left.minor < right.minor ? -1 : 1
  if (left.patch !== right.patch) return left.patch < right.patch ? -1 : 1
  return comparePrerelease(left.prerelease, right.prerelease)
}

/**
 * Render one version back to text.
 * @param version - version to render.
 * @returns the canonical text.
 */
function format(version: Version): string {
  const core = `${String(version.major)}.${String(version.minor)}.${String(version.patch)}`
  return version.prerelease.length === 0 ? core : `${core}-${version.prerelease.join('.')}`
}

/**
 * Validate an exact version.
 * @param text - candidate version text.
 * @returns the canonical version, or null when invalid.
 */
export function valid(text: unknown): string | null {
  const version = parseVersion(text)
  return version === null ? null : format(version)
}

/**
 * Expand one caret range.
 * @param partial - parsed partial version.
 * @param z - `-0` when prereleases are included, otherwise empty.
 * @returns comparators.
 */
function expandCaret(partial: PartialVersion, z: string): Comparator[] {
  const { major, minor, patch, prerelease, prereleaseText } = partial
  if (major === null) return []
  if (minor === null) {
    return [bound('>=', `${String(major)}.0.0${z}`), bound('<', `${String(major + 1)}.0.0-0`)]
  }
  if (patch === null) {
    const upper = major === 0 ? `${String(major)}.${String(minor + 1)}.0-0` : `${String(major + 1)}.0.0-0`
    return [bound('>=', `${String(major)}.${String(minor)}.0${z}`), bound('<', upper)]
  }
  const pre = prereleaseText === '' ? '' : `-${prereleaseText}`
  const upper = major === 0
    ? (minor === 0 ? `${String(major)}.${String(minor)}.${String(patch + 1)}-0` : `${String(major)}.${String(minor + 1)}.0-0`)
    : `${String(major + 1)}.0.0-0`
  return [bound('>=', `${String(major)}.${String(minor)}.${String(patch)}${pre}`), bound('<', upper)]
}

/**
 * Expand one tilde range.
 * @param partial - parsed partial version.
 * @param z - `-0` when prereleases are included, otherwise empty.
 * @returns comparators.
 */
function expandTilde(partial: PartialVersion, z: string): Comparator[] {
  const { major, minor, patch, prereleaseText } = partial
  if (major === null) return []
  if (minor === null) {
    return [bound('>=', `${String(major)}.0.0${z}`), bound('<', `${String(major + 1)}.0.0-0`)]
  }
  if (patch === null) {
    return [bound('>=', `${String(major)}.${String(minor)}.0${z}`), bound('<', `${String(major)}.${String(minor + 1)}.0-0`)]
  }
  const pre = prereleaseText === '' ? '' : `-${prereleaseText}`
  return [
    bound('>=', `${String(major)}.${String(minor)}.${String(patch)}${pre}`),
    bound('<', `${String(major)}.${String(minor + 1)}.0-0`),
  ]
}

/**
 * Expand one x-range or plain comparator.
 * @param operator - comparison operator, possibly empty.
 * @param partial - parsed partial version.
 * @param includePrerelease - whether lower bounds widen to `-0`.
 * @returns comparators.
 */
function expandXRange(
  operator: Comparator['operator'] | '=' | '^' | '~',
  partial: PartialVersion,
  includePrerelease: boolean,
): Comparator[] {
  const { major, minor, patch, prereleaseText } = partial
  const wildMinor = major === null || minor === null
  const wildPatch = wildMinor || patch === null
  let op = operator === '=' && wildPatch ? '' : operator
  const pr = includePrerelease ? '-0' : ''

  if (major === null) {
    return op === '>' || op === '<' ? [bound('<', '0.0.0-0')] : []
  }

  if (op !== '' && op !== '=' && wildPatch) {
    let nextMajor = major
    let nextMinor = minor ?? 0
    if (op === '>') {
      if (wildMinor) {
        nextMajor = major + 1
        nextMinor = 0
      } else {
        nextMinor += 1
      }
      return [bound('>=', `${String(nextMajor)}.${String(nextMinor)}.0${pr}`)]
    }
    if (op === '<=') {
      if (wildMinor) nextMajor = major + 1
      else nextMinor += 1
      return [bound('<', `${String(nextMajor)}.${String(nextMinor)}.0-0`)]
    }
    if (op === '>=') {
      return [bound('>=', `${String(major)}.${String(nextMinor)}.0${pr}`)]
    }
    return [bound('<', `${String(major)}.${String(nextMinor)}.0-0`)]
  }

  if (wildMinor) {
    return [bound('>=', `${String(major)}.0.0${pr}`), bound('<', `${String(major + 1)}.0.0-0`)]
  }
  if (wildPatch) {
    return [bound('>=', `${String(major)}.${String(minor)}.0${pr}`), bound('<', `${String(major)}.${String(minor + 1)}.0-0`)]
  }

  const pre = prereleaseText === '' ? '' : `-${prereleaseText}`
  const equality = (op === '=' ? '' : op) as Comparator['operator']
  return [{ operator: equality, version: exactVersion(`${String(major)}.${String(minor)}.${String(patch)}${pre}`) }]
}

/**
 * Expand one comparator token.
 * @param token - token such as `>=1.2.3`, `1.2.x`, `^1.2.3`, or `~1.2`.
 * @param includePrerelease - whether lower bounds widen to `-0`.
 * @returns comparators, or null when the token is malformed.
 */
function expandToken(token: string, includePrerelease: boolean): Comparator[] | null {
  if (token === '' || WILDCARD.test(token)) return []
  const match = /^(>=|<=|>|<|=|\^|~)?(.*)$/.exec(token)
  if (match === null) return null
  const operator = (match[1] ?? '') as '' | '>' | '>=' | '<' | '<=' | '=' | '^' | '~'
  const body = match[2] ?? ''
  const partial = parseWildcard(body)
  if (partial === null) return null
  const z = includePrerelease ? '-0' : ''
  if (operator === '^') return expandCaret(partial, z)
  if (operator === '~') return expandTilde(partial, z)
  return expandXRange(operator, partial, includePrerelease)
}

/**
 * Expand one hyphen range.
 * @param text - set text containing `A - B`.
 * @param includePrerelease - whether lower bounds widen to `-0`.
 * @returns comparators, or null when malformed.
 */
function expandHyphen(text: string, includePrerelease: boolean): Comparator[] | null {
  const match = /^(\S+)\s+-\s+(\S+)$/.exec(text.trim())
  if (match === null) return null
  const from = parseWildcard(match[1] ?? '')
  const to = parseWildcard(match[2] ?? '')
  if (from === null || to === null) return null
  const comparators: Comparator[] = []
  if (from.major !== null) {
    const lower = concrete(from, from.prerelease)
    comparators.push({
      operator: '>=',
      version: { ...lower, prerelease: from.prerelease.length > 0 ? from.prerelease : (includePrerelease ? [0] : []) },
    })
  }
  if (to.major !== null) {
    if (to.minor === null) {
      comparators.push(bound('<', `${String(to.major + 1)}.0.0-0`))
    } else if (to.patch === null) {
      comparators.push(bound('<', `${String(to.major)}.${String(to.minor + 1)}.0-0`))
    } else if (to.prerelease.length > 0) {
      comparators.push({ operator: '<=', version: concrete(to, to.prerelease) })
    } else if (includePrerelease) {
      comparators.push(bound('<', `${String(to.major)}.${String(to.minor)}.${String(to.patch + 1)}-0`))
    } else {
      comparators.push({ operator: '<=', version: concrete(to, []) })
    }
  }
  return comparators
}

/**
 * Normalize operator spacing and the `~>` alias.
 * @param text - raw range text.
 * @returns range text with tight operators.
 */
function normalizeOperators(text: string): string {
  return text
    .trim()
    .replace(/~>/g, '~')
    .replace(/(>=|<=|>|<|=|\^|~)\s+/g, '$1')
}

/**
 * Parse one comparator set.
 * @param text - set text such as `>=1.0.0 <2.0.0`.
 * @param includePrerelease - whether lower bounds widen to `-0`.
 * @returns comparators, or null when the set is malformed.
 */
function parseSet(text: string, includePrerelease: boolean): Comparator[] | null {
  const normalized = normalizeOperators(text)
  if (normalized === '') return []
  if (/\s-\s/.test(normalized)) return expandHyphen(normalized, includePrerelease)
  const comparators: Comparator[] = []
  for (const token of normalized.split(/\s+/)) {
    if (token === '') continue
    const expanded = expandToken(token, includePrerelease)
    if (expanded === null) return null
    for (const comparator of expanded) {
      if (comparator.operator === '>=' && comparator.version.prerelease.length === 0
        && comparator.version.major === 0 && comparator.version.minor === 0 && comparator.version.patch === 0) {
        continue
      }
      comparators.push(comparator)
    }
  }
  return comparators
}

/**
 * Parse a range into comparator sets.
 * @param text - range text.
 * @param includePrerelease - whether lower bounds widen to `-0`.
 * @returns comparator sets, or null when the range is invalid.
 */
export function parseRange(text: unknown, includePrerelease = false): Comparator[][] | null {
  if (typeof text !== 'string' || text.length > MAX_LENGTH) return null
  const sets: Comparator[][] = []
  for (const piece of text.split('||')) {
    const parsed = parseSet(piece, includePrerelease)
    if (parsed === null) return null
    sets.push(parsed)
  }
  return sets
}

/**
 * Test one comparator set against a version.
 * @param set - comparators that must all pass.
 * @param version - candidate version.
 * @param includePrerelease - whether prereleases are admitted freely.
 * @returns true when every comparator passes and the prerelease rule holds.
 */
function testSet(set: Comparator[], version: Version, includePrerelease: boolean): boolean {
  for (const comparator of set) {
    const order = compareVersions(version, comparator.version)
    const pass = comparator.operator === '' ? order === 0
      : comparator.operator === '>' ? order > 0
        : comparator.operator === '>=' ? order >= 0
          : comparator.operator === '<' ? order < 0
            : order <= 0
    if (!pass) return false
  }
  if (version.prerelease.length > 0 && !includePrerelease) {
    for (const comparator of set) {
      if (comparator.version.prerelease.length === 0) continue
      const allowed = comparator.version
      if (allowed.major === version.major && allowed.minor === version.minor && allowed.patch === version.patch) {
        return true
      }
    }
    return false
  }
  return true
}

/**
 * Check whether a version is inside a range.
 * @param versionText - candidate version.
 * @param rangeText - semver range.
 * @param options - `includePrerelease` admits prereleases without a matching opt-in.
 * @returns true when the version satisfies the range.
 */
export function satisfies(
  versionText: unknown,
  rangeText: unknown,
  options: { includePrerelease?: boolean } = {},
): boolean {
  const version = parseVersion(versionText)
  if (version === null) return false
  const includePrerelease = options.includePrerelease === true
  const sets = parseRange(rangeText, includePrerelease)
  if (sets === null) return false
  for (const set of sets) {
    if (testSet(set, version, includePrerelease)) return true
  }
  return false
}

/**
 * Validate a range.
 * @param text - candidate range text.
 * @returns the range text when valid, otherwise null.
 */
export function validRange(text: unknown): string | null {
  return parseRange(text) === null ? null : String(text)
}
