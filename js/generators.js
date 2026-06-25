// The six entity generators + a shared batch context that keeps generated
// values unique within a run. Pure module (Date is fine; no DOM).

import * as P from './data.js'
import { HTML_KIND, AVATAR_KIND } from './constants.js'
import { createNameGenerator, chineseName } from './names.js'
import { cap, words, sentence, paras, descText, titleText, richMessage } from './text.js'

const GENDERS = ['male', 'female']
const DURATIONS = [60, 90, 120]
const PACK_SIZES = [4, 8, 10, 12, 20]
const EMAIL_DOMAIN = '@mailinator.com'
const DEV_MARKER = '[DEV]' // marks test records; a SUFFIX so the real name stays the leading sort key
const UNIQUE_ATTEMPTS = 50
const DAYS_PER_YEAR = 365

// --- field helpers ---
const pad2 = (n) => String(n).padStart(2, '0')
const fmtDate = (d) => `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`
const dayMs = 86400000

const birthDate = (rng, minAge, maxAge) =>
  new Date(Date.now() - rng.randInt(minAge, maxAge) * DAYS_PER_YEAR * dayMs - rng.randInt(0, 364) * dayMs)

const dob = (rng, minAge, maxAge) => fmtDate(birthDate(rng, minAge, maxAge))

const cleanToken = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '')
const withDevSuffix = (name) => `${name} ${DEV_MARKER}`

// firstname.lastword@ — memorable + name-related; a running number is appended only on collision.
function memorableEmail(ctx, first, last) {
  const firstTok = cleanToken(first.split(' ')[0])
  const lastTok = cleanToken(last.split(' ').pop())
  const handle = [firstTok, lastTok].filter(Boolean).join('.') || 'parent'
  return `${handle}${ctx.sequence(handle)}${EMAIL_DOMAIN}`
}

const sgMobile = (rng) => {
  const digits = rng.pick(['8', '9']) + String(rng.randInt(1000000, 9999999))
  return `${digits.slice(0, 4)} ${digits.slice(4)}`
}

const slug = (s) =>
  s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function addressText(rng, len) {
  const base = `${rng.randInt(1, 200)} ${rng.pick(P.STREET)}`
  if (len === 'normal') return base
  const unit = `#${rng.randInt(1, 30)}-${rng.randInt(100, 999)}`
  if (len === 'long') return `${base}, ${unit}, ${rng.pick(P.BUILDINGS)}`
  return `${base}, ${unit}, ${rng.pick(P.BUILDINGS)}, ${cap(words(rng, 4))}, Singapore ${rng.randInt(100000, 999999)}`
}

function allergiesText(rng, len) {
  if (len === 'normal') return rng.chance(0.4) ? rng.pick(P.ALLERGIES) : 'None'
  const set = rng.sample(P.ALLERGIES, rng.randInt(2, 3))
  if (len === 'long') return set.join(', ')
  return `${set.join(', ')}. ${sentence(rng, 12, 18)}`
}

function courseName(ctx) {
  return ctx.unique('courseName', () => {
    const base = `${ctx.rng.pick(P.SUBJECTS)} ${ctx.rng.pick(P.LEVELS)}`
    if (ctx.len === 'normal') return base
    if (ctx.len === 'long') return `${base}: ${cap(words(ctx.rng, ctx.rng.randInt(4, 6)))}`
    return `${base}: ${cap(words(ctx.rng, ctx.rng.randInt(9, 14)))} (${cap(words(ctx.rng, 3))})`
  })
}

function productName(ctx) {
  return ctx.unique('productName', () => {
    const base = `${ctx.rng.pick(P.SUBJECTS)} ${ctx.rng.pick(P.PRODUCT_BASE)}`
    if (ctx.len === 'normal') return base
    if (ctx.len === 'long') return `${ctx.rng.pick(PACK_SIZES)}-Session ${base}: ${cap(words(ctx.rng, ctx.rng.randInt(3, 5)))}`
    return `${ctx.rng.pick(PACK_SIZES)}-Session ${base}: ${cap(words(ctx.rng, ctx.rng.randInt(9, 14)))} (${cap(words(ctx.rng, 3))})`
  })
}

