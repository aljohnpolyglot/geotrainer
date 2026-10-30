import type { Attempt, ReviewGrade, ReviewRecord, SchedulerPreferences } from '../types';
import { nextGeneralizationLevel } from './reviewVariation';
import { configuredCountryScoreFloor, intervalsFor, reviewGradeForPerformance } from './reviewGrading';
import { nextReviewAt } from './reviewTiming';
import type { DueShift } from './reviewRebalance';

export function gradedReviewRecord(panoId: string, grade: ReviewGrade, previous: ReviewRecord | undefined, preferences: SchedulerPreferences, intervalOverride?: number, variation?: { level?: number; kind?: 'original' | 'heading' | 'spatial' }, now = Date.now()): ReviewRecord {
  const intervalDays = Math.min(preferences.maximumIntervalDays, intervalOverride ?? intervalsFor(previous?.intervalDays || 0, preferences)[grade]);
  const { naturalDueAt: _naturalDueAt, dueAdjustedAt: _dueAdjustedAt, ...base } = previous || {};
  return { ...base, id: previous?.panoId || panoId, panoId: previous?.panoId || panoId,
    dueAt: nextReviewAt(now, intervalDays, preferences), intervalDays,
    gradingHistory: [...(previous?.gradingHistory || []), { grade, at: now }],
    lapseCount: (previous?.lapseCount || 0) + (grade === 'again' ? 1 : 0), reviewCount: (previous?.reviewCount || 0) + 1, lastReviewedAt: now,
    ...(variation?.kind && variation.kind !== 'original' ? { generalizationLevel: nextGeneralizationLevel(previous?.generalizationLevel ?? variation.level, variation.level, variation.kind, grade), generalizationUpdatedAt: now } : {}),
  };
}

export function generalizedReviewRecord(previous: ReviewRecord | undefined, grade: ReviewGrade, variation: { level?: number; kind?: 'original' | 'heading' | 'spatial' }, now = Date.now()) {
  return !previous || !variation.kind || variation.kind === 'original' ? previous : { ...previous, generalizationLevel: nextGeneralizationLevel(previous.generalizationLevel ?? variation.level, variation.level, variation.kind, grade), generalizationUpdatedAt: now };
}

export function reconcileReviewAttempt(review: ReviewRecord, attempt: Attempt, preferences: SchedulerPreferences): ReviewRecord {
  const at = attempt.reviewedAt || attempt.createdAt;
  if (attempt.source !== 'review' || (review.lastReviewedAt || 0) > at) return review;
  const grade = attempt.grade || reviewGradeForPerformance(attempt.score, attempt.timeSpentSeconds, attempt.guessedCountryCode === attempt.countryCode, preferences.maximumAnswerSeconds, preferences.strictness, configuredCountryScoreFloor(attempt.countryCode, preferences));
  const intervalDays = attempt.intervalDays ?? Math.min(preferences.maximumIntervalDays, intervalsFor(review.intervalDays, preferences)[grade]);
  if (review.lastReviewedAt === at) {
    if (review.dueAdjustedAt && review.dueAdjustedAt >= at && (attempt.nextDueAt === undefined || review.naturalDueAt === undefined || review.naturalDueAt === attempt.nextDueAt)) return review;
    if (attempt.nextDueAt === undefined || review.dueAt === attempt.nextDueAt && review.intervalDays === intervalDays && !review.dueAdjustedAt) return review;
    const { dueAdjustedAt: _dueAdjustedAt, naturalDueAt: _naturalDueAt, ...unadjusted } = review;
    return { ...unadjusted, dueAt: attempt.nextDueAt, intervalDays };
  }
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
