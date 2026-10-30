import assert from 'node:assert/strict';
import test from 'node:test';
import type { Attempt, ReviewRecord, TrainerLocation } from '../types';
import { coalesceNearbyReviews, nearbyReviewPoint, savedReviewMatcher } from './reviewIdentity';

const review = (panoId: string, reviewCount: number): ReviewRecord => ({ id: panoId, panoId, dueAt: 100 + reviewCount, intervalDays: 2, gradingHistory: [], lapseCount: 0, reviewCount });
const location = (panoId: string, lat: number): TrainerLocation => ({ id: panoId, panoId, lat, lng: 13.4, countryCode: 'DE', firstSeenAt: 1, lastSeenAt: 1, encounterCount: 1 });

test('review cards within 50 metres share the established card', () => {
  const result = coalesceNearbyReviews([review('near-a', 3), review('near-b', 0), review('far', 0)], [location('near-a', 52.5), location('near-b', 52.5002), location('far', 52.51)], [] as Attempt[]);
  assert.deepEqual(result.reviews.map((item) => item.panoId).sort(), ['far', 'near-a']);
  assert.equal(result.aliases.get('near-b'), 'near-a');
});

test('a newer grade on another device replaces the earlier due date of a nearby card', () => {
  const phone = { ...review('phone', 2), dueAt: 100, lastReviewedAt: 20, gradingHistory: [{ grade: 'hard' as const, at: 20 }] };
  const pc = { ...review('pc', 1), dueAt: 500, lastReviewedAt: 200, gradingHistory: [{ grade: 'good' as const, at: 200 }] };
  const merged = coalesceNearbyReviews([phone, pc], [location('phone', 52.5), location('pc', 52.5002)], []);
  assert.equal(merged.reviews[0].dueAt, 500);
  assert.deepEqual(merged.reviews[0].gradingHistory, [...phone.gradingHistory, ...pc.gradingHistory]);
});

test('a stale rollover cannot outrank a later grade on a nearby card', () => {
  const phone = { ...review('phone', 3), dueAt: 300, naturalDueAt: 200, dueAdjustedAt: 250, lastReviewedAt: 100, gradingHistory: [{ grade: 'hard' as const, at: 100 }] };
  const pc = { ...review('pc', 1), dueAt: 1000, intervalDays: 7, lastReviewedAt: 200, gradingHistory: [{ grade: 'good' as const, at: 200 }] };
  const merged = coalesceNearbyReviews([phone, pc], [location('phone', 52.5), location('pc', 52.5002)], []);
  assert.deepEqual([merged.reviews[0].dueAt, merged.reviews[0].intervalDays], [1000, 7]);
});

test('indexed matching preserves greedy card identity across bands, borders, poles, and imported sources', () => {
  const places = Array.from({ length: 1000 }, (_, index) => ({
    ...location(`place-${index}`, -60 + Math.floor(index / 2) * .24 + (index % 2 ? .0002 : 0)),
    countryCode: index % 7 === 0 ? 'FR' : 'DE',
    sourcePointHash: index % 29 === 0 ? 'shared-source' : undefined,
  }));
  places.push(
    { ...location('band-a', -.0001), sourcePointHash: undefined },
    { ...location('band-b', .0001), sourcePointHash: undefined },
    { ...location('date-a', 0), lng: 179.9999, sourcePointHash: undefined },
    { ...location('date-b', 0), lng: -179.9999, sourcePointHash: undefined },
    { ...location('pole-a', 89.9999), lng: 90, sourcePointHash: undefined },
    { ...location('pole-b', 89.9999), lng: -90, sourcePointHash: undefined },
  );
  const records = places.map((place, index) => review(place.panoId, index % 5));
  const points = new Map(places.map((place) => [place.panoId, place]));
  const kept: ReviewRecord[] = [];
  const aliases = new Map<string, string>();
  for (const record of [...records].sort((a, b) => b.reviewCount - a.reviewCount)) {
    const match = kept.find((candidate) => nearbyReviewPoint(points.get(record.panoId)!, points.get(candidate.panoId)!));
    if (match) { aliases.set(record.panoId, match.panoId); match.reviewCount += record.reviewCount; }
    else kept.push({ ...record });
  }
  const actual = coalesceNearbyReviews(records, places, []);
  assert.deepEqual(actual.aliases, aliases);
  assert.deepEqual(actual.reviews.map(({ panoId, reviewCount }) => ({ panoId, reviewCount })), kept.map(({ panoId, reviewCount }) => ({ panoId, reviewCount })));
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

test('one saved-card snapshot checks current and upcoming map panoramas without changing the records', () => {
  const saved = { ...location('saved', 52.5), sourcePointHash: 'source-a' };
  const records = [review('saved', 2)];
  const isSaved = savedReviewMatcher(records, [saved], []);
  const upcoming = Array.from({ length: 5 }, (_, index) => ({ ...location(`next-${index}`, 52.501 + index * .01), sourcePointHash: index === 3 ? 'source-a' : `source-${index}` }));
  assert.deepEqual(upcoming.map(isSaved), [false, false, false, true, false]);
  assert.equal(isSaved({ ...location('nearby', 52.5002), sourcePointHash: 'other' }), true);
  assert.equal(isSaved({ ...location('foreign', 52.5), countryCode: 'AT' }), false);
  assert.equal(records.length, 1);
});
