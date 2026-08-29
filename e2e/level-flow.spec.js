import { test, expect } from '@playwright/test';

// Level 1 ("opening-tip") solution, per js/levels.js:
//   base: { justifyContent: 'flex-end' }
//   solution: { container: { justifyContent: 'flex-start' } }
const LEVEL_1_SOLUTION = 'justify-content: flex-start;';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
});

test('smoke: loads, solves level 1, advances, and jumps via level nav', async ({ page }) => {
  await expect(page.locator('#level-indicator')).toHaveText('Level 1 of 14');

  const chips = page.locator('#level-nav .level-chip');
  await expect(chips).toHaveCount(14);

  // Regression check for a real bug found via screenshot: the basket
  // backboard used to render ~11px above the court's own top edge and get
  // silently clipped by .court-wrapper's overflow. It must now render
  // fully inside the court's border.
  const basketGeometry = await page.evaluate(() => {
    const court = document.querySelector('.court');
    const backboard = document.querySelector('.basket__backboard');
    const courtRect = court.getBoundingClientRect();
    const borderTop = parseFloat(getComputedStyle(court).borderTopWidth);
    return {
      courtInnerTop: courtRect.top + borderTop,
      backboardTop: backboard.getBoundingClientRect().top,
    };
  });
  expect(basketGeometry.backboardTop).toBeGreaterThanOrEqual(basketGeometry.courtInnerTop);

  // Solve level 1.
  const textarea = page.locator('#editor-blocks textarea').first();
  await textarea.fill(LEVEL_1_SOLUTION);
  await page.locator('#check-btn').click();

  await expect(page.locator('#success-overlay')).toBeVisible();

  // Advance to level 2.
  await page.locator('#next-level-btn').click();
  await expect(page.locator('#level-indicator')).toHaveText('Level 2 of 14');

  // Jump to level 5 via the nav chip.
  await chips.nth(4).click();
  await expect(page.locator('#level-indicator')).toHaveText('Level 5 of 14');
});
