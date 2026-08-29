import { test, expect } from '@playwright/test';

// Level 1 ("opening-tip"), per js/levels.js:
//   editableTargets: [{ kind: 'container' }]
//   base: { justifyContent: 'flex-end' }
//   solution: { container: { justifyContent: 'flex-start' } }
const LEVEL_1_SOLUTION = 'justify-content: flex-start;';

// Level 4 ("corner-three"), per js/levels.js:
//   editableTargets: [{ kind: 'container' }]
//   solution: { container: { justifyContent: 'space-between', alignItems: 'flex-end' } }
const LEVEL_4_INDEX = 3; // zero-based nav index

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
});

test('typing the correct declaration re-renders live, before any Check click', async ({ page }) => {
  const ball = page.locator('#ball-layer .ball').first();
  const textarea = page.locator('#editor-blocks textarea').first();

  const beforeBox = await ball.boundingBox();

  // Type character-by-character to simulate a real user typing; the
  // textarea's `input` listener re-applies styles on every keystroke.
  await textarea.pressSequentially(LEVEL_1_SOLUTION);

  // Confirm the container actually picked up the inline style live.
  await expect
    .poll(() => page.locator('#ball-layer').evaluate((el) => el.style.justifyContent))
    .toBe('flex-start');

  // The ball starts at the right edge (base: justify-content: flex-end) and
  // the solution moves it to the left edge, so its x position should drop.
  const afterBox = await ball.boundingBox();
  expect(afterBox.x).toBeLessThan(beforeBox.x);

  // None of this required clicking Check.
  await expect(page.locator('#success-overlay')).toBeHidden();
});

test('uppercase kebab-case property name is accepted', async ({ page }) => {
  const textarea = page.locator('#editor-blocks textarea').first();
  await textarea.fill('JUSTIFY-CONTENT: flex-start;');

  await page.locator('#check-btn').click();

  await expect(page.locator('#success-overlay')).toBeVisible();
});

test('extra blank lines and surrounding whitespace do not break parsing', async ({ page }) => {
  const textarea = page.locator('#editor-blocks textarea').first();
  const text = '\n\n   \n  justify-content :   flex-start   ;  \n\n   \n';
  await textarea.fill(text);

  await page.locator('#check-btn').click();

  await expect(page.locator('#success-overlay')).toBeVisible();
});

