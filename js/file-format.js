// Pure, DOM-free file-format helpers: pad an encoded image to an exact byte
// size using format-legal padding, synthesize a sized PDF, and parse size input.
// Image *base* bytes come from a canvas (browser); the padding logic here is
// format-aware but content-agnostic, so it is fully unit-testable in node.

const enc = new TextEncoder()
const textToBytes = (s) => enc.encode(s)

const PNG_SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const PNG_TEXT_KEYWORD = 'C' // 1 byte → smallest possible tEXt overhead
const PNG_CHUNK_OVERHEAD = 12 // length(4) + type(4) + crc(4)
const PNG_MIN_PAD = PNG_CHUNK_OVERHEAD + PNG_TEXT_KEYWORD.length + 1 // + keyword + null separator
const JPEG_SEG_OVERHEAD = 4 // marker(2) + length(2)
const JPEG_SEG_MAX = 0xffff + 2 // max wire size of one COM segment
const PAD_BYTE = 0x20 // ASCII space — valid Latin-1 text / comment filler

function concat(...arrays) {
  const total = arrays.reduce((sum, a) => sum + a.length, 0)
  const out = new Uint8Array(total)
  let offset = 0
  for (const a of arrays) {
    out.set(a, offset)
    offset += a.length
  }
  return out
}

function filled(byte, n) {
  const a = new Uint8Array(Math.max(0, n))
  a.fill(byte)
  return a
}

function u32be(n) {
  return Uint8Array.of((n >>> 24) & 0xff, (n >>> 16) & 0xff, (n >>> 8) & 0xff, n & 0xff)
}

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c >>> 0
  }
  return table
})()

export function crc32(bytes) {
  let c = 0xffffffff
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8)
  return (c ^ 0xffffffff) >>> 0
}

function isPng(bytes) {
  return PNG_SIGNATURE.every((b, i) => bytes[i] === b)
}

function pngChunk(type, data) {
  const typeBytes = textToBytes(type)
  const crc = crc32(concat(typeBytes, data))
  return concat(u32be(data.length), typeBytes, data, u32be(crc))
}

/**
 * Insert a tEXt chunk before IEND so the PNG ends up exactly `target` bytes.
 * Returns the base unchanged when `target` leaves no room for a minimal chunk
 * (caller should report the actual size).
 */
export function padPng(base, target) {
  if (!isPng(base)) throw new Error('padPng: input is not a PNG')
  const padTotal = target - base.length
  if (padTotal < PNG_MIN_PAD) return base.slice()
  const dataLen = padTotal - PNG_CHUNK_OVERHEAD
  const textLen = dataLen - (PNG_TEXT_KEYWORD.length + 1)
  const data = concat(textToBytes(PNG_TEXT_KEYWORD), Uint8Array.of(0), filled(PAD_BYTE, textLen))
  const chunk = pngChunk('tEXt', data)
  const iendStart = base.length - 12 // IEND is always the final 12-byte chunk
  return concat(base.subarray(0, iendStart), chunk, base.subarray(iendStart))
}

// Split `total` padding bytes into COM-segment wire sizes, each in [min, max],
// never leaving a remainder smaller than `min`.
function splitPadding(total, max, min) {
  const widths = []
  let remaining = total
  while (remaining > 0) {
    let width = Math.min(remaining, max)
    if (remaining - width > 0 && remaining - width < min) width = remaining - min
    widths.push(width)
    remaining -= width
  }
  return widths
}

function comSegment(wire) {
  const lengthField = wire - 2 // JPEG length field counts itself but not the marker
  return concat(Uint8Array.of(0xff, 0xfe, (lengthField >> 8) & 0xff, lengthField & 0xff), filled(PAD_BYTE, wire - JPEG_SEG_OVERHEAD))
}

/**
 * Insert COM (comment) segments after the SOI marker so the JPEG ends up
 * exactly `target` bytes. Decoders ignore COM segments.
 */
export function padJpeg(base, target) {
  if (base[0] !== 0xff || base[1] !== 0xd8) throw new Error('padJpeg: input is not a JPEG')
  const padTotal = target - base.length
  if (padTotal < JPEG_SEG_OVERHEAD) return base.slice()
  const segments = splitPadding(padTotal, JPEG_SEG_MAX, JPEG_SEG_OVERHEAD).map(comSegment)
  return concat(base.subarray(0, 2), ...segments, base.subarray(2))
}

const PDF_HEADER = '%PDF-1.4\n'

/** Synthesize a valid one-page PDF padded to exactly `target` bytes (when feasible). */
export function buildPdf(target, label) {
  const safe = String(label).replace(/[^\x20-\x7e]/g, '').replace(/[()\\]/g, ' ').slice(0, 60)
  const stream = `BT /F1 18 Tf 20 100 Td (${safe}) Tj ET`
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>',
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ]

  let body = PDF_HEADER
  const offsets = []
  objects.forEach((content, i) => {
    offsets[i] = body.length
    body += `${i + 1} 0 obj\n${content}\nendobj\n`
  })
  const count = objects.length + 1

  let xref = `xref\n0 ${count}\n0000000000 65535 f \n`
  for (const offset of offsets) xref += `${String(offset).padStart(10, '0')} 00000 n \n`
  const trailer = (startxref) => `trailer\n<< /Size ${count} /Root 1 0 R >>\nstartxref\n${startxref}\n%%EOF\n`

  // The comment between body and xref absorbs the padding; startxref points at xref.
  let commentLen = Math.max(2, target - body.length - xref.length - trailer(0).length)
  for (let i = 0; i < 10; i++) {
    const total = body.length + commentLen + xref.length + trailer(body.length + commentLen).length
    const diff = target - total
    if (diff === 0) break
    commentLen = Math.max(2, commentLen + diff)
  }
  const startxref = body.length + commentLen
  const comment = `%${' '.repeat(commentLen - 2)}\n`
  return textToBytes(body + comment + xref + trailer(startxref))
}

const SIZE_UNITS = { b: 1, kb: 1024, mb: 1024 ** 2, gb: 1024 ** 3 }

/** Parse "2.5MB" / "500 kb" / "1048576" → bytes. Returns null on invalid input. */
export function parseSize(input) {
  const match = String(input).trim().match(/^([\d.]+)\s*(b|kb|mb|gb)?$/i)
  if (!match) return null
  const value = parseFloat(match[1])
  if (Number.isNaN(value) || value < 0) return null
  return Math.round(value * SIZE_UNITS[(match[2] || 'b').toLowerCase()])
}

/** Format a byte count for display: 1536 → "1.5 KB". */
export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`
}
