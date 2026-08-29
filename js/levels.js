export const LEVELS = [
  {
    id: 'opening-tip',
    title: 'Opening Tip',
    goal: 'The ball sits at the right edge. Send it all the way to the left edge instead.',
    hint: 'justify-content controls the main axis. This court starts at flex-end — override it back to flex-start.',
    ballCount: 1,
    base: { justifyContent: 'flex-end' },
    editableTargets: [{ kind: 'container' }],
    solution: { container: { justifyContent: 'flex-start' } },
  },
  {
    id: 'pick-and-roll',
    title: 'Pick and Roll',
    goal: 'Two balls, two baskets — but the baskets are in the opposite order. Reverse the lineup.',
    hint: 'flex-direction: row-reverse flips the main axis, so items lay out right to left.',
    ballCount: 2,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexDirection: 'row-reverse' } },
  },
  {
    id: 'free-throw-lane',
    title: 'Free Throw Lane',
    goal: 'The basket floats at the vertical midline of the court. Meet it on the cross axis.',
    hint: 'align-items works on the cross axis. center splits the difference between top and bottom.',
    ballCount: 1,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { alignItems: 'center' } },
  },
  {
    id: 'corner-three',
    title: 'Corner Three',
    goal: 'Three baskets — one at each edge, one in the middle — and all three sit on the floor.',
    hint: 'space-between pins the first and last items to the edges. align-items: flex-end drops everything to the bottom.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { justifyContent: 'space-between', alignItems: 'flex-end' } },
  },
  {
    id: 'zone-defense',
    title: 'Zone Defense',
    goal: 'The three baskets are stacked in a vertical column now.',
    hint: 'flex-direction: column makes the main axis vertical.',
    ballCount: 3,
    base: {},
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexDirection: 'column' } },
  },
  {
    id: 'transition-offense',
    title: 'Transition Offense',
    goal: 'Still stacked vertically, but now each basket needs equal breathing room above and below it.',
    hint: 'justify-content works on whichever axis is the main one — here that is vertical. space-around gives every item a half-unit of space at the ends, a full unit between.',
    ballCount: 3,
    base: { flexDirection: 'column' },
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexDirection: 'column', justifyContent: 'space-around' } },
  },
  {
    id: 'baseline-out-of-bounds',
    title: 'Baseline Out-of-Bounds',
    goal: 'Stacked and reversed already — now push the whole group down to the very bottom of the court, and pin it to the right edge.',
    hint: 'With column-reverse the main axis starts at the bottom, so justify-content: flex-start packs items downward. align-items: flex-end handles the cross axis.',
    ballCount: 3,
    base: { flexDirection: 'column-reverse' },
    editableTargets: [{ kind: 'container' }],
    solution: { container: { justifyContent: 'flex-start', alignItems: 'flex-end' } },
  },
  {
    id: 'inbound-under-pressure',
    title: 'Inbound Under Pressure',
    goal: 'Ball 1 needs to fall to the back of the line, and ball 3 needs to jump to the very front. Every other ball stays put.',
    hint: 'order defaults to 0 for every item. A higher order pushes an item later; a negative order pulls it earlier.',
    ballCount: 4,
    base: {},
    editableTargets: [{ kind: 'item', index: 0 }, { kind: 'item', index: 2 }],
    solution: { items: { 0: { order: 2 }, 2: { order: -1 } } },
  },
  {
    id: 'sixth-man',
    title: 'Sixth Man',
    goal: 'All three balls sit centered in the column — except the middle one, which needs to hug the left edge.',
    hint: 'align-self overrides align-items for a single item, even inside a column.',
    ballCount: 3,
    base: { flexDirection: 'column', alignItems: 'center' },
    editableTargets: [{ kind: 'item', index: 1 }],
    solution: { items: { 1: { alignSelf: 'flex-start' } } },
  },
  {
    id: 'full-court-fastbreak',
    title: 'Full-Court Fastbreak',
    goal: "Seven balls won't fit in one row. Wrap them onto multiple lines, and pack those lines snugly against the top.",
    hint: 'flex-wrap: wrap lets items break onto new lines. align-content controls how those lines sit on the cross axis — flex-start pins them to the start.',
    ballCount: 7,
    base: { gap: '16px' },
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexWrap: 'wrap', alignContent: 'flex-start' } },
  },
  {
    id: 'double-team',
    title: 'Double Team',
    goal: 'Eight balls, laid out right-to-left already. Wrap them into rows, each with equal breathing room around it.',
    hint: 'align-content: space-around gives every wrapped line a half-unit of space at the ends, a full unit between lines.',
    ballCount: 8,
    base: { gap: '12px', flexDirection: 'row-reverse' },
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexWrap: 'wrap', alignContent: 'space-around' } },
  },
  {
    id: 'buzzer-beater',
    title: 'Buzzer Beater',
    goal: 'Six balls need to wrap — but the overflow line should stack above the first one, not below. Every ball also hugs the right side of its row.',
    hint: 'flex-wrap: wrap-reverse flips which side new lines stack on. justify-content still controls each row\'s own main axis.',
    ballCount: 6,
    base: { gap: '30px' },
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexWrap: 'wrap-reverse', justifyContent: 'flex-end' } },
  },
  {
    id: 'clutch-substitution',
    title: 'Clutch Substitution',
    goal: "Direction's reversed and everything's centered already — but ball 4 needs to jump ahead of the whole group despite the reversal.",
    hint: 'order still works the same way even inside a reversed main axis — the lowest value goes first.',
    ballCount: 4,
    base: { flexDirection: 'row-reverse', justifyContent: 'center' },
    editableTargets: [{ kind: 'item', index: 3 }],
    solution: { items: { 3: { order: -2 } } },
  },
  {
    id: 'full-roster',
    title: 'Full Roster',
    goal: 'Eight balls, two rows of baskets. They will not fit on one line.',
    hint: "flex-wrap: wrap lets items break onto new lines instead of overflowing. You'll also need align-content to space the two lines.",
    ballCount: 8,
    base: { gap: '10px' },
    editableTargets: [{ kind: 'container' }],
    solution: { container: { flexWrap: 'wrap', alignContent: 'space-between' } },
  },
];

