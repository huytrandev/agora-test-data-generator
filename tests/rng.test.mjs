import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createRng } from '../js/rng.js'

test('same seed produces an identical rnd() stream', () => {
  const a = createRng(42)
  const b = createRng(42)
  const seqA = Array.from({ length: 20 }, () => a.rnd())
  const seqB = Array.from({ length: 20 }, () => b.rnd())
  assert.deepEqual(seqA, seqB)
})

test('different seeds diverge', () => {
  const a = createRng(1)
  const b = createRng(2)
  const seqA = Array.from({ length: 20 }, () => a.rnd())
  const seqB = Array.from({ length: 20 }, () => b.rnd())
  assert.notDeepEqual(seqA, seqB)
})

test('blank or non-numeric seed falls back to Math.random (unseeded)', () => {
  assert.equal(createRng('').seeded, false)
  assert.equal(createRng(undefined).seeded, false)
  assert.equal(createRng('not-a-number').seeded, false)
  assert.equal(createRng(7).seeded, true)
})

test('randInt stays within inclusive bounds', () => {
  const rng = createRng(123)
  for (let i = 0; i < 500; i++) {
    const n = rng.randInt(3, 9)
    assert.ok(n >= 3 && n <= 9, `out of range: ${n}`)
  }
})

test('pick returns a member of the array', () => {
  const rng = createRng(99)
  const arr = ['a', 'b', 'c', 'd']
  for (let i = 0; i < 50; i++) assert.ok(arr.includes(rng.pick(arr)))
})

test('sample returns n distinct members', () => {
  const rng = createRng(5)
  const arr = ['a', 'b', 'c', 'd', 'e']
  const picked = rng.sample(arr, 3)
  assert.equal(picked.length, 3)
  assert.equal(new Set(picked).size, 3)
  picked.forEach((p) => assert.ok(arr.includes(p)))
})

test('sample never exceeds the source length', () => {
  const rng = createRng(5)
  const picked = rng.sample(['a', 'b'], 10)
  assert.equal(picked.length, 2)
})

test('token and alpha respect length and charset', () => {
  const rng = createRng(2024)
  const tok = rng.token(12)
  assert.equal(tok.length, 12)
  assert.match(tok, /^[a-z0-9]+$/)
  const al = rng.alpha(8)
  assert.equal(al.length, 8)
  // Exact charset: A–Z minus the ambiguous I and O, digits 2–9 (no 0 or 1).
  assert.match(al, /^[A-HJ-NP-Z2-9]+$/)
})
