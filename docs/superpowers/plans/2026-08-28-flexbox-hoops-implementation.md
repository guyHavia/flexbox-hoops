# Flexbox Hoops Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a 12-level basketball-themed Flexbox learning game as a static site (HTML/CSS/JS, zero dependencies, zero build step).

**Architecture:** A static single-page app split into DOM-free pure logic modules (`levels.js`, `parser.js`, `geometry.js`, `progress.js`, `scoring.js`) and a thin DOM layer (`game.js`/`main.js`) that composes them. Each level renders two overlapping flex containers that share identical base geometry: one permanently styled with the level's solution (ghost baskets, always visible), one live-styled from the player's CSS-editor input (balls). A correct answer is reached by the real browser flex layout algorithm rather than simulated, and is confirmed by bounding-box proximity between each ball and its paired basket.

**Tech Stack:** Vanilla HTML5, CSS3 (Flexbox), JavaScript ES modules (`<script type="module">`). Node.js built-in test runner (`node --test`) + `node:assert/strict` for unit tests — no npm dependencies at all.

**Spec:** `docs/superpowers/specs/2026-08-28-flexbox-hoops-design.md`

## Global Constraints

- Pure HTML/CSS/JS only. Zero external JavaScript libraries, zero CDN scripts, zero build step (spec §3, §9).
- No CSS Grid anywhere in the puzzle layout (spec §9).
- The court board is a fixed 480×320px at every viewport (spec §7).
- Game source files are ES modules, loaded unmodified by both the browser and `node --test` (spec §3).
- Tests use only `node --test` / `node:assert/strict` — zero test dependencies (spec §3, §10).
- No full-page navigation between levels — one `index.html`, level switches happen entirely in JS state (spec §9).
- At least 6 levels are required; this plan implements 12 (spec §4).
- At least 3 levels must combine more than one flex property; levels 6, 9, 11 do (spec §4).
- At least 1 level must use `flex-wrap`; level 12 does (spec §4).
- No design, characters, or stage content copied from Flexbox Froggy — original basketball theme and level set (spec §1).

---

## Task 1: Project scaffolding + `geometry.js`

**Files:**
- Create: `package.json`
- Create: `js/geometry.js`
- Create: `tests/geometry.test.js`

**Interfaces:**
- Produces: `isAligned(rectA, rectB, tolerance = 6) -> boolean`, where `rectA`/`rectB` are objects with `left`/`right`/`top`/`bottom` numeric properties (the shape of `DOMRect`).

- [ ] **Step 1: Create `package.json`**

```json
{
  "name": "flexbox-hoops",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "description": "A basketball-themed game for learning CSS Flexbox.",
  "scripts": {
    "test": "node --test tests/"
  }
}
```

- [ ] **Step 2: Write the failing test**

Create `tests/geometry.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAligned } from '../js/geometry.js';

test('identical rects are aligned', () => {
  const rect = { left: 10, right: 50, top: 10, bottom: 50 };
  assert.equal(isAligned(rect, rect), true);
});

test('rects within tolerance are aligned', () => {
  const a = { left: 10, right: 50, top: 10, bottom: 50 };
  const b = { left: 14, right: 54, top: 10, bottom: 50 };
  assert.equal(isAligned(a, b, 6), true);
});

test('rects just outside tolerance are not aligned', () => {
  const a = { left: 10, right: 50, top: 10, bottom: 50 };
  const b = { left: 17, right: 57, top: 10, bottom: 50 };
  assert.equal(isAligned(a, b, 6), false);
});

test('vertical misalignment fails even when horizontal matches', () => {
  const a = { left: 10, right: 50, top: 10, bottom: 50 };
  const b = { left: 10, right: 50, top: 30, bottom: 70 };
  assert.equal(isAligned(a, b, 6), false);
});

test('default tolerance is 6px', () => {
  const a = { left: 10, right: 50, top: 10, bottom: 50 };
  const b = { left: 15, right: 55, top: 10, bottom: 50 };
  assert.equal(isAligned(a, b), true);
});
```

- [ ] **Step 3: Run the tests to verify they fail**

Run: `node --test tests/geometry.test.js`
Expected: FAIL — `js/geometry.js` does not exist yet.

- [ ] **Step 4: Write the minimal implementation**

Create `js/geometry.js`:

```js
export function isAligned(rectA, rectB, tolerance = 6) {
  const centerA = { x: (rectA.left + rectA.right) / 2, y: (rectA.top + rectA.bottom) / 2 };
  const centerB = { x: (rectB.left + rectB.right) / 2, y: (rectB.top + rectB.bottom) / 2 };
  return (
    Math.abs(centerA.x - centerB.x) <= tolerance &&
    Math.abs(centerA.y - centerB.y) <= tolerance
  );
}
```

- [ ] **Step 5: Run the tests to verify they pass**

Run: `node --test tests/geometry.test.js`
Expected: PASS (5 tests)

- [ ] **Step 6: Commit**

```bash
git checkout -b implement-flexbox-hoops
mkdir -p js tests css
git add package.json js/geometry.js tests/geometry.test.js
git commit -m "feat: scaffold project and add geometry alignment check"
```

---

## Task 2: `parser.js` — CSS declaration parser

**Files:**
- Create: `js/parser.js`
- Test: `tests/parser.test.js`

**Interfaces:**
- Produces: `parseDeclarations(text: string) -> Record<string, string | number>`, `ALLOWED_PROPERTIES: Set<string>` (camelCase property names).

- [ ] **Step 1: Write the failing test**

Create `tests/parser.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseDeclarations } from '../js/parser.js';

test('parses a single declaration', () => {
  assert.deepEqual(parseDeclarations('justify-content: flex-end;'), { justifyContent: 'flex-end' });
});

test('parses multiple declarations separated by newlines', () => {
  const text = 'justify-content: center;\nalign-items: center;';
  assert.deepEqual(parseDeclarations(text), { justifyContent: 'center', alignItems: 'center' });
});

test('parses declarations separated only by semicolons on one line', () => {
  const text = 'justify-content: center; align-items: center;';
  assert.deepEqual(parseDeclarations(text), { justifyContent: 'center', alignItems: 'center' });
});

test('is case-insensitive on the property name', () => {
  assert.deepEqual(parseDeclarations('JUSTIFY-CONTENT: center;'), { justifyContent: 'center' });
});

test('drops properties not on the whitelist', () => {
  assert.deepEqual(parseDeclarations('color: red; justify-content: center;'), { justifyContent: 'center' });
});

test('drops malformed lines with no colon', () => {
  assert.deepEqual(parseDeclarations('justify-content center; align-items: center;'), { alignItems: 'center' });
});

test('parses order as an integer', () => {
  assert.deepEqual(parseDeclarations('order: 2;'), { order: 2 });
});

test('empty or missing input returns an empty object', () => {
  assert.deepEqual(parseDeclarations(''), {});
  assert.deepEqual(parseDeclarations(undefined), {});
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/parser.test.js`
Expected: FAIL — `js/parser.js` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

Create `js/parser.js`:

