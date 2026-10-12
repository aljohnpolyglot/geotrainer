import type { Attempt, ReviewRecord } from '../types';

export type DueShift = { id: string; fromDueAt: number; toDueAt: number; reset?: boolean };
const dayStart = (at: number) => new Date(at).setHours(0, 0, 0, 0);
const dayAt = (today: number, offset: number) => { const day = new Date(today); day.setDate(day.getDate() + offset); return day.getTime(); };

// Keep today's queue and short learning steps intact. Reviewed cards can move
// within 20% of their interval, capped at a week; first reviews can only move later.
export function planReviewRebalance(reviews: ReviewRecord[], now = Date.now(), strength = 50): DueShift[] {
  if (strength <= 0) return [];
  const moveCost = .4 - Math.min(100, strength) * .004;
  const today = dayStart(now);
  const days = Array.from({ length: 31 }, (_, offset) => dayAt(today, offset));
  const index = new Map(days.map((day, offset) => [day, offset]));
  const counts = days.map((day) => reviews.filter((review) => dayStart(review.dueAt) === day).length);
  const eligible = reviews.map((review) => ({ review, original: index.get(dayStart(review.dueAt)) ?? -1 }))
    .filter(({ review, original }) => original > 0 && review.intervalDays >= 2)
    .sort((a, b) => counts[b.original] - counts[a.original] || a.review.id.localeCompare(b.review.id));
  const shifts: DueShift[] = [];
  for (const { review, original } of eligible) {
    const radius = Math.min(7, Math.max(1, Math.floor(review.intervalDays * .2)));
    const earliest = review.reviewCount ? Math.max(1, original - radius) : original;
    const latest = Math.min(30, original + radius);
    counts[original]--;
    let best = original;
    for (let candidate = earliest; candidate <= latest; candidate++) {
      if (review.lastReviewedAt && days[candidate] < dayAt(dayStart(review.lastReviewedAt), Math.ceil(review.intervalDays * .8))) continue;
      if (counts[candidate] + Math.abs(candidate - original) * moveCost < counts[best] + Math.abs(best - original) * moveCost) best = candidate;
    }
    counts[best]++;
    if (best !== original) shifts.push({ id: review.id, fromDueAt: review.dueAt, toDueAt: days[best] + (review.dueAt - dayStart(review.dueAt)) });
  }
  return shifts;
}

export function planReviewReset(reviews: ReviewRecord[], attempts: Attempt[] = [], now = Date.now()): DueShift[] {
  const today = dayStart(now);
  const originalByReview = new Map(attempts.filter((attempt) => attempt.source === 'review' && attempt.nextDueAt !== undefined && attempt.intervalDays !== undefined).map((attempt) => [`${attempt.panoId}:${attempt.reviewedAt || attempt.createdAt}:${attempt.intervalDays}`, attempt.nextDueAt!]));
  return reviews.flatMap((review) => {
    if (!review.dueAdjustedAt || dayStart(review.dueAt) <= today) return [];
    const recordedDue = originalByReview.get(`${review.panoId}:${review.lastReviewedAt}:${review.intervalDays}`);
    const naturalDueAt = review.naturalDueAt ?? recordedDue;
    return naturalDueAt !== undefined && dayStart(naturalDueAt) > today && naturalDueAt !== review.dueAt ? [{ id: review.id, fromDueAt: review.dueAt, toDueAt: naturalDueAt, reset: true }] : [];
  });
}
