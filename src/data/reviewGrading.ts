import type { Attempt, ReviewGrade, SchedulerPreferences } from '../types';
import { DEFAULT_SCHEDULER_PREFERENCES, passingScoreFor } from './reviewPreferences';
export { passingScoreFor } from './reviewPreferences';

export const intervalsFor = (oldInterval: number, preferences = DEFAULT_SCHEDULER_PREFERENCES): Record<ReviewGrade, number> => ({
  again: preferences.relearningMinutes / 1440,
  hard: Math.max(1, oldInterval * 1.5),
  good: Math.max(3, oldInterval * 2),
  easy: Math.max(7, oldInterval * 2.5),
});

export const reviewGradeForScore = (score: number): ReviewGrade => score < 2000 ? 'again' : score < 3000 ? 'hard' : score < 4500 ? 'good' : 'easy';

const scoreThresholds = { beginner: [1500, 2500, 4200], balanced: [2000, 3000, 4500], pro: [4800, 4900, 5000] } as const;
export const configuredCountryScoreFloor = (countryCode: string, preferences: SchedulerPreferences) => {
  const target = preferences.countryScoreFloors?.[countryCode] ?? preferences.defaultCountryScoreFloor;
  return target === undefined ? undefined : Math.max(passingScoreFor(preferences.strictness), target);
};
export const countryScoreFloorFor = (countryCode: string, preferences: SchedulerPreferences) => configuredCountryScoreFloor(countryCode, preferences) ?? passingScoreFor(preferences.strictness);
type MistakePreferences = SchedulerPreferences['strictness'] | SchedulerPreferences;

export const reviewGradeForPerformance = (score: number, timeSpentSeconds: number, correctCountry = true, maximumAnswerSeconds = 60, strictness: SchedulerPreferences['strictness'] = 'balanced', countryScoreFloor?: number): ReviewGrade => {
  const [againBelow, hardBelow, easyAt] = scoreThresholds[strictness];
  if (!correctCountry || score < againBelow || countryScoreFloor !== undefined && score < countryScoreFloor) return 'again';
  if (score < hardBelow || timeSpentSeconds > maximumAnswerSeconds) return 'hard';
  if (score < easyAt || timeSpentSeconds > maximumAnswerSeconds / 2) return 'good';
  return 'easy';
};
export const shouldAutoSchedulePlayReview = (score: number, countryCode: string, guessedCountryCode: string | undefined, preferences: SchedulerPreferences) => score < Math.max(preferences.autoReviewScore, configuredCountryScoreFloor(countryCode, preferences) ?? 0) || (preferences.autoReviewWrongCountry && guessedCountryCode !== countryCode);
export const isCountryMistake = (score: number, countryCode: string, guessedCountryCode?: string, preferences: MistakePreferences = 'balanced') => guessedCountryCode !== countryCode || score < (typeof preferences === 'string' ? passingScoreFor(preferences) : countryScoreFloorFor(countryCode, preferences));
export const gameMistakes = (attempts: Attempt[], gameId: string, preferences: MistakePreferences) => attempts.filter((attempt) => attempt.gameId === gameId && isCountryMistake(attempt.score, attempt.countryCode, attempt.guessedCountryCode, preferences)).sort((a, b) => a.roundNumber - b.roundNumber);
export const reviewGradeForCorrection = (score: number, countryCode: string, guessedCountryCode?: string, preferences: MistakePreferences = 'balanced'): ReviewGrade => isCountryMistake(score, countryCode, guessedCountryCode, preferences) ? 'again' : 'hard';
