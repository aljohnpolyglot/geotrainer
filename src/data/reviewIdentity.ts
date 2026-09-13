import type { Attempt, ReviewRecord, TrainerLocation } from '../types';
import { calculateDistanceKm } from '../services/gameLogic';

export const REVIEW_DUPLICATE_RADIUS_KM = .05;
type ReviewPoint = { panoId: string; lat: number; lng: number; countryCode: string };

const pointsByPano = (locations: TrainerLocation[], attempts: Attempt[]) => {
  const points = new Map<string, ReviewPoint>();
  attempts.forEach((item) => points.set(item.panoId, { panoId: item.panoId, lat: item.actualLat, lng: item.actualLng, countryCode: item.countryCode }));
  locations.forEach((item) => points.set(item.panoId, item));
  return points;
};

const nearby = (a: ReviewPoint, b: ReviewPoint) => a.countryCode === b.countryCode && calculateDistanceKm(a.lat, a.lng, b.lat, b.lng) <= REVIEW_DUPLICATE_RADIUS_KM;

export const hasStudyReviewSource = (attempts: Attempt[], panoId: string) => attempts.some((attempt) => attempt.source === 'study' && attempt.panoId === panoId);

const merge = (kept: ReviewRecord, duplicate: ReviewRecord): ReviewRecord => {
  const gradingHistory = [...kept.gradingHistory, ...duplicate.gradingHistory]
    .filter((item, index, values) => values.findIndex((other) => other.at === item.at && other.grade === item.grade) === index)
    .sort((a, b) => a.at - b.at);
  return {
    ...kept,
    dueAt: Math.min(kept.dueAt, duplicate.dueAt),
    intervalDays: Math.min(kept.intervalDays, duplicate.intervalDays),
    gradingHistory,
    lapseCount: kept.lapseCount + duplicate.lapseCount,
    reviewCount: kept.reviewCount + duplicate.reviewCount,
    lastReviewedAt: Math.max(kept.lastReviewedAt || 0, duplicate.lastReviewedAt || 0) || undefined,
  };
};

export function coalesceNearbyReviews(reviews: ReviewRecord[], locations: TrainerLocation[], attempts: Attempt[]) {
  const points = pointsByPano(locations, attempts); const aliases = new Map<string, string>(); const result: ReviewRecord[] = [];
  [...reviews].sort((a, b) => b.reviewCount - a.reviewCount || (b.lastReviewedAt || 0) - (a.lastReviewedAt || 0)).forEach((review) => {
    const point = points.get(review.panoId); const index = point ? result.findIndex((item) => { const candidate = points.get(item.panoId); return !!candidate && nearby(point, candidate); }) : -1;
    if (index < 0) result.push(review);
    else { aliases.set(review.panoId, result[index].panoId); result[index] = merge(result[index], review); }
  });
  return { reviews: result, aliases };
}

export function nearbyReview(reviews: ReviewRecord[], locations: TrainerLocation[], attempts: Attempt[], target: ReviewPoint) {
  const points = pointsByPano(locations, attempts);
  return reviews.find((review) => review.panoId === target.panoId) || reviews.find((review) => { const point = points.get(review.panoId); return !!point && nearby(target, point); });
}
