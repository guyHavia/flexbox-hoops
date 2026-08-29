import { test, expect } from '@playwright/test';

// Level 7 ("baseline-out-of-bounds"), per js/levels.js:
//   base: { flexDirection: 'column-reverse' }
//   editableTargets: [{ kind: 'container' }]
//   solution: { container: { justifyContent: 'flex-start', alignItems: 'flex-end' } }
// Goal text: "Stacked and reversed already — now push the whole group down
// to the very bottom of the court, and pin it to the right edge."
//
// With flex-direction: column-reverse, the main axis starts at the bottom,
// so justify-content: flex-start packs the group toward the bottom (not
// the top). align-items: flex-end handles the cross axis, pinning the
// group to the right edge.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await page.locator('#level-nav .level-chip').nth(6).click();
  await expect(page.locator('#level-indicator')).toHaveText('Level 7 of 14');
});

test('level 7 solution stacks balls toward the bottom-right of the court', async ({ page }) => {
  const textarea = page.locator('#editor-blocks textarea').first();
  await textarea.fill('justify-content: flex-start;\nalign-items: flex-end;');

  // Screenshot before checking, for visual confirmation of ball placement.
  await page.screenshot({ path: 'test-results/level-7-before-check.png' });

  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();

  // Geometric confirmation: every ball should be aligned with its basket
  // (already asserted by success), the group should sit flush against the
  // court's bottom edge (not the top), and hug the right edge. The 3-ball
  // stack (156px) is tall relative to the court's usable height, so its
  // top ball can end up above the exact vertical midline even while the
  // whole group is packed against the bottom — check the group's bottom
  // edge and center of mass instead of every ball's top individually.
  const courtBox = await page.locator('#court').boundingBox();
  const ballBoxes = await page.locator('#ball-layer .ball').evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, right: r.right };
    })
  );
  const courtMidY = courtBox.y + courtBox.height / 2;
  const courtBottomEdge = courtBox.y + courtBox.height;
  const courtRightEdge = courtBox.x + courtBox.width;

  const groupBottom = Math.max(...ballBoxes.map((b) => b.bottom));
  const groupCenterY = ballBoxes.reduce((sum, b) => sum + (b.top + b.bottom) / 2, 0) / ballBoxes.length;

  // The stack's bottom edge sits close to the court's own bottom edge.
  expect(courtBottomEdge - groupBottom).toBeLessThan(30);
  // The stack as a whole is pushed below center, not straddling or above it.
  expect(groupCenterY).toBeGreaterThan(courtMidY);

  for (const { right } of ballBoxes) {
    expect(right).toBeGreaterThan(courtBox.x + courtBox.width / 2);
  }
  // The rightmost ball should sit close to the court's own right edge.
  const rightmost = Math.max(...ballBoxes.map((b) => b.right));
  expect(courtRightEdge - rightmost).toBeLessThan(40);
});
