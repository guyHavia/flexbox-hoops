import { test, expect } from '@playwright/test';

// Solve-flow coverage for levels 7-14, independent of the dedicated
// single-level specs (level-7-direction.spec.js, level-14-wrap.spec.js,
// reset.spec.js). Solution shapes below are copied by hand from
// js/levels.js (index 6-13) so this file verifies the app against the
// same source of truth without importing (and therefore blindly trusting)
// the app's own module.
//
//   7  baseline-out-of-bounds  container   { justifyContent: 'flex-start', alignItems: 'flex-end' }  (base: { flexDirection: 'column-reverse' })
//   8  inbound-under-pressure  item[0]+item[2]  { 0: { order: 2 }, 2: { order: -1 } }
//   9  sixth-man               item[1]     { alignSelf: 'flex-start' }  (base: { flexDirection: 'column', alignItems: 'center' })
//   10 full-court-fastbreak    container   { flexWrap: 'wrap', alignContent: 'flex-start' }  (ballCount: 7)
//   11 double-team             container   { flexWrap: 'wrap', alignContent: 'space-around' }  (ballCount: 8, base: { flexDirection: 'row-reverse' })
//   12 buzzer-beater           container   { flexWrap: 'wrap-reverse', justifyContent: 'flex-end' }  (ballCount: 6)
//   13 clutch-substitution     item[3]     { order: -2 }  (base: { flexDirection: 'row-reverse', justifyContent: 'center' })
//   14 full-roster             container   { flexWrap: 'wrap', alignContent: 'space-between' }  (ballCount: 8)
const LEVEL_DEFS = [
  {
    number: 7,
    id: 'baseline-out-of-bounds',
    ballCount: 3,
    editableTargets: [{ kind: 'container' }],
    solutionText: 'justify-content: flex-start;\nalign-items: flex-end;',
  },
  {
    number: 9,
    id: 'sixth-man',
    ballCount: 3,
    editableTargets: [{ kind: 'item', index: 1 }],
    targetItemIndex: 1,
    solutionText: 'align-self: flex-start;',
  },
  {
    number: 10,
    id: 'full-court-fastbreak',
    ballCount: 7,
    editableTargets: [{ kind: 'container' }],
    solutionText: 'flex-wrap: wrap;\nalign-content: flex-start;',
  },
  {
    number: 11,
    id: 'double-team',
    ballCount: 8,
    editableTargets: [{ kind: 'container' }],
    solutionText: 'flex-wrap: wrap;\nalign-content: space-around;',
  },
  {
    number: 12,
    id: 'buzzer-beater',
    ballCount: 6,
    editableTargets: [{ kind: 'container' }],
    solutionText: 'flex-wrap: wrap-reverse;\njustify-content: flex-end;',
  },
  {
    number: 13,
    id: 'clutch-substitution',
    ballCount: 4,
    editableTargets: [{ kind: 'item', index: 3 }],
    targetItemIndex: 3,
    solutionText: 'order: -2;',
  },
  {
    number: 14,
    id: 'full-roster',
    ballCount: 8,
    editableTargets: [{ kind: 'container' }],
    solutionText: 'flex-wrap: wrap;\nalign-content: space-between;',
  },
];

// renderEditor() in js/game.js renders exactly one css-block/<textarea>
// per entry of level.editableTargets, in that array's order. This walks
// the array rather than assuming the target we want is always the first
// (or only) textarea, so the mapping stays correct even for a level whose
// editableTargets mixes a container block with one or more item blocks.
function textareaIndexFor(level, wantKind, wantItemIndex) {
  return level.editableTargets.findIndex((target) =>
    wantKind === 'container'
      ? target.kind === 'container'
      : target.kind === 'item' && target.index === wantItemIndex
  );
}

function targetTextareaIndex(level) {
  return level.targetItemIndex !== undefined
    ? textareaIndexFor(level, 'item', level.targetItemIndex)
    : textareaIndexFor(level, 'container');
}

async function gotoLevel(page, number) {
  await page.addInitScript(() => localStorage.clear());
  await page.goto('/');
  await page.locator('#level-nav .level-chip').nth(number - 1).click();
  await expect(page.locator('#level-indicator')).toHaveText(`Level ${number} of 14`);
}

// Independent re-check of ball/basket alignment straight from live
// geometry (getBoundingClientRect centers), using the same 6px tolerance
// as js/geometry.js's isAligned — this does not rely on the app's own
// #success-overlay flag at all.
async function assertAllAligned(page, ballCount) {
  const offsets = await page.evaluate((count) => {
    function center(el) {
      const r = el.getBoundingClientRect();
      return { x: (r.left + r.right) / 2, y: (r.top + r.bottom) / 2 };
    }
    const balls = Array.from(document.querySelectorAll('#ball-layer .ball'));
    const baskets = Array.from(document.querySelectorAll('#basket-layer .basket'));
    return balls.slice(0, count).map((ball, i) => {
      const b = center(ball);
      const k = center(baskets[i]);
      return { i, dx: Math.abs(b.x - k.x), dy: Math.abs(b.y - k.y) };
    });
  }, ballCount);

  for (const { i, dx, dy } of offsets) {
    expect(dx, `ball ${i} x-center offset from its basket`).toBeLessThanOrEqual(6);
    expect(dy, `ball ${i} y-center offset from its basket`).toBeLessThanOrEqual(6);
  }
}

