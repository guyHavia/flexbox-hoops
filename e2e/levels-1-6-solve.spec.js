import { test, expect } from '@playwright/test';

// Levels 1-6 (indices 0-5), per js/levels.js. All six are single-textarea
// "container" levels (editableTargets: [{ kind: 'container' }]) driven by
// justify-content / align-items / flex-direction. Solution text below is
// hand-derived from each level's `base` + `solution.container` object,
// converted to kebab-case CSS exactly as js/parser.js expects (camelCase <-
// kebab-case, ";"/newline separated declarations).
const LEVELS_1_6 = [
  {
    index: 0,
    id: 'opening-tip',
    title: 'Opening Tip',
    ballCount: 1,
    // base: { justifyContent: 'flex-end' }
    // solution: { container: { justifyContent: 'flex-start' } }
    solutionText: 'justify-content: flex-start;',
    // Single ball, basket on the left edge -> flex-end leaves the ball at
    // its starting (right) edge, clearly unaligned.
    wrongText: 'justify-content: flex-end;',
  },
  {
    index: 1,
    id: 'pick-and-roll',
    title: 'Pick and Roll',
    ballCount: 2,
    // solution: { container: { flexDirection: 'row-reverse' } }
    solutionText: 'flex-direction: row-reverse;',
  },
  {
    index: 2,
    id: 'free-throw-lane',
    title: 'Free Throw Lane',
    ballCount: 1,
    // solution: { container: { alignItems: 'center' } }
    solutionText: 'align-items: center;',
    // Single ball, basket at the vertical midline -> flex-end sends the
    // ball to the opposite (bottom) edge, clearly unaligned.
    wrongText: 'align-items: flex-end;',
  },
  {
    index: 3,
    id: 'corner-three',
    title: 'Corner Three',
    ballCount: 3,
    // solution: { container: { justifyContent: 'space-between', alignItems: 'flex-end' } }
    solutionText: 'justify-content: space-between;\nalign-items: flex-end;',
  },
  {
    index: 4,
    id: 'zone-defense',
    title: 'Zone Defense',
    ballCount: 3,
    // solution: { container: { flexDirection: 'column' } }
    solutionText: 'flex-direction: column;',
  },
  {
    index: 5,
    id: 'transition-offense',
    title: 'Transition Offense',
    ballCount: 3,
    // base: { flexDirection: 'column' }
    // solution: { container: { flexDirection: 'column', justifyContent: 'space-around' } }
    solutionText: 'flex-direction: column;\njustify-content: space-around;',
    // Only the (redundant) direction declaration, no spacing -> still wrong.
    wrongText: 'flex-direction: column;',
  },
];

function centersAligned(rectA, rectB, tolerance = 6) {
  // Re-implemented independently from js/geometry.js's isAligned, so a bug
  // in the app's own geometry helper can't hide a real misalignment here.
  const centerA = { x: (rectA.left + rectA.right) / 2, y: (rectA.top + rectA.bottom) / 2 };
  const centerB = { x: (rectB.left + rectB.right) / 2, y: (rectB.top + rectB.bottom) / 2 };
  return (
    Math.abs(centerA.x - centerB.x) <= tolerance &&
    Math.abs(centerA.y - centerB.y) <= tolerance
  );
}

async function getBallBasketRectPairs(page) {
  return page.evaluate(() => {
    const toRect = (r) => ({ left: r.left, right: r.right, top: r.top, bottom: r.bottom });
    const balls = Array.from(document.querySelectorAll('#ball-layer .ball'));
    const baskets = Array.from(document.querySelectorAll('#basket-layer .basket'));
    return balls.map((ball, i) => ({
      ball: toRect(ball.getBoundingClientRect()),
      basket: toRect(baskets[i].getBoundingClientRect()),
    }));
  });
}

