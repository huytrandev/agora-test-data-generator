import { test } from 'node:test'
import assert from 'node:assert/strict'
import { crc32, padPng, padJpeg, buildPdf, parseSize, formatSize } from '../js/file-format.js'

const enc = new TextEncoder()

function concat(...arrays) {
  const total = arrays.reduce((s, a) => s + a.length, 0)
  const out = new Uint8Array(total)
  let o = 0
  for (const a of arrays) {
    out.set(a, o)
    o += a.length
  }
  return out
}
const u32 = (n) => Uint8Array.of((n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255)
function pngChunk(type, data) {
  const t = enc.encode(type)
  return concat(u32(data.length), t, data, u32(crc32(concat(t, data))))
}
const PNG_SIG = Uint8Array.of(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)
// Structurally valid PNG layout (sig + IHDR + IDAT + IEND); enough to exercise padPng.
const BASE_PNG = concat(
  PNG_SIG,
  pngChunk('IHDR', Uint8Array.of(0, 0, 0, 1, 0, 0, 0, 1, 8, 2, 0, 0, 0)),
  pngChunk('IDAT', Uint8Array.of(0x78, 0x9c, 0x62, 0x00, 0x00, 0x00, 0x02, 0x00, 0x01)),
  pngChunk('IEND', new Uint8Array(0)),
)
const BASE_JPEG = Uint8Array.of(0xff, 0xd8, 0x10, 0x20, 0x30, 0xff, 0xd9)

const indexOfBytes = (hay, needle) => {
  for (let i = 0; i <= hay.length - needle.length; i++) {
    let ok = true
    for (let j = 0; j < needle.length; j++) if (hay[i + j] !== needle[j]) { ok = false; break }
    if (ok) return i
  }
  return -1
}

test('crc32 matches the standard check vector', () => {
  assert.equal(crc32(enc.encode('123456789')), 0xcbf43926)
})

test('padPng hits the exact target size and preserves structure', () => {
  for (const target of [BASE_PNG.length + 14, 1024, 10240, 1048576]) {
    const out = padPng(BASE_PNG, target)
    assert.equal(out.length, target, `target ${target}`)
    assert.deepEqual(out.subarray(0, 8), PNG_SIG)
    assert.deepEqual(out.subarray(out.length - 12), BASE_PNG.subarray(BASE_PNG.length - 12))
    assert.ok(indexOfBytes(out, enc.encode('tEXt')) > 0, 'tEXt chunk present')
  }
})

test('padPng returns the base unchanged when target leaves no room', () => {
  assert.equal(padPng(BASE_PNG, BASE_PNG.length + 1).length, BASE_PNG.length)
  assert.equal(padPng(BASE_PNG, 10).length, BASE_PNG.length)
})

test('padJpeg hits the exact target size, even across the 64KB segment boundary', () => {
  for (const target of [BASE_JPEG.length + 4, 5000, 70000, 200000]) {
    const out = padJpeg(BASE_JPEG, target)
    assert.equal(out.length, target, `target ${target}`)
    assert.deepEqual(out.subarray(0, 2), Uint8Array.of(0xff, 0xd8))
    assert.equal(out[2], 0xff)
    assert.equal(out[3], 0xfe, 'COM marker after SOI')
    assert.deepEqual(out.subarray(out.length - 5), BASE_JPEG.subarray(2), 'original tail preserved')
  }
})

test('padJpeg returns the base unchanged when padding is below one segment', () => {
  assert.equal(padJpeg(BASE_JPEG, BASE_JPEG.length + 2).length, BASE_JPEG.length)
})

test('buildPdf hits the exact target size and is structurally valid', () => {
  for (const target of [1024, 10240, 99999, 100000, 1000000, 5 * 1024 * 1024]) {
    const out = buildPdf(target, `dummy ${target}`)
    assert.equal(out.length, target, `target ${target}`)
    const text = new TextDecoder().decode(out)
    assert.ok(text.startsWith('%PDF-1.4'), 'PDF header')
    assert.ok(text.includes('\nstartxref\n'), 'startxref present')
    assert.ok(text.includes('xref\n'), 'xref table present')
    assert.ok(text.trimEnd().endsWith('%%EOF'), 'EOF marker')
  }
})

test('buildPdf clamps gracefully when target is below the minimum', () => {
  const out = buildPdf(100, 'tiny')
  assert.ok(out.length >= 100)
  assert.ok(new TextDecoder().decode(out).startsWith('%PDF-1.4'))
})

test('parseSize understands units and raw bytes', () => {
  assert.equal(parseSize('2.5MB'), 2621440)
  assert.equal(parseSize('500KB'), 512000)
  assert.equal(parseSize('1.5 mb'), 1572864)
  assert.equal(parseSize('1048576'), 1048576)
  assert.equal(parseSize('1024'), 1024)
  assert.equal(parseSize('abc'), null)
  assert.equal(parseSize(''), null)
})

test('formatSize renders human-readable sizes', () => {
  assert.equal(formatSize(512), '512 B')
  assert.equal(formatSize(1536), '1.5 KB')
  assert.equal(formatSize(1048576), '1.0 MB')
})
