import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LEVELS, validateLevels } from '../js/levels.js';

test('LEVELS passes its own validator with no errors', () => {
  assert.deepEqual(validateLevels(LEVELS), []);
});

test('has at least 6 levels', () => {
  assert.ok(LEVELS.length >= 6);
});

test('flags a level with a missing required field', () => {
  const broken = [{ id: 'x', title: 'X', ballCount: 1, editableTargets: [], solution: {} }];
  const errors = validateLevels(broken);
  assert.ok(errors.some((e) => e.includes('goal')));
});

test('flags a solution item index outside ballCount', () => {
  const broken = [{
    id: 'x', title: 'X', goal: 'g', ballCount: 1,
    editableTargets: [{ kind: 'item', index: 5 }],
    solution: { items: { 5: { order: 1 } } },
  }];
  const errors = validateLevels(broken);
  assert.ok(errors.some((e) => e.includes('item index 5')));
});

test('flags missing coverage of a required property', () => {
  const flexWrapIds = ['full-court-fastbreak', 'double-team', 'buzzer-beater', 'full-roster'];
  const withoutWrap = LEVELS.filter((l) => !flexWrapIds.includes(l.id));
  const errors = validateLevels(withoutWrap);
  assert.ok(errors.some((e) => e.includes('flexWrap')));
});

test('flags fewer than 3 combined-property levels', () => {
  const nonCombinedIds = ['pick-and-roll', 'free-throw-lane', 'zone-defense'];
  const nonCombined = LEVELS.filter((l) => nonCombinedIds.includes(l.id));
  assert.equal(nonCombined.length, 3);
  const errors = validateLevels(nonCombined);
  assert.ok(errors.some((e) => e.includes('combining more than one property')));
});

test('flags two levels with identical solutions', () => {
  const dup = [
    {
      id: 'a', title: 'A', goal: 'g', ballCount: 1,
      editableTargets: [{ kind: 'container' }],
      solution: { container: { justifyContent: 'center' } },
    },
    {
      id: 'b', title: 'B', goal: 'g', ballCount: 1,
      editableTargets: [{ kind: 'container' }],
      solution: { container: { justifyContent: 'center' } },
    },
  ];
  const errors = validateLevels(dup);
  assert.ok(errors.some((e) => e.includes('identical')));
});
