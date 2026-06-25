// Browser-only: build downloadable dummy files at an exact target size.
// The image base is drawn on a canvas (solid colour + label so it compresses
// tiny); file-format.js then pads it to the exact size. PDF is synthesized
// directly (no canvas needed).

import { padPng, padJpeg, buildPdf, formatSize } from './file-format.js'

export const FILE_TYPES = {
  png: { mime: 'image/png', ext: 'png', label: 'PNG' },
  jpeg: { mime: 'image/jpeg', ext: 'jpg', label: 'JPEG' },
  pdf: { mime: 'application/pdf', ext: 'pdf', label: 'PDF' },
}

// Synchronous on purpose: canvas.toDataURL encodes inline, unlike toBlob (which
// runs off-thread and stalls under headless virtual-time).
export function dataUrlToBytes(dataUrl) {
  const binary = atob(dataUrl.slice(dataUrl.indexOf(',') + 1))
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
  return bytes
}

function imageBytes(typeKey, target, label, index) {
  const canvas = document.createElement('canvas')
  canvas.width = 480
  canvas.height = 300
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = `hsl(${(index * 47) % 360} 58% 56%)`
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.fillStyle = 'rgba(0, 0, 0, 0.8)'
  ctx.font = '22px monospace'
  ctx.fillText(label, 28, 160)
  const base = dataUrlToBytes(canvas.toDataURL(FILE_TYPES[typeKey].mime, 0.9))
  return typeKey === 'png' ? padPng(base, target) : padJpeg(base, target)
}

export function generateFile(typeKey, target, index) {
  const meta = FILE_TYPES[typeKey]
  const label = `Agora dummy #${index} - ${formatSize(target)}`
  const bytes = typeKey === 'pdf' ? buildPdf(target, label) : imageBytes(typeKey, target, label, index)
  return {
    name: `agora-dummy-${index}-${formatSize(target).replace(/\s+/g, '')}.${meta.ext}`,
    mime: meta.mime,
    typeLabel: meta.label,
    sizeBytes: bytes.length,
    blob: new Blob([bytes], { type: meta.mime }),
  }
}

export function generateFiles(typeKey, target, count) {
  return Array.from({ length: count }, (_, i) => generateFile(typeKey, target, i + 1))
}
