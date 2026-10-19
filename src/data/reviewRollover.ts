import type { ReviewRecord, SchedulerPreferences } from '../types';
import type { DueShift } from './reviewRebalance';
import { nextReviewAt, reviewDayStart } from './reviewTiming';

export function planReviewRollover(reviews: ReviewRecord[], now: number, preferences: SchedulerPreferences): DueShift[] {
  if (preferences.rollOverMissedReviews === false) return [];
  const today = reviewDayStart(now, preferences);
  const eligible = reviews.filter((review) => (review.intervalDays >= 1 || review.reviewCount === 0) && (!review.lastReviewedAt || review.lastReviewedAt < today));
  const earliest = Math.min(...eligible.filter((review) => reviewDayStart(review.dueAt, preferences) < today).map((review) => reviewDayStart(review.dueAt, preferences)));
  if (!Number.isFinite(earliest)) return [];
  const days = Math.round((today - earliest) / 864e5);
  return eligible.filter((review) => reviewDayStart(review.dueAt, preferences) >= earliest).map((review) => ({
    id: review.id, fromDueAt: review.dueAt,
    toDueAt: review.dueAt + nextReviewAt(review.dueAt, days, preferences) - reviewDayStart(review.dueAt, preferences),
  }));
}