function attachErrorCapture(page) {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console.error: ${msg.text()}`);
  });
  page.on('pageerror', (err) => errors.push(`pageerror: ${err.message || String(err)}`));
  return errors;
}

for (const level of LEVELS_1_6) {
  test.describe(`Level ${level.index + 1} - ${level.title} (${level.id})`, () => {
    test.beforeEach(async ({ page }) => {
      await page.addInitScript(() => localStorage.clear());
      await page.goto('/');
      await page.locator('#level-nav .level-chip').nth(level.index).click();
      await expect(page.locator('#level-indicator')).toHaveText(`Level ${level.index + 1} of 14`);
    });

    test('solves with the documented correct solution', async ({ page }) => {
      const errors = attachErrorCapture(page);

      const textarea = page.locator('#editor-blocks textarea').first();
      await textarea.fill(level.solutionText);
      await page.locator('#check-btn').click();

      await expect(page.locator('#success-overlay')).toBeVisible();
      await expect(page.locator('#court')).not.toHaveClass(/court--wrong/);

      expect(errors, `unexpected console/page errors: ${errors.join(' | ')}`).toEqual([]);
    });

    if (level.wrongText) {
      test('flags a wrong/partial answer, then still solves with the correct one', async ({ page }) => {
        const textarea = page.locator('#editor-blocks textarea').first();
        const court = page.locator('#court');
        const checkMessage = page.locator('#check-message');

        await textarea.fill(level.wrongText);
        await page.locator('#check-btn').click();

        await expect(court).toHaveClass(/court--wrong/);
        await expect(checkMessage).toBeVisible();
        await expect(checkMessage).toHaveText(/not quite/i);
        await expect(checkMessage).toHaveClass(/check-message--error/);
        await expect(page.locator('#success-overlay')).toBeHidden();

        // Independent geometry check: with the wrong/partial answer, the
        // ball(s) must NOT actually be aligned with their basket either --
        // otherwise the app's court--wrong flag would itself be a lie.
        const pairs = await getBallBasketRectPairs(page);
        const anyAligned = pairs.some(({ ball, basket }) => centersAligned(ball, basket));
        expect(anyAligned, 'wrong answer produced geometrically-aligned balls/baskets').toBe(false);

        // Now supply the correct solution and confirm it still solves.
        await textarea.fill(level.solutionText);
        await page.locator('#check-btn').click();

        await expect(page.locator('#success-overlay')).toBeVisible();
        await expect(court).not.toHaveClass(/court--wrong/);
      });
    }
  });
}

test.describe('Levels 1-6 solved in sequence via Next Level', () => {
  test('re-verifies win geometry independently of the app success-overlay flag', async ({ page }) => {
    const errors = attachErrorCapture(page);

    await page.addInitScript(() => localStorage.clear());
    await page.goto('/');
    await expect(page.locator('#level-indicator')).toHaveText('Level 1 of 14');

    for (const level of LEVELS_1_6) {
      await expect(page.locator('#level-indicator')).toHaveText(`Level ${level.index + 1} of 14`);

      const textarea = page.locator('#editor-blocks textarea').first();
      await textarea.fill(level.solutionText);
      await page.locator('#check-btn').click();

      // App's own signal.
      await expect(page.locator('#success-overlay')).toBeVisible();
      await expect(page.locator('#court')).not.toHaveClass(/court--wrong/);

      // Independent re-check, bypassing isLevelSolved()/court--wrong entirely:
      // measure ball vs. basket centers ourselves and compare against the
      // documented 6px tolerance from js/geometry.js.
      const pairs = await getBallBasketRectPairs(page);
      expect(pairs.length).toBe(level.ballCount);
      for (const { ball, basket } of pairs) {
        expect(
          centersAligned(ball, basket, 6),
          `level ${level.index + 1} (${level.id}): ball center ${JSON.stringify(ball)} not within 6px of basket center ${JSON.stringify(basket)}`
        ).toBe(true);
      }

      if (level.index < LEVELS_1_6.length - 1) {
        await page.locator('#next-level-btn').click();
      }
    }

    expect(errors, `unexpected console/page errors during full sequence: ${errors.join(' | ')}`).toEqual([]);
  });
});