```js
export const ALLOWED_PROPERTIES = new Set([
  'display',
  'flexDirection',
  'flexWrap',
  'flexFlow',
  'justifyContent',
  'alignItems',
  'alignContent',
  'alignSelf',
  'order',
  'gap',
  'rowGap',
  'columnGap',
  'flex',
  'flexGrow',
  'flexShrink',
  'flexBasis',
]);

function toCamelCase(prop) {
  return prop.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
}

export function parseDeclarations(text) {
  const result = {};
  if (!text) return result;

  const lines = text.split(/[;\n]/);
  for (const line of lines) {
    const colonIndex = line.indexOf(':');
    if (colonIndex < 1) continue;

    const rawProp = line.slice(0, colonIndex).trim().toLowerCase();
    const rawValue = line.slice(colonIndex + 1).trim();
    if (!rawProp || !rawValue) continue;

    const prop = toCamelCase(rawProp);
    if (!ALLOWED_PROPERTIES.has(prop)) continue;

    result[prop] = prop === 'order' ? (parseInt(rawValue, 10) || 0) : rawValue;
  }
  return result;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/parser.test.js`
Expected: PASS (8 tests)

- [ ] **Step 5: Commit**

```bash
git add js/parser.js tests/parser.test.js
git commit -m "feat: add whitelisted CSS declaration parser"
```

---

## Task 3: `levels.js` — level data + validator

**Files:**
- Create: `js/levels.js`
- Test: `tests/levels.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `LEVELS: Level[]`, `validateLevels(levels: Level[]) -> string[]` (empty array = valid). `Level` shape: `{ id, title, goal, hint, ballCount, base, editableTargets: {kind:'container'}|{kind:'item',index}[], solution: {container?: object, items?: {[index]: object}} }`.

- [ ] **Step 1: Write the failing test**

Create `tests/levels.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, validateLevels } from '../js/levels.js';

test('LEVELS passes its own validator with no errors', () => {
  assert.deepEqual(validateLevels(LEVELS), []);
});

test('has at least 6 levels', () => {
  assert.ok(LEVELS.length >= 6);
});

test('flags a level with a missing required field', () => {
  const broken = [{ id: 'x', title: 'X', ballCount: 1, editableTargets: [], solution: {} }];
  const errors = validateLevels(broken);
  assert.ok(errors.some((e) => e.includes('goal')));
});

test('flags a solution item index outside ballCount', () => {
  const broken = [{
    id: 'x', title: 'X', goal: 'g', ballCount: 1,
    editableTargets: [{ kind: 'item', index: 5 }],
    solution: { items: { 5: { order: 1 } } },
  }];
  const errors = validateLevels(broken);
  assert.ok(errors.some((e) => e.includes('item index 5')));
});

test('flags missing coverage of a required property', () => {
  const withoutWrap = LEVELS.filter((l) => l.id !== 'full-roster');
  const errors = validateLevels(withoutWrap);
  assert.ok(errors.some((e) => e.includes('flexWrap')));
});

test('flags fewer than 3 combined-property levels', () => {
  const combinedIds = ['center-court', 'bottom-up', 'one-man-down-low'];
  const nonCombined = LEVELS.filter((l) => !combinedIds.includes(l.id)).slice(0, 3);
  const errors = validateLevels(nonCombined);
  assert.ok(errors.some((e) => e.includes('combining more than one property')));
});

test('flags two levels with identical solutions', () => {
  const dup = [
    {
      id: 'a', title: 'A', goal: 'g', ballCount: 1,
      editableTargets: [{ kind: 'container' }],
      solution: { container: { justifyContent: 'center' } },
    },
    {
      id: 'b', title: 'B', goal: 'g', ballCount: 1,
      editableTargets: [{ kind: 'container' }],
      solution: { container: { justifyContent: 'center' } },
    },
  ];
  const errors = validateLevels(dup);
  assert.ok(errors.some((e) => e.includes('identical')));
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/levels.test.js`
Expected: FAIL — `js/levels.js` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

Create `js/levels.js`:

```js
export const LEVELS = [
  {
    id: 'baseline-drive',
    title: 'Baseline Drive',
    goal: 'One ball, one basket on the right edge of the court. Send the ball there.',
    hint: 'justify-content moves items along the main axis: flex-start, flex-end, center, space-between, space-around.',
    ballCount: 1,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { justifyContent: 'flex-end' } },
  },
  {
    id: 'top-of-the-key',
    title: 'Top of the Key',
    goal: 'The basket sits dead center on the main axis. Send the ball there.',
    hint: 'Try justify-content: center;',
    ballCount: 1,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { justifyContent: 'center' } },
  },
  {
    id: 'spread-the-floor',
    title: 'Spread the Floor',
    goal: 'Three balls, three baskets — one at each edge and one in the middle. Space them out.',
    hint: 'space-between pushes the first and last item to the edges and divides the remaining space evenly between the rest.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { justifyContent: 'space-between' } },
  },
  {
    id: 'even-spacing',
    title: 'Even Spacing',
    goal: 'Same three baskets, but now each one needs equal space on both sides of it.',
    hint: 'space-around gives every item half a unit of space at the ends, a full unit between items.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { justifyContent: 'space-around' } },
  },
  {
    id: 'low-post',
    title: 'Low Post',
    goal: 'The basket dropped to the floor. Follow it down the cross axis.',
    hint: 'align-items works on the cross axis. flex-end sends items to the bottom of a row.',
    ballCount: 1,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { alignItems: 'flex-end' } },
  },
  {
    id: 'center-court',
    title: 'Center Court',
    goal: 'Both axes this time — the basket hangs at the exact middle of the court.',
    hint: 'You need two declarations: one for the main axis, one for the cross axis.',
    ballCount: 1,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { justifyContent: 'center', alignItems: 'center' } },
  },
  {
    id: 'fast-break-back',
    title: 'Fast Break Back',
    goal: 'The colored rings show which ball belongs in which basket — the order is reversed.',
    hint: 'flex-direction: row-reverse flips the main axis, so items lay out right to left.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexDirection: 'row-reverse' } },
  },
  {
    id: 'stack-the-rack',
    title: 'Stack the Rack',
    goal: 'The baskets are stacked vertically now.',
    hint: 'flex-direction: column makes the main axis vertical.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexDirection: 'column' } },
  },
  {
    id: 'bottom-up',
    title: 'Bottom Up',
    goal: 'Stacked, reversed, and pushed to the bottom of the court.',
    hint: 'Combine column-reverse with a justify-content value. With column-reverse the main axis starts at the bottom.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexDirection: 'column-reverse', justifyContent: 'flex-end' } },
  },
  {
    id: 'sub-him-out',
    title: 'Sub Him Out',
    goal: 'Only the first ball is out of place — it belongs last. Change that one ball, not the court.',
    hint: 'order defaults to 0 for every item. A higher order moves an item later.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'item', index: 0 }],
    solution: { items: { 0: { order: 1 } } },
  },
  {
    id: 'one-man-down-low',
    title: 'One Man Down Low',
    goal: 'The court aligns every ball to the top. The second ball needs the bottom basket.',
    hint: 'align-self overrides align-items for a single item.',
    ballCount: 3,
    base: { alignItems: 'flex-start' },
    editableTargets: [{ kind: 'item', index: 1 }],
    solution: { items: { 1: { alignSelf: 'flex-end' } } },
  },
  {
    id: 'full-roster',
    title: 'Full Roster',
    goal: 'Eight balls, two rows of baskets. They will not fit on one line.',
    hint: 'flex-wrap: wrap lets items break onto new lines instead of overflowing.',
    ballCount: 8,
    base: { gap: '20px', alignContent: 'space-between' },
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexWrap: 'wrap' } },
  },
];

