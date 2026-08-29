import { test, expect } from '@playwright/test';

// Level 1 ("opening-tip") solution, per js/levels.js:
//   base: { justifyContent: 'flex-end' }
//   solution: { container: { justifyContent: 'flex-start' } }
const LEVEL_1_SOLUTION = 'justify-content: flex-start;';

// The success-overlay scene runs several CSS animations before it settles into
// its final ("both" fill-mode) resting state: shooter-hop / leg-bend /
// shooter-arm-throw / shooter-arm-guide / shadow-pulse (0.9s each), ball-arc
// (1.05s), hand-snap (0.2s starting at a 0.33s delay, finishing at 0.53s),
// hoop-net-swish (0.4s starting at a 0.98s delay, finishing at 1.38s), and
// finally .success-overlay__result's fade-in (0.3s starting at a 1.45s delay,
// finishing at 1.75s) once the ball has resolved through the net. Wait past
// all of them before measuring geometry so assertions reflect the settled
// scene, not a mid-animation frame.
const OVERLAY_SETTLE_MS = 2000;

const SHOOTER_AND_HOOP_PARTS = [
  '.shooter__head',
  '.shooter__torso',
  '.shooter__leg--left',
  '.shooter__leg--right',
  '.shooter__arm--throw',
  '.shooter__arm--guide',
  '.shooter__shadow',
  '.shooter__ball',
  '.success-overlay__hoop-pole',
  '.success-overlay__hoop-backboard',
  '.success-overlay__hoop-rim',
  '.success-overlay__hoop-net',
];

async function solveLevel1(page) {
  await expect(page.locator('#level-indicator')).toHaveText('Level 1 of 14');
  const textarea = page.locator('#editor-blocks textarea').first();
  await textarea.fill(LEVEL_1_SOLUTION);
  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => localStorage.clear());
});

test.describe('win-overlay geometry (desktop, 1280x800)', () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test('every shooter/hoop part renders with real size and stays inside the court', async ({ page }) => {
    await page.goto('/');
    await solveLevel1(page);
    await page.waitForTimeout(OVERLAY_SETTLE_MS);

    const result = await page.evaluate((selectors) => {
      const rectOf = (el) => {
        const r = el.getBoundingClientRect();
        return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height };
      };
      return {
        court: rectOf(document.querySelector('.court')),
        parts: selectors.map((sel) => ({ sel, ...rectOf(document.querySelector(sel)) })),
      };
    }, SHOOTER_AND_HOOP_PARTS);

    for (const part of result.parts) {
      expect(part.width, `${part.sel} width should be non-zero`).toBeGreaterThan(0);
      expect(part.height, `${part.sel} height should be non-zero`).toBeGreaterThan(0);
    }

    // "Substantially overlapping" the court: allow a small tolerance for
    // decorative overhang (e.g. shadow blur, net fringe) but nothing should
    // be wildly outside the court box the way the pre-fix backboard clipping
    // bug (see e2e-report.md) was.
    const TOLERANCE = 10;
    for (const part of result.parts) {
      expect(part.left, `${part.sel} left edge within court`).toBeGreaterThanOrEqual(result.court.left - TOLERANCE);
      expect(part.right, `${part.sel} right edge within court`).toBeLessThanOrEqual(result.court.right + TOLERANCE);
      expect(part.top, `${part.sel} top edge within court`).toBeGreaterThanOrEqual(result.court.top - TOLERANCE);
      expect(part.bottom, `${part.sel} bottom edge within court`).toBeLessThanOrEqual(result.court.bottom + TOLERANCE);
    }
  });

  test('win overlay screenshot artifact can be captured', async ({ page }) => {
    await page.goto('/');
    await solveLevel1(page);
    await page.waitForTimeout(OVERLAY_SETTLE_MS);

    // No assertion on the image itself — just confirm the screenshot call
    // succeeds without throwing, as a visual artifact for manual review.
    await page.screenshot({ path: 'test-results/win-overlay-desktop.png', fullPage: true });
  });

  test('hoop parts (pole, backboard, rim, net) share one horizontal center axis', async ({ page }) => {
    await page.goto('/');
    await solveLevel1(page);
    await page.waitForTimeout(OVERLAY_SETTLE_MS);

    const centers = await page.evaluate(() => {
      const selectors = [
        '.success-overlay__hoop-pole',
        '.success-overlay__hoop-backboard',
        '.success-overlay__hoop-rim',
        '.success-overlay__hoop-net',
      ];
      return selectors.map((sel) => {
        const r = document.querySelector(sel).getBoundingClientRect();
        return { sel, centerX: r.left + r.width / 2 };
      });
    });

    const TOLERANCE = 5;
    const axis = centers[0].centerX;
    for (const c of centers) {
      expect(Math.abs(c.centerX - axis), `${c.sel} center-X vs ${centers[0].sel} center-X`).toBeLessThanOrEqual(TOLERANCE);
    }
  });

  test('throwing arm is raised overhead, not hanging at the shooter\'s side', async ({ page }) => {
    await page.goto('/');
    await solveLevel1(page);
    await page.waitForTimeout(OVERLAY_SETTLE_MS);

    // .shooter__arm--throw runs the shared `shooter-arm` keyframe animation,
    // which (per css/styles.css) ends at `rotate(-150deg)` with fill-mode
    // `both`, so the settled state should hold that end frame. transform-origin
    // is `top center`, so a raised arm's bounding box should sit clearly above
    // the torso's vertical center, not hang down alongside it.
    const geometry = await page.evaluate(() => {
      const rectOf = (el) => el.getBoundingClientRect();
      const torso = rectOf(document.querySelector('.shooter__torso'));
      const arm = rectOf(document.querySelector('.shooter__arm--throw'));
      const armStyle = getComputedStyle(document.querySelector('.shooter__arm--throw'));
      return {
        torsoCenterY: torso.top + torso.height / 2,
        armTop: arm.top,
        armCenterY: arm.top + arm.height / 2,
        transform: armStyle.transform,
      };
    });

    // Sanity: the animation actually applied a rotation (not stuck at `none`).
    expect(geometry.transform).not.toBe('none');

    // The raised arm's own top edge should be above the torso's vertical
    // center by a clear margin (overhead, not "hanging at the side").
    expect(geometry.armTop).toBeLessThan(geometry.torsoCenterY - 10);
  });
});

