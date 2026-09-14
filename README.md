# Flexbox Hoops

**Submitted by:** Guy Havia & Ori Peretz

A 14-level basketball-themed game for learning CSS Flexbox. Arrange balls
on the court by editing real CSS declarations — when your flex properties
match the level's target, the balls land in the baskets. Inspired by the
general idea of Flexbox Froggy, but with an original theme, level set, and
teaching sequence — see "Design notes" below.

## Running locally

No build step, no dependencies. From this directory:

```
python3 -m http.server 8000
```

Then open `http://localhost:8000`.

The page must be served over HTTP — opening `index.html` directly via
`file://` will show a blank page, because ES modules
(`<script type="module">`) are blocked by CORS under the `file://`
protocol.

## Running tests

```
npm test
```

Runs the pure-logic unit tests (`js/geometry.js`, `js/parser.js`,
`js/levels.js`, `js/progress.js`, `js/scoring.js`) with Node's built-in
test runner — zero dependencies to install.

### End-to-end tests

```
npm install -D @playwright/test
npx playwright install chromium
npm run test:e2e
```

Runs a real, browser-driven Playwright suite (`e2e/*.spec.js`) against
`index.html` served over HTTP — Playwright's `webServer` option starts and
stops `python3 -m http.server 8000` automatically for the test run. Covers:

- **`level-flow.spec.js`** — page load, header/level-nav rendering, solving
  level 1, advancing to the next level, jumping via a level-nav chip, and a
  regression check that the basket backboard art renders fully inside the
  court's border.
- **`levels-1-6-solve.spec.js`** — levels 1-6 solved individually with their
  documented solution (plus wrong/partial-answer coverage where a level has
  one), then all six solved in sequence via **Next Level**, re-verified
  against live ball/basket geometry independent of the app's own
  success-overlay flag.
- **`levels-7-14-solve.spec.js`** — levels 7-14 solved individually
  (including the two-item `order` puzzle at level 8 and the two-property
  combo at level 7), each re-verified against live geometry; plus dedicated
  "partial answer isn't enough" checks for levels 7 and 14, and "the fix is
  scoped to the targeted ball only" checks for levels 8 and 13.
- **`level-7-direction.spec.js`** — level 7's `column-reverse` +
  `justify-content: flex-start` + `align-items: flex-end` solution packs the
  balls against the bottom-right of the court, matching its goal text.
- **`level-14-wrap.spec.js`** — level 14 genuinely requires both
  `flex-wrap: wrap` and `align-content: space-between` together; `flex-wrap`
  alone does not solve it.
- **`reset.spec.js`** — levels 9 (`align-self`) and 13 (`order`): solving
  them, then on a fresh instance, typing the solving declaration and
  clicking **Reset** before checking, confirming the affected ball's inline
  style is actually cleared.
- **`editor-parser-reset.spec.js`** — live re-render on keystroke (before
  any Check click), case-insensitive property names, whitespace tolerance,
  unknown properties silently dropped, empty/wrong submissions, the Reset
  button's textarea/inline-style/attempt-counter behavior, a documented
  `check-message` visibility bug, and level 4's two-property (`justify-content`
  + `align-items`) requirement parsed both as a one-liner and one-per-line.
- **`wrong-answer.spec.js`** — an empty/wrong submission flags the court
  (`court--wrong`) and shows an error message; a subsequent correct
  submission both succeeds and removes the wrong-state class.
- **`nav-hint-persistence.spec.js`** — level-nav chip rendering and solved
  state, the hint toggle (including auto-collapse on navigation), objective
  text per level, **Next Level** wraparound from the last level back to the
  first, progress persistence across reload, and resilience to corrupted or
  out-of-range `localStorage` state.
- **`persistence.spec.js`** — solved progress survives a page reload
  (level-nav chip stays marked solved, solved-counter updates).
- **`responsive.spec.js`** — at a 375×667 viewport, `.court` stays a fixed
  480px wide (relying on horizontal scroll) and the side panel stacks below
  the court instead of beside it.
- **`visual-responsive-overlay.spec.js`** — win-overlay shooter/hoop art
  geometry at desktop size, a screenshot artifact, hoop-part alignment, the
  raised-arm animation's end state, and layout behavior at mobile/tablet
  viewports.

This suite is what caught a real bug: the basket backboard art rendered
~11px above the court's own top edge and was silently clipped by
`.court-wrapper`'s overflow. Fixed in `css/styles.css` by giving
`.court-layer` more top padding. See `e2e-report.md` for the full writeup,
including a visual spot-check of basket-art bounds and ball-to-hoop
alignment.

## Design notes

The assignment (see the brief) permits using Flexbox Froggy's general idea
as inspiration but forbids copying its design, characters, or levels. This
project's level set was deliberately built to diverge from Froggy's actual
24-level curriculum rather than reskin it: properties are combined much
earlier (level 4 pairs `justify-content` + `align-items`, instead of
Froggy's single-property-only levels 1-5), `flex-direction: row-reverse` is
introduced at level 2 instead of level 8, several levels pre-set the
container to a value the player must actively override (`base` differs from
the level's `solution`, e.g. level 1 starts at `justify-content: flex-end`
and must be reset to `flex-start`) — a mechanic Froggy never uses — one
`order` puzzle edits two items in the same level instead of one, `align-self`
is taught inside a `column` layout instead of a row, and `align-content:
space-around` appears as a wrap-level value Froggy's 24 levels never use at
all.

## Project structure

- `index.html`, `css/styles.css` — page shell and all styling.
- `js/levels.js` — the 14 level definitions and a validator that checks
  them against the assignment's own rules.
- `js/parser.js` — parses the CSS declarations typed into the editor.
- `js/geometry.js` — the ball/basket alignment check.
- `js/progress.js`, `js/scoring.js` — localStorage persistence and
  attempt counting.
- `js/game.js`, `js/main.js` — DOM rendering, event wiring, bootstrap.
- `tests/` — one test file per pure module above.
- `e2e/`, `playwright.config.js` — browser-driven Playwright end-to-end
  tests (`npm run test:e2e`); see "End-to-end tests" above.
- `docs/superpowers/` (and the gitignored `.superpowers/`) — this
  project's planning/process artifacts (design spec, implementation plan,
  SDD ledger). Not part of the shipped game itself, which is
  `index.html`, `css/`, and `js/`.

## Status

- **Automated tests: passing.** `npm test` runs 30/30 tests across all
  five pure-logic modules (`geometry`, `parser`, `levels`, `progress`,
  `scoring`).
- **Browser-driven E2E: passing.** `npm run test:e2e` runs 58 real
  Playwright tests across 12 spec files in `e2e/`, against Chromium,
  covering every level's solve flow (including the two multi-item `order`
  puzzles and the base-override "reset to default" puzzle), level-nav
  jumps and wraparound, Reset clearing item-level inline styles, wrong-
  answer/success class handling, the combined-property requirements on
  levels 4, 7, and 14, progress persistence across reload, and the
  narrow-viewport responsive layout. This is a real browser clicking
  through the actual rendered page — not a logic trace.
- **One real bug found and fixed by the E2E suite.** A visual spot-check
  (full-page screenshot + `getBoundingClientRect()` measurements of level
  1's default state) showed the basket backboard art rendering ~11px above
  the court's own top edge, silently clipped by `.court-wrapper`'s
  overflow. Fixed in `css/styles.css` by increasing `.court-layer`'s top
  padding from 16px to 34px, with a screenshot re-check confirming the
  backboard now renders fully inside the court's border. Ball-to-hoop
  vertical alignment was checked the same way and found correct — no fix
  needed there. Full details in `e2e-report.md`.
