import type { Attempt, ReviewRecord, StudyVisit, TrainerLocation, TrainingSession } from '../types';
import { geographyFor } from './geography';
import { COUNTRIES } from '../data/countries';

export type RangeKey = 'today' | '7d' | '30d' | '90d' | 'year' | 'all' | 'custom';
export type AnalyticsInput = { attempts: Attempt[]; visits: StudyVisit[]; locations: TrainerLocation[]; reviews: ReviewRecord[]; sessions: TrainingSession[] };
export type Accuracy = { correct: number; eligible: number; unknown: number; rate: number | null };
export const sampleLabel = (n: number) => n < 5 ? 'very low sample' : n < 15 ? 'low sample' : n < 50 ? 'moderate' : 'strong sample';
const rate = (correct: number, eligible: number): Accuracy => ({ correct, eligible, unknown: 0, rate: eligible ? correct / eligible : null });
const mean = (values: number[]) => values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;
export const percentile = (values: number[], p: number) => {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.floor((sorted.length - 1) * p))];
};
const median = (values: number[]) => percentile(values, .5);
const localDay = (value: number) => { const d = new Date(value); return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime(); };

export function rangeBounds(key: RangeKey, now = Date.now(), custom?: { from?: string; to?: string }) {
  const today = localDay(now);
  if (key === 'all') return { from: -Infinity, to: Infinity };
  if (key === 'custom') return {
    from: custom?.from ? new Date(`${custom.from}T00:00:00`).getTime() : -Infinity,
    to: custom?.to ? new Date(`${custom.to}T00:00:00`).setHours(23, 59, 59, 999) : Infinity,
  };
  if (key === 'year') return { from: new Date(new Date(now).getFullYear(), 0, 1).getTime(), to: Infinity };
  const days = key === 'today' ? 0 : Number(key.slice(0, -1)) - 1;
  return { from: today - days * 86400000, to: Infinity };
}

export function filterByRange<T>(items: T[], timestamp: (item: T) => number, bounds: { from: number; to: number }) {
  return items.filter((item) => timestamp(item) >= bounds.from && timestamp(item) <= bounds.to);
}

export function performanceAttempts(attempts: Attempt[], includeReviews = false, includeAssisted = false) {
  return attempts.filter((item) => (item.source === 'play' || includeReviews && item.source === 'review') && (includeAssisted || !item.aiAssisted));
}

export function recognition(attempts: Attempt[]) {
  const eligible = attempts.filter((item) => item.guessedCountryCode && geographyFor(item.countryCode) && geographyFor(item.guessedCountryCode));
  const country = rate(eligible.filter((item) => item.guessedCountryCode === item.countryCode).length, eligible.length);
  const region = rate(eligible.filter((item) => geographyFor(item.guessedCountryCode)!.region === geographyFor(item.countryCode)!.region).length, eligible.length);
  const continent = rate(eligible.filter((item) => geographyFor(item.guessedCountryCode)!.continent === geographyFor(item.countryCode)!.continent).length, eligible.length);
  const unknown = attempts.length - eligible.length;
  return { country: { ...country, unknown }, region: { ...region, unknown }, continent: { ...continent, unknown } };
}

export function metrics(attempts: Attempt[]) {
  const ladder = recognition(attempts);
  const distance = attempts.flatMap((item) => item.distanceKm === null ? [] : [item.distanceKm]);
  return {
    attempts: attempts.length, ladder, averageScore: mean(attempts.map((item) => item.score)), medianScore: median(attempts.map((item) => item.score)),
    averageDistance: mean(distance), medianDistance: median(distance), p75Distance: percentile(distance, .75), p90Distance: percentile(distance, .9),
    averageTime: mean(attempts.map((item) => item.timeSpentSeconds).filter(Number.isFinite)),
  };
}

export type Breakdown = { key: string; attempts: number; country: Accuracy; region: Accuracy; continent: Accuracy; averageScore: number | null; medianDistance: number | null; averageDistance: number | null; averageTime: number | null };
export function breakdown(attempts: Attempt[], key: (attempt: Attempt) => string | undefined): Breakdown[] {
  const groups = new Map<string, Attempt[]>();
  attempts.forEach((item) => { const value = key(item); if (value) groups.set(value, [...(groups.get(value) || []), item]); });
  return [...groups].map(([name, items]) => { const value = metrics(items); return { key: name, attempts: items.length, ...value.ladder, averageScore: value.averageScore, medianDistance: value.medianDistance, averageDistance: value.averageDistance, averageTime: value.averageTime }; });
}

export const movementMode = (item: Attempt) => item.canMove ? 'Standard' : item.canPan || item.canZoom ? 'No Move' : 'NMPZ';
export const environmentOf = (item: Attempt) => item.environment || item.environmentRequested;
export const countryBreakdown = (items: Attempt[]) => breakdown(items, (item) => item.countryCode);
export const regionBreakdown = (items: Attempt[]) => breakdown(items, (item) => geographyFor(item.countryCode)?.region);
export const continentBreakdown = (items: Attempt[]) => breakdown(items, (item) => geographyFor(item.countryCode)?.continent);

