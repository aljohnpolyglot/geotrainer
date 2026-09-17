import type { Environment, LocationResult, ReviewGrade, ReviewRecord } from '../types';
import { calculateDistanceKm } from '../services/gameLogic';

export type GeneralizationLevel = 0 | 1 | 2 | 3 | 4;
export type ReviewVariationPlan = {
  kind: 'original' | 'heading' | 'spatial';
  generalizationLevel: GeneralizationLevel;
  heading?: number;
  maxDistanceM: number;
  seed: number;
};

export type ReviewCandidate = Pick<LocationResult, 'panoId' | 'lat' | 'lng' | 'countryCode'> & { heading?: number };

export const clampReviewViewVariationDifficulty = (value: unknown) => {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(100, Math.max(0, number)) : 50;
};

export const reviewVariationCheckpoint = (value: unknown) => {
  const difficulty = clampReviewViewVariationDifficulty(value);
  if (difficulty === 0) return 0;
  if (difficulty < 25) return 1;
  if (difficulty < 50) return 25;
  if (difficulty < 75) return 50;
  if (difficulty < 100) return 75;
  return 100;
};

export const reviewVariationSeed = (value: string) => {
  let hash = 2166136261;
  for (const char of value) hash = Math.imul(hash ^ char.charCodeAt(0), 16777619);
  return hash >>> 0;
};

export const derivedGeneralizationLevel = (review?: ReviewRecord): GeneralizationLevel => {
  if (review?.generalizationLevel !== undefined) return Math.min(4, Math.max(0, Math.round(review.generalizationLevel))) as GeneralizationLevel;
  if (!review?.reviewCount) return 0;
  if (review.reviewCount < 2 || review.intervalDays < 7) return 1;
  if (review.reviewCount < 4 || review.intervalDays < 30) return 2;
  if (review.reviewCount < 7 || review.intervalDays < 90) return 3;
  return 4;
};

const distanceFor = (level: GeneralizationLevel, difficulty: number, environment: Environment) => {
  if (!level) return 0;
  const ranges = [[0, 0], [20, 100], [100, 500], [500, 2000], [1000, 5000]] as const;
  const [minimum, maximum] = ranges[level];
  const safety = environment === 'urban' ? .4 : environment === 'suburban' ? .7 : environment === 'rural' ? 1 : .6;
  return Math.round((minimum + (maximum - minimum) * difficulty / 100) * safety);
};

export function planReviewVariation(enabled: boolean, difficultyValue: unknown, review: ReviewRecord | undefined, anchorHeading: number | undefined, environment: Environment = 'mixed'): ReviewVariationPlan {
  const difficulty = clampReviewViewVariationDifficulty(difficultyValue);
  const seed = reviewVariationSeed(`${review?.panoId || 'new'}:${review?.reviewCount || 0}:${review?.lapseCount || 0}`);
  if (!enabled || difficulty === 0) return { kind: 'original', generalizationLevel: 0, heading: anchorHeading, maxDistanceM: 0, seed };
  const level = derivedGeneralizationLevel(review);
  if (seed % 7 === 0) return { kind: 'original', generalizationLevel: level, heading: anchorHeading, maxDistanceM: 0, seed };
  const variedHeading = ((anchorHeading ?? seed % 360) + 70 + seed % 111) % 360;
  if (!level) return { kind: 'heading', generalizationLevel: 0, heading: variedHeading, maxDistanceM: 0, seed };
  return { kind: 'spatial', generalizationLevel: level, heading: variedHeading, maxDistanceM: distanceFor(level, difficulty, environment), seed };
}

export function chooseReviewCandidate(anchor: ReviewCandidate, candidates: ReviewCandidate[], plan: ReviewVariationPlan, recentlyShown = new Set<string>()): ReviewCandidate {
  if (plan.kind !== 'spatial' || !plan.maxDistanceM) return { ...anchor, heading: plan.heading ?? anchor.heading };
  const eligible = candidates.map((candidate) => ({ candidate, distanceM: calculateDistanceKm(anchor.lat, anchor.lng, candidate.lat, candidate.lng) * 1000 }))
    .filter(({ candidate, distanceM }) => candidate.panoId !== anchor.panoId && candidate.countryCode === anchor.countryCode && distanceM <= plan.maxDistanceM * 1.2)
    .sort((a, b) => Number(recentlyShown.has(a.candidate.panoId)) - Number(recentlyShown.has(b.candidate.panoId)) || Math.abs(a.distanceM - plan.maxDistanceM * .75) - Math.abs(b.distanceM - plan.maxDistanceM * .75));
  return eligible[0]?.candidate ? { ...eligible[0].candidate, heading: eligible[0].candidate.heading ?? plan.heading } : { ...anchor, heading: anchor.heading };
}

export function nextGeneralizationLevel(current: number | undefined, shown: number | undefined, kind: ReviewVariationPlan['kind'] | undefined, grade: ReviewGrade): GeneralizationLevel {
  const level = Math.min(4, Math.max(0, Math.round(current || 0))) as GeneralizationLevel;
  if (kind === 'original') return level;
  if (grade === 'again') return Math.max(0, Math.min(level, shown || level) - 1) as GeneralizationLevel;
  if (grade === 'good' || grade === 'easy') return Math.min(4, Math.max(level, shown || 0) + 1) as GeneralizationLevel;
  return level;
}
