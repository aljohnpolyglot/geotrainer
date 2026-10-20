import assert from 'node:assert/strict';
import test from 'node:test';
import { activeRoundClock, resumeRoundStartedAt } from './gameLogic';

test('one clock drives elapsed and remaining time and catches up after a delayed frame', () => {
  assert.deepEqual(activeRoundClock(1000, 30, 11000), { elapsed: 10, remaining: 20 });
  assert.deepEqual(activeRoundClock(1000, 30, 14500), { elapsed: 14, remaining: 17 });
  assert.deepEqual(activeRoundClock(1000, 30, 35000), { elapsed: 34, remaining: 0 });
  assert.deepEqual(activeRoundClock(1000, 0, 35000), { elapsed: 34, remaining: null });
});

test('hidden time stays excluded when the round resumes', () => {
  const resumed = resumeRoundStartedAt(1000, 11000, 61000);
  assert.deepEqual(activeRoundClock(resumed, 30, 62000), { elapsed: 11, remaining: 19 });
  assert.deepEqual(activeRoundClock(1000, 30, 500), { elapsed: 0, remaining: 30 });
});
