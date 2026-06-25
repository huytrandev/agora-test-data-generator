import { createRng } from './rng.js'
import { HTML_KIND, AVATAR_KIND, CHAT_KIND } from './constants.js'
import { GENERATORS, TYPE_LABELS, createBatchContext } from './generators.js'
import { loadFaker, seedFaker } from './faker.js'
import { generateFiles, FILE_TYPES, dataUrlToBytes } from './files.js'
import { avatarDataUrl } from './avatar.js'
import { parseSize, formatSize } from './file-format.js'
import {
  copyText, copyRich, fieldsToText, fieldsToObject, stripTags, downloadBlob, downloadJson, downloadCsv,
} from './clipboard.js'

const MAX_COUNT = 100
const CARD_ANIM_STEP_MS = 35
const FILES_TYPE = 'files'
const TICKET_TYPE = 'ticket'
const MIN_FILE_SIZE = 1024
const MAX_FILE_SIZE = 25 * 1024 * 1024
const DEFAULT_FILE_SIZE = 1024 * 1024

const $ = (id) => document.getElementById(id)
const cardsEl = $('cards')
const countEl = $('count')
const lenEl = $('len')
const seedEl = $('seed')
const fileTypeEl = $('fileType')
const fileSizeEl = $('fileSize')

let currentType = 'parent'
let currentCtx = null
let lastCards = []
let lastFiles = []
let sessionCtx = null
let dataSource = 'loading…'

const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

function readSeed() {
  const raw = seedEl.value.trim()
  if (raw === '' || Number.isNaN(Number(raw))) return { seeded: false, value: null }
  return { seeded: true, value: Number(raw) >>> 0 }
}

// Seeded runs build a fresh, reproducible context each time. Unseeded runs reuse
// one session context so names never repeat across consecutive Generates.
function getContext(len) {
  const { seeded, value } = readSeed()
  if (seeded) {
    seedFaker(value)
    return createBatchContext(createRng(value), len)
  }
  if (!sessionCtx) sessionCtx = createBatchContext(createRng(''), len)
  sessionCtx.len = len
  return sessionCtx
}

function clampCount() {
  const n = Math.floor(Number(countEl.value) || 1)
  const clamped = Math.min(MAX_COUNT, Math.max(1, n))
  countEl.value = String(clamped)
  return clamped
}

const avatarSlug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

function rowsMarkup(fields) {
  return fields
    .map(([label, value, kind]) => {
      if (kind === HTML_KIND) {
        // * value is rich HTML produced only by text.js (no user input) — rendered intentionally for WYSIWYG preview.
        return `<div class="preview-lbl">${label} <button class="mini copy-rich">✧ copy formatted</button></div>` +
          `<div class="preview">${value}</div>`
      }
      if (kind === CHAT_KIND) {
        // Chat transcript — bubbles only; each bubble is individually click-to-copy (see handleCardClick).
        return `<div class="preview-lbl">${label}</div><div class="preview chat">${value}</div>`
      }
      if (kind === AVATAR_KIND) {
        // src is a self-generated data: URL (base64, no HTML-special chars) — safe in the attribute.
        return `<div class="row"><span class="lbl">${escapeHtml(label)}</span>` +
          `<div class="avatar-wrap"><img class="avatar-img" alt="avatar" src="${escapeHtml(avatarDataUrl(value))}" />` +
          `<button class="mini avatar-dl" data-file="agora-avatar-${escapeHtml(avatarSlug(value))}.png">download</button></div></div>`
      }
      return `<div class="row"><span class="lbl">${escapeHtml(label)}</span>` +
        `<button class="val" title="click to copy">${escapeHtml(value)}</button></div>`
    })
    .join('')
}

function cardMarkup(fields, index) {
  return (
    `<div class="card-head"><span class="card-type">${TYPE_LABELS[currentType]} #${index + 1}</span>` +
    '<div class="card-actions">' +
    '<button class="mini act-json">json</button>' +
    '<button class="mini act-regen" title="regenerate this card">↻</button>' +
    '<button class="mini act-all">copy all</button>' +
    `</div></div><div class="rows">${rowsMarkup(fields)}</div>`
  )
}

function renderCardList(items, className, markup) {
  cardsEl.innerHTML = ''
  items.forEach((item, i) => {
    const card = document.createElement('div')
    card.className = className
    card.dataset.index = String(i)
    card.style.animationDelay = `${i * CARD_ANIM_STEP_MS}ms`
    card.innerHTML = markup(item, i)
    cardsEl.appendChild(card)
  })
}

