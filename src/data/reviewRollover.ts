import type { ReviewRecord, SchedulerPreferences } from '../types';
import type { DueShift } from './reviewRebalance';
import { planReviewReset } from './reviewRebalance';
import { nextReviewAt, reviewDayStart } from './reviewTiming';

export function planLegacyRolloverRepair(reviews: ReviewRecord[], now: number): DueShift[] {
  // Date balancing never moves a card by more than seven days.
  return planReviewReset(reviews.filter((review) => review.naturalDueAt !== undefined && Math.round((review.dueAt - review.naturalDueAt) / 864e5) > 7), [], now);
}

export function planReviewRollover(reviews: ReviewRecord[], now: number, preferences: SchedulerPreferences): DueShift[] {
  if (preferences.rollOverMissedReviews === false) return [];
  const today = reviewDayStart(now, preferences);
  const eligible = reviews.filter((review) => (review.intervalDays >= 1 || review.reviewCount === 0) && (!review.lastReviewedAt || review.lastReviewedAt < today));
  return eligible.filter((review) => reviewDayStart(review.dueAt, preferences) < today).map((review) => {
    const dueDay = reviewDayStart(review.dueAt, preferences);
    const missedDays = Math.round((today - dueDay) / 864e5);
    return { id: review.id, fromDueAt: review.dueAt, toDueAt: review.dueAt + nextReviewAt(review.dueAt, missedDays, preferences) - dueDay };
  });
}
