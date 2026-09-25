import type { Attempt, ReviewGrade, SchedulerPreferences } from '../types';
import { DEFAULT_SCHEDULER_PREFERENCES } from './reviewPreferences';

export const intervalsFor = (oldInterval: number, preferences = DEFAULT_SCHEDULER_PREFERENCES): Record<ReviewGrade, number> => ({
  again: preferences.relearningMinutes / 1440,
  hard: Math.max(1, oldInterval * 1.5),
  good: Math.max(3, oldInterval * 2),
  easy: Math.max(7, oldInterval * 2.5),
});

export const reviewGradeForScore = (score: number): ReviewGrade => score < 2000 ? 'again' : score < 3000 ? 'hard' : score < 4500 ? 'good' : 'easy';

const scoreThresholds = { beginner: [1500, 2500, 4200], balanced: [2000, 3000, 4500], pro: [4800, 4900, 5000] } as const;
const correctionThresholds = { beginner: 1500, balanced: 3000, pro: 4800 } as const;
export const passingScoreFor = (strictness: SchedulerPreferences['strictness']) => correctionThresholds[strictness];
export const reviewGradeForPerformance = (score: number, timeSpentSeconds: number, correctCountry = true, maximumAnswerSeconds = 60, strictness: SchedulerPreferences['strictness'] = 'balanced'): ReviewGrade => {
  const [againBelow, hardBelow, easyAt] = scoreThresholds[strictness];
  if (!correctCountry || score < againBelow) return 'again';
  if (score < hardBelow || timeSpentSeconds > maximumAnswerSeconds) return 'hard';
  if (score < easyAt || timeSpentSeconds > maximumAnswerSeconds / 2) return 'good';
  return 'easy';
};
export const shouldAutoSchedulePlayReview = (score: number, countryCode: string, guessedCountryCode: string | undefined, preferences: SchedulerPreferences) => score < preferences.autoReviewScore || (preferences.autoReviewWrongCountry && guessedCountryCode !== countryCode);
export const isCountryMistake = (score: number, countryCode: string, guessedCountryCode?: string, strictness: SchedulerPreferences['strictness'] = 'balanced') => guessedCountryCode !== countryCode || score < passingScoreFor(strictness);
export const gameMistakes = (attempts: Attempt[], gameId: string, strictness: SchedulerPreferences['strictness']) => attempts.filter((attempt) => attempt.gameId === gameId && isCountryMistake(attempt.score, attempt.countryCode, attempt.guessedCountryCode, strictness)).sort((a, b) => a.roundNumber - b.roundNumber);
export const reviewGradeForCorrection = (score: number, countryCode: string, guessedCountryCode?: string, strictness: SchedulerPreferences['strictness'] = 'balanced'): ReviewGrade => isCountryMistake(score, countryCode, guessedCountryCode, strictness) ? 'again' : 'hard';
