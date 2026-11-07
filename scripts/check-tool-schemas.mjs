// Validate the JSON Schema of every tool this package registers.
//
// DSH accepts a small JSON Schema subset and rejects anything else when a
// preset mounts the tool row; a rejected row marks the whole preset unusable.
// This check mirrors that subset so an unsupported keyword fails here instead
// of in a user's preset picker.
//
// Usage: node scripts/check-tool-schemas.mjs [path/to/tools.js]
import { fileURLToPath, pathToFileURL } from 'node:url'
import path from 'node:path'

const toolsPath = process.argv[2] ?? path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'tools.js')

const TYPES = new Set(['object', 'array', 'string', 'number', 'integer', 'boolean', 'null'])
const CONSTRAINTS = new Set(['type', 'oneOf', 'properties', 'required', 'additionalProperties', 'items', 'enum', 'const'])
const ANNOTATIONS = new Set(['description', 'title', 'default', 'examples'])
const OBJECT_ONLY = ['properties', 'required', 'additionalProperties']
const ARRAY_ONLY = ['items']
const SCALARS = new Set(['string', 'number', 'integer', 'boolean', 'null'])
const ONE_OF_SIBLINGS = [...OBJECT_ONLY, ...ARRAY_ONLY, 'enum', 'const']

/** Whether a value is a plain JSON record. */
function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

/** Whether a value is lossless JSON data. */
function isJsonValue(value, seen = new Set()) {
  if (value === null) return true
  const kind = typeof value
  if (kind === 'string' || kind === 'boolean') return true
  if (kind === 'number') return Number.isFinite(value) && !Object.is(value, -0)
  if (kind !== 'object') return false
  if (seen.has(value)) return false
  seen.add(value)
  if (Array.isArray(value)) {
    const ok = Reflect.ownKeys(value).length === value.length + 1
      && value.every((entry, index) => Object.hasOwn(value, index) && isJsonValue(entry, seen))
    seen.delete(value)
    return ok
  }
  const prototype = Object.getPrototypeOf(value)
  if (prototype !== null && Object.getPrototypeOf(prototype) !== null) {
    seen.delete(value)
    return false
  }
  const ok = Reflect.ownKeys(value).every(key => typeof key === 'string' && isJsonValue(value[key], seen))
  seen.delete(value)
  return ok
}

/** Whether a scalar matches one declared type. */
function scalarMatches(type, value) {
  switch (type) {
    case 'string': return typeof value === 'string'
    case 'number': return typeof value === 'number' && Number.isFinite(value) && !Object.is(value, -0)
    case 'integer': return Number.isInteger(value)
    case 'boolean': return typeof value === 'boolean'
    case 'null': return value === null
    default: return false
  }
}

/**
 * Collect every violation in one schema tree.
 * @param root - schema value.
 * @param rootPath - diagnostic prefix.
 * @returns violation strings.
 */