export function confusions(attempts: Attempt[]) {
  const directional = new Map<string, number>();
  attempts.forEach((item) => {
    if (!item.guessedCountryCode || item.guessedCountryCode === item.countryCode) return;
    const key = `${item.countryCode}:${item.guessedCountryCode}`;
    directional.set(key, (directional.get(key) || 0) + 1);
  });
  const symmetric = new Map<string, number>();
  directional.forEach((count, key) => { const pair = key.split(':').sort().join(':'); symmetric.set(pair, (symmetric.get(pair) || 0) + count); });
  const rows = (map: Map<string, number>) => [...map].sort((a, b) => b[1] - a[1]).map(([key, count]) => ({ codes: key.split(':'), count }));
  return { directional: rows(directional), symmetric: rows(symmetric) };
}

export function reviewAnalytics(attempts: Attempt[], reviews: ReviewRecord[], now = Date.now()) {
  const byId = new Map(attempts.map((item) => [item.id, item]));
  const reviewAttempts = attempts.filter((item) => item.source === 'review').sort((a, b) => a.createdAt - b.createdAt);
  const improvements = reviewAttempts.flatMap((item) => {
    const original = item.sourceAttemptId ? byId.get(item.sourceAttemptId) : undefined;
    return original ? [{ attempt: item, original, score: item.score - original.score, distance: item.distanceKm !== null && original.distanceKm !== null ? original.distanceKm - item.distanceKm : null }] : [];
  });
  const gradeCounts = { again: 0, hard: 0, good: 0, easy: 0 };
  reviews.flatMap((item) => item.gradingHistory).forEach((item) => gradeCounts[item.grade]++);
  return {
    completed: reviewAttempts.length, due: reviews.filter((item) => item.dueAt <= now).length, locations: new Set(reviewAttempts.map((item) => item.panoId)).size,
    averageBefore: mean(improvements.map((item) => item.original.score)), averageAfter: mean(improvements.map((item) => item.attempt.score)),
    averageImprovement: mean(improvements.map((item) => item.score)), improved: improvements.filter((item) => item.score > 0).length,
    corrected: improvements.filter((item) => item.original.guessedCountryCode !== item.original.countryCode && item.attempt.guessedCountryCode === item.attempt.countryCode).length,
    eligible: improvements.length, gradeCounts, improvements,
  };
}

export function countryBalancedAccuracy(attempts: Attempt[], minimum = 5) {
  const values = countryBreakdown(attempts).filter((item) => item.country.eligible >= minimum && item.country.rate !== null).map((item) => item.country.rate!);
  return { rate: mean(values), countries: values.length, minimum };
}

export function rollingBest(attempts: Attempt[], size: number, value: (items: Attempt[]) => number | null) {
  const sorted = [...attempts].sort((a, b) => a.createdAt - b.createdAt);
  let best: number | null = null;
  for (let i = size; i <= sorted.length; i++) { const next = value(sorted.slice(i - size, i)); if (next !== null && (best === null || next > best)) best = next; }
  return best;
}

export function beginnerSummary(attempts: Attempt[]) {
  const ladder = recognition(attempts);
  const top = confusions(attempts).symmetric[0];
  const weakest = regionBreakdown(attempts).filter((item) => item.country.eligible >= 5 && item.country.rate !== null).sort((a, b) => itemRate(a) - itemRate(b))[0];
  const environments = breakdown(attempts, environmentOf).filter((item) => item.country.eligible >= 5 && item.country.rate !== null).sort((a, b) => itemRate(a) - itemRate(b));
  const pct = (value: number | null) => value === null ? 'not enough data' : `${Math.round(value * 100)}%`;
  return [
    `Continent recognition: ${pct(ladder.continent.rate)}.`, `Region recognition: ${pct(ladder.region.rate)}.`, `Exact-country recognition: ${pct(ladder.country.rate)}.`,
    ...(weakest ? [`Weakest region with n≥5: ${weakest.key} (${pct(weakest.country.rate)}, n=${weakest.country.eligible}).`] : []),
    ...(environments[0] ? [`Weakest environment with n≥5: ${environments[0].key} (${pct(environments[0].country.rate)}, n=${environments[0].country.eligible}).`] : []),
    top ? `Most frequent confusion: ${top.codes.map((code) => COUNTRIES[code]?.name || code).join(' ↔ ')} (${top.count}).` : 'No repeated country confusion yet.',
  ];
}

const itemRate = (item: Breakdown) => item.country.rate ?? 1;

export function activeSeconds(sessions: TrainingSession[], bounds: { from: number; to: number }) {
  return filterByRange(sessions, (item) => item.startedAt, bounds).reduce((sum, item) => sum + item.activeTimeSeconds, 0);
}

export function studyExposure(visits: StudyVisit[]) {
  return breakdown(visits.map((visit) => ({ ...visit, gameId: '', roundNumber: 0, actualLat: visit.lat, actualLng: visit.lng, guessedLat: null, guessedLng: null, distanceKm: null, score: 0, timeSpentSeconds: visit.activeTimeSeconds, canMove: true, canPan: true, canZoom: true, createdAt: visit.openedAt, source: 'study' as const })), (item) => item.countryCode);
}