test('unknown property is silently dropped alongside a valid one, no page errors', async ({ page }) => {
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', (err) => pageErrors.push(err));
  page.on('console', (msg) => {
    if (msg.type() === 'error') consoleErrors.push(msg.text());
  });

  const textarea = page.locator('#editor-blocks textarea').first();
  await textarea.fill('foo-bar: baz; justify-content: flex-start;');

  await page.locator('#check-btn').click();

  await expect(page.locator('#success-overlay')).toBeVisible();
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('empty submission is flagged as wrong without crashing', async ({ page }) => {
  const court = page.locator('#court');
  const checkMessage = page.locator('#check-message');

  await expect(page.locator('#editor-blocks textarea').first()).toHaveValue('');
  await page.locator('#check-btn').click();

  await expect(court).toHaveClass(/court--wrong/);
  await expect(checkMessage).toBeVisible();
  await expect(checkMessage).toHaveText(/not quite/i);
  await expect(page.locator('#success-overlay')).toBeHidden();
});

test('wrong submission then correct submission clears court--wrong and shows success', async ({ page }) => {
  const court = page.locator('#court');
  const checkMessage = page.locator('#check-message');

  await page.locator('#check-btn').click();
  await expect(court).toHaveClass(/court--wrong/);
  await expect(checkMessage).toBeVisible();

  await page.locator('#editor-blocks textarea').first().fill(LEVEL_1_SOLUTION);
  await page.locator('#check-btn').click();

  await expect(page.locator('#success-overlay')).toBeVisible();
  await expect(court).not.toHaveClass(/court--wrong/);
});

test('attempt counter increments across consecutive wrong submissions', async ({ page }) => {
  const checkMessage = page.locator('#check-message');
  const checkBtn = page.locator('#check-btn');

  await checkBtn.click();
  await expect(checkMessage).toHaveText(/\(attempt 1\)/);

  await checkBtn.click();
  await expect(checkMessage).toHaveText(/\(attempt 2\)/);

  await checkBtn.click();
  await expect(checkMessage).toHaveText(/\(attempt 3\)/);
});

test('Reset clears the textarea, the inline style, and the check-message `hidden` DOM property', async ({ page }) => {
  const textarea = page.locator('#editor-blocks textarea').first();
  const checkMessage = page.locator('#check-message');
  const ballLayer = page.locator('#ball-layer');

  // Generate a wrong attempt first so an attempt count exists for this level.
  await page.locator('#check-btn').click();
  await expect(checkMessage).toHaveText(/\(attempt 1\)/);

  // Type a partial/garbage value so there's a live inline style to clear.
  await textarea.fill('justify-content: center;');
  await expect
    .poll(() => ballLayer.evaluate((el) => el.style.justifyContent))
    .toBe('center');

  await page.locator('#reset-btn').click();

  await expect(textarea).toHaveValue('');
  // Reset clears the *user's* override, not the level's own base state —
  // level 1's base sets justify-content: flex-end, so that's what should
  // remain once the typed override is gone.
  await expect
    .poll(() => ballLayer.evaluate((el) => el.style.justifyContent))
    .toBe('flex-end');

  // Assert at the DOM-property level (independent of CSS rendering) that
  // handleReset() really does set `checkMessage.hidden = true` (js/game.js:219).
  // See the dedicated bug-report test below for why this does NOT translate
  // into the element actually being visually hidden.
  await expect
    .poll(() => checkMessage.evaluate((el) => el.hidden))
    .toBe(true);
});

test('Reset restarts the attempt counter for the level back to (attempt 1)', async ({ page }) => {
  const checkMessage = page.locator('#check-message');

  // Rack up two wrong attempts.
  await page.locator('#check-btn').click();
  await expect(checkMessage).toHaveText(/\(attempt 1\)/);
  await page.locator('#check-btn').click();
  await expect(checkMessage).toHaveText(/\(attempt 2\)/);

  await page.locator('#reset-btn').click();

  // A fresh wrong attempt after Reset should restart the counter at 1,
  // confirming Reset actually calls resetAttemptsFor (js/game.js:220) and
  // not just a UI clear.
  await page.locator('#check-btn').click();
  await expect(checkMessage).toHaveText(/\(attempt 1\)/);
});

// --- Known bug -------------------------------------------------------------
// `#check-message` never actually becomes visually hidden, in ANY code path
// that sets `els.checkMessage.hidden = true` (handleReset at js/game.js:219,
// handleSuccess at js/game.js:199, renderLevel at js/game.js:227), because
// css/styles.css:632 declares `.check-message { display: flex; ... }`
// unconditionally. Per the CSS cascade, an author-origin "normal" declaration
// always wins over the user-agent stylesheet's `[hidden] { display: none }`
// rule regardless of selector specificity, so setting the `hidden` IDL
// property/attribute has no visual effect on this element. Contrast with
// `.success-overlay[hidden] { display: none; }` at css/styles.css:391, which
// is the correct pattern the author used elsewhere in the same file but
// forgot to apply to `.check-message`.
//
// Practical impact: after Reset (or after a success), the previous message's
// text and error/success styling stay on screen (the element still renders,
// just with empty text, unless it's the current message).
test('BUG: #check-message stays visually visible after Reset despite hidden=true (missing CSS [hidden] rule)', async ({ page }) => {
  const checkMessage = page.locator('#check-message');

  // Show an error message, then Reset — handleReset() sets hidden = true.
  await page.locator('#check-btn').click();
  await expect(checkMessage).toBeVisible();
  await page.locator('#reset-btn').click();

  // Expected: the message is visually hidden, matching the DOM-level intent
  // documented in the previous test (checkMessage.hidden === true).
  // Actual: css/styles.css has no `.check-message[hidden] { display: none; }`
  // override, so `.check-message { display: flex; }` keeps winning and the
  // element remains laid out/visible.
  await expect(checkMessage).toBeHidden();
});

test('level 4 requires BOTH justify-content and align-items; only one is not enough', async ({ page }) => {
  await page.locator('#level-nav .level-chip').nth(LEVEL_4_INDEX).click();
  await expect(page.locator('#level-indicator')).toHaveText('Level 4 of 14');

  const textarea = page.locator('#editor-blocks textarea').first();

  // Only justify-content: not solved.
  await textarea.fill('justify-content: space-between;');
  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeHidden();

  // Only align-items (replacing the previous value): still not solved.
  await textarea.fill('align-items: flex-end;');
  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeHidden();

  // Both together: solved.
  await textarea.fill('justify-content: space-between; align-items: flex-end;');
  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();
});

test('level 4: semicolon-separated one-liner and one-per-line declarations parse identically', async ({ page }) => {
  const textarea = page.locator('#editor-blocks textarea').first();

  // One line, semicolon-separated.
  await page.locator('#level-nav .level-chip').nth(LEVEL_4_INDEX).click();
  await expect(page.locator('#level-indicator')).toHaveText('Level 4 of 14');
  await textarea.fill('justify-content: space-between; align-items: flex-end;');
  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();

  // Fresh instance of the same level, declarations split across two lines.
  await page.reload();
  await page.locator('#level-nav .level-chip').nth(LEVEL_4_INDEX).click();
  await expect(page.locator('#level-indicator')).toHaveText('Level 4 of 14');
  const textarea2 = page.locator('#editor-blocks textarea').first();
  await textarea2.fill('justify-content: space-between;\nalign-items: flex-end;');
  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();
});
