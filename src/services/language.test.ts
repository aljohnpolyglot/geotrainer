import assert from 'node:assert/strict';
import test from 'node:test';
import { countryDisplayName, normalizeLanguagePreferences, LANGUAGE_OPTIONS, reviewSourceDisplayName, translate } from './language';

test('language preferences keep only supported community languages and migrate missing fields', () => {
  assert.equal(LANGUAGE_OPTIONS.some((option) => (option.code as string) === 'id'), false);
  assert.deepEqual(normalizeLanguagePreferences({ ui: 'it', game: 'id', ai: 'tl', wikipedia: 'fr' }), { ui: 'it', game: 'en', ai: 'en', wikipedia: 'fr' });
  assert.deepEqual(normalizeLanguagePreferences(undefined), { ui: 'en', game: 'en', ai: 'en', wikipedia: 'en' });
  assert.equal(new Set(LANGUAGE_OPTIONS.map((option) => option.flagCode)).size, LANGUAGE_OPTIONS.length);
  const preferenceKeys = ['preferences', 'dailyLimits', 'newCardsDay', 'maximumReviewsDay', 'scheduling', 'strictness', 'beginner', 'balanced', 'pro', 'firstReview', 'relearning', 'excellentInterval', 'maximumInterval', 'maximumAnswer', 'dueOrder', 'oldestDue', 'random'];
  for (const { code } of LANGUAGE_OPTIONS) for (const key of preferenceKeys) assert.notEqual(translate(code, key), key);
  const visibleKeys = ['History', 'Relearning', 'Young', 'Mastery', 'Continue saved session?', 'Resume', 'Start new', 'Location order', 'Shuffle', 'Source order', 'Skip seen places', 'Back to uploaded panorama', 'mature locations', 'until next rank', 'Coverage by continent', 'Study scenes', '1–100 scored rounds · Standard / No Move / NMPZ', 'Major Cities', 'Any environment', 'bestLocationEstimate', 'candidates', 'navLearn', 'navPlay', 'navReview', 'navClues', 'navProgress'];
  for (const { code } of LANGUAGE_OPTIONS.filter(({ code }) => code !== 'en')) for (const key of visibleKeys) assert.notEqual(translate(code, key), key);
  for (const { code } of LANGUAGE_OPTIONS.filter(({ code }) => code !== 'en')) for (const key of ['Saved maps', 'No saved maps yet.', 'Map name', 'Rename map', 'Save name', 'Use map', 'Keeps 30 recent maps; active and paused maps stay available.', 'Could not load saved maps.', 'Could not open saved map.', 'Enter a map name.', 'Could not rename saved map.']) assert.notEqual(translate(code, key), key);
  for (const { code } of LANGUAGE_OPTIONS) {
    assert.ok(translate(code, 'Seconds per round'));
    assert.notEqual(translate(code, 'Custom time'), 'Custom time');
    assert.notEqual(translate(code, 'Zoom to city'), 'Zoom to city');
    if (code !== 'en') assert.notEqual(translate(code, 'Occasional boat views'), 'Occasional boat views');
  }
});

test('country names follow the selected language', () => {
  assert.equal(countryDisplayName('NL', 'it'), 'Paesi Bassi');
  assert.equal(countryDisplayName('DE', 'ru'), 'Германия');
  assert.equal(countryDisplayName('IT', 'sv'), 'Italien');
  assert.equal(countryDisplayName('FR', 'sv'), 'Frankrike');
  assert.equal(countryDisplayName('BL', 'sv'), 'Saint Barthélemy');
  assert.equal(countryDisplayName('', 'sv'), '');
  const france = { en: 'France', es: 'Francia', pt: 'França', fr: 'France', de: 'Frankreich', it: 'Francia', ru: 'Франция', sv: 'Frankrike' } as const;
  for (const { code } of LANGUAGE_OPTIONS) assert.equal(countryDisplayName('FR', code), france[code]);
  for (const { code } of LANGUAGE_OPTIONS.filter(({ code }) => code !== 'en')) assert.notEqual(reviewSourceDisplayName(code, 'Due Today'), 'Due Today');
});
