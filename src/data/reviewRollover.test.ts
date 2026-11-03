import assert from 'node:assert/strict';
import test from 'node:test';
import type { ReviewRecord } from '../types';
import { DEFAULT_SCHEDULER_PREFERENCES, normalizeSchedulerPreferences } from './reviewPreferences';
import { planReviewRollover } from './reviewRollover';

test('unfinished reviews carry forward without moving later schedules', () => {
  assert.equal(normalizeSchedulerPreferences(undefined).minimumReviewsPerDay, 50);
  assert.equal(normalizeSchedulerPreferences({ rollOverMissedReviews: false }).rollOverMissedReviews, false);
  const preferences = { ...DEFAULT_SCHEDULER_PREFERENCES, reviewTimeZone: 'UTC', reviewTimeZoneAuto: false };
  const now = Date.parse('2026-10-19T12:00:00Z');
  const card = (id: string, date: string, intervalDays = 7): ReviewRecord => ({ id, panoId: id, dueAt: Date.parse(date), intervalDays, gradingHistory: [], lapseCount: 0, reviewCount: 1 });
  const reviews = [card('unfinished', '2026-10-18T00:00:00Z'), card('older', '2026-10-10T00:00:00Z'), card('later', '2026-10-19T00:00:00Z'), { ...card('new', '2026-10-20T00:00:00Z', 0), reviewCount: 0 }, card('short-step', '2026-10-18T12:00:00Z', .01), { ...card('graded-today', '2026-10-26T00:00:00Z'), lastReviewedAt: now - 3600e3 }];
  assert.deepEqual(planReviewRollover(reviews, now, preferences).map(({ id, toDueAt }) => [id, new Date(toDueAt).toISOString()]), [
    ['older', '2026-10-19T00:00:00.000Z'], ['unfinished', '2026-10-19T00:00:00.000Z'],
  ]);
  assert.deepEqual(planReviewRollover(reviews, now, { ...preferences, rollOverMissedReviews: false }), []);
});

test('a full day keeps its cards while same-day rollover is spread into available later days', () => {
  const preferences = { ...DEFAULT_SCHEDULER_PREFERENCES, reviewTimeZone: 'UTC', reviewTimeZoneAuto: false, minimumReviewsPerDay: 100 };
  const now = Date.parse('2026-11-03T16:10:00Z');
  const card = (id: string, dueAt: number): ReviewRecord => ({ id, panoId: id, dueAt, intervalDays: 7, gradingHistory: [], lapseCount: 0, reviewCount: 1 });
  const today = Date.parse('2026-11-03T00:00:00Z');
  const tomorrow = Date.parse('2026-11-04T00:00:00Z');
  const dayAfter = Date.parse('2026-11-05T00:00:00Z');
  const scheduled = [...Array.from({ length: 120 }, (_, index) => card(`today-${index}`, today)), ...Array.from({ length: 120 }, (_, index) => card(`tomorrow-${index}`, tomorrow)), ...Array.from({ length: 92 }, (_, index) => card(`later-${index}`, dayAfter))];
  const rolled = Array.from({ length: 120 }, (_, index) => ({ ...card(`rolled-${index}`, today), naturalDueAt: today - 864e5, dueAdjustedAt: now - 1000 }));
  const shifts = planReviewRollover([...scheduled, ...rolled], now, preferences);
  assert.equal(shifts.length, 120);
  assert.deepEqual([...new Set(shifts.map((shift) => shift.toDueAt))].map((day) => [day, shifts.filter((shift) => shift.toDueAt === day).length]), [
    [dayAfter, 8], [Date.parse('2026-11-06T00:00:00Z'), 100], [Date.parse('2026-11-07T00:00:00Z'), 12],
  ]);
  const updated = new Map(shifts.map((shift) => [shift.id, shift.toDueAt]));
  assert.deepEqual(planReviewRollover([...scheduled, ...rolled.map((review) => ({ ...review, dueAt: updated.get(review.id)! }))], now, preferences), []);
});
