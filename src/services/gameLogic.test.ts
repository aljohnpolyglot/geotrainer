import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateDistanceKm, calculateRoundScore, compassDirection, restoredRoundElapsed, resumeRoundStartedAt } from './gameLogic';

test('distance and score remain bounded at gameplay edges', () => {
  assert.equal(calculateDistanceKm(10, 20, 10, 20), 0);
  assert.equal(calculateRoundScore(0), 5000);
  assert.equal(calculateRoundScore(0.025), 5000);
  assert.ok(calculateRoundScore(1000) < 5000);
  assert.equal(calculateRoundScore(Number.POSITIVE_INFINITY), 0);
});

test('compass direction wraps headings at north', () => {
  assert.equal(compassDirection(0), 'N');
  assert.equal(compassDirection(359), 'N');
  assert.equal(compassDirection(212), 'SW');
  assert.equal(compassDirection(-90), 'W');
});

test('resuming Play keeps active round time without counting closed hours', () => {
  assert.equal(restoredRoundElapsed(75, null, 0), 75);
  assert.equal(restoredRoundElapsed(undefined, 45, 60), 15);
  assert.equal(restoredRoundElapsed(undefined, null, 0), 0);
  assert.equal(resumeRoundStartedAt(1_000, 2_000, 12_000), 11_000);
});
