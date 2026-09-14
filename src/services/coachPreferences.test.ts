import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_COACH_PREFERENCES, normalizeCoachPreferences } from './coachPreferences';

test('Coach preferences preserve valid independent style/depth and migrate old profiles', () => {
  assert.deepEqual(normalizeCoachPreferences(undefined), DEFAULT_COACH_PREFERENCES);
  assert.deepEqual(normalizeCoachPreferences({ style: 'deep-geography', depth: 'short', askEveryTime: false }), { style: 'deep-geography', depth: 'short', askEveryTime: false });
  assert.deepEqual(normalizeCoachPreferences({ style: 'adaptive', depth: 'huge' }), DEFAULT_COACH_PREFERENCES);
});
