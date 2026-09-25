import type { SchedulerPreferences } from '../types';
import { detectedTimeZone } from './reviewTiming';
import { clampReviewViewVariationDifficulty } from './reviewVariation';

export const hardOrAgainScoreForStrictness = (strictness: SchedulerPreferences['strictness']) => ({ beginner: 2500, balanced: 3000, pro: 4900 })[strictness];

export const DEFAULT_SCHEDULER_PREFERENCES: SchedulerPreferences = {
  strictness: 'balanced', newCardsPerDay: 50, maximumReviewsPerDay: 500, firstReviewDays: 1,
  relearningMinutes: 10, easyFirstIntervalDays: 21, maximumIntervalDays: 3650,
  maximumAnswerSeconds: 60, reviewOrder: 'random', autoReviewScore: 3000, autoReviewWrongCountry: true, reviewDayResetMinutes: 0,
  reviewTimeZone: detectedTimeZone(), reviewTimeZoneAuto: true,
  reviewViewVariationEnabled: false, reviewViewVariationDifficulty: 50,
};

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
  return {
    strictness,
    newCardsPerDay: number('newCardsPerDay', 1, 500), maximumReviewsPerDay: number('maximumReviewsPerDay', 1, 2000),
    firstReviewDays: number('firstReviewDays', 1, 30), relearningMinutes: number('relearningMinutes', 1, 1440),
    easyFirstIntervalDays: number('easyFirstIntervalDays', 2, 365), maximumIntervalDays: number('maximumIntervalDays', 30, 36500),
    maximumAnswerSeconds: number('maximumAnswerSeconds', 10, 600), reviewOrder: source.reviewOrder === 'due' ? 'due' : 'random',
    autoReviewScore: Number.isFinite(autoReviewScore) ? Math.min(5000, Math.max(0, autoReviewScore)) : hardOrAgainScoreForStrictness(strictness), autoReviewWrongCountry: source.autoReviewWrongCountry !== false,
    reviewDayResetMinutes: number('reviewDayResetMinutes', 0, 1439), reviewTimeZone: auto ? detectedTimeZone() : (timeZone || detectedTimeZone()), reviewTimeZoneAuto: auto,
    reviewViewVariationEnabled: source.reviewViewVariationEnabled === true,
    reviewViewVariationDifficulty: clampReviewViewVariationDifficulty(source.reviewViewVariationDifficulty),
  };
};
