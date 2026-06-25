// Seeded PRNG + sampling primitives. Pure module (no DOM) so it stays node-testable.

const TOKEN_CHARS = 'abcdefghijklmnopqrstuvwxyz0123456789'
// Ambiguous glyphs (I, O, 1, 0) dropped so generated codes read cleanly.
const ALPHA_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

function mulberry32(seed) {
  let a = seed >>> 0
  return function () {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function resolveSource(seed) {
  const isBlank = seed === undefined || seed === null || String(seed).trim() === ''
  if (isBlank || Number.isNaN(Number(seed))) return Math.random
  return mulberry32(Number(seed) >>> 0)
}

function randToken(rnd, length, charset) {
  let out = ''
  for (let i = 0; i < length; i++) out += charset[Math.floor(rnd() * charset.length)]
  return out
}

/**
 * Build a random generator. A finite numeric `seed` makes the stream
 * deterministic (mulberry32); a blank / non-numeric seed falls back to Math.random.
 */
export function createRng(seed) {
  const rnd = resolveSource(seed)
  const pick = (arr) => arr[Math.floor(rnd() * arr.length)]

  const sample = (arr, n) => {
    const copy = arr.slice()
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1))
      ;[copy[i], copy[j]] = [copy[j], copy[i]]
    }
    return copy.slice(0, Math.min(n, copy.length))
  }

  return {
    seeded: rnd !== Math.random,
    rnd,
    randInt: (min, max) => Math.floor(rnd() * (max - min + 1)) + min,
    pick,
    sample,
    chance: (p) => rnd() < p,
    token: (length) => randToken(rnd, length, TOKEN_CHARS),
    alpha: (length) => randToken(rnd, length, ALPHA_CHARS),
  }
}