test.describe('narrow mobile viewport (375x667)', () => {
  test.use({ viewport: { width: 375, height: 667 } });

  test('court stays fixed-width with horizontal scroll, side panel stacks below', async ({ page }) => {
    await page.goto('/');

    // Same expectation as e2e/responsive.spec.js: the court never shrinks.
    const courtWidth = await page.locator('.court').evaluate((el) => el.getBoundingClientRect().width);
    expect(courtWidth).toBe(480);

    const scrollInfo = await page.locator('.court-wrapper').evaluate((el) => ({
      scrollWidth: el.scrollWidth,
      clientWidth: el.clientWidth,
    }));
    expect(scrollInfo.scrollWidth).toBeGreaterThan(scrollInfo.clientWidth);

    const wrapperBox = await page.locator('.court-wrapper').boundingBox();
    const panelBox = await page.locator('.side-panel').boundingBox();
    expect(panelBox.y).toBeGreaterThanOrEqual(wrapperBox.y + wrapperBox.height);
  });

  test('win overlay stays usable: Next Level button is on-screen and clickable', async ({ page }) => {
    await page.goto('/');
    await solveLevel1(page);
    await page.waitForTimeout(OVERLAY_SETTLE_MS);

    const btn = page.locator('#next-level-btn');
    await expect(btn).toBeVisible();

    const box = await btn.boundingBox();
    expect(box).not.toBeNull();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.y).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(375);
    expect(box.y + box.height).toBeLessThanOrEqual(667);

    await btn.click();
    await expect(page.locator('#level-indicator')).toHaveText('Level 2 of 14');
  });
});

test.describe('tablet viewport (768x1024)', () => {
  test.use({ viewport: { width: 768, height: 1024 } });

  test('no unintended horizontal page overflow beyond the court\'s own scroll area', async ({ page }) => {
    await page.goto('/');

    const overflow = await page.evaluate(() => ({
      docScrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));

    // .court-wrapper is allowed (expected) to internally scroll on narrower
    // viewports, but that must stay contained inside the wrapper (it has its
    // own overflow-x: auto) and not blow out the overall page/document width.
    // Small tolerance for scrollbar width.
    expect(overflow.docScrollWidth).toBeLessThanOrEqual(overflow.innerWidth + 20);
  });
});
