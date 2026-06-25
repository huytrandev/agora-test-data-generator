// Deterministic initials avatar generated from a name. The pure helpers
// (avatarInitials, avatarHue) are DOM-free and unit-tested; avatarDataUrl draws
// on a canvas (browser only).

const AVATAR_SIZE = 256

export function avatarInitials(seed) {
  const words = String(seed).trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return (words[0][0] + words[words.length - 1][0]).toUpperCase()
}

// Stable hue in [0, 360) — same name always yields the same colour.
export function avatarHue(seed) {
  let hash = 0
  const s = String(seed)
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0
  return hash % 360
}

export function avatarDataUrl(seed, size = AVATAR_SIZE) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')
  const hue = avatarHue(seed)
  // Transparent corners + a filled circle → a round avatar in the PNG itself.
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.closePath()
  ctx.fillStyle = `hsl(${hue} 55% 45%)`
  ctx.fill()
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.font = `700 ${Math.round(size * 0.4)}px 'Atkinson Hyperlegible', system-ui, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText(avatarInitials(seed), size / 2, size / 2 + size * 0.02)
  return canvas.toDataURL('image/png')
}
