import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRng } from '../js/rng.js'
import { GENERATORS, TYPE_LABELS, createBatchContext } from '../js/generators.js'

function runBatch(type, count, { seed = 1, len = 'long' } = {}) {
  const ctx = createBatchContext(createRng(seed), len)
  return Array.from({ length: count }, () => GENERATORS[type](ctx))
}

const value = (fields, label) => fields.find(([l]) => l === label)?.[1]

test('every type is registered with a label', () => {
  for (const type of Object.keys(GENERATORS)) {
    assert.ok(TYPE_LABELS[type], `missing label for ${type}`)
  }
})

test('parent exposes the expected fields', () => {
  const [fields] = runBatch('parent', 1)
  const labels = fields.map(([l]) => l)
  assert.deepEqual(labels, [
    'Avatar', 'First name', 'Last name', 'Full name', 'Email', 'Mobile',
    'Gender', 'Relationship', 'Date of birth', 'Address', 'Postcode',
  ])
  assert.match(value(fields, 'Mobile'), /^[89]\d{3} \d{4}$/)
  assert.match(value(fields, 'Date of birth'), /^\d{2}\/\d{2}\/\d{4}$/)
})

test('parent avatar seed is the clean name (no [DEV] prefix), tagged avatar kind', () => {
  const [fields] = runBatch('parent', 1)
  const avatar = fields.find(([l]) => l === 'Avatar')
  assert.equal(avatar[2], 'avatar')
  assert.ok(!avatar[1].includes('[DEV]'), 'avatar seed must be clean for correct initials/colour')
})

test('parent names carry the [DEV] suffix on last + full name only', () => {
  const [fields] = runBatch('parent', 1)
  assert.ok(value(fields, 'Last name').endsWith(' [DEV]'))
  assert.ok(value(fields, 'Full name').endsWith(' [DEV]'))
  assert.equal(value(fields, 'First name').includes('[DEV]'), false)
})

test('parent emails are short, name-related, and unique within a batch', () => {
  const fields = runBatch('parent', 200, { len: 'normal' })
  const emails = fields.map((f) => value(f, 'Email'))
  assert.equal(new Set(emails).size, emails.length, 'emails are unique')
  for (const f of fields) {
    const email = value(f, 'Email')
    assert.match(email, /^[a-z0-9.]+@mailinator\.com$/, `clean handle: ${email}`)
    assert.ok(!email.includes('agora.'), 'no agora prefix')
    const firstClean = value(f, 'First name').split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '')
    assert.ok(email.startsWith(`${firstClean}.`), `${email} should start with ${firstClean}.`)
  }
})

test('class exposes the expected fields, programmes last', () => {
  const [fields] = runBatch('class', 1)
  const labels = fields.map(([l]) => l)
  assert.deepEqual(labels, [
    'Class name', 'Business unit', 'Venue', 'Teachers', 'Courses', 'Programmes',
  ])
  for (const label of ['Teachers', 'Courses', 'Programmes']) {
    assert.ok(value(fields, label).length > 0, `${label} is non-empty`)
  }
})

test('class names never repeat within a batch', () => {
  const names = runBatch('class', 200, { len: 'normal' }).map((f) => value(f, 'Class name'))
  assert.equal(new Set(names).size, names.length)
})

test('message marks its body as html', () => {
  const [fields] = runBatch('message', 1)
  const body = fields.find(([l]) => l === 'Message')
  assert.equal(body[2], 'html')
  assert.match(body[1], /<p>|<h4>/)
})

test('ticket exposes a chat conversation marked as html', () => {
  const [fields] = runBatch('ticket', 1)
  const labels = fields.map(([l]) => l)
  assert.deepEqual(labels, ['Participant A', 'Participant B', 'Messages', 'Conversation'])
  const convo = fields.find(([l]) => l === 'Conversation')
  assert.equal(convo[2], 'html')
  assert.match(convo[1], /msg-in|msg-out/)
  assert.match(convo[1], /class="bubble"/)
})

test('ticket message count matches the rendered bubbles', () => {
  for (const fields of runBatch('ticket', 30)) {
    const convo = value(fields, 'Conversation')
    const bubbles = (convo.match(/class="bubble"/g) || []).length
    assert.equal(Number(value(fields, 'Messages')), bubbles)
    assert.ok(bubbles >= 2, 'a conversation has at least two messages')
  }
})

test('parent full names never repeat within a batch', () => {
  const fulls = runBatch('parent', 300, { len: 'normal' }).map((f) => value(f, 'Full name').toLowerCase())
  assert.equal(new Set(fulls).size, fulls.length)
})

test('course names never repeat within a batch', () => {
  const names = runBatch('course', 200, { len: 'normal' }).map((f) => value(f, 'Name'))
  assert.equal(new Set(names).size, names.length)
})

test('product SKUs never repeat within a batch', () => {
  const skus = runBatch('product', 200).map((f) => value(f, 'SKU'))
  assert.equal(new Set(skus).size, skus.length)
})

test('ctx.sequence numbers repeated handles for unique emails', () => {
  const ctx = createBatchContext(createRng(1), 'normal')
  assert.equal(ctx.sequence('siti.rahman'), '')
  assert.equal(ctx.sequence('siti.rahman'), '1')
  assert.equal(ctx.sequence('siti.rahman'), '2')
  assert.equal(ctx.sequence('isla.seah'), '')
})

test('a fresh context (same seed) reproduces the same batch', () => {
  const a = runBatch('student', 20, { seed: 42 }).map((f) => value(f, 'Full name'))
  const b = runBatch('student', 20, { seed: 42 }).map((f) => value(f, 'Full name'))
  assert.deepEqual(a, b)
})

test('instance end date is not before its start date', () => {
  for (const fields of runBatch('instance', 50)) {
    const [ds, ms, ys] = value(fields, 'Start date').split('/').map(Number)
    const [de, me, ye] = value(fields, 'End date').split('/').map(Number)
    const start = Date.UTC(ys, ms - 1, ds)
    const end = Date.UTC(ye, me - 1, de)
    assert.ok(end >= start, `end ${value(fields, 'End date')} < start ${value(fields, 'Start date')}`)
  }
})
