import { test, expect } from '@playwright/test';

// Level 1 ("opening-tip") solution, per js/levels.js:
//   base: { justifyContent: 'flex-end' }
//   solution: { container: { justifyContent: 'flex-start' } }
const LEVEL_1_SOLUTION = 'justify-content: flex-start;';

test.beforeEach(async ({ page }) => {
  // Clear localStorage once for a clean starting state. Deliberately NOT
  // using addInitScript here (unlike other specs) because this test
  // reloads the page mid-test and needs progress to actually persist
  // across that reload rather than being wiped every navigation.
  await page.goto('/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
});

test('solved progress survives a page reload', async ({ page }) => {
  await page.locator('#editor-blocks textarea').first().fill(LEVEL_1_SOLUTION);
  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();

  await page.reload();

  const firstChip = page.locator('#level-nav .level-chip').nth(0);
  await expect(firstChip).toHaveClass(/level-chip--solved/);

  const solvedCounter = page.locator('#solved-counter');
  await expect(solvedCounter).toHaveText(/^([1-9]\d*) \/ 14 solved$/);
});