// --- class field helpers ---
function classTime(rng) {
  const hour = rng.randInt(9, 18)
  const h12 = ((hour + 11) % 12) + 1
  return `${h12}:00${hour < 12 ? 'am' : 'pm'}`
}

function className(ctx) {
  return ctx.unique('className', () => {
    const base = `${ctx.rng.pick(P.GRADES)} ${ctx.rng.pick(P.SUBJECTS)} · ${ctx.rng.pick(P.CLASS_DAYS)} ${classTime(ctx.rng)}`
    if (ctx.len === 'normal') return base
    if (ctx.len === 'long') return `${base} (${cap(words(ctx.rng, ctx.rng.randInt(3, 5)))})`
    return `${base} (${cap(words(ctx.rng, ctx.rng.randInt(9, 14)))})`
  })
}

// Teachers are real people — reuse the batch-unique name engine so no teacher repeats across the run.
function teacherList(ctx, n) {
  return Array.from({ length: n }, () => ctx.nameGen.next(ctx.rng.pick(GENDERS), 'normal').full).join(', ')
}

function courseList(ctx, n) {
  const set = new Set()
  while (set.size < n) set.add(`${ctx.rng.pick(P.SUBJECTS)} ${ctx.rng.pick(P.LEVELS)}`)
  return [...set].join(', ')
}

// --- generators: each returns [label, value] or [label, value, 'html'] ---
function parent(ctx) {
  const { rng, len } = ctx
  const gender = rng.pick(GENDERS)
  const { first, last, full } = ctx.nameGen.next(gender, len)
  return [
    ['Avatar', `${first} ${last}`, AVATAR_KIND],
    ['First name', first],
    ['Last name', withDevSuffix(last)],
    ['Full name', withDevSuffix(full)],
    ['Email', memorableEmail(ctx, first, last)],
    ['Mobile', sgMobile(rng)],
    ['Gender', gender],
    ['Relationship', gender === 'male' ? 'father' : 'mother'],
    ['Date of birth', dob(rng, 28, 50)],
    ['Address', addressText(rng, len)],
    ['Postcode', String(rng.randInt(100000, 999999))],
  ]
}

function student(ctx) {
  const { rng, len } = ctx
  const gender = rng.pick(GENDERS)
  const { first, last, full } = ctx.nameGen.next(gender, len)
  const bd = birthDate(rng, 4, 16)
  const age = Math.floor((Date.now() - bd.getTime()) / (DAYS_PER_YEAR * dayMs))
  return [
    ['First name', first],
    ['Last name', last],
    ['Full name', full],
    ['Preferred name', rng.pick(P.NICKNAMES)],
    ['Chinese name', chineseName(rng)],
    ['Gender', gender],
    ['Date of birth', fmtDate(bd)],
    ['Age', String(age)],
    ['Grade level', rng.pick(P.GRADES)],
    ['Allergies', allergiesText(rng, len)],
  ]
}

function course(ctx) {
  const { rng } = ctx
  const name = courseName(ctx)
  const minAge = rng.randInt(4, 12)
  return [
    ['Name', name],
    ['Description', descText(rng, ctx.len)],
    ['Slug', slug(name)],
    ['Subject type', rng.pick(P.SUBJECT_TYPE)],
    ['Min age', String(minAge)],
    ['Max age', String(minAge + rng.randInt(2, 4))],
    ['Price (SGD)', String(rng.randInt(120, 800))],
    ['Sessions', String(rng.randInt(4, 12))],
    ['Duration (min)', String(rng.pick(DURATIONS))],
    ['Seats', String(rng.randInt(8, 30))],
  ]
}

