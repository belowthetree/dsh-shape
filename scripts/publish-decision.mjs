// Decide whether the checked-out version still needs publishing.
//
// Reads `PKG_NAME` / `PKG_VERSION`, asks the registry for published versions, and
// writes `state=new|exists|older` to `$GITHUB_OUTPUT`. Exits 1 for `older` so a
// stale checkout cannot move the `latest` dist-tag backwards.
import { get as httpGet } from 'node:http'
import { get as httpsGet } from 'node:https'
import { appendFileSync } from 'node:fs'

const name = process.env.PKG_NAME
const version = process.env.PKG_VERSION
if (!name || !version) throw new Error('PKG_NAME and PKG_VERSION are required')

const published = await readPublishedVersions(name)
const state = decide(published, version)

if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `state=${state}\n`)
console.log(`local=${version} published=${published.join(',') || '(none)'} -> ${state}`)

if (state === 'older') {
  console.error(`::error::${name}@${version} is not newer than ${published.at(-1)}; bump the version`)
  process.exitCode = 1
}

/**
 * Read every published version of a package from the registry.
 * @param pkg - package name.
 * @returns published versions; empty when the package does not exist yet.
 */
async function readPublishedVersions(pkg) {
  const registry = (
    process.env.NPM_REGISTRY ?? process.env.npm_config_registry ?? 'https://registry.npmjs.org'
  ).replace(/\/+$/, '')
  const metadata = await requestJson(`${registry}/${encodeURIComponent(pkg)}`)
  if (metadata === null) return [] // never published
  return Object.keys(metadata.versions ?? {})
}

/**
 * Fetch JSON over HTTP(S) with a fresh connection, so the process can exit at once.
 * @param url - absolute URL.
 * @returns parsed body, or null for 404.
 */
function requestJson(url) {
  const send = url.startsWith('https:') ? httpsGet : httpGet
  return new Promise((resolve, reject) => {
    const request = send(
      url,
      { agent: false, headers: { accept: 'application/vnd.npm.install-v1+json' } },
      (response) => {
        if (response.statusCode === 404) {
          response.resume()
          resolve(null)
          return
        }
        if (response.statusCode !== 200) {
          response.resume()
          reject(new Error(`${url} responded ${String(response.statusCode)}`))
          return
        }
        let body = ''
        response.setEncoding('utf8')
        response.on('data', (chunk) => { body += chunk })
        response.on('end', () => {
          try {
            resolve(JSON.parse(body))
          } catch (cause) {
            reject(cause instanceof Error ? cause : new Error(String(cause)))
          }
        })
      },
    )
    request.on('error', reject)
  })
}

/**
 * Classify the local version against the registry.
 * @param versions - published versions.
 * @param local - version from package.json.
 * @returns `exists` when already published, `older` when behind the newest, else `new`.
 */
function decide(versions, local) {
  if (versions.includes(local)) return 'exists'
  const latest = [...versions].sort(compare).at(-1)
  if (latest === undefined) return 'new'
  return compare(local, latest) > 0 ? 'new' : 'older'
}

/**
 * Compare two semver versions, including prerelease ordering.
 * @param a - left version.
 * @param b - right version.
 * @returns negative when a < b, positive when a > b, zero when equal.
 */
function compare(a, b) {
  const left = parse(a)
  const right = parse(b)
  for (const key of ['major', 'minor', 'patch']) {
    if (left[key] !== right[key]) return left[key] < right[key] ? -1 : 1
  }
  return comparePrerelease(left.pre, right.pre)
}

/**
 * Split a version into numeric core and prerelease parts.
 * @param version - semver string.
 * @returns parsed parts.
 */
function parse(version) {
  const dash = version.indexOf('-')
  const core = dash === -1 ? version : version.slice(0, dash)
  const pre = dash === -1 ? '' : version.slice(dash + 1)
  const [major, minor, patch] = core.split('.').map(Number)
  return { major, minor, patch, pre }
}

/**
 * Compare prerelease identifiers; an empty prerelease sorts after any identifier.
 * @param a - left prerelease.
 * @param b - right prerelease.
 * @returns comparison result.
 */
function comparePrerelease(a, b) {
  if (a === b) return 0
  if (a === '') return 1
  if (b === '') return -1
  const left = a.split('.')
  const right = b.split('.')
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const x = left[index]
    const y = right[index]
    if (x === undefined) return -1
    if (y === undefined) return 1
    const numericX = /^\d+$/.test(x)
    const numericY = /^\d+$/.test(y)
    if (numericX && numericY) {
      if (Number(x) !== Number(y)) return Number(x) < Number(y) ? -1 : 1
      continue
    }
    if (numericX !== numericY) return numericX ? -1 : 1
    if (x !== y) return x < y ? -1 : 1
  }
  return 0
}
