import { test } from 'node:test'
import assert from 'node:assert/strict'
import { avatarInitials, avatarHue } from '../js/avatar.js'

test('avatarInitials takes first + last word initials', () => {
  assert.equal(avatarInitials('Vincent Rozario'), 'VR')
  assert.equal(avatarInitials('Kumar s/o Suppiah'), 'KS')
  assert.equal(avatarInitials('Aiman bin Yusof'), 'AY')
  assert.equal(avatarInitials('Isla Seah Hui Ling'), 'IL')
})

test('avatarInitials handles a single word', () => {
  assert.equal(avatarInitials('Madonna'), 'MA')
})

test('avatarInitials is uppercase and defensive on empty input', () => {
  assert.equal(avatarInitials('  '), '?')
  assert.equal(avatarInitials('chloe foo'), 'CF')
})

test('avatarHue is deterministic and within range', () => {
  for (const name of ['Vincent Rozario', 'Kumar Suppiah', 'Isla Seah', '']) {
    const hue = avatarHue(name)
    assert.ok(hue >= 0 && hue < 360, `hue out of range: ${hue}`)
    assert.equal(avatarHue(name), hue, 'same name → same hue')
  }
})

test('avatarHue differs for different names (typical case)', () => {
  assert.notEqual(avatarHue('Vincent Rozario'), avatarHue('Kumar Suppiah'))
})
