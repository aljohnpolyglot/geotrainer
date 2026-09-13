import assert from 'node:assert/strict';
import test from 'node:test';
import type { Attempt, ReviewRecord, TrainerLocation } from '../types';
import { coalesceNearbyReviews, hasStudyReviewSource, nearbyReviewPoint } from './reviewIdentity';

const review = (panoId: string, reviewCount: number): ReviewRecord => ({ id: panoId, panoId, dueAt: 100 + reviewCount, intervalDays: 2, gradingHistory: [], lapseCount: 0, reviewCount });
const location = (panoId: string, lat: number): TrainerLocation => ({ id: panoId, panoId, lat, lng: 13.4, countryCode: 'DE', firstSeenAt: 1, lastSeenAt: 1, encounterCount: 1 });

test('review cards within 50 metres share the established card', () => {
  const result = coalesceNearbyReviews([review('near-a', 3), review('near-b', 0), review('far', 0)], [location('near-a', 52.5), location('near-b', 52.5002), location('far', 52.51)], [] as Attempt[]);
  assert.deepEqual(result.reviews.map((item) => item.panoId).sort(), ['far', 'near-a']);
  assert.equal(result.aliases.get('near-b'), 'near-a');
});

test('a persisted Study source restores the saved state without treating Play as a Study save', () => {
  const attempts = [{ panoId: 'saved', source: 'study' }, { panoId: 'played', source: 'play' }] as Attempt[];
  assert.equal(hasStudyReviewSource(attempts, 'saved'), true);
  assert.equal(hasStudyReviewSource(attempts, 'played'), false);
});

test('nearby note identity includes same-country Street View nodes only within 50 metres', () => {
  const current = { panoId: 'current', lat: 45.8, lng: 16, countryCode: 'HR' };
  assert.equal(nearbyReviewPoint(current, { ...current, panoId: 'next', lat: 45.8002 }), true);
  assert.equal(nearbyReviewPoint(current, { ...current, panoId: 'far', lat: 45.81 }), false);
  assert.equal(nearbyReviewPoint(current, { ...current, panoId: 'border', countryCode: 'SI' }), false);
});
