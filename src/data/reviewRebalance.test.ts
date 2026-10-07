import assert from 'node:assert/strict';
import test from 'node:test';
import { planReviewRebalance } from './reviewRebalance';
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