function renderCards() {
  renderCardList(lastCards, 'card', cardMarkup)
}

// The "manifest" status line — makes the run's provenance (seed, source, count) legible.
const seg = (k, v, hi) => `<span class="seg"><span class="seg-k">${k}</span> <span class="seg-v${hi ? ' hi' : ''}">${escapeHtml(v)}</span></span>`

function renderManifest() {
  const el = $('manifest')
  if (!el) return
  if (currentType === FILES_TYPE) {
    el.innerHTML =
      seg('type', TYPE_LABELS[FILES_TYPE] || 'Files') +
      seg('format', (fileTypeEl.value || 'png').toUpperCase(), true) +
      seg('size', fileSizeEl.value) +
      seg('count', String(lastFiles.length), true)
    return
  }
  const { seeded, value } = readSeed()
  el.innerHTML =
    seg('type', TYPE_LABELS[currentType] || currentType) +
    seg('seed', seeded ? String(value) : 'random', seeded) +
    seg('source', dataSource) +
    seg('count', String(lastCards.length), true) +
    seg('dates', 'dd/mm/yyyy')
}

function generate() {
  if (currentType === FILES_TYPE) {
    generateFilesFlow()
    return
  }
  const len = lenEl.value
  const count = currentType === TICKET_TYPE ? 1 : clampCount() // a ticket is one conversation
  currentCtx = getContext(len)
  lastCards = Array.from({ length: count }, () => GENERATORS[currentType](currentCtx))
  renderCards()
  renderManifest()
}

function clampFileSize() {
  const parsed = parseSize(fileSizeEl.value)
  const target = parsed ?? DEFAULT_FILE_SIZE
  return Math.min(MAX_FILE_SIZE, Math.max(MIN_FILE_SIZE, target))
}

function fileCardMarkup(file, index) {
  const meta = `${file.mime} · ${formatSize(file.sizeBytes)}`
  return (
    `<div class="card-head"><span class="card-type">File #${index + 1} · ${file.typeLabel}</span>` +
    '<div class="card-actions"><button class="mini file-dl">download</button></div></div>' +
    `<div class="file-meta"><div class="file-icon">${file.typeLabel}</div>` +
    `<div class="file-info"><div class="file-name">${escapeHtml(file.name)}</div>` +
    `<div class="file-sub">${escapeHtml(meta)}</div></div></div>`
  )
}

function renderFileCards() {
  renderCardList(lastFiles, 'card file-card', fileCardMarkup)
}

function generateFilesFlow() {
  const count = clampCount()
  const typeKey = fileTypeEl.value in FILE_TYPES ? fileTypeEl.value : 'png'
  const target = clampFileSize()
  try {
    lastFiles = generateFiles(typeKey, target, count)
    renderFileCards()
    renderManifest()
  } catch (error) {
    console.warn('File generation failed.', error)
    cardsEl.innerHTML = '<div class="placeholder">File generation failed — see console.</div>'
  }
}

function flash(btn, text) {
  const original = btn.textContent
  btn.textContent = text
  btn.classList.add('ok')
  setTimeout(() => {
    btn.textContent = original
    btn.classList.remove('ok')
  }, 1200)
}

let toastTimer = null
function toast(message) {
  let el = document.querySelector('.toast')
  if (!el) {
    el = document.createElement('div')
    el.className = 'toast'
    document.body.appendChild(el)
  }
  el.textContent = message
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), 1600)
}

function handleCardClick(e) {
  const card = e.target.closest('.card')
  if (!card) return

  const dl = e.target.closest('.file-dl')
  if (dl) {
    const file = lastFiles[Number(card.dataset.index)]
    if (file) downloadBlob(file.name, file.blob)
    return
  }

  const av = e.target.closest('.avatar-dl')
  if (av) {
    const img = av.closest('.avatar-wrap')?.querySelector('.avatar-img')
    if (img) downloadBlob(av.dataset.file || 'agora-avatar.png', new Blob([dataUrlToBytes(img.src)], { type: 'image/png' }))
    return
  }
  if (currentType === FILES_TYPE) return // file cards have no data-card actions

  const bubble = e.target.closest('.bubble')
  if (bubble) {
    void copyText(bubble.textContent)
    bubble.classList.add('copied')
    setTimeout(() => bubble.classList.remove('copied'), 900)
    toast('Message copied')
    return
  }

  const fields = lastCards[Number(card.dataset.index)]

  const rich = e.target.closest('.copy-rich')
  if (rich) {
    void copyRich(rich.closest('.preview-lbl').nextElementSibling)
    flash(rich, '✓ copied')
    return
  }
  if (e.target.closest('.act-regen')) {
    const index = Number(card.dataset.index)
    lastCards[index] = GENERATORS[currentType](currentCtx)
    card.innerHTML = cardMarkup(lastCards[index], index)
    return
  }
  const jsonBtn = e.target.closest('.act-json')
  if (jsonBtn) {
    void copyText(JSON.stringify(fieldsToObject(fields), null, 2))
    flash(jsonBtn, '✓ copied')
    return
  }
  const allBtn = e.target.closest('.act-all')
  if (allBtn) {
    void copyText(fieldsToText(fields))
    flash(allBtn, '✓ copied')
    return
  }
  const val = e.target.closest('.val')
  if (val) {
    void copyText(val.textContent)
    flash(val, '✓ copied')
  }
}

