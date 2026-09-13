import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_SCHEDULER_PREFERENCES, isCountryMistake, nextReviewAt, reconcileReviewAttempt, reviewDayStart, reviewGradeForPerformance, shouldScheduleReview } from './trainerDb';

test('automatic grading scales from country-first beginner to 4800-point pro', () => {
  assert.equal(reviewGradeForPerformance(1600, 20, true, 60, 'beginner'), 'hard');
  assert.equal(reviewGradeForPerformance(1999, 20, true, 60, 'balanced'), 'again');
  assert.equal(reviewGradeForPerformance(4500, 20, true, 60, 'balanced'), 'easy');
  assert.equal(reviewGradeForPerformance(4799, 20, true, 60, 'pro'), 'again');
  assert.equal(reviewGradeForPerformance(5000, 61, true, 60, 'pro'), 'hard');
  assert.equal(reviewGradeForPerformance(5000, 20, false, 60, 'beginner'), 'again');
  assert.equal(isCountryMistake(4799, 'IT', 'IT', 'pro'), true);
  assert.equal(isCountryMistake(4800, 'IT', 'IT', 'pro'), false);
});

test('daily review boundary follows configured timezone and reset time', () => {
  const preferences = { ...DEFAULT_SCHEDULER_PREFERENCES, reviewTimeZone: 'Asia/Singapore', reviewDayResetMinutes: 240 };
  const before = Date.parse('2026-09-10T20:30:00.000Z'); // 04:30 local, same review day
  const after = Date.parse('2026-09-10T18:30:00.000Z'); // 02:30 local, previous review day
  assert.equal(new Date(reviewDayStart(before, preferences)).toISOString(), '2026-09-10T20:00:00.000Z');
  assert.equal(new Date(reviewDayStart(after, preferences)).toISOString(), '2026-09-09T20:00:00.000Z');
});

test('interday due dates become available at the configured boundary', () => {
  const preferences = { ...DEFAULT_SCHEDULER_PREFERENCES, reviewTimeZone: 'UTC', reviewDayResetMinutes: 0 };
  assert.equal(new Date(reviewDayStart(Date.parse('2026-09-12T10:41:00.000Z'), preferences)).toISOString(), '2026-09-12T00:00:00.000Z');
  assert.equal(new Date(nextReviewAt(Date.parse('2026-09-12T10:41:00.000Z'), 1, preferences)).toISOString(), '2026-09-13T00:00:00.000Z');
});

test('practicing a card that is already due advances its persisted schedule', () => {
  const now = Date.parse('2026-09-12T10:00:00.000Z');
  const due = { id: 'pano', panoId: 'pano', dueAt: now - 1, intervalDays: 0, gradingHistory: [], lapseCount: 0, reviewCount: 1 };
  assert.equal(shouldScheduleReview('practice', due, now, DEFAULT_SCHEDULER_PREFERENCES), true);
  assert.equal(shouldScheduleReview('practice', { ...due, dueAt: now + 60_000 }, now, DEFAULT_SCHEDULER_PREFERENCES), false);
});

test('a saved review attempt repairs a stale due record', () => {
  const reviewedAt = Date.parse('2026-09-12T10:00:00.000Z');
  const review = { id: 'pano', panoId: 'pano', dueAt: reviewedAt - 1, intervalDays: 1, gradingHistory: [], lapseCount: 0, reviewCount: 0 };
  const attempt = { source: 'review', panoId: 'pano', createdAt: reviewedAt, reviewedAt, score: 4872, timeSpentSeconds: 20, countryCode: 'BZ', guessedCountryCode: 'BZ', intervalDays: 7, nextDueAt: reviewedAt + 7 * 864e5, grade: 'easy' };
  const repaired = reconcileReviewAttempt(review, attempt as never, DEFAULT_SCHEDULER_PREFERENCES);
  assert.equal(repaired.dueAt, attempt.nextDueAt);
  assert.equal(repaired.reviewCount, 1);
  assert.equal(repaired.lastReviewedAt, reviewedAt);
});
