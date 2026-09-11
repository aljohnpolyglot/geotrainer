import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeLanguagePreferences, LANGUAGE_OPTIONS, translate } from './language';

test('language preferences keep only supported community languages and migrate missing fields', () => {
  assert.equal(LANGUAGE_OPTIONS.some((option) => (option.code as string) === 'id'), false);
  assert.deepEqual(normalizeLanguagePreferences({ ui: 'it', game: 'id', ai: 'tl' }), { ui: 'it', game: 'en', ai: 'en' });
  assert.deepEqual(normalizeLanguagePreferences(undefined), { ui: 'en', game: 'en', ai: 'en' });
  assert.equal(new Set(LANGUAGE_OPTIONS.map((option) => option.flagCode)).size, LANGUAGE_OPTIONS.length);
  const preferenceKeys = ['preferences', 'dailyLimits', 'newCardsDay', 'maximumReviewsDay', 'scheduling', 'strictness', 'beginner', 'balanced', 'pro', 'firstReview', 'relearning', 'excellentInterval', 'maximumInterval', 'maximumAnswer', 'dueOrder', 'oldestDue', 'random'];
  for (const { code } of LANGUAGE_OPTIONS) for (const key of preferenceKeys) assert.notEqual(translate(code, key), key);
  const visibleKeys = ['History', 'Relearning', 'Young', 'mature locations', 'until next rank', 'Coverage by continent', 'Study scenes', '1–100 scored rounds · Standard / No Move / NMPZ', 'Major Cities'];
  for (const { code } of LANGUAGE_OPTIONS.filter(({ code }) => code !== 'en')) for (const key of visibleKeys) assert.notEqual(translate(code, key), key);
});
