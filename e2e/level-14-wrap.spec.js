import { test, expect } from '@playwright/test';

// Level 14 ("full-roster"), per js/levels.js:
//   editableTargets: [{ kind: 'container' }]
//   solution: { container: { flexWrap: 'wrap', alignContent: 'space-between' } }
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await page.locator('#level-nav .level-chip').nth(13).click();
  await expect(page.locator('#level-indicator')).toHaveText('Level 14 of 14');
});

test('level 14 requires both flex-wrap and align-content, not just flex-wrap', async ({ page }) => {
  const textarea = page.locator('#editor-blocks textarea').first();
  const successOverlay = page.locator('#success-overlay');

  // Only flex-wrap: wrap; -> should NOT solve it.
  await textarea.fill('flex-wrap: wrap;');
  await page.locator('#check-btn').click();
  await expect(successOverlay).toBeHidden();

  // Add align-content: space-between; alongside it -> should solve it.
  await textarea.fill('flex-wrap: wrap;\nalign-content: space-between;');
  await page.locator('#check-btn').click();
  await expect(successOverlay).toBeVisible();
});
