// Singapore-realistic name engine with batch-level uniqueness. Pure module.
//
// Ethnicity is weighted by rough SG demographics and drives naming conventions:
//   Chinese  -> Surname-first, optional English given name
//   Malay    -> <given> bin/binte <father>
//   Indian   -> <given> s/o (d/o) <father>
//   Eurasian / Western -> <given> <surname>

import * as P from './data.js'

const CHINESE_MAX = 0.62
const MALAY_MAX = 0.77
const INDIAN_MAX = 0.89
const MAX_ATTEMPTS = 40
const ESCALATE_AFTER = 8

function buildName(rng, gender, len, withMiddle) {
  const { pick, chance } = rng
  const isMale = gender === 'male'
  const e = rng.rnd()
  let first
  let last
  let full

  if (e < CHINESE_MAX) {
    const sur = pick(P.CN_SUR_R)
    const giv = pick(isMale ? P.CN_GIV_M : P.CN_GIV_F)
    const eng = pick(isMale ? P.FIRST_M : P.FIRST_F)
    if (len !== 'normal' || chance(0.5)) {
      first = eng
      last = sur
      full = `${eng} ${sur} ${giv}`
    } else {
      first = giv
      last = sur
      full = `${sur} ${giv}`
    }
  } else if (e < MALAY_MAX) {
    const giv = pick(isMale ? P.MY_GIV_M : P.MY_GIV_F)
    const fa = pick(P.MY_FATHER)
    const conn = isMale ? 'bin' : 'binte'
    first = giv
    last = `${conn} ${fa}`
    full = `${giv} ${conn} ${fa}`
  } else if (e < INDIAN_MAX) {
    const giv = pick(isMale ? P.IN_GIV_M : P.IN_GIV_F)
    const fa = pick(P.IN_FATHER)
    const conn = isMale ? 's/o' : 'd/o'
    first = giv
    last = `${conn} ${fa}`
    full = `${giv} ${conn} ${fa}`
  } else {
    const f = pick(isMale ? P.FIRST_M : P.FIRST_F)
    const l = pick(chance(0.5) ? P.EURASIAN_SUR : P.LAST)
    first = f
    last = l
    full = `${f} ${l}`
  }

  if (len === 'long' || withMiddle) {
    const mid = pick(isMale ? P.FIRST_M : P.FIRST_F)
    first = `${first} ${mid}`
    full = `${full} ${mid}`
  }
  if (len === 'stress') {
    const tok = pick(P.LONG_TOKENS)
    last = `${last} ${tok}`
    full = `${full} ${tok}`
  }
  return { first, last, full }
}

/**
 * Returns a name generator backed by one RNG. `next()` never repeats a full
 * name it has already returned: on collision it regenerates, escalating entropy
 * (extra middle name) and, as a last resort, appending a short suffix so the
 * call always terminates even when the source pools are exhausted.
 */
export function createNameGenerator(rng) {
  const seen = new Set()

  function next(gender, len) {
    for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
      const name = buildName(rng, gender, len, attempt >= ESCALATE_AFTER)
      const key = name.full.toLowerCase()
      if (!seen.has(key)) {
        seen.add(key)
        return name
      }
    }
    // Pool exhausted: regenerate with extra entropy + a suffix until genuinely unique.
    let name
    let full
    do {
      const base = buildName(rng, gender, len, true)
      const suffix = rng.alpha(3)
      full = `${base.full} ${suffix}`
      name = { first: `${base.first} ${suffix}`, last: base.last, full }
    } while (seen.has(full.toLowerCase()))
    seen.add(full.toLowerCase())
    return name
  }

  return {
    next,
    reset: () => seen.clear(),
    get size() {
      return seen.size
    },
  }
}

/** Display-only Chinese name (may repeat — it is a secondary cosmetic field). */
export function chineseName(rng) {
  return rng.pick(P.CN_SUR) + rng.pick(P.CN_GIVEN)
}
