import assert from 'node:assert/strict';
import test from 'node:test';
import type { Attempt, ReviewRecord, TrainerLocation } from '../types';
import { coalesceNearbyReviews, nearbyReviewPoint } from './reviewIdentity';

const review = (panoId: string, reviewCount: number): ReviewRecord => ({ id: panoId, panoId, dueAt: 100 + reviewCount, intervalDays: 2, gradingHistory: [], lapseCount: 0, reviewCount });
const location = (panoId: string, lat: number): TrainerLocation => ({ id: panoId, panoId, lat, lng: 13.4, countryCode: 'DE', firstSeenAt: 1, lastSeenAt: 1, encounterCount: 1 });

test('review cards within 50 metres share the established card', () => {
  const result = coalesceNearbyReviews([review('near-a', 3), review('near-b', 0), review('far', 0)], [location('near-a', 52.5), location('near-b', 52.5002), location('far', 52.51)], [] as Attempt[]);
  assert.deepEqual(result.reviews.map((item) => item.panoId).sort(), ['far', 'near-a']);
  assert.equal(result.aliases.get('near-b'), 'near-a');
});

test('nearby note identity includes same-country Street View nodes only within 50 metres', () => {
  const current = { panoId: 'current', lat: 45.8, lng: 16, countryCode: 'HR' };
  assert.equal(nearbyReviewPoint(current, { ...current, panoId: 'next', lat: 45.8002 }), true);
  assert.equal(nearbyReviewPoint(current, { ...current, panoId: 'far', lat: 45.81 }), false);
  assert.equal(nearbyReviewPoint(current, { ...current, panoId: 'border', countryCode: 'SI' }), false);
});

test('one uploaded source point keeps a single Review card across distant panorama resolutions', () => {
  const hash = 'source-point-hash';
  const first = { ...location('first', 52.5), sourcePointHash: hash };
  const second = { ...location('second', 52.501), sourcePointHash: hash };
  assert.equal(nearbyReviewPoint(first, second), true);
  assert.equal(nearbyReviewPoint(first, { ...second, sourcePointHash: 'another-point' }), false);
  const result = coalesceNearbyReviews([review('first', 2), review('second', 0)], [first, second], []);
  assert.equal(result.reviews.length, 1);
  assert.equal(result.aliases.get('second'), 'first');
});
