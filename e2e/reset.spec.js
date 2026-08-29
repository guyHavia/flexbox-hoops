import { test, expect } from '@playwright/test';

// Level 9 ("sixth-man"), per js/levels.js:
//   editableTargets: [{ kind: 'item', index: 1 }]
//   solution: { items: { 1: { alignSelf: 'flex-start' } } }
// Level 13 ("clutch-substitution"):
//   editableTargets: [{ kind: 'item', index: 3 }]
//   solution: { items: { 3: { order: -2 } } }
const CASES = [
  {
    levelNumber: 9,
    declaration: 'align-self: flex-start;',
    ballNth: 1,
    styleProp: 'alignSelf',
  },
  {
    levelNumber: 13,
    declaration: 'order: -2;',
    ballNth: 3,
    styleProp: 'order',
  },
];

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
});

for (const { levelNumber, declaration, ballNth, styleProp } of CASES) {
  test(`level ${levelNumber}: Reset clears the item-level inline style before checking`, async ({ page }) => {
    // First pass: solve the level for real, to confirm the declaration is correct.
    await page.locator('#level-nav .level-chip').nth(levelNumber - 1).click();
    await expect(page.locator('#level-indicator')).toHaveText(`Level ${levelNumber} of 14`);

    let textarea = page.locator('#editor-blocks textarea').first();
    await textarea.fill(declaration);
    await page.locator('#check-btn').click();
    await expect(page.locator('#success-overlay')).toBeVisible();

    // Get a truly fresh, unsolved instance of the level: reload the page
    // (clearing any DOM/module state) and re-navigate to the same level.
    await page.reload();
    await page.locator('#level-nav .level-chip').nth(levelNumber - 1).click();
    await expect(page.locator('#level-indicator')).toHaveText(`Level ${levelNumber} of 14`);

    // Confirm this instance is unsolved/blank before we touch it.
    textarea = page.locator('#editor-blocks textarea').first();
    await expect(textarea).toHaveValue('');

    // Type the solving declaration again, but click Reset before checking.
    await textarea.fill(declaration);
    const ball = page.locator('#ball-layer .ball').nth(ballNth);
    // Sanity check: typing it did apply the inline style live.
    await expect
      .poll(() => ball.evaluate((el, prop) => el.style[prop], styleProp))
      .not.toBe('');

    await page.locator('#reset-btn').click();

    const inlineStyleValue = await ball.evaluate((el, prop) => el.style[prop], styleProp);
    expect(inlineStyleValue).toBe('');

    // The textarea itself should also be cleared by Reset.
    await expect(textarea).toHaveValue('');

    // And the level should genuinely be unsolved: checking now should fail.
    await page.locator('#check-btn').click();
    await expect(page.locator('#success-overlay')).toBeHidden();
  });
}
