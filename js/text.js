// Lorem + rich-HTML message generation. Pure module.
//
// The *words* come from a swappable provider: the local LOREM pool by default
// (deterministic + offline), or Faker via setWordProvider() for more variety.
// All *structure* (counts, where emphasis/links land) always uses our own rng,
// so a seeded run stays reproducible regardless of which provider is active.

import { LOREM, NOTIF_TITLES } from './data.js'

const fallbackProvider = {
  word: (rng) => rng.pick(LOREM),
  words: (rng, n) => Array.from({ length: n }, () => rng.pick(LOREM)).join(' '),
}

let provider = fallbackProvider

export function setWordProvider(next) {
  provider = next
}

export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1)

export const words = (rng, n) => provider.words(rng, n)
export const sentence = (rng, a, b) => `${cap(words(rng, rng.randInt(a, b)))}.`
export const paras = (rng, n, a, b) => Array.from({ length: n }, () => sentence(rng, a, b)).join(' ')

function richInline(rng, text) {
  return text
    .split(' ')
    .map((word) => {
      const r = rng.rnd()
      if (r < 0.1) return `<strong>${word}</strong>`
      if (r < 0.18) return `<em>${word}</em>`
      if (r < 0.23) return `<u>${word}</u>`
      return word
    })
    .join(' ')
}

const link = (rng, label) => `<a href="https://app.agora.sg/c/${rng.token(6)}">${label}</a>`
const para = (rng, a, b) => `<p>${richInline(rng, paras(rng, rng.randInt(a, b), 8, 16))}</p>`
const listItems = (rng, count, a, b) =>
  `<ul>${Array.from({ length: count }, () => `<li>${richInline(rng, sentence(rng, a, b))}</li>`).join('')}</ul>`

export function descText(rng, len) {
  if (len === 'normal') return sentence(rng, 10, 16)
  if (len === 'long') return paras(rng, 2, 10, 16)
  return paras(rng, rng.randInt(4, 6), 10, 18)
}

export function titleText(rng, len) {
  if (len === 'normal') return `${rng.pick(NOTIF_TITLES)} — ${cap(words(rng, rng.randInt(3, 5)))}`
  if (len === 'long') return cap(words(rng, rng.randInt(9, 14)))
  return cap(words(rng, rng.randInt(22, 32)))
}

export function richMessage(rng, len) {
  if (len === 'normal') {
    return [para(rng, 3, 4), `<p>Please ${link(rng, 'view the schedule')} for the full details.</p>`].join('\n')
  }
  if (len === 'long') {
    return [
      `<h4>${cap(words(rng, rng.randInt(5, 8)))}</h4>`,
      para(rng, 4, 6),
      para(rng, 4, 6),
      listItems(rng, 4, 8, 16),
      `<p>Action needed: ${link(rng, 'confirm attendance')} before the next session.</p>`,
      para(rng, 4, 6),
    ].join('\n')
  }
  const out = [`<h4>${cap(words(rng, rng.randInt(8, 12)))}</h4>`]
  for (let i = 0; i < rng.randInt(6, 8); i++) out.push(para(rng, 5, 8))
  out.splice(3, 0, listItems(rng, 5, 10, 18))
  out.splice(6, 0, `<blockquote>${richInline(rng, paras(rng, rng.randInt(2, 3), 12, 18))}</blockquote>`)
  out.push(`<p>${link(rng, 'Read the full notice')} for more information.</p>`)
  out.push(`<p><em>${sentence(rng, 12, 18)}</em></p>`)
  return out.join('\n')
}

// --- Chat / conversation transcript -----------------------------------------
// Two parties replying back and forth for an exact number of messages. The sides
// alternate in bursts of 1–3 consecutive bubbles; Text length sets how wordy each
// message is.
function chatLine(rng, len) {
  const r = rng.rnd()
  if (len === 'stress') return r < 0.3 ? sentence(rng, 8, 14) : paras(rng, rng.randInt(2, 4), 10, 18)
  if (len === 'long') return r < 0.35 ? sentence(rng, 6, 12) : paras(rng, 2, 8, 14)
  if (r < 0.45) return cap(words(rng, rng.randInt(2, 6))) // short, chatty — no period
  if (r < 0.85) return sentence(rng, 6, 12)
  return paras(rng, 2, 8, 14)
}

export function chatThread(rng, len, total, whoA, whoB) {
  const parts = []
  let count = 0
  let turn = 0
  while (count < total) {
    const fromA = turn % 2 === 0
    const who = fromA ? whoA : whoB
    const dir = fromA ? 'in' : 'out'
    const burst = Math.min(rng.randInt(1, 3), total - count)
    const bubbles = []
    for (let m = 0; m < burst; m++) {
      bubbles.push(`<div class="bubble" title="click to copy">${chatLine(rng, len)}</div>`)
      count++
    }
    parts.push(`<div class="msg msg-${dir}"><div class="msg-who">${who}</div>${bubbles.join('')}</div>`)
    turn++
  }
  return { html: parts.join('\n'), count }
}
