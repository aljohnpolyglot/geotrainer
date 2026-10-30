import type { Attempt, ReviewRecord, TrainerLocation } from '../types';
import { calculateDistanceKm } from '../services/gameLogic';

export const REVIEW_DUPLICATE_RADIUS_KM = .05;
type ReviewPoint = { panoId: string; lat: number; lng: number; countryCode: string; sourcePointHash?: string };

const pointsByPano = (locations: TrainerLocation[], attempts: Attempt[]) => {
  const points = new Map<string, ReviewPoint>();
  attempts.forEach((item) => points.set(item.panoId, { panoId: item.panoId, lat: item.actualLat, lng: item.actualLng, countryCode: item.countryCode, sourcePointHash: item.sourcePointHash }));
  locations.forEach((item) => points.set(item.panoId, item));
  return points;
};

export const nearbyReviewPoint = (a: ReviewPoint, b: ReviewPoint) => a.countryCode === b.countryCode && (!!a.sourcePointHash && a.sourcePointHash === b.sourcePointHash || calculateDistanceKm(a.lat, a.lng, b.lat, b.lng) <= REVIEW_DUPLICATE_RADIUS_KM);

export function savedReviewMatcher(reviews: ReviewRecord[], locations: TrainerLocation[], attempts: Attempt[]) {
  const points = pointsByPano(locations, attempts);
  const exact = new Set(reviews.map((review) => review.panoId));
  const anchors = reviews.flatMap((review) => { const point = points.get(review.panoId); return point ? [point] : []; });
  return (target: ReviewPoint) => exact.has(target.panoId) || anchors.some((point) => nearbyReviewPoint(target, point));
}

export function uniqueReviewSources(attempts: Attempt[], canonicalPano: (attempt: Attempt) => string): Attempt[] {
  const priority = { play: 0, review: 1, study: 2 };
  const selected = new Map<string, Attempt>();
  for (const attempt of attempts) {
    const key = canonicalPano(attempt);
    const previous = selected.get(key);
    if (!previous || priority[attempt.source] < priority[previous.source]) selected.set(key, attempt);
  }
  return attempts.filter((attempt) => selected.get(canonicalPano(attempt)) === attempt);
}

const merge = (kept: ReviewRecord, duplicate: ReviewRecord): ReviewRecord => {
  const gradingHistory = [...kept.gradingHistory, ...duplicate.gradingHistory]
    .filter((item, index, values) => values.findIndex((other) => other.at === item.at && other.grade === item.grade) === index)
    .sort((a, b) => a.at - b.at);
  const generalization = (duplicate.generalizationUpdatedAt || 0) > (kept.generalizationUpdatedAt || 0) ? duplicate : kept;
  const keptReviewedAt = Math.max(kept.lastReviewedAt || 0, ...kept.gradingHistory.map((item) => item.at));
  const duplicateReviewedAt = Math.max(duplicate.lastReviewedAt || 0, ...duplicate.gradingHistory.map((item) => item.at));
  const schedule = duplicateReviewedAt > keptReviewedAt || duplicateReviewedAt === keptReviewedAt && ((duplicate.dueAdjustedAt || 0) > (kept.dueAdjustedAt || 0) || (duplicate.dueAdjustedAt || 0) === (kept.dueAdjustedAt || 0) && duplicate.dueAt < kept.dueAt) ? duplicate : kept;
  const { naturalDueAt: _naturalDueAt, dueAdjustedAt: _dueAdjustedAt, ...base } = kept;
  return {
    ...base,
    dueAt: schedule.dueAt,
    ...(schedule.naturalDueAt !== undefined ? { naturalDueAt: schedule.naturalDueAt } : {}),
    ...(schedule.dueAdjustedAt !== undefined ? { dueAdjustedAt: schedule.dueAdjustedAt } : {}),
    intervalDays: schedule.intervalDays,
    gradingHistory,
    lapseCount: kept.lapseCount + duplicate.lapseCount,
    reviewCount: kept.reviewCount + duplicate.reviewCount,
    lastReviewedAt: Math.max(kept.lastReviewedAt || 0, duplicate.lastReviewedAt || 0) || undefined,
    generalizationLevel: generalization.generalizationLevel,
    generalizationUpdatedAt: generalization.generalizationUpdatedAt,
  };
};

export function coalesceNearbyReviews(reviews: ReviewRecord[], locations: TrainerLocation[], attempts: Attempt[]) {
  const points = pointsByPano(locations, attempts); const aliases = new Map<string, string>(); const result: ReviewRecord[] = [];
  const latitudeBands = new Map<string, number[]>();
  const sourceHashes = new Map<string, number[]>();
  const add = (index: Map<string, number[]>, key: string, value: number) => {
    const entries = index.get(key);
    if (entries) entries.push(value); else index.set(key, [value]);
  };
  [...reviews].sort((a, b) => b.reviewCount - a.reviewCount || (b.lastReviewedAt || 0) - (a.lastReviewedAt || 0)).forEach((review) => {
    const point = points.get(review.panoId);
    // A 0.001-degree latitude band exceeds 50 m, including at the poles and date line.
    const band = point ? Math.floor(point.lat * 1000) : 0;
    const candidates = point ? [-1, 0, 1].flatMap((offset) => latitudeBands.get(`${point.countryCode}:${band + offset}`) || []) : [];
    if (point?.sourcePointHash) candidates.push(...(sourceHashes.get(`${point.countryCode}:${point.sourcePointHash}`) || []));
    let index = -1;
    for (const candidate of candidates) {
      if ((index < 0 || candidate < index) && nearbyReviewPoint(point!, points.get(result[candidate].panoId)!)) index = candidate;
    }
    if (index < 0) {
      const next = result.length;
      result.push(review);
      if (point) {
        add(latitudeBands, `${point.countryCode}:${band}`, next);
        if (point.sourcePointHash) add(sourceHashes, `${point.countryCode}:${point.sourcePointHash}`, next);
      }
    }
    else { aliases.set(review.panoId, result[index].panoId); result[index] = merge(result[index], review); }
  });
  return { reviews: result, aliases };
}

export function createReviewLookup(reviews: ReviewRecord[], locations: TrainerLocation[], attempts: Attempt[]) {
  const points = pointsByPano(locations, attempts);
  const exact = new Map(reviews.map((review) => [review.panoId, review]));
  return (target: ReviewPoint) => exact.get(target.panoId) || reviews.find((review) => { const point = points.get(review.panoId); return !!point && nearbyReviewPoint(target, point); });
}

export const nearbyReview = (reviews: ReviewRecord[], locations: TrainerLocation[], attempts: Attempt[], target: ReviewPoint) => createReviewLookup(reviews, locations, attempts)(target);