function exportBatch(kind) {
  if (lastCards.length === 0) {
    toast('Generate a batch first')
    return
  }
  const filename = `agora-${currentType}-${lastCards.length}.${kind}`
  if (kind === 'json') downloadJson(filename, lastCards)
  else downloadCsv(filename, lastCards)
  toast(`Downloaded ${filename}`)
}

function downloadAllFiles() {
  if (lastFiles.length === 0) {
    toast('Generate files first')
    return
  }
  lastFiles.forEach((file, i) => setTimeout(() => downloadBlob(file.name, file.blob), i * 150))
  toast(`Downloading ${lastFiles.length} file(s)`)
}

function applyModeVisibility() {
  const filesMode = currentType === FILES_TYPE
  document.querySelectorAll('.data-only').forEach((el) => {
    el.hidden = filesMode
  })
  document.querySelectorAll('.files-only').forEach((el) => {
    el.hidden = !filesMode
  })
  $('countField').hidden = currentType === TICKET_TYPE // a ticket is always a single conversation
  cardsEl.classList.toggle('cards-single', currentType === TICKET_TYPE)
}

function selectTab(tab) {
  document.querySelectorAll('.tab').forEach((x) => x.classList.remove('active'))
  tab.classList.add('active')
  currentType = tab.dataset.type
  applyModeVisibility()
  generate()
}

function wireEvents() {
  document.querySelectorAll('.tab').forEach((t) => t.addEventListener('click', () => selectTab(t)))
  document.querySelectorAll('.stepper button').forEach((b) =>
    b.addEventListener('click', () => {
      countEl.value = String(Math.max(1, (Number(countEl.value) || 1) + Number(b.dataset.step)))
    }),
  )
  lenEl.addEventListener('change', generate)
  fileTypeEl.addEventListener('change', generate)
  fileSizeEl.addEventListener('change', generate)
  $('run').addEventListener('click', generate)
  ;[countEl, seedEl, fileSizeEl].forEach((el) =>
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') generate()
    }),
  )
  $('exportJson').addEventListener('click', () => exportBatch('json'))
  $('exportCsv').addEventListener('click', () => exportBatch('csv'))
  $('downloadAll').addEventListener('click', downloadAllFiles)
  cardsEl.addEventListener('click', handleCardClick)

  // Keyboard: press 1–8 to switch record type (ignored while typing in a field).
  document.addEventListener('keydown', (e) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return
    if (e.target.closest('input, select, textarea')) return
    if (e.key >= '1' && e.key <= '9') {
      const tabs = document.querySelectorAll('.tab')
      const tab = tabs[Number(e.key) - 1]
      if (tab) {
        e.preventDefault()
        selectTab(tab)
      }
    }
  })
}

async function initFaker() {
  const pill = $('fakerPill')
  const { ok } = await loadFaker()
  dataSource = ok ? 'faker' : 'offline'
  pill.textContent = ok ? 'source: faker (rich)' : 'source: offline pool'
  pill.classList.add(ok ? 'ok' : 'warn')
  renderManifest()
  // Re-seed Faker if the user already entered a seed before it finished loading.
  const { seeded, value } = readSeed()
  if (seeded) seedFaker(value)
}

function setupTheme() {
  const btn = $('themeToggle')
  const apply = (theme) => {
    document.documentElement.dataset.theme = theme
    btn.textContent = theme === 'dark' ? '☀ Light' : '☾ Dark'
  }
  apply(document.documentElement.dataset.theme || 'dark')
  btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark'
    try {
      localStorage.setItem('tdg-theme', next)
    } catch (error) {
      console.warn('Theme preference not persisted.', error)
    }
    apply(next)
  })
}

setupTheme()
wireEvents()
applyModeVisibility()
generate()
void initFaker()

export { stripTags }
