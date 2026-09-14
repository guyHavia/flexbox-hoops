import { test, expect } from '@playwright/test';

test.use({ viewport: { width: 375, height: 667 } });

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test('narrow viewport keeps the court fixed-size and stacks the panel below it', async ({ page }) => {
  await page.goto('/');

  const courtWidth = await page.locator('.court').evaluate(
    (el) => el.getBoundingClientRect().width
  );
  expect(courtWidth).toBe(320);

  const courtBox = await page.locator('.court').boundingBox();
  const panelBox = await page.locator('.side-panel').boundingBox();

  // Side panel should be visually below the court, not beside it.
  expect(panelBox.y).toBeGreaterThanOrEqual(courtBox.y + courtBox.height);
});