function instance(ctx) {
  const { rng } = ctx
  const sessions = rng.randInt(4, 12)
  const start = new Date(Date.now() + rng.randInt(3, 30) * dayMs)
  const end = new Date(start)
  end.setDate(end.getDate() + (sessions - 1) * 7)
  return [
    ['Course code', ctx.unique('courseCode', () => rng.alpha(8))],
    ['Start date', fmtDate(start)],
    ['End date', fmtDate(end)],
    ['Sessions', String(sessions)],
    ['Duration (min)', String(rng.pick(DURATIONS))],
    ['Price (SGD)', String(rng.randInt(120, 800))],
    ['Seats', String(rng.randInt(8, 30))],
    ['Status', rng.pick(P.INSTANCE_STATUS)],
    ['Rate type', rng.pick(P.RATE_TYPE)],
  ]
}

function product(ctx) {
  const { rng } = ctx
  const name = productName(ctx)
  return [
    ['SKU', ctx.unique('sku', () => `AGR-${rng.alpha(6)}`)],
    ['Name', name],
    ['Description', descText(rng, ctx.len)],
    ['Slug', slug(name)],
    ['Variant name', cap(words(rng, rng.randInt(2, 3)))],
    ['Status', rng.pick(P.PRODUCT_STATUS)],
    ['Product type', rng.pick(P.PRODUCT_TYPE)],
    ['Variant type', rng.pick(P.VARIANT_TYPE)],
    ['Time period', rng.pick(P.TIME_PERIOD)],
    ['Price (SGD)', String(rng.randInt(50, 1200))],
    ['Currency', 'SGD'],
    ['Require student', rng.pick(['true', 'false'])],
    ['Is deposit', rng.pick(['true', 'false'])],
  ]
}

// Mirrors the "Add New Class" form (name, business unit, venue, teachers, courses) plus a programmes field.
function klass(ctx) {
  const { rng } = ctx
  return [
    ['Class name', className(ctx)],
    ['Business unit', rng.pick(P.BUSINESS_UNITS)],
    ['Venue', rng.pick(P.VENUES)],
    ['Teachers', teacherList(ctx, rng.randInt(1, 3))],
    ['Courses', courseList(ctx, rng.randInt(1, 3))],
    ['Programmes', rng.sample(P.PROGRAMMES, rng.randInt(1, 2)).join(', ')],
  ]
}

function message(ctx) {
  const { rng, len } = ctx
  return [
    ['Title', titleText(rng, len)],
    ['Message', richMessage(rng, len), HTML_KIND],
    ['Send to', rng.pick(P.SEND_TO)],
    ['Type', 'update'],
  ]
}

export const GENERATORS = { parent, student, course, instance, class: klass, product, message }

export const TYPE_LABELS = {
  parent: 'Parent',
  student: 'Student',
  course: 'Course',
  instance: 'Instance',
  class: 'Class',
  product: 'Product',
  message: 'Message',
}

/**
 * One context per Generate run. Holds the name generator and a per-bucket
 * Set so repeated calls within the run never collide on the same value.
 */
export function createBatchContext(rng, len) {
  const buckets = new Map()
  const counts = new Map()
  const nameGen = createNameGenerator(rng)

  // '' for the first use of a key, then '1', '2', … — for memorable-but-unique values.
  function sequence(key) {
    const n = counts.get(key) || 0
    counts.set(key, n + 1)
    return n === 0 ? '' : String(n)
  }

  function unique(bucket, produce) {
    let set = buckets.get(bucket)
    if (!set) {
      set = new Set()
      buckets.set(bucket, set)
    }
    for (let i = 0; i < UNIQUE_ATTEMPTS; i++) {
      const value = produce()
      if (!set.has(value)) {
        set.add(value)
        return value
      }
    }
    // Pool exhausted: append a suffix and keep trying until genuinely unique.
    let fallback = `${produce()} ${rng.alpha(4)}`
    while (set.has(fallback)) fallback = `${produce()} ${rng.alpha(4)}`
    set.add(fallback)
    return fallback
  }

  return { rng, len, nameGen, unique, sequence }
}
