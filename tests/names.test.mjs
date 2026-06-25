import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRng } from '../js/rng.js'
import { createNameGenerator, chineseName } from '../js/names.js'

const GENDERS = ['male', 'female']

function generate(seed, count, len) {
  const rng = createRng(seed)
  const gen = createNameGenerator(rng)
  return Array.from({ length: count }, (_, i) => gen.next(GENDERS[i % 2], len))
}

test('no duplicate full names within a batch (normal length)', () => {
  const names = generate(1, 400, 'normal')
  const fulls = names.map((n) => n.full.toLowerCase())
  assert.equal(new Set(fulls).size, fulls.length)
})

test('no duplicate full names within a batch (long length)', () => {
  const names = generate(2, 600, 'long')
  const fulls = names.map((n) => n.full.toLowerCase())
  assert.equal(new Set(fulls).size, fulls.length)
})

test('stays unique even past the natural pool size (forced suffix path)', () => {
  // Far more names than any single ethnicity pool can yield distinctly.
  const names = generate(7, 1500, 'normal')
  const fulls = names.map((n) => n.full.toLowerCase())
  assert.equal(new Set(fulls).size, fulls.length)
})

test('produces all SG naming conventions across a sample', () => {
  const sample = generate(3, 300, 'normal').map((n) => n.full)
  const joined = sample.join(' | ')
  assert.match(joined, /\bbin\b|\bbinte\b/, 'expected a Malay bin/binte name')
  assert.match(joined, /s\/o|d\/o/, 'expected an Indian s/o or d/o name')
})

test('every name exposes first, last and full', () => {
  const names = generate(11, 50, 'long')
  for (const n of names) {
    assert.ok(n.first && n.last && n.full, `incomplete name: ${JSON.stringify(n)}`)
  }
})

test('same seed yields an identical name sequence', () => {
  const a = generate(123, 30, 'normal').map((n) => n.full)
  const b = generate(123, 30, 'normal').map((n) => n.full)
  assert.deepEqual(a, b)
})

test('reset clears the seen set so names may repeat afterwards', () => {
  const rng = createRng(50)
  const gen = createNameGenerator(rng)
  gen.next('male', 'normal')
  assert.equal(gen.size, 1)
  gen.reset()
  assert.equal(gen.size, 0)
})

test('chineseName returns a non-empty CJK string', () => {
  const rng = createRng(8)
  const name = chineseName(rng)
  assert.ok(name.length >= 2)
})