export function validateLevels(levels) {
  const errors = [];
  if (levels.length < 6) {
    errors.push(`expected at least 6 levels, got ${levels.length}`);
  }

  const seenIds = new Set();
  const propertiesUsed = new Set();
  const solutionSignatures = new Set();
  let combinedCount = 0;

  levels.forEach((level, index) => {
    const label = `level ${index} (${level.id ?? 'unknown id'})`;

    for (const field of ['id', 'title', 'goal', 'ballCount', 'editableTargets', 'solution']) {
      if (level[field] === undefined) {
        errors.push(`${label}: missing required field "${field}"`);
      }
    }

    if (level.id) {
      if (seenIds.has(level.id)) errors.push(`${label}: duplicate id`);
      seenIds.add(level.id);
    }

    const allProps = [...Object.keys(level.base || {})];
    if (level.solution?.container) {
      allProps.push(...Object.keys(level.solution.container));
    }
    if (level.solution?.items) {
      for (const [itemIndex, decl] of Object.entries(level.solution.items)) {
        if (Number(itemIndex) >= level.ballCount) {
          errors.push(`${label}: solution references item index ${itemIndex} but ballCount is ${level.ballCount}`);
        }
        allProps.push(...Object.keys(decl));
      }
    }
    allProps.forEach((p) => propertiesUsed.add(p));
    if (allProps.length > 1) combinedCount += 1;

    const signature = JSON.stringify(level.solution);
    if (solutionSignatures.has(signature)) {
      errors.push(`${label}: solution identical to another level`);
    }
    solutionSignatures.add(signature);
  });

  for (const required of ['flexDirection', 'justifyContent', 'alignItems', 'flexWrap']) {
    if (!propertiesUsed.has(required)) {
      errors.push(`no level uses required property "${required}"`);
    }
  }

  if (combinedCount < 3) {
    errors.push(`expected at least 3 levels combining more than one property, found ${combinedCount}`);
  }

  return errors;
}
