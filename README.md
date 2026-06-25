# Agora · Test Data Generator

A static, browser-only tool that generates realistic, **non-duplicating** dummy data for
testing Agora forms — and stress-tests how the UI handles long / rich text. No server, no build step.

It replaces the old single-file `agora-faker.html`. The main improvement: names (and course /
product names, SKUs, course codes) are now **guaranteed unique within a batch**, instead of being
re-picked at random from small arrays.

## Data types

`Parent`, `Student / Child`, `Course`, `Course Instance`, `Class`, `Product`, `Update Message` — each
maps to the fields of the matching Agora form, including the verbatim enum tokens for dropdown fields.
`Class` mirrors the "Add New Class" form (class name, business unit, venue, teachers, courses) plus a
programmes field.

## How it works

- **Singapore-realistic names** — weighted by rough demographics (Chinese / Malay / Indian /
  Eurasian) with the right conventions (`bin` / `binte`, `s/o` / `d/o`, surname-first Chinese names).
- **No duplicates** — each Generate run keeps a per-batch set of used values; collisions are
  regenerated. When the **Seed** field is blank, uniqueness also holds across consecutive runs in the
  same session.
- **Seed** — enter a number for reproducible output (same seed → same batch). Blank = random.
- **Text length** — `Normal` / `Long` / `Stress (overflow)` to exercise truncation and wrapping.
- **Faker (optional)** — varied lorem text is pulled from [`@faker-js/faker`](https://fakerjs.dev/)
  via CDN. If the CDN is unreachable the tool falls back to an offline word pool (the status pill
  shows which source is active). Names and addresses are always generated locally for SG realism.

## Usage

1. Open `index.html` in a browser (or the deployed Netlify URL).
2. Pick a type, set how many, choose a text length, hit **Generate**.
3. **Click any value to copy it.** Use **copy all** / **json** per card, or **JSON** / **CSV** to
   export the whole batch. For `Update Message`, **copy formatted** keeps rich formatting for pasting
   into a WYSIWYG editor.

## Project layout

```
index.html          # markup + control bar
css/styles.css       # styling
js/
  rng.js             # seeded PRNG + sampling primitives
  data.js            # SG name pools + Agora enum tokens
  names.js           # SG name engine + batch uniqueness
  text.js            # lorem + rich-HTML message (swappable word provider)
  faker.js           # Faker CDN loader with offline fallback
  generators.js      # the six entity generators + shared batch context
  clipboard.js       # copy text / rich HTML + JSON / CSV export
  main.js            # UI wiring
tests/               # node:test unit tests for the pure logic modules
```

`rng`, `data`, `names`, `text`, `generators` are DOM-free and unit-tested; `faker`, `clipboard`,
`main` are browser-only.

## Tests

Requires Node ≥ 18 (built-in test runner). From this directory:

```bash
node --test tests/
# or
npm test
```

## Deploy

This is a static site with no build step — `index.html` is at the repo root and uses relative asset
paths, so any static host works.

### GitHub Pages (current)

Pages serves the `main` branch root directly; no Actions workflow needed. After pushing:

1. Repo → Settings → Pages → Source = **Deploy from a branch**, Branch = `main`, folder = `/ (root)`.
2. Live at `https://<user>.github.io/<repo>/`.

Pushing to `main` redeploys automatically.

### Netlify (alternative)

`netlify deploy --dir=. --prod`, or drag & drop the folder into the dashboard (`netlify.toml` included).
