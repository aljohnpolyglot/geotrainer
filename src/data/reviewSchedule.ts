import type { Attempt, ReviewRecord, SchedulerPreferences } from '../types';
import { configuredCountryScoreFloor, intervalsFor, reviewGradeForPerformance } from './reviewGrading';
import { nextReviewAt } from './reviewTiming';
import type { DueShift } from './reviewRebalance';

export function reconcileReviewAttempt(review: ReviewRecord, attempt: Attempt, preferences: SchedulerPreferences): ReviewRecord {
  const at = attempt.reviewedAt || attempt.createdAt;
  if (attempt.source !== 'review' || (review.lastReviewedAt || 0) > at) return review;
  const grade = attempt.grade || reviewGradeForPerformance(attempt.score, attempt.timeSpentSeconds, attempt.guessedCountryCode === attempt.countryCode, preferences.maximumAnswerSeconds, preferences.strictness, configuredCountryScoreFloor(attempt.countryCode, preferences));
  const intervalDays = attempt.intervalDays ?? Math.min(preferences.maximumIntervalDays, intervalsFor(review.intervalDays, preferences)[grade]);
  if (review.lastReviewedAt === at) return review.dueAdjustedAt && review.dueAdjustedAt >= at ? review : attempt.nextDueAt !== undefined && (review.dueAt !== attempt.nextDueAt || review.intervalDays !== intervalDays) ? { ...review, dueAt: attempt.nextDueAt, intervalDays } : review;
  const { dueAdjustedAt: _dueAdjustedAt, naturalDueAt: _naturalDueAt, ...unadjusted } = review;
  return { ...unadjusted, dueAt: attempt.nextDueAt ?? nextReviewAt(at, intervalDays, preferences), intervalDays, gradingHistory: [...(review.gradingHistory || []), { grade, at }], lapseCount: review.lapseCount + (grade === 'again' ? 1 : 0), reviewCount: review.reviewCount + 1, lastReviewedAt: at };
}

export async function rebalanceReviewDates(shifts: DueShift[], openDatabase: () => Promise<IDBDatabase>): Promise<void> {
  if (!shifts.length) return;
  const db = await openDatabase();
  const tx = db.transaction('reviews', 'readwrite');
  const completed = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error('Database transaction aborted'));
  });
  const store = tx.objectStore('reviews');
  const updates: ReviewRecord[] = [];
  const adjustedAt = Date.now();
  let pending = shifts.length;
  for (const shift of shifts) {
    const lookup = store.get(shift.id);
    lookup.onsuccess = () => {
      const review = lookup.result as ReviewRecord | undefined;
      if (!review || review.dueAt !== shift.fromDueAt) { tx.abort(); return; }
      updates.push({ ...review, dueAt: shift.toDueAt, naturalDueAt: shift.reset ? shift.toDueAt : review.naturalDueAt ?? review.dueAt, dueAdjustedAt: adjustedAt });
      if (--pending === 0) updates.forEach((item) => store.put(item));
    };
  }
  await completed;
}
