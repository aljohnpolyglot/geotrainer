import type { ReviewRecord, SchedulerPreferences } from '../types';
import type { DueShift } from './reviewRebalance';
import { nextReviewAt, reviewDayStart } from './reviewTiming';

export function planReviewRollover(reviews: ReviewRecord[], now: number, preferences: SchedulerPreferences): DueShift[] {
  if (preferences.rollOverMissedReviews === false) return [];
  const today = reviewDayStart(now, preferences);
  const missed = reviews.filter((review) => {
    const dueDay = reviewDayStart(review.dueAt, preferences);
    return (review.intervalDays >= 1 || review.reviewCount === 0) && (!review.lastReviewedAt || review.lastReviewedAt < today)
      && (dueDay < today || dueDay === today && !!review.dueAdjustedAt && review.dueAdjustedAt >= today && review.dueAdjustedAt <= now);
  }).sort((a, b) => (a.naturalDueAt ?? a.dueAt) - (b.naturalDueAt ?? b.dueAt) || a.id.localeCompare(b.id));
  const missedIds = new Set(missed.map((review) => review.id));
  const counts = new Map<number, number>();
  for (const review of reviews) {
    if (missedIds.has(review.id)) continue;
    const day = Math.max(today, reviewDayStart(review.dueAt, preferences));
    counts.set(day, (counts.get(day) || 0) + 1);
  }
  const shifts: DueShift[] = [];
  let day = today;
  for (const review of missed) {
    while ((counts.get(day) || 0) >= preferences.minimumReviewsPerDay) day = nextReviewAt(day, 1, preferences);
    counts.set(day, (counts.get(day) || 0) + 1);
    const toDueAt = day + review.dueAt - reviewDayStart(review.dueAt, preferences);
    if (toDueAt !== review.dueAt) shifts.push({ id: review.id, fromDueAt: review.dueAt, toDueAt });
  }
  return shifts;
}