export function validateLevels(levels) {
  const errors = [];
  if (levels.length < 6) {
    errors.push(`expected at least 6 levels, got ${levels.length}`);
  }

  const seenIds = new Set();
  const propertiesUsed = new Set();
  const solutionSignatures = new Set();
  let combinedCount = 0;

  levels.forEach((level, index) => {
    const label = `level ${index} (${level.id ?? 'unknown id'})`;

    for (const field of ['id', 'title', 'goal', 'ballCount', 'editableTargets', 'solution']) {
      if (level[field] === undefined) {
        errors.push(`${label}: missing required field "${field}"`);
      }
    }

    if (level.id) {
      if (seenIds.has(level.id)) errors.push(`${label}: duplicate id`);
      seenIds.add(level.id);
    }

    const allProps = [...Object.keys(level.base || {})];
    if (level.solution?.container) {
      allProps.push(...Object.keys(level.solution.container));
    }
    if (level.solution?.items) {
      for (const [itemIndex, decl] of Object.entries(level.solution.items)) {
        if (Number(itemIndex) >= level.ballCount) {
          errors.push(`${label}: solution references item index ${itemIndex} but ballCount is ${level.ballCount}`);
        }
        allProps.push(...Object.keys(decl));
      }
    }
    allProps.forEach((p) => propertiesUsed.add(p));
    if (allProps.length > 1) combinedCount += 1;

    const signature = JSON.stringify(level.solution);
    if (solutionSignatures.has(signature)) {
      errors.push(`${label}: solution identical to another level`);
    }
    solutionSignatures.add(signature);
  });

  for (const required of ['flexDirection', 'justifyContent', 'alignItems', 'flexWrap']) {
    if (!propertiesUsed.has(required)) {
      errors.push(`no level uses required property "${required}"`);
    }
  }

  if (combinedCount < 3) {
    errors.push(`expected at least 3 levels combining more than one property, found ${combinedCount}`);
  }

  return errors;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/levels.test.js`
Expected: PASS (7 tests)

- [ ] **Step 5: Commit**

```bash
git add js/levels.js tests/levels.test.js
git commit -m "feat: add 12-level game data and a validator that encodes the assignment's rules"
```

---

## Task 4: `progress.js` — localStorage persistence

**Files:**
- Create: `js/progress.js`
- Test: `tests/progress.test.js`

**Interfaces:**
- Produces: `defaultProgress() -> {currentLevel:number, solved:object, attempts:object}`, `serializeProgress(state) -> string`, `parseProgress(raw: string|null) -> state`, `loadProgress() -> state` (reads `localStorage`), `saveProgress(state)` (writes `localStorage`).

- [ ] **Step 1: Write the failing test**

Create `tests/progress.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { defaultProgress, serializeProgress, parseProgress } from '../js/progress.js';

test('default progress has the expected shape', () => {
  assert.deepEqual(defaultProgress(), { currentLevel: 0, solved: {}, attempts: {} });
});

test('serialize then parse round-trips', () => {
  const state = { currentLevel: 3, solved: { 'baseline-drive': true }, attempts: { 'baseline-drive': 2 } };
  const roundTripped = parseProgress(serializeProgress(state));
  assert.deepEqual(roundTripped, state);
});

test('missing data falls back to default', () => {
  assert.deepEqual(parseProgress(null), defaultProgress());
  assert.deepEqual(parseProgress(''), defaultProgress());
});

test('corrupt JSON falls back to default', () => {
  assert.deepEqual(parseProgress('{not valid json'), defaultProgress());
});

test('wrong-shaped JSON falls back to default', () => {
  assert.deepEqual(parseProgress('{"currentLevel":"three"}'), defaultProgress());
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/progress.test.js`
Expected: FAIL — `js/progress.js` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

Create `js/progress.js`:

```js
const STORAGE_KEY = 'flexbox-hoops-progress';

export function defaultProgress() {
  return { currentLevel: 0, solved: {}, attempts: {} };
}

export function serializeProgress(state) {
  return JSON.stringify(state);
}

export function parseProgress(raw) {
  if (!raw) return defaultProgress();
  try {
    const parsed = JSON.parse(raw);
    const valid =
      typeof parsed === 'object' && parsed !== null &&
      typeof parsed.currentLevel === 'number' &&
      typeof parsed.solved === 'object' && parsed.solved !== null &&
      typeof parsed.attempts === 'object' && parsed.attempts !== null;
    return valid ? parsed : defaultProgress();
  } catch {
    return defaultProgress();
  }
}

export function loadProgress() {
  return parseProgress(localStorage.getItem(STORAGE_KEY));
}

export function saveProgress(state) {
  localStorage.setItem(STORAGE_KEY, serializeProgress(state));
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/progress.test.js`
Expected: PASS (5 tests) — `loadProgress`/`saveProgress` are not exercised by these tests since they touch the browser-only `localStorage` global; they're covered by manual verification in Task 10.

- [ ] **Step 5: Commit**

```bash
git add js/progress.js tests/progress.test.js
git commit -m "feat: add progress persistence with corrupt-data fallback"
```

---

## Task 5: `scoring.js` — attempt counters

**Files:**
- Create: `js/scoring.js`
- Test: `tests/scoring.test.js`

**Interfaces:**
- Produces: `attemptCount(attempts, levelId) -> number`, `recordAttempt(attempts, levelId) -> newAttempts`, `resetAttemptsFor(attempts, levelId) -> newAttempts`. All pure — return new objects, never mutate the input.

- [ ] **Step 1: Write the failing test**

Create `tests/scoring.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { attemptCount, recordAttempt, resetAttemptsFor } from '../js/scoring.js';

test('attemptCount defaults to 0 for an unseen level', () => {
  assert.equal(attemptCount({}, 'baseline-drive'), 0);
});

test('recordAttempt increments the given level', () => {
  const attempts = recordAttempt({ 'baseline-drive': 1 }, 'baseline-drive');
  assert.equal(attempts['baseline-drive'], 2);
});

test('recordAttempt does not mutate the input', () => {
  const original = { 'baseline-drive': 1 };
  recordAttempt(original, 'baseline-drive');
  assert.deepEqual(original, { 'baseline-drive': 1 });
});

test('recordAttempt leaves other levels untouched', () => {
  const attempts = recordAttempt({ a: 1, b: 5 }, 'a');
  assert.equal(attempts.b, 5);
});

test('resetAttemptsFor clears only the given level', () => {
  const attempts = resetAttemptsFor({ a: 3, b: 5 }, 'a');
  assert.equal(attemptCount(attempts, 'a'), 0);
  assert.equal(attempts.b, 5);
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `node --test tests/scoring.test.js`
Expected: FAIL — `js/scoring.js` does not exist yet.

- [ ] **Step 3: Write the minimal implementation**

Create `js/scoring.js`:

```js
export function attemptCount(attempts, levelId) {
  return attempts[levelId] || 0;
}

export function recordAttempt(attempts, levelId) {
  return { ...attempts, [levelId]: attemptCount(attempts, levelId) + 1 };
}

export function resetAttemptsFor(attempts, levelId) {
  const next = { ...attempts };
  delete next[levelId];
  return next;
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `node --test tests/scoring.test.js`
Expected: PASS (5 tests)

- [ ] **Step 5: Run the full suite**

Run: `npm test`
Expected: PASS — all 5 test files, 30 tests total.

- [ ] **Step 6: Commit**

```bash
git add js/scoring.js tests/scoring.test.js
git commit -m "feat: add pure attempt-counter helpers"
```

---

## Task 6: `index.html` + `css/styles.css` — static shell

**Files:**
- Create: `index.html`
- Create: `css/styles.css`

**Interfaces:**
- Produces: the DOM element ids Task 7+ query: `#level-indicator`, `#level-nav`, `#court`, `#basket-layer`, `#ball-layer`, `#success-overlay`, `#success-subtitle`, `#next-level-btn`, `#objective-text`, `#hint-toggle`, `#hint-text`, `#editor-blocks`, `#check-message`, `#reset-btn`, `#check-btn`, `#solved-counter`, `#app`. Produces CSS classes Task 7+ apply: `.ball`, `.basket`, `.basket__backboard`, `.basket__rim`, `.basket__net`, `.court-layer`, `.court-layer--baskets`, `.court-layer--balls`, `.level-chip`, `.level-chip--current`, `.level-chip--solved`, `.court--wrong`, `.css-block`, `.check-message--success`, `.check-message--error`.

- [ ] **Step 1: Create `index.html`**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Flexbox Hoops</title>
  <link rel="stylesheet" href="css/styles.css">
</head>
<body>
  <div id="app">
    <header class="app-header">
      <h1 class="app-title">Flexbox Hoops</h1>
      <div class="level-indicator" id="level-indicator"></div>
      <nav class="level-nav" id="level-nav"></nav>
    </header>

    <main class="game-main">
      <div class="court-wrapper">
        <div class="court" id="court">
          <div class="court-layer court-layer--baskets" id="basket-layer"></div>
          <div class="court-layer court-layer--balls" id="ball-layer"></div>

          <div class="success-overlay" id="success-overlay" hidden>
            <div class="success-overlay__scene">
              <div class="shooter"><div class="shooter__ball" id="success-ball"></div></div>
              <div class="success-overlay__hoop">
                <div class="success-overlay__hoop-backboard"></div>
                <div class="success-overlay__hoop-rim"></div>
                <div class="success-overlay__hoop-net"></div>
              </div>
            </div>
            <div class="success-overlay__title">Nothing but net</div>
            <div class="success-overlay__subtitle" id="success-subtitle"></div>
            <button class="btn btn--primary" id="next-level-btn">Next Level →</button>
          </div>
        </div>
      </div>

      <aside class="side-panel">
        <section class="panel-card">
          <h2 class="panel-card__label">Objective</h2>
          <p class="objective-text" id="objective-text"></p>
          <button class="hint-toggle" id="hint-toggle">Show hint</button>
          <p class="hint-text" id="hint-text" hidden></p>
        </section>

        <section class="panel-card panel-card--editor">
          <div class="panel-card__header">
            <h2 class="panel-card__label">CSS Editor</h2>
            <span class="live-dot"></span>
          </div>
          <div id="editor-blocks"></div>
          <p class="check-message" id="check-message" hidden></p>
          <div class="editor-actions">
            <button class="btn" id="reset-btn">Reset</button>
            <button class="btn btn--primary" id="check-btn">Check Solution</button>
          </div>
          <div class="solved-counter" id="solved-counter"></div>
        </section>
      </aside>
    </main>
  </div>

  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 2: Create `css/styles.css`**

```css
:root {
  --bg: #12331f;
  --panel-bg: #ffffff;
  --panel-border: rgba(26, 47, 122, 0.14);
  --text: #eafbea;
  --text-muted: #bfe3c8;
  --accent: #ffb703;
  --error: #d64545;
  --court-bg: radial-gradient(circle at 50% 100%, #245c37, #12331f 70%);
  --court-border: #e8d9b5;
}

* { box-sizing: border-box; }

body {
  margin: 0;
  font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
  background: var(--bg);
  color: var(--text);
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 14px 20px;
  flex-wrap: wrap;
}
.app-title { margin: 0; font-size: 20px; }
.level-indicator { font-size: 13px; color: var(--text-muted); }
.level-nav { display: flex; gap: 6px; flex-wrap: wrap; }
.level-chip {
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 1px solid var(--panel-border);
  background: transparent;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
}
.level-chip--current { background: var(--accent); color: #1b1400; border-color: transparent; }
.level-chip--solved { border-color: #2dcfb3; color: #2dcfb3; }

.game-main {
  flex: 1;
  display: flex;
  gap: 24px;
  padding: 0 20px 24px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.court-wrapper {
  overflow-x: auto;
  max-width: 100%;
}
.court {
  position: relative;
  width: 480px;
  height: 320px;
  background: var(--court-bg);
  border: 3px solid var(--court-border);
  border-radius: 10px;
  flex-shrink: 0;
}
.court-layer {
  position: absolute;
  inset: 0;
  display: flex;
  padding: 16px;
}
.court-layer--baskets { z-index: 1; opacity: 0.6; }
.court-layer--balls { z-index: 2; }

@keyframes court-shake {
  0%, 100% { transform: translateX(0); }
  20% { transform: translateX(-6px); }
  40% { transform: translateX(6px); }
  60% { transform: translateX(-4px); }
  80% { transform: translateX(4px); }
}
.court--wrong {
  animation: court-shake 0.3s ease-in-out;
  border-color: var(--error) !important;
}

.ball {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  flex-shrink: 0;
  background: radial-gradient(circle at 34% 28%, #ffab68, #e8701a 58%, #bf560f);
  box-shadow:
    inset -4px -6px 12px rgba(70, 26, 0, 0.30),
    0 4px 10px rgba(0, 0, 0, 0.25),
    0 0 0 3px var(--ring-color, #f4822a);
}
.ball::before,
.ball::after {
  content: '';
  position: absolute;
  background: rgba(70, 26, 0, 0.5);
}
.ball::before { left: 0; right: 0; top: 50%; height: 2px; margin-top: -1px; }
.ball::after { top: 0; bottom: 0; left: 50%; width: 2px; margin-left: -1px; }

.basket {
  position: relative;
  width: 52px;
  height: 52px;
  flex-shrink: 0;
}
.basket__backboard {
  position: absolute;
  top: -30px;
  left: 50%;
  width: 70px;
  height: 36px;
  margin-left: -35px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.75);
  border: 1.5px solid rgba(15, 27, 45, 0.35);
}
.basket__rim {
  position: absolute;
  top: -8px;
  left: 50%;
  width: 46px;
  height: 12px;
  margin-left: -23px;
  border-radius: 50%;
  border: 3px solid var(--ring-color, #f4822a);
}
.basket__net {
  position: absolute;
  top: -2px;
  left: 50%;
  width: 40px;
  height: 30px;
  margin-left: -20px;
  clip-path: polygon(0 0, 100% 0, 74% 100%, 26% 100%);
  background:
    repeating-linear-gradient(48deg, rgba(15, 27, 45, 0.4) 0 1px, transparent 1px 8px),
    repeating-linear-gradient(-48deg, rgba(15, 27, 45, 0.4) 0 1px, transparent 1px 8px);
}

.success-overlay {
  position: absolute;
  inset: 0;
  z-index: 5;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(242, 240, 238, 0.92);
  backdrop-filter: blur(6px);
  border-radius: 8px;
}
.success-overlay[hidden] { display: none; }

.success-overlay__scene { position: relative; width: 260px; height: 150px; }

.shooter { position: absolute; left: 10px; bottom: 0; width: 40px; height: 70px; }
.shooter::before {
  content: '';
  position: absolute;
  top: 0; left: 10px;
  width: 20px; height: 20px;
  border-radius: 50%;
  background: #1a2f7a;
}
.shooter::after {
  content: '';
  position: absolute;
  top: 18px; left: 6px;
  width: 28px; height: 40px;
  border-radius: 9px;
  background: #1a2f7a;
  animation: shooter-lean 1.6s ease-in-out both;
}
.shooter__ball {
  position: absolute;
  width: 26px;
  height: 26px;
  border-radius: 50%;
  background: radial-gradient(circle at 34% 28%, #ffab68, #e8701a 58%, #bf560f);
  animation: shooter-arc 1.6s cubic-bezier(0.32, 0.06, 0.5, 1) both;
}

@keyframes shooter-lean {
  0%, 55% { transform: rotate(0deg); }
  75% { transform: rotate(-12deg); }
  100% { transform: rotate(-12deg); }
}
@keyframes shooter-arc {
  0%, 55% { left: 30px; top: 10px; transform: rotate(0deg) scale(1); opacity: 1; }
  75% { left: 130px; top: -40px; transform: rotate(200deg) scale(0.9); opacity: 1; }
  92% { left: 210px; top: 20px; transform: rotate(380deg) scale(0.8); opacity: 1; }
  100% { left: 210px; top: 20px; transform: rotate(380deg) scale(0.8); opacity: 0; }
}

.success-overlay__hoop { position: absolute; right: 10px; top: 10px; width: 60px; height: 90px; }
.success-overlay__hoop-backboard {
  position: absolute; top: 0; right: 0;
  width: 44px; height: 30px;
  border-radius: 4px;
  background: rgba(255, 255, 255, 0.9);
  border: 1.5px solid rgba(26, 47, 122, 0.3);
}
.success-overlay__hoop-rim {
  position: absolute; top: 26px; right: 4px;
  width: 36px; height: 10px;
  border-radius: 50%;
  border: 3px solid #f4822a;
}
.success-overlay__hoop-net {
  position: absolute; top: 30px; right: 8px;
  width: 28px; height: 26px;
  transform-origin: top center;
  clip-path: polygon(0 0, 100% 0, 76% 100%, 24% 100%);
  background:
    repeating-linear-gradient(48deg, rgba(26, 47, 122, 0.4) 0 1.5px, transparent 1.5px 9px),
    repeating-linear-gradient(-48deg, rgba(26, 47, 122, 0.4) 0 1.5px, transparent 1.5px 9px);
  animation: hoop-net-swish 0.5s ease-out 1.3s both;
}
@keyframes hoop-net-swish {
  0% { transform: scaleY(1) skewX(0deg); }
  35% { transform: scaleY(1.5) skewX(5deg); }
  70% { transform: scaleY(0.88) skewX(-3deg); }
  100% { transform: scaleY(1) skewX(0deg); }
}

.success-overlay__title { font-size: 28px; font-weight: 700; color: #1a2f7a; }
.success-overlay__subtitle { font-size: 13px; letter-spacing: 0.08em; text-transform: uppercase; color: #5a6fa8; }

.side-panel {
  flex: 1;
  min-width: 280px;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.panel-card { background: var(--panel-bg); color: #1a2f7a; border-radius: 10px; padding: 14px 16px; }
.panel-card__label { font-size: 11px; letter-spacing: 0.1em; text-transform: uppercase; color: #5a6fa8; margin: 0 0 8px; }
.objective-text { margin: 0 0 8px; font-size: 14px; line-height: 1.5; }
.hint-toggle { background: none; border: none; color: #c2611a; font-size: 12px; cursor: pointer; padding: 0; }
.hint-text { margin: 8px 0 0; font-size: 12.5px; color: #5a6fa8; }

.panel-card__header { display: flex; align-items: center; justify-content: space-between; }
.live-dot { width: 6px; height: 6px; border-radius: 50%; background: #2dcfb3; }

.css-block { border: 1px solid var(--panel-border); border-radius: 8px; overflow: hidden; margin-bottom: 10px; }
.css-block__open, .css-block__close { padding: 6px 10px; background: #eae8e5; font-family: monospace; font-size: 11px; }
.css-block textarea {
  width: 100%;
  min-height: 64px;
  border: none;
  padding: 10px;
  font-family: monospace;
  font-size: 12.5px;
  resize: vertical;
}
.css-block textarea:focus { outline: none; background: #f7f7f5; }

.check-message { font-size: 13px; padding: 8px 10px; border-radius: 6px; }
.check-message--success { background: rgba(45, 207, 179, 0.15); color: #17836f; }
.check-message--error { background: rgba(214, 69, 69, 0.12); color: #a83232; }

.editor-actions { display: flex; gap: 8px; margin-top: 8px; }
.btn { padding: 8px 14px; border-radius: 6px; border: 1px solid var(--panel-border); background: #fff; color: #1a2f7a; font-size: 12.5px; cursor: pointer; }
.btn--primary { background: var(--accent); color: #1b1400; border-color: transparent; font-weight: 600; }

.solved-counter { margin-top: 10px; font-size: 11.5px; color: #5a6fa8; }

@media (max-width: 760px) {
  .game-main { flex-direction: column; }
  .side-panel { max-width: 100%; }
}
```

- [ ] **Step 3: Manually verify the static shell**

Run: `python3 -m http.server 8000` from the `task2/` directory, then open `http://localhost:8000` in a browser.

Expected: page loads with dark-green header/background, an empty court area (480×320, tan border), an empty side panel with "Objective" and "CSS Editor" cards. No JavaScript has run yet, so the court and panel text are empty — that's expected until Task 7.

- [ ] **Step 4: Commit**

```bash
git add index.html css/styles.css
git commit -m "feat: add static page shell and full stylesheet"
```

---

## Task 7: `game.js` — render levels and navigation

**Files:**
- Create: `js/game.js`

**Interfaces:**
- Consumes: `LEVELS` from `js/levels.js`.
- Produces: `init(root: HTMLElement)`. Internal (used by later tasks): `renderLevel()`, `goToLevel(index)`, module-level `state` and `els` objects.

- [ ] **Step 1: Create `js/game.js`**

```js
import { LEVELS } from './levels.js';

const RING_COLORS = ['#f4822a', '#29aaed', '#2dcfb3', '#7c3aed'];

const state = {
  levelIndex: 0,
};

let els = {};

function ringColor(index) {
  return RING_COLORS[index % RING_COLORS.length];
}

function solutionStyles(level) {
  return {
    containerStyle: { ...level.base, ...(level.solution.container || {}) },
    itemStyles: { ...(level.solution.items || {}) },
  };
}

function createBall(index) {
  const el = document.createElement('div');
  el.className = 'ball';
  el.style.setProperty('--ring-color', ringColor(index));
  return el;
}

function createBasket(index) {
  const el = document.createElement('div');
  el.className = 'basket';
  el.style.setProperty('--ring-color', ringColor(index));
  el.innerHTML = `
    <div class="basket__backboard"></div>
    <div class="basket__rim"></div>
    <div class="basket__net"></div>
  `;
  return el;
}

function applyContainerStyle(layerEl, style) {
  layerEl.removeAttribute('style');
  Object.assign(layerEl.style, style);
}

function applyItemStyle(itemEl, style) {
  for (const [prop, value] of Object.entries(style)) {
    itemEl.style[prop] = value;
  }
}

function renderLevelNav() {
  els.levelNav.innerHTML = '';
  LEVELS.forEach((level, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'level-chip';
    chip.textContent = String(index + 1);
    chip.title = level.title;
    if (index === state.levelIndex) chip.classList.add('level-chip--current');
    chip.addEventListener('click', () => goToLevel(index));
    els.levelNav.appendChild(chip);
  });
}

function renderBasketLayer(level) {
  els.basketLayer.innerHTML = '';
  const { containerStyle, itemStyles } = solutionStyles(level);
  applyContainerStyle(els.basketLayer, containerStyle);
  for (let i = 0; i < level.ballCount; i++) {
    const basket = createBasket(i);
    if (itemStyles[i]) applyItemStyle(basket, itemStyles[i]);
    els.basketLayer.appendChild(basket);
  }
}

function renderBallLayer(level) {
  els.ballLayer.innerHTML = '';
  applyContainerStyle(els.ballLayer, { ...level.base });
  for (let i = 0; i < level.ballCount; i++) {
    els.ballLayer.appendChild(createBall(i));
  }
}

function renderObjective(level) {
  els.objectiveText.textContent = level.goal;
  els.hintText.textContent = level.hint;
  els.hintText.hidden = true;
  els.hintToggle.textContent = 'Show hint';
}

function renderLevelIndicator() {
  els.levelIndicator.textContent = `Level ${state.levelIndex + 1} of ${LEVELS.length}`;
}

function renderLevel() {
  const level = LEVELS[state.levelIndex];
  renderBasketLayer(level);
  renderBallLayer(level);
  renderObjective(level);
  renderLevelIndicator();
  renderLevelNav();
  els.successOverlay.hidden = true;
}

function goToLevel(index) {
  state.levelIndex = index;
  renderLevel();
}

export function init(root) {
  els = {
    levelIndicator: root.querySelector('#level-indicator'),
    levelNav: root.querySelector('#level-nav'),
    basketLayer: root.querySelector('#basket-layer'),
    ballLayer: root.querySelector('#ball-layer'),
    objectiveText: root.querySelector('#objective-text'),
    hintText: root.querySelector('#hint-text'),
    hintToggle: root.querySelector('#hint-toggle'),
    successOverlay: root.querySelector('#success-overlay'),
  };

  els.hintToggle.addEventListener('click', () => {
    els.hintText.hidden = !els.hintText.hidden;
    els.hintToggle.textContent = els.hintText.hidden ? 'Show hint' : 'Hide hint';
  });

  renderLevel();
}
```

- [ ] **Step 2: Wire up a temporary bootstrap to verify in-browser**

Create `js/main.js` (this file is extended in Task 11, but needs to exist now to test):

```js
import { init } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
  init(document.getElementById('app'));
});
```

Add the script tag if not already present — it already is, from Task 6's `index.html`.

- [ ] **Step 3: Manually verify**

Run: `python3 -m http.server 8000` from `task2/`, open `http://localhost:8000`.

Expected: header shows "Level 1 of 12" and 12 numbered chips (chip 1 highlighted). The court shows basket ghosts positioned per level 1's solution (one basket near the right edge — `justify-content: flex-end`). One ball renders at the default top-left flex position (unwired until Task 8 — this is expected). Click chip 8 ("Stack the Rack"): indicator reads "Level 8 of 12", objective text updates, and the 3 basket ghosts now stack vertically down the left edge.

- [ ] **Step 4: Commit**

```bash
git add js/game.js js/main.js
git commit -m "feat: render levels, basket ghost targets, and level navigation"
```

---

## Task 8: CSS editor — live style application

**Files:**
- Modify: `js/game.js`

**Interfaces:**
- Consumes: `parseDeclarations` from `js/parser.js`.
- Produces (new, used by Task 9): `userStyles(level)`, `applyUserStyles()`.

- [ ] **Step 1: Add the parser import**

At the top of `js/game.js`, add:

```js
import { parseDeclarations } from './parser.js';
```

- [ ] **Step 2: Add editor state and rendering functions**

Add these functions to `js/game.js` (after `renderLevelIndicator`, before `renderLevel`):

```js
function blockLabel(target) {
  return target.kind === 'container' ? '.court' : `.ball:nth-child(${target.index + 1})`;
}

function userStyles(level) {
  const containerStyle = { ...level.base };
  const itemStyles = {};

  level.editableTargets.forEach((target, i) => {
    const parsed = parseDeclarations(state.texts[i] || '');
    if (target.kind === 'container') {
      Object.assign(containerStyle, parsed);
    } else {
      itemStyles[target.index] = { ...(itemStyles[target.index] || {}), ...parsed };
    }
  });

  return { containerStyle, itemStyles };
}

function applyUserStyles() {
  const level = LEVELS[state.levelIndex];
  const { containerStyle, itemStyles } = userStyles(level);
  applyContainerStyle(els.ballLayer, containerStyle);
  Array.from(els.ballLayer.children).forEach((ballEl, index) => {
    if (itemStyles[index]) applyItemStyle(ballEl, itemStyles[index]);
  });
}

function renderEditor(level) {
  state.texts = level.editableTargets.map(() => '');
  els.editorBlocks.innerHTML = '';

  level.editableTargets.forEach((target, i) => {
    const wrapper = document.createElement('div');
    wrapper.className = 'css-block';
    wrapper.innerHTML = `
      <div class="css-block__open">${blockLabel(target)} {</div>
      <textarea placeholder="${target.kind === 'container' ? 'property: value;' : '  order: …;'}"></textarea>
      <div class="css-block__close">}</div>
    `;
    const textarea = wrapper.querySelector('textarea');
    textarea.addEventListener('input', () => {
      state.texts[i] = textarea.value;
      applyUserStyles();
    });
    els.editorBlocks.appendChild(wrapper);
  });
}
```

- [ ] **Step 3: Wire the editor into level rendering**

Modify `renderLevel()` in `js/game.js` to add the editor and apply the (empty) user styles:

```js
function renderLevel() {
  const level = LEVELS[state.levelIndex];
  renderBasketLayer(level);
  renderBallLayer(level);
  renderEditor(level);
  applyUserStyles();
  renderObjective(level);
  renderLevelIndicator();
  renderLevelNav();
  els.successOverlay.hidden = true;
}
```

- [ ] **Step 4: Register the new element in `init`**

Modify `init(root)` in `js/game.js` — add `editorBlocks` to the `els` object:

```js
  els = {
    levelIndicator: root.querySelector('#level-indicator'),
    levelNav: root.querySelector('#level-nav'),
    basketLayer: root.querySelector('#basket-layer'),
    ballLayer: root.querySelector('#ball-layer'),
    objectiveText: root.querySelector('#objective-text'),
    hintText: root.querySelector('#hint-text'),
    hintToggle: root.querySelector('#hint-toggle'),
    successOverlay: root.querySelector('#success-overlay'),
    editorBlocks: root.querySelector('#editor-blocks'),
  };
```

- [ ] **Step 5: Manually verify**

Reload `http://localhost:8000`. On level 1 ("Baseline Drive"), a `.court { }` textarea appears in the side panel. Type `justify-content: flex-end;` — the ball moves to the right edge and visually lands on the basket ghost as you finish typing. Click chip 10 ("Sub Him Out"): the editor block label reads `.ball:nth-child(1) {` instead of `.court {`.

- [ ] **Step 6: Commit**

```bash
git add js/game.js
git commit -m "feat: wire CSS editor textareas to live ball-layer styling"
```

---

## Task 9: Check Solution, Reset, and feedback animations

**Files:**
- Modify: `js/game.js`

**Interfaces:**
- Consumes: `isAligned` from `js/geometry.js`.
- Produces (new, used by Task 10): `handleCheck()`, `handleReset()`, `handleSuccess(level)`, `handleWrong()`.

- [ ] **Step 1: Add the geometry import**

At the top of `js/game.js`, add:

```js
import { isAligned } from './geometry.js';
```

- [ ] **Step 2: Add check/reset/feedback functions**

Add these functions to `js/game.js` (after `renderEditor`, before `renderLevel`):

```js
function ballBasketPairs() {
  const balls = Array.from(els.ballLayer.children);
  const baskets = Array.from(els.basketLayer.children);
  return balls.map((ball, i) => [ball, baskets[i]]);
}

function isLevelSolved() {
  return ballBasketPairs().every(([ball, basket]) =>
    isAligned(ball.getBoundingClientRect(), basket.getBoundingClientRect())
  );
}

function showCheckMessage(text, kind) {
  els.checkMessage.hidden = false;
  els.checkMessage.textContent = text;
  els.checkMessage.className = `check-message check-message--${kind}`;
}

function handleWrong() {
  showCheckMessage('Not quite — try again.', 'error');
  els.court.classList.remove('court--wrong');
  void els.court.offsetWidth; // restart the shake animation even on repeated wrong answers
  els.court.classList.add('court--wrong');
}

function handleSuccess() {
  els.checkMessage.hidden = true;
  els.successOverlay.hidden = false;
}

function handleCheck() {
  if (isLevelSolved()) {
    handleSuccess();
  } else {
    handleWrong();
  }
}

function handleReset() {
  const level = LEVELS[state.levelIndex];
  state.texts = level.editableTargets.map(() => '');
  Array.from(els.editorBlocks.querySelectorAll('textarea')).forEach((t) => { t.value = ''; });
  applyUserStyles();
  els.checkMessage.hidden = true;
}
```

- [ ] **Step 3: Reset transient UI state at the top of `renderLevel`**

Modify `renderLevel()` in `js/game.js` to clear the wrong-shake class and check message when switching levels:

```js
function renderLevel() {
  const level = LEVELS[state.levelIndex];
  els.court.classList.remove('court--wrong');
  els.checkMessage.hidden = true;
  renderBasketLayer(level);
  renderBallLayer(level);
  renderEditor(level);
  applyUserStyles();
  renderObjective(level);
  renderLevelIndicator();
  renderLevelNav();
  els.successOverlay.hidden = true;
}
```

- [ ] **Step 4: Register new elements and wire the buttons in `init`**

Modify `init(root)` in `js/game.js`:

```js
export function init(root) {
  els = {
    levelIndicator: root.querySelector('#level-indicator'),
    levelNav: root.querySelector('#level-nav'),
    court: root.querySelector('#court'),
    basketLayer: root.querySelector('#basket-layer'),
    ballLayer: root.querySelector('#ball-layer'),
    objectiveText: root.querySelector('#objective-text'),
    hintText: root.querySelector('#hint-text'),
    hintToggle: root.querySelector('#hint-toggle'),
    successOverlay: root.querySelector('#success-overlay'),
    editorBlocks: root.querySelector('#editor-blocks'),
    checkMessage: root.querySelector('#check-message'),
    checkBtn: root.querySelector('#check-btn'),
    resetBtn: root.querySelector('#reset-btn'),
  };

  els.hintToggle.addEventListener('click', () => {
    els.hintText.hidden = !els.hintText.hidden;
    els.hintToggle.textContent = els.hintText.hidden ? 'Show hint' : 'Hide hint';
  });
  els.checkBtn.addEventListener('click', handleCheck);
  els.resetBtn.addEventListener('click', handleReset);

  renderLevel();
}
```

- [ ] **Step 5: Manually verify**

Reload the page. On level 1, click "Check Solution" without typing anything: the court shakes, its border flashes red, and "Not quite — try again." appears. Type `justify-content: flex-end;`, click "Check Solution" again: the success overlay appears (shooter leans back, ball arcs to the hoop, net swishes, "Nothing but net" shows). Click "Reset": the textarea clears and the ball returns to its default position.

- [ ] **Step 6: Commit**

```bash
git add js/game.js
git commit -m "feat: add Check Solution / Reset with success and wrong-answer feedback"
```

---

## Task 10: Persistence, scoring, and level advancement

**Files:**
- Modify: `js/game.js`

**Interfaces:**
- Consumes: `loadProgress`, `saveProgress` from `js/progress.js`; `attemptCount`, `recordAttempt`, `resetAttemptsFor` from `js/scoring.js`.
- Produces: `goToNextLevel()`, `renderSolvedCounter()`.

- [ ] **Step 1: Add the progress and scoring imports**

At the top of `js/game.js`, add:

```js
import { defaultProgress, loadProgress, saveProgress } from './progress.js';
import { attemptCount, recordAttempt, resetAttemptsFor } from './scoring.js';
```

- [ ] **Step 2: Add `progress` to state and a solved-counter renderer**

Change the `state` declaration in `js/game.js`:

```js
const state = {
  levelIndex: 0,
  progress: defaultProgress(),
};
```

Add this function (after `renderLevelIndicator`):

```js
function renderSolvedCounter() {
  const solvedCount = Object.keys(state.progress.solved).length;
  els.solvedCounter.textContent = `${solvedCount} / ${LEVELS.length} solved`;
}
```

- [ ] **Step 3: Mark solved chips in `renderLevelNav`**

Modify `renderLevelNav()` in `js/game.js`:

```js
function renderLevelNav() {
  els.levelNav.innerHTML = '';
  LEVELS.forEach((level, index) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'level-chip';
    chip.textContent = String(index + 1);
    chip.title = level.title;
    if (index === state.levelIndex) chip.classList.add('level-chip--current');
    if (state.progress.solved[level.id]) chip.classList.add('level-chip--solved');
    chip.addEventListener('click', () => goToLevel(index));
    els.levelNav.appendChild(chip);
  });
}
```

- [ ] **Step 4: Persist progress on success, wrong answer, and reset**

Modify `handleSuccess`, `handleWrong`, and `handleReset` in `js/game.js`:

```js
function handleSuccess() {
  const level = LEVELS[state.levelIndex];
  state.progress.solved[level.id] = true;
  saveProgress(state.progress);
  els.checkMessage.hidden = true;
  renderLevelNav();
  renderSolvedCounter();
  els.successOverlay.hidden = false;
}

function handleWrong() {
  const level = LEVELS[state.levelIndex];
  state.progress.attempts = recordAttempt(state.progress.attempts, level.id);
  saveProgress(state.progress);
  showCheckMessage(`Not quite — try again. (attempt ${attemptCount(state.progress.attempts, level.id)})`, 'error');
  els.court.classList.remove('court--wrong');
  void els.court.offsetWidth;
  els.court.classList.add('court--wrong');
}

function handleReset() {
  const level = LEVELS[state.levelIndex];
  state.texts = level.editableTargets.map(() => '');
  Array.from(els.editorBlocks.querySelectorAll('textarea')).forEach((t) => { t.value = ''; });
  applyUserStyles();
  els.checkMessage.hidden = true;
  state.progress.attempts = resetAttemptsFor(state.progress.attempts, level.id);
  saveProgress(state.progress);
}
```

- [ ] **Step 5: Add `goToNextLevel` and persist on every level change**

Modify `goToLevel` and add `goToNextLevel` in `js/game.js`:

```js
function goToLevel(index) {
  state.levelIndex = index;
  state.progress.currentLevel = index;
  saveProgress(state.progress);
  renderLevel();
}

function goToNextLevel() {
  const isLast = state.levelIndex >= LEVELS.length - 1;
  goToLevel(isLast ? 0 : state.levelIndex + 1);
}
```

- [ ] **Step 6: Load progress and wire the next-level button and solved counter in `init`**

Modify `init(root)` in `js/game.js`:

```js
export function init(root) {
  els = {
    levelIndicator: root.querySelector('#level-indicator'),
    levelNav: root.querySelector('#level-nav'),
    court: root.querySelector('#court'),
    basketLayer: root.querySelector('#basket-layer'),
    ballLayer: root.querySelector('#ball-layer'),
    objectiveText: root.querySelector('#objective-text'),
    hintText: root.querySelector('#hint-text'),
    hintToggle: root.querySelector('#hint-toggle'),
    successOverlay: root.querySelector('#success-overlay'),
    editorBlocks: root.querySelector('#editor-blocks'),
    checkMessage: root.querySelector('#check-message'),
    checkBtn: root.querySelector('#check-btn'),
    resetBtn: root.querySelector('#reset-btn'),
    nextLevelBtn: root.querySelector('#next-level-btn'),
    solvedCounter: root.querySelector('#solved-counter'),
  };

  state.progress = loadProgress();
  state.levelIndex = state.progress.currentLevel || 0;

  els.hintToggle.addEventListener('click', () => {
    els.hintText.hidden = !els.hintText.hidden;
    els.hintToggle.textContent = els.hintText.hidden ? 'Show hint' : 'Hide hint';
  });
  els.checkBtn.addEventListener('click', handleCheck);
  els.resetBtn.addEventListener('click', handleReset);
  els.nextLevelBtn.addEventListener('click', goToNextLevel);

  renderLevel();
  renderSolvedCounter();
}
```

Also add `renderSolvedCounter();` at the end of `renderLevel()`, right after `renderLevelNav();`.

- [ ] **Step 7: Manually verify**

Reload the page, solve level 1 (type `justify-content: flex-end;`, click Check Solution), click "Next Level →". Confirm the header now reads "Level 2 of 12", chip 1 is marked solved (green outline), and "1 / 12 solved" shows. Reload the browser tab entirely (F5): confirm you resume on level 2, chip 1 is still marked solved, and the counter still reads "1 / 12 solved". On level 2, click "Check Solution" twice without typing anything: confirm the message shows "(attempt 1)" then "(attempt 2)".

- [ ] **Step 8: Commit**

```bash
git add js/game.js
git commit -m "feat: persist progress and attempts, wire next-level advancement"
```

---

## Task 11: `main.js` finalize + responsive verification

**Files:**
- Modify: `js/main.js`

**Interfaces:**
- Consumes: `init` from `js/game.js`.

- [ ] **Step 1: Confirm `js/main.js` is complete**

`js/main.js` was created in Task 7 and needs no further code changes:

```js
import { init } from './game.js';

document.addEventListener('DOMContentLoaded', () => {
  init(document.getElementById('app'));
});
```

- [ ] **Step 2: Manually verify responsive behavior**

With the local server running, open the browser devtools responsive-design mode:
- At a desktop width (≥1024px): court and side panel sit side by side.
- At 700px width: the side panel stacks below the court (the `@media (max-width: 760px)` rule in `css/styles.css` takes over).
- At 375px width (a typical phone): the court's `court-wrapper` scrolls horizontally (`overflow-x: auto`) rather than shrinking the court — confirm via devtools that `.court` still measures exactly 480×320 in the computed styles panel at every width tested.

- [ ] **Step 3: Commit**

Only commit if Step 2 required a CSS fix; otherwise this task needs no commit. If a fix was needed:

```bash
git add css/styles.css
git commit -m "fix: correct responsive breakpoint for narrow viewports"
```

---

## Task 12: Full QA pass + README

**Files:**
- Create: `README.md`

- [ ] **Step 1: Run the full automated test suite**

Run: `npm test`
Expected: PASS — all 30 tests across `geometry.test.js`, `parser.test.js`, `levels.test.js`, `progress.test.js`, `scoring.test.js`.

- [ ] **Step 2: Manually solve every level end-to-end**

With the local server running and `localStorage` cleared (devtools → Application → Local Storage → clear), play through all 12 levels in order, for each one:
1. Read the objective text and (if needed) the hint.
2. Type the correct declaration(s) into the CSS editor block(s).
3. Click "Check Solution" and confirm the success overlay plays and "Next Level →" advances.

Also, on at least 2 levels, deliberately type a wrong value first and confirm the shake + "Not quite" message appears before correcting it. On at least 1 level, click "Reset" after typing something and confirm the ball returns to its unstyled position.

- [ ] **Step 3: Create `README.md`**

```markdown
# Flexbox Hoops

A 12-level basketball-themed game for learning CSS Flexbox. Arrange balls
on the court by editing real CSS declarations — when your flex properties
match the level's target, the balls land in the baskets.

## Running locally

No build step, no dependencies. From this directory:

​```
python3 -m http.server 8000
​```

Then open `http://localhost:8000`.

## Running tests

​```
npm test
​```

Runs the pure-logic unit tests (`js/geometry.js`, `js/parser.js`,
`js/levels.js`, `js/progress.js`, `js/scoring.js`) with Node's built-in
test runner — zero dependencies to install.

## Project structure

- `index.html`, `css/styles.css` — page shell and all styling.
- `js/levels.js` — the 12 level definitions and a validator that checks
  them against the assignment's own rules.
- `js/parser.js` — parses the CSS declarations typed into the editor.
- `js/geometry.js` — the ball/basket alignment check.
- `js/progress.js`, `js/scoring.js` — localStorage persistence and
  attempt counting.
- `js/game.js`, `js/main.js` — DOM rendering, event wiring, bootstrap.
- `tests/` — one test file per pure module above.

## Status

Implemented and tested locally. Not yet deployed to GitHub Pages.
```

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: add README with run/test instructions"
```