function checkSchema(root, rootPath) {
  const violations = []
  const walk = (node, where) => {
    if (!isRecord(node)) {
      violations.push(`${where} must be a schema object`)
      return
    }
    for (const key of Object.keys(node)) {
      if (CONSTRAINTS.has(key)) continue
      if (ANNOTATIONS.has(key)) {
        if ((key === 'description' || key === 'title') && typeof node[key] !== 'string') {
          violations.push(`${where}.${key} must be a string`)
        }
        if ((key === 'default' || key === 'examples') && !isJsonValue(node[key])) {
          violations.push(`${where}.${key} annotation must be lossless JSON data`)
        }
        continue
      }
      violations.push(`${where}.${key} is not a supported keyword (subset: type/oneOf/properties/required/additionalProperties/items/enum/const + annotations)`)
    }
    const hasType = Object.hasOwn(node, 'type')
    const hasOneOf = Object.hasOwn(node, 'oneOf')
    if (hasType && hasOneOf) {
      violations.push(`${where} cannot declare both type and oneOf`)
      return
    }
    if (!hasType && !hasOneOf) {
      for (const key of ONE_OF_SIBLINGS) {
        if (Object.hasOwn(node, key)) violations.push(`${where}.${key} requires type or oneOf`)
      }
      return
    }
    if (hasOneOf) {
      const branches = node.oneOf
      if (!Array.isArray(branches) || branches.length < 2) {
        violations.push(`${where}.oneOf must be an array of at least two schemas`)
      } else {
        branches.forEach((branch, index) => walk(branch, `${where}.oneOf[${index}]`))
      }
      for (const key of ONE_OF_SIBLINGS) {
        if (Object.hasOwn(node, key)) violations.push(`${where}.${key} is not supported beside oneOf`)
      }
      return
    }
    const type = node.type
    if (typeof type !== 'string' || !TYPES.has(type)) {
      violations.push(`${where}.type must be a single type string (one of ${[...TYPES].join('/')}); type arrays are not supported`)
      return
    }
    if (type !== 'object') {
      for (const key of OBJECT_ONLY) {
        if (Object.hasOwn(node, key)) violations.push(`${where}.${key} requires type "object"`)
      }
    }
    if (type !== 'array') {
      for (const key of ARRAY_ONLY) {
        if (Object.hasOwn(node, key)) violations.push(`${where}.${key} requires type "array"`)
      }
    }
    if (isRecord(node.properties)) {
      for (const [name, child] of Object.entries(node.properties)) walk(child, `${where}.properties.${name}`)
    } else if (Object.hasOwn(node, 'properties')) {
      violations.push(`${where}.properties must be a schema object map`)
    }
    if (Object.hasOwn(node, 'required')) {
      const required = node.required
      if (!Array.isArray(required) || required.some(entry => typeof entry !== 'string')) {
        violations.push(`${where}.required must be an array of strings`)
      } else if (isRecord(node.properties)) {
        for (const name of required) {
          if (!Object.hasOwn(node.properties, name)) violations.push(`${where}.required names "${name}" which is not in properties`)
        }
      }
    }
    if (Object.hasOwn(node, 'additionalProperties') && typeof node.additionalProperties !== 'boolean') {
      violations.push(`${where}.additionalProperties must be a boolean`)
    }
    if (Object.hasOwn(node, 'items')) walk(node.items, `${where}.items`)
    if (Object.hasOwn(node, 'enum')) {
      if (!SCALARS.has(type)) violations.push(`${where}.enum requires a scalar type`)
      if (!Array.isArray(node.enum) || node.enum.length === 0) {
        violations.push(`${where}.enum must be a non-empty array`)
      } else {
        for (const entry of node.enum) {
          if (!SCALARS.has(type) || !scalarMatches(type, entry)) violations.push(`${where}.enum value ${JSON.stringify(entry)} does not match type "${type}"`)
        }
      }
    }
    if (Object.hasOwn(node, 'const')) {
      if (!SCALARS.has(type)) violations.push(`${where}.const requires a scalar type`)
      else if (!scalarMatches(type, node.const)) violations.push(`${where}.const value does not match type "${type}"`)
    }
  }
  walk(root, rootPath)
  return violations
}

const registered = []
const ctx = {
  effect: (callback) => { const off = callback(); return typeof off === 'function' ? off : () => {} },
  tools: { register: (tool) => { registered.push(tool); return () => {} } },
  get: () => undefined,
  on: () => () => {},
}
const module = await import(pathToFileURL(path.resolve(toolsPath)).href)
module.apply(ctx, {})

const problems = []
for (const tool of registered) {
  for (const [field, schema] of [['parameters', tool.parameters], ['output.schema', tool.output?.schema]]) {
    if (schema === undefined) continue
    for (const violation of checkSchema(schema, `${tool.name}.${field}`)) problems.push(violation)
  }
}

if (problems.length > 0) {
  console.error(`unsupported JSON schema in ${String(problems.length)} place(s):`)
  for (const problem of problems) console.error(`  ${problem}`)
  process.exit(1)
}
console.log(`tool schemas OK: ${String(registered.length)} tools`)
