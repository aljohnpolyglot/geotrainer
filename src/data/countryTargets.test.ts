import assert from 'node:assert/strict';
import test from 'node:test';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';
import type { Attempt } from '../types';
import { normalizeSchedulerPreferences } from './reviewPreferences';
import { configuredCountryScoreFloor, countryScoreFloorFor, gameMistakes, isCountryMistake, reviewGradeForCorrection, reviewGradeForPerformance, shouldAutoSchedulePlayReview } from './reviewGrading';

Object.assign(globalThis, { indexedDB, IDBKeyRange });

test('country specializations govern Play and Review without weakening untargeted countries or rewriting attempts', async () => {
  const baseline = normalizeSchedulerPreferences(undefined);
  assert.equal(baseline.defaultCountryScoreFloor, undefined);
  assert.equal(baseline.countryScoreFloors, undefined);
  const preferences = normalizeSchedulerPreferences({ ...baseline, countryScoreFloors: { FR: 4800, IT: 4900 } });
  assert.equal(isCountryMistake(4799, 'FR', 'FR', preferences), true);
  assert.equal(isCountryMistake(4800, 'FR', 'FR', preferences), false);
  assert.equal(isCountryMistake(5000, 'FR', 'DE', preferences), true);
  assert.equal(isCountryMistake(5000, 'FR', undefined, preferences), true);
  assert.equal(shouldAutoSchedulePlayReview(4799, 'FR', 'FR', preferences), true);
  assert.equal(shouldAutoSchedulePlayReview(4800, 'FR', 'FR', preferences), false);
  assert.equal(reviewGradeForCorrection(4799, 'FR', 'FR', preferences), 'again');
  assert.equal(reviewGradeForCorrection(4800, 'FR', 'FR', preferences), 'hard');
  assert.equal(reviewGradeForPerformance(4799, 10, true, 60, 'balanced', configuredCountryScoreFloor('FR', preferences)), 'again');
  assert.equal(reviewGradeForPerformance(4800, 10, true, 60, 'balanced', configuredCountryScoreFloor('FR', preferences)), 'easy');
  for (const country of ['BR', 'CL', 'RU', 'US', 'AR', 'CA']) {
    assert.equal(countryScoreFloorFor(country, preferences), countryScoreFloorFor(country, baseline));
    assert.equal(isCountryMistake(2999, country, country, preferences), true);
    assert.equal(isCountryMistake(4000, country, country, preferences), false);
    assert.equal(shouldAutoSchedulePlayReview(2999, country, country, preferences), true);
    assert.equal(configuredCountryScoreFloor(country, preferences), undefined);
    assert.equal(reviewGradeForPerformance(2500, 10, true, 60, 'balanced', configuredCountryScoreFloor(country, preferences)), 'hard');
  }
  const lowered = normalizeSchedulerPreferences({ strictness: 'pro', defaultCountryScoreFloor: 0, countryScoreFloors: { FR: 1 } });
  assert.equal(countryScoreFloorFor('FR', lowered), 4800);
  assert.equal(isCountryMistake(4799, 'FR', 'FR', lowered), true);
  const defaults = normalizeSchedulerPreferences({ defaultCountryScoreFloor: 4600, countryScoreFloors: { FR: 4800 } });
  assert.equal(countryScoreFloorFor('BR', defaults), 4600);
  assert.equal(countryScoreFloorFor('FR', defaults), 4800);
  const removed = normalizeSchedulerPreferences({ ...defaults, countryScoreFloors: {} });
  assert.equal(countryScoreFloorFor('FR', removed), 4600);
  assert.deepEqual(normalizeSchedulerPreferences({ countryScoreFloors: { FR: 9000, IT: -1, DE: 4800.4, US: NaN, ZZ: 4800, BR: '4900' }, defaultCountryScoreFloor: Infinity }).countryScoreFloors, { FR: 5000, IT: 3000, DE: 4800 });
  const { trainerDb } = await import('./trainerDb');
  await trainerDb.setSetting('schedulerPreferences', preferences);
  assert.deepEqual((await trainerDb.schedulerPreferences()).countryScoreFloors, preferences.countryScoreFloors);
  const attempt: Attempt = { id: 'country-target-play', gameId: 'target-game', roundNumber: 1, panoId: 'target-pano', actualLat: 48.8, actualLng: 2.3, countryCode: 'FR', guessedLat: 48, guessedLng: 2, guessedCountryCode: 'FR', distanceKm: 100, score: 4700, timeSpentSeconds: 10, collectionId: 'world', canMove: true, canPan: true, canZoom: true, createdAt: 100, source: 'play' };
  await trainerDb.saveAttempt(attempt);
  assert.deepEqual(gameMistakes(await trainerDb.attempts(), attempt.gameId, await trainerDb.schedulerPreferences()).map(({ id }) => id), [attempt.id]);
  await trainerDb.queueForReview(attempt.panoId, false, { lat: attempt.actualLat, lng: attempt.actualLng, countryCode: attempt.countryCode });
  await trainerDb.gradeReview(attempt.panoId, reviewGradeForCorrection(4700, 'FR', 'FR', preferences));
  assert.equal((await trainerDb.reviewState(attempt.panoId))?.gradingHistory.at(-1)?.grade, 'again');
  assert.deepEqual((await trainerDb.attempts()).find(({ id }) => id === attempt.id), attempt);
});