test.beforeEach(async ({ page }) => {
  page.on('pageerror', (err) => console.log(`[pageerror] ${err.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.log(`[console.error] ${msg.text()}`);
  });
});

for (const level of LEVEL_DEFS) {
  test(`level ${level.number} ("${level.id}"): typing the exact solution solves it and every ball lines up with its basket`, async ({ page }) => {
    await gotoLevel(page, level.number);

    const idx = targetTextareaIndex(level);
    expect(idx, 'editableTargets should contain the expected target for this level').toBeGreaterThanOrEqual(0);

    await page.locator('#editor-blocks textarea').nth(idx).fill(level.solutionText);
    await page.locator('#check-btn').click();

    await expect(page.locator('#success-overlay')).toBeVisible();

    // Don't just trust the success flag - re-derive it from live geometry.
    await assertAllAligned(page, level.ballCount);
  });
}

test('level 7 ("baseline-out-of-bounds"): justify-content alone, without align-items, is not a solution', async ({ page }) => {
  const level = LEVEL_DEFS.find((l) => l.number === 7);
  await gotoLevel(page, 7);

  const idx = targetTextareaIndex(level);
  const textarea = page.locator('#editor-blocks textarea').nth(idx);
  const court = page.locator('#court');

  // Only the justify-content half of the two-declaration solution.
  await textarea.fill('justify-content: flex-start;');
  await page.locator('#check-btn').click();

  await expect(court).toHaveClass(/court--wrong/);
  await expect(page.locator('#success-overlay')).toBeHidden();

  // Completing it with align-items: flex-end; solves it.
  await textarea.fill(level.solutionText);
  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();
  await assertAllAligned(page, level.ballCount);
});

test('level 14 ("full-roster"): flex-wrap alone, without align-content, is not a solution', async ({ page }) => {
  const level = LEVEL_DEFS.find((l) => l.number === 14);
  await gotoLevel(page, 14);

  const idx = targetTextareaIndex(level);
  const textarea = page.locator('#editor-blocks textarea').nth(idx);
  const court = page.locator('#court');

  // Known important regression case: flex-wrap alone lets the 8 balls
  // break onto two lines, but without align-content the two lines are not
  // spaced the way the target baskets are, so it must still read as wrong.
  await textarea.fill('flex-wrap: wrap;');
  await page.locator('#check-btn').click();

  await expect(court).toHaveClass(/court--wrong/);
  await expect(page.locator('#success-overlay')).toBeHidden();

  // Adding align-content: space-between; alongside it solves it.
  await textarea.fill(level.solutionText);
  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();
  await assertAllAligned(page, level.ballCount);
});

test('level 13 ("clutch-substitution"): the order fix is scoped to the targeted ball only, the other three are never touched', async ({ page }) => {
  const level = LEVEL_DEFS.find((l) => l.number === 13);
  await gotoLevel(page, 13);

  const idx = targetTextareaIndex(level);
  expect(idx, 'the single editable target for this level should be item index 3').toBe(0);

  const balls = page.locator('#ball-layer .ball');

  // Before typing anything, no ball has an inline `order` style at all -
  // applyUserStyles() has not written anything for any of the 4 balls yet.
  for (let i = 0; i < 4; i++) {
    const orderValue = await balls.nth(i).evaluate((el) => el.style.order);
    expect(orderValue, `ball ${i} inline order before typing`).toBe('');
  }

  // Type the solution into the correct (and only) textarea for this level.
  await page.locator('#editor-blocks textarea').nth(idx).fill(level.solutionText);

  // The typed `order: -2;` must land on ball 3 only - balls 0, 1, 2 must
  // not pick up an order value of their own from the same edit.
  expect(await balls.nth(3).evaluate((el) => el.style.order)).toBe('-2');
  expect(await balls.nth(0).evaluate((el) => el.style.order), 'ball 0 must be untouched').toBe('');
  expect(await balls.nth(1).evaluate((el) => el.style.order), 'ball 1 must be untouched').toBe('');
  expect(await balls.nth(2).evaluate((el) => el.style.order), 'ball 2 must be untouched').toBe('');

  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();

  // Independent geometric re-check: every ball - not just the targeted
  // one - now lines up with its basket.
  await assertAllAligned(page, level.ballCount);
});

test('level 8 ("inbound-under-pressure"): the two order fixes each land on their own ball only', async ({ page }) => {
  await gotoLevel(page, 8);

  const level = {
    ballCount: 4,
    editableTargets: [{ kind: 'item', index: 0 }, { kind: 'item', index: 2 }],
  };
  const idx0 = textareaIndexFor(level, 'item', 0);
  const idx2 = textareaIndexFor(level, 'item', 2);
  expect(idx0, 'first textarea should target item 0').toBeGreaterThanOrEqual(0);
  expect(idx2, 'second textarea should target item 2').toBeGreaterThanOrEqual(0);

  const balls = page.locator('#ball-layer .ball');
  for (let i = 0; i < 4; i++) {
    const orderValue = await balls.nth(i).evaluate((el) => el.style.order);
    expect(orderValue, `ball ${i} inline order before typing`).toBe('');
  }

  await page.locator('#editor-blocks textarea').nth(idx0).fill('order: 2;');
  await page.locator('#editor-blocks textarea').nth(idx2).fill('order: -1;');

  expect(await balls.nth(0).evaluate((el) => el.style.order)).toBe('2');
  expect(await balls.nth(2).evaluate((el) => el.style.order)).toBe('-1');
  expect(await balls.nth(1).evaluate((el) => el.style.order), 'ball 1 must be untouched').toBe('');
  expect(await balls.nth(3).evaluate((el) => el.style.order), 'ball 3 must be untouched').toBe('');

  await page.locator('#check-btn').click();
  await expect(page.locator('#success-overlay')).toBeVisible();
  await assertAllAligned(page, 4);
});
