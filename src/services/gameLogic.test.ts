import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateDistanceKm, calculateRoundScore, compassDirection } from './gameLogic';

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
