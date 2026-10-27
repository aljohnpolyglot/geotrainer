import { COUNTRIES } from './countries';
import type { SchedulerPreferences } from '../types';
import { detectedTimeZone } from './reviewTiming';
import { clampReviewViewVariationDifficulty } from './reviewVariation';

export const passingScoreFor = (strictness: SchedulerPreferences['strictness']) => ({ beginner: 1500, balanced: 3000, pro: 4800 })[strictness];
export const hardOrAgainScoreForStrictness = (strictness: SchedulerPreferences['strictness']) => ({ beginner: 2500, balanced: 3000, pro: 4900 })[strictness];

export const DEFAULT_SCHEDULER_PREFERENCES: SchedulerPreferences = {
  strictness: 'balanced', newCardsPerDay: 50, maximumReviewsPerDay: 500, minimumReviewsPerDay: 50, rollOverMissedReviews: true, firstReviewDays: 1,
  relearningMinutes: 10, easyFirstIntervalDays: 21, maximumIntervalDays: 3650,
  maximumAnswerSeconds: 60, reviewOrder: 'random', autoReviewScore: 3000, autoReviewWrongCountry: true, reviewDayResetMinutes: 0,
  reviewTimeZone: detectedTimeZone(), reviewTimeZoneAuto: true,
  reviewViewVariationStandardDifficulty: 0, reviewViewVariationNoMoveDifficulty: 0, reviewViewVariationNmpzDifficulty: 0,
};

export const reviewViewVariationDifficultyFor = (preferences: SchedulerPreferences, canMove: boolean, canPan: boolean, canZoom: boolean) => clampReviewViewVariationDifficulty(canMove ? preferences.reviewViewVariationStandardDifficulty : canPan || canZoom ? preferences.reviewViewVariationNoMoveDifficulty : preferences.reviewViewVariationNmpzDifficulty);

export function shuffleInPlace<T>(items: T[], random = Math.random) {
  for (let index = items.length - 1; index > 0; index--) {
    const swap = Math.floor(random() * (index + 1));
    [items[index], items[swap]] = [items[swap], items[index]];
  }
  return items;
}

export const normalizeSchedulerPreferences = (value: unknown): SchedulerPreferences => {
  const source = value && typeof value === 'object' ? value as Partial<SchedulerPreferences> : {};
  const number = (key: keyof SchedulerPreferences, min: number, max: number) => Math.min(max, Math.max(min, Number(source[key]) || DEFAULT_SCHEDULER_PREFERENCES[key] as number));
  const auto = source.reviewTimeZoneAuto !== false;
  let timeZone = typeof source.reviewTimeZone === 'string' ? source.reviewTimeZone.trim() : '';
  try { new Intl.DateTimeFormat('en', { timeZone: auto ? detectedTimeZone() : timeZone }).format(); } catch { timeZone = detectedTimeZone(); }
  const strictness = source.strictness === 'beginner' || source.strictness === 'pro' ? source.strictness : 'balanced';
  const autoReviewScore = Number(source.autoReviewScore);
  const floor = (value: unknown) => typeof value === 'number' && Number.isFinite(value) ? Math.min(5000, Math.max(passingScoreFor(strictness), Math.round(value))) : undefined;
  const defaultFloor = floor(source.defaultCountryScoreFloor);
  const countryFloors = Object.fromEntries(Object.entries(source.countryScoreFloors && typeof source.countryScoreFloors === 'object' ? source.countryScoreFloors : {}).flatMap(([code, value]) => { const score = floor(value); return Object.hasOwn(COUNTRIES, code) && score !== undefined ? [[code, score]] : []; }));
  const legacyVariation = source.reviewViewVariationEnabled === true ? clampReviewViewVariationDifficulty(source.reviewViewVariationDifficulty) : 0;
  const variation = (key: 'reviewViewVariationStandardDifficulty' | 'reviewViewVariationNoMoveDifficulty' | 'reviewViewVariationNmpzDifficulty') => source[key] === undefined ? legacyVariation : clampReviewViewVariationDifficulty(source[key]);
  return {
    strictness,
    ...(defaultFloor !== undefined ? { defaultCountryScoreFloor: defaultFloor } : {}),
    ...(Object.keys(countryFloors).length ? { countryScoreFloors: countryFloors } : {}),
    newCardsPerDay: number('newCardsPerDay', 1, 500), maximumReviewsPerDay: number('maximumReviewsPerDay', 1, 2000),
    minimumReviewsPerDay: Math.min(2000, Math.max(1, Math.round(Number(source.minimumReviewsPerDay)) || 50)), rollOverMissedReviews: source.rollOverMissedReviews !== false,
    firstReviewDays: number('firstReviewDays', 1, 30), relearningMinutes: number('relearningMinutes', 1, 1440),
    easyFirstIntervalDays: number('easyFirstIntervalDays', 2, 365), maximumIntervalDays: number('maximumIntervalDays', 30, 36500),
    maximumAnswerSeconds: number('maximumAnswerSeconds', 10, 600), reviewOrder: source.reviewOrder === 'due' ? 'due' : 'random',
    autoReviewScore: Number.isFinite(autoReviewScore) ? Math.min(5000, Math.max(0, autoReviewScore)) : hardOrAgainScoreForStrictness(strictness), autoReviewWrongCountry: source.autoReviewWrongCountry !== false,
    reviewDayResetMinutes: number('reviewDayResetMinutes', 0, 1439), reviewTimeZone: auto ? detectedTimeZone() : (timeZone || detectedTimeZone()), reviewTimeZoneAuto: auto,
    reviewViewVariationStandardDifficulty: variation('reviewViewVariationStandardDifficulty'),
    reviewViewVariationNoMoveDifficulty: variation('reviewViewVariationNoMoveDifficulty'),
    reviewViewVariationNmpzDifficulty: variation('reviewViewVariationNmpzDifficulty'),
  };
};
