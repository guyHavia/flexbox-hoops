import { test, expect } from '@playwright/test';

// Level 1 ("opening-tip") solution, per js/levels.js:
//   base: { justifyContent: 'flex-end' }
//   solution: { container: { justifyContent: 'flex-start' } }
const LEVEL_1_SOLUTION = 'justify-content: flex-start;';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
});

test('wrong answer flags the court, correct answer clears the flag', async ({ page }) => {
  const court = page.locator('#court');
  const checkMessage = page.locator('#check-message');

  // Empty/wrong textarea -> Check Solution.
  await page.locator('#check-btn').click();

  await expect(court).toHaveClass(/court--wrong/);
  await expect(checkMessage).toBeVisible();
  await expect(checkMessage).toHaveText(/not quite/i);
  await expect(checkMessage).toHaveClass(/check-message--error/);
  await expect(page.locator('#success-overlay')).toBeHidden();

  // Now supply the correct solution and check again.
  await page.locator('#editor-blocks textarea').first().fill(LEVEL_1_SOLUTION);
  await page.locator('#check-btn').click();

  await expect(page.locator('#success-overlay')).toBeVisible();
  // The wrong-state class must not leak through after a subsequent success.
  await expect(court).not.toHaveClass(/court--wrong/);
});
