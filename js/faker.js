// Loads Faker from a CDN and wires it in as the word provider for text.js.
// On any failure the tool keeps working with the offline LOREM pool.

import { setWordProvider } from './text.js'

const FAKER_CDN = 'https://cdn.jsdelivr.net/npm/@faker-js/faker@9/+esm'

let faker = null

export async function loadFaker() {
  try {
    const mod = await import(/* @vite-ignore */ FAKER_CDN)
    faker = mod.faker
    setWordProvider({
      word: () => faker.lorem.word(),
      words: (_rng, n) => faker.lorem.words(n),
    })
    return { ok: true }
  } catch (error) {
    console.warn('Faker CDN unavailable — falling back to offline word pool.', error)
    return { ok: false, error }
  }
}

// Keep seeded runs reproducible by seeding Faker's own stream too.
export function seedFaker(seed) {
  if (faker && typeof seed === 'number' && !Number.isNaN(seed)) faker.seed(seed)
}
