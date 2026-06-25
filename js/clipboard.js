// Clipboard + export helpers. Browser-only (uses Clipboard API / DOM).

import { HTML_KIND, AVATAR_KIND, CHAT_KIND } from './constants.js'

export function stripTags(html) {
  // DOMParser never executes scripts and avoids touching the live DOM.
  return new DOMParser().parseFromString(html, 'text/html').body.textContent ?? ''
}

function plainValue([, val, kind]) {
  return kind === HTML_KIND || kind === CHAT_KIND ? stripTags(val) : val
}

// Avatars are images, not pasteable text — exclude them from text/JSON/CSV export.
const isTextField = ([, , kind]) => kind !== AVATAR_KIND

function fallbackCopy(text) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  try {
    document.execCommand('copy')
  } catch (error) {
    console.warn('Copy failed.', error)
  }
  ta.remove()
}

export function copyText(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
  }
  fallbackCopy(text)
  return Promise.resolve()
}

export async function copyRich(el) {
  const html = el.innerHTML
  const text = el.textContent ?? ''
  try {
    if (navigator.clipboard && window.ClipboardItem) {
      await navigator.clipboard.write([
        new ClipboardItem({
          'text/html': new Blob([html], { type: 'text/html' }),
          'text/plain': new Blob([text], { type: 'text/plain' }),
        }),
      ])
      return true
    }
  } catch (error) {
    console.warn('Rich copy via Clipboard API failed, trying selection.', error)
  }
  try {
    const range = document.createRange()
    range.selectNodeContents(el)
    const sel = window.getSelection()
    sel.removeAllRanges()
    sel.addRange(range)
    document.execCommand('copy')
    sel.removeAllRanges()
    return true
  } catch (error) {
    console.warn('Rich copy failed.', error)
    return false
  }
}

export const fieldsToText = (fields) => fields.filter(isTextField).map((f) => `${f[0]}: ${plainValue(f)}`).join('\n')

export const fieldsToObject = (fields) =>
  Object.fromEntries(fields.filter(isTextField).map((f) => [f[0], plainValue(f)]))

export function downloadBlob(filename, blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  // Defer revoke so the browser finishes consuming the URL — large downloads can fail otherwise.
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

function download(filename, content, mime) {
  downloadBlob(filename, new Blob([content], { type: mime }))
}

export function downloadJson(filename, cards) {
  download(filename, JSON.stringify(cards.map(fieldsToObject), null, 2), 'application/json')
}

function csvCell(value) {
  const s = String(value)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

export function downloadCsv(filename, cards) {
  if (cards.length === 0) return
  const headers = cards[0].filter(isTextField).map((f) => f[0])
  const lines = [headers.map(csvCell).join(',')]
  for (const fields of cards) {
    const row = fieldsToObject(fields)
    lines.push(headers.map((h) => csvCell(row[h] ?? '')).join(','))
  }
  download(filename, lines.join('\n'), 'text/csv')
}
