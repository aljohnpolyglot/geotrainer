import assert from 'node:assert/strict';
import test from 'node:test';
import type { ReviewRecord } from '../types';
import { chooseReviewCandidate, clampReviewViewVariationDifficulty, nextGeneralizationLevel, planReviewVariation, reviewVariationCheckpoint } from './reviewVariation';

const review = (extra: Partial<ReviewRecord> = {}): ReviewRecord => ({ id: 'card', panoId: 'card', dueAt: 0, intervalDays: 0, gradingHistory: [], lapseCount: 0, reviewCount: 0, ...extra });

test('disabled or zero-difficulty variation preserves the original view', () => {
  assert.deepEqual(planReviewVariation(false, 100, review({ reviewCount: 20, intervalDays: 365 }), 42, 'rural').kind, 'original');
  assert.deepEqual(planReviewVariation(true, 0, review({ reviewCount: 20, intervalDays: 365 }), 42, 'rural').kind, 'original');
});

test('view variation progresses from heading changes to broad mature movement', () => {
  const learning = Array.from({ length: 20 }, (_, index) => review({ id: `new-${index}`, panoId: `new-${index}` })).map((card) => planReviewVariation(true, 100, card, 10, 'rural')).find((plan) => plan.kind === 'heading');
  assert.ok(learning); assert.equal(learning.maxDistanceM, 0);
  const mature = Array.from({ length: 20 }, (_, index) => review({ id: `mature-${index}`, panoId: `mature-${index}`, reviewCount: 12, intervalDays: 180 })).map((card) => planReviewVariation(true, 100, card, 10, 'rural')).find((plan) => plan.kind === 'spatial');
  assert.ok(mature); assert.equal(mature.generalizationLevel, 4); assert.equal(mature.maxDistanceM, 5000);
});

test('candidate selection stays on-country and falls back to the anchor', () => {
  const anchor = { panoId: 'anchor', lat: 0, lng: 0, countryCode: 'SE', heading: 30 };
  const plan = { kind: 'spatial' as const, generalizationLevel: 2 as const, heading: 100, maxDistanceM: 500, seed: 1 };
  assert.equal(chooseReviewCandidate(anchor, [{ panoId: 'wrong-country', lat: .001, lng: 0, countryCode: 'NO' }], plan).panoId, 'anchor');
  assert.equal(chooseReviewCandidate(anchor, [{ panoId: 'nearby', lat: .003, lng: 0, countryCode: 'SE' }], plan).panoId, 'nearby');
});

test('failed generalized recall contracts without changing ordinary review data', () => {
  const card = review({ generalizationLevel: 4, intervalDays: 120, reviewCount: 10 });
  assert.equal(nextGeneralizationLevel(card.generalizationLevel, 4, 'spatial', 'again'), 3);
  assert.equal(card.intervalDays, 120); assert.equal(card.reviewCount, 10); assert.equal(card.panoId, 'card');
});

test('difficulty clamps and checkpoint copy changes at the defined ranges', () => {
  assert.equal(clampReviewViewVariationDifficulty(-1), 0); assert.equal(clampReviewViewVariationDifficulty(101), 100); assert.equal(clampReviewViewVariationDifficulty('bad'), 50);
  assert.deepEqual([0, 1, 24, 25, 49, 50, 74, 75, 99, 100].map(reviewVariationCheckpoint), [0, 1, 1, 25, 25, 50, 50, 75, 75, 100]);
});
