import assert from 'node:assert/strict';
import test from 'node:test';
import { planReviewRebalance, planReviewReset } from './reviewRebalance';
import { reconcileReviewAttempt } from './trainerDb';
import { DEFAULT_SCHEDULER_PREFERENCES } from './reviewPreferences';
import type { Attempt, ReviewRecord } from '../types';

test('review balancing lowers a future peak without moving due, short-step, or first-review cards earlier', () => {
  const now = new Date(2026, 9, 7, 12).getTime();
  const due = new Date(2026, 9, 13).getTime();
  const card = (id: string, intervalDays = 14, reviewCount = 2): ReviewRecord => ({ id, panoId: id, dueAt: due, intervalDays, reviewCount, lapseCount: 0, gradingHistory: [] });
  const reviews = [card('today'), ...Array.from({ length: 12 }, (_, index) => card(`peak-${index}`)), card('short', 1), card('new', 7, 0)];
  reviews[0].dueAt = now;
  const shifts = planReviewRebalance(reviews, now);
  assert.ok(shifts.length > 0);
  assert.ok(shifts.every((shift) => shift.id !== 'today' && shift.id !== 'short'));
  assert.ok(shifts.every((shift) => Math.abs(shift.toDueAt - shift.fromDueAt) <= 2 * 864e5));
  assert.ok(shifts.filter((shift) => shift.id === 'new').every((shift) => shift.toDueAt > due));
  const adjusted = new Map(shifts.map((shift) => [shift.id, shift.toDueAt]));
  assert.ok(reviews.filter((review) => (adjusted.get(review.id) || review.dueAt) === due).length < 14);
  const changed = { ...reviews[1], dueAt: adjusted.get(reviews[1].id) || due, dueAdjustedAt: now };
  const attempt = { source: 'review', reviewedAt: now - 1000, nextDueAt: due, intervalDays: 14 } as Attempt;
  changed.lastReviewedAt = attempt.reviewedAt;
  assert.equal(reconcileReviewAttempt(changed, attempt, DEFAULT_SCHEDULER_PREFERENCES).dueAt, changed.dueAt);
});

test('balance strength changes the proposed schedule without expanding card date limits', () => {
  const now = new Date(2026, 9, 7, 12).getTime();
  const dueAt = new Date(2026, 9, 20).getTime();
  const reviews: ReviewRecord[] = Array.from({ length: 30 }, (_, index) => ({ id: `card-${index}`, panoId: `pano-${index}`, dueAt, intervalDays: 35, reviewCount: 3, lapseCount: 0, gradingHistory: [] }));
  assert.deepEqual(planReviewRebalance(reviews, now, 0), []);
  const moderate = planReviewRebalance(reviews, now, 50);
  const stronger = planReviewRebalance(reviews, now, 100);
  assert.ok(stronger.length > moderate.length);
  assert.ok(stronger.reduce((total, shift) => total + Math.abs(shift.toDueAt - shift.fromDueAt), 0) > moderate.reduce((total, shift) => total + Math.abs(shift.toDueAt - shift.fromDueAt), 0));
  assert.ok(stronger.every((shift) => Math.abs(shift.toDueAt - shift.fromDueAt) <= 7 * 864e5));
});

test('reset uses saved original dates or matching Review attempts and leaves today alone', () => {
  const now = new Date(2026, 9, 7, 12).getTime();
  const naturalDueAt = new Date(2026, 9, 14).getTime();
  const movedDueAt = new Date(2026, 9, 15).getTime();
  const card = (id: string, extra: Partial<ReviewRecord> = {}): ReviewRecord => ({ id, panoId: id, dueAt: movedDueAt, naturalDueAt, dueAdjustedAt: now - 1000, intervalDays: 7, reviewCount: 1, lapseCount: 0, gradingHistory: [], ...extra });
  const legacy = card('legacy', { naturalDueAt: undefined, lastReviewedAt: now - 864e5 });
  const attempt = { source: 'review', panoId: legacy.panoId, reviewedAt: legacy.lastReviewedAt, intervalDays: 7, nextDueAt: naturalDueAt } as Attempt;
  const shifts = planReviewReset([card('saved'), legacy, card('today', { dueAt: now }), card('untouched', { dueAdjustedAt: undefined })], [attempt], now);
  assert.deepEqual(shifts.map(({ id }) => id), ['saved', 'legacy']);
  assert.ok(shifts.every((shift) => shift.toDueAt === naturalDueAt && shift.reset));
});
