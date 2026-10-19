import assert from 'node:assert/strict';
import test from 'node:test';
import type { ReviewRecord } from '../types';
import { DEFAULT_SCHEDULER_PREFERENCES, normalizeSchedulerPreferences } from './reviewPreferences';
import { planReviewRollover } from './reviewRollover';

test('unfinished reviews carry to the next day and later reviews move with them', () => {
  assert.equal(normalizeSchedulerPreferences(undefined).minimumReviewsPerDay, 50);
  assert.equal(normalizeSchedulerPreferences({ rollOverMissedReviews: false }).rollOverMissedReviews, false);
  const preferences = { ...DEFAULT_SCHEDULER_PREFERENCES, reviewTimeZone: 'UTC', reviewTimeZoneAuto: false };
  const now = Date.parse('2026-10-19T12:00:00Z');
  const card = (id: string, date: string, intervalDays = 7): ReviewRecord => ({ id, panoId: id, dueAt: Date.parse(date), intervalDays, gradingHistory: [], lapseCount: 0, reviewCount: 1 });
  const reviews = [card('unfinished', '2026-10-18T00:00:00Z'), card('later', '2026-10-19T00:00:00Z'), { ...card('new', '2026-10-20T00:00:00Z', 0), reviewCount: 0 }, card('short-step', '2026-10-18T12:00:00Z', .01), { ...card('graded-today', '2026-10-26T00:00:00Z'), lastReviewedAt: now - 3600e3 }];
  assert.deepEqual(planReviewRollover(reviews, now, preferences).map(({ id, toDueAt }) => [id, new Date(toDueAt).toISOString()]), [
    ['unfinished', '2026-10-19T00:00:00.000Z'], ['later', '2026-10-20T00:00:00.000Z'], ['new', '2026-10-21T00:00:00.000Z'],
  ]);
  assert.deepEqual(planReviewRollover(reviews, now, { ...preferences, rollOverMissedReviews: false }), []);
});
