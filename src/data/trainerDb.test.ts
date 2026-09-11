import assert from 'node:assert/strict';
import test from 'node:test';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';

Object.assign(globalThis, { indexedDB, IDBKeyRange });
const legacy = new Map<string, string>();
Object.assign(globalThis, {
  localStorage: {
    getItem: (key: string) => legacy.get(key) ?? null,
    setItem: (key: string, value: string) => legacy.set(key, value),
    removeItem: (key: string) => legacy.delete(key),
  },
});

const location = { panoId: 'pano-legacy', lat: 47.5, lng: 19.04, countryCode: 'HU' };
legacy.set('sv_saved_bookmarks_v1', JSON.stringify([{ ...location, id: 'bm-1', countryName: 'Hungary', savedAt: 100 }]));
legacy.set('sv_custom_collections_v1', JSON.stringify([{ id: 'custom-1', name: 'Home', countryCodes: ['HU'] }]));
legacy.set('sv_last_selected_collection_id', 'custom-1');
legacy.set('sv_game_history_v1', JSON.stringify([{
  id: 'game-legacy', createdAt: 200, collectionId: 'world', collectionName: 'World',
  settings: { roundCount: 1, collectionId: 'world', canMove: true, canPan: true, canZoom: true, timeLimitSeconds: 0 },
  totalScore: 3200, maxPossibleScore: 5000,
  rounds: [{ roundNumber: 1, location, guess: { lat: 48, lng: 20 }, distanceKm: 100, score: 3200, timeSpentSeconds: 20 }],
}]));

test('migration is idempotent and backup/import protects history', async () => {
  const { clearTrainerDbForTesting, createBackup, importBackup, initTrainerDb, isCountryMistake, reviewGradeForCorrection, reviewGradeForPerformance, trainerDb } = await import('./trainerDb');
  await initTrainerDb();
  await initTrainerDb();
  assert.equal((await trainerDb.locations()).length, 1);
  assert.equal((await trainerDb.attempts()).length, 1);
  assert.equal((await trainerDb.attempts())[0].showCompass, true);
  assert.equal((await trainerDb.games()).length, 1);
  assert.equal((await trainerDb.collections()).length, 1);
  assert.equal((await trainerDb.bookmarks()).length, 1);
  assert.equal(await trainerDb.setting('selectedCollectionId'), 'custom-1');
  assert.ok(legacy.has('sv_game_history_v1'));
  assert.ok(legacy.has('sv_saved_bookmarks_v1'));
  assert.ok(legacy.has('sv_custom_collections_v1'));

  const fresh = { panoId: 'pano-new', lat: 52.5, lng: 13.4, countryCode: 'DE' };
  await trainerDb.encounter(fresh, 300);
  await trainerDb.encounter(fresh, 400);
  assert.equal((await trainerDb.locations()).find((item) => item.id === 'pano-new')?.encounterCount, 2);

  const baseAttempt = {
    gameId: 'game-2', roundNumber: 1, panoId: 'pano-new', actualLat: 52.5, actualLng: 13.4,
    countryCode: 'DE', guessedLat: 48, guessedLng: 2, distanceKm: 800, score: 1000,
    timeSpentSeconds: 15, collectionId: 'world', canMove: true, canPan: true, canZoom: true,
    createdAt: Date.now(), source: 'play' as const,
  };
  await trainerDb.saveAttempt({ ...baseAttempt, id: 'attempt-a', guessedCountryCode: 'FR' });
  await trainerDb.saveAttempt({ ...baseAttempt, id: 'attempt-b', roundNumber: 2, guessedCountryCode: 'DE' });
  assert.equal((await trainerDb.attempts()).length, 3);
  assert.equal((await trainerDb.reviewQueue({ maxScore: 4000 })).length, 2);
  assert.equal((await trainerDb.reviewQueue({ maxScore: 2000 })).length, 1);
  assert.equal((await trainerDb.reviewQueue({ minScore: 2000, maxScore: 4000 })).length, 1);
  assert.equal((await trainerDb.reviewQueue({ wrongCountry: true })).length, 1);
  assert.equal((await trainerDb.reviewQueue({ due: true })).some((item) => item.panoId === 'pano-new'), false);

  await trainerDb.saveAttempt({ ...baseAttempt, id: 'study-card:pano-study', panoId: 'pano-study', source: 'study', score: 0, guessedLat: null, guessedLng: null, guessedCountryCode: undefined });
  await trainerDb.queueForReview('pano-study');
  assert.equal((await trainerDb.reviewQueue({ due: true })).some((item) => item.panoId === 'pano-study'), false);
  assert.ok((await trainerDb.reviews()).find((item) => item.panoId === 'pano-study')!.dueAt > Date.now());
  await trainerDb.queueForReview('pano-study', true);
  assert.equal((await trainerDb.reviewQueue({ due: true })).some((item) => item.panoId === 'pano-study'), true);
  await trainerDb.gradeReview('pano-study', 'easy');
  assert.equal((await trainerDb.reviewQueue({ due: true })).some((item) => item.panoId === 'pano-study'), false);
  await trainerDb.queueForReview('pano-study', true);
  assert.equal((await trainerDb.reviewQueue({ due: true })).some((item) => item.panoId === 'pano-study'), true);

  const review = await trainerDb.gradeReview('pano-new', 'good');
  assert.equal(review.reviewCount, 1);
  assert.ok(review.dueAt > Date.now() + 2 * 864e5);
  assert.equal((await trainerDb.reviewQueue({ due: true })).some((item) => item.panoId === 'pano-new'), false);
  const intervals = await trainerDb.reviewIntervals('pano-new');
  assert.equal(intervals.again, 10 / 1440);
  assert.ok(intervals.easy > intervals.good);
  const easy = await trainerDb.gradeReview('pano-new', 'easy');
  assert.ok(easy.intervalDays > review.intervalDays);
  const again = await trainerDb.gradeReview('pano-new', 'again');
  assert.equal(again.lapseCount, 1);
  assert.equal(reviewGradeForPerformance(4900, 12, true), 'easy');
  assert.equal(reviewGradeForPerformance(4900, 95, true), 'hard');
  assert.equal(reviewGradeForPerformance(4900, 12, false), 'again');
  assert.equal(reviewGradeForPerformance(4799, 12, true, 60, 'pro'), 'again');
  assert.equal(reviewGradeForPerformance(4800, 12, true, 60, 'pro'), 'hard');
  assert.equal(isCountryMistake(4900, 'IT', 'FR'), true);
  assert.equal(reviewGradeForCorrection(3200, 'IT', 'IT'), 'hard');
  assert.equal(reviewGradeForCorrection(2999, 'IT', 'IT'), 'again');

  const firstPlay = await trainerDb.scheduleFirstPlay('pano-first-play', 'easy');
  assert.equal(firstPlay.intervalDays, 21);
  assert.equal((await trainerDb.scheduleFirstPlay('pano-first-play', 'again')).intervalDays, 21);
  await trainerDb.setSetting('schedulerPreferences', { ...(await trainerDb.schedulerPreferences()), maximumIntervalDays: 30, easyFirstIntervalDays: 90 });
  assert.equal((await trainerDb.scheduleFirstPlay('pano-clamped-play', 'easy')).intervalDays, 30);
  await trainerDb.setSetting('schedulerPreferences', { ...(await trainerDb.schedulerPreferences()), strictness: 'pro', maximumAnswerSeconds: 45 });
  assert.equal((await trainerDb.schedulerPreferences()).strictness, 'pro');

  await trainerDb.saveVisit({ id: 'visit-1', panoId: 'pano-new', lat: 52.5, lng: 13.4, countryCode: 'DE', collectionId: 'world', openedAt: 1, closedAt: 2, activeTimeSeconds: 1, wasRevealed: false, bookmarked: false });
  await trainerDb.saveVisit({ id: 'visit-2', panoId: 'pano-new', lat: 52.5, lng: 13.4, countryCode: 'DE', collectionId: 'world', openedAt: 3, closedAt: 4, activeTimeSeconds: 1, wasRevealed: true, bookmarked: true });
  assert.equal((await trainerDb.locations()).filter((item) => item.id === 'pano-new').length, 1);
  assert.equal((await trainerDb.studyVisits()).filter((item) => item.panoId === 'pano-new').length, 2);

  await trainerDb.saveClue({ id: 'clue-1', panoId: 'pano-new', countryCode: 'DE', lat: 52.5, lng: 13.4, createdAt: 500, imageDataUrl: 'data:image/jpeg;base64,AQID', model: 'test', analysis: { confidence: 'low', region: '', candidates: [], strongClues: ['Black reflector'], weakClues: [], confusions: [], nextThingsToInspect: [], extraCards: [] } });
  assert.equal((await trainerDb.clues())[0].countryCode, 'DE');
  assert.deepEqual([(await trainerDb.clues())[0].lat, (await trainerDb.clues())[0].lng], [52.5, 13.4]);

  const backup = await createBackup();
  const expected = Object.fromEntries(await Promise.all(['locations', 'attempts', 'games', 'studyVisits', 'reviews', 'bookmarks', 'collections', 'sessions'].map(async (name) => [name, backup.data[name as keyof typeof backup.data].length])));
  await clearTrainerDbForTesting();
  await importBackup(backup, 'replace');
  assert.equal((await trainerDb.locations()).length, expected.locations);
  assert.equal((await trainerDb.attempts()).length, expected.attempts);
  assert.equal((await trainerDb.studyVisits()).length, expected.studyVisits);
  assert.equal((await trainerDb.collections()).length, expected.collections);
  assert.equal((await trainerDb.reviews()).length, expected.reviews);
  assert.equal((await trainerDb.clues()).length, 1);
  assert.equal((await trainerDb.schedulerPreferences()).maximumAnswerSeconds, 45);
  await importBackup(backup, 'merge');
  assert.equal((await trainerDb.locations()).length, expected.locations);
  assert.equal((await trainerDb.attempts()).length, expected.attempts);

  const beforeMalformed = (await trainerDb.attempts()).length;
  await assert.rejects(() => importBackup({ format: 'wrong' }, 'replace'));
  assert.equal((await trainerDb.attempts()).length, beforeMalformed);
});

test('due queue enforces same-day limits and persists review session kind', async () => {
  const { clearTrainerDbForTesting, createBackup, importBackup, initTrainerDb, trainerDb } = await import('./trainerDb');
  await initTrainerDb();
  await clearTrainerDbForTesting();
  const preferences = await trainerDb.schedulerPreferences();
  const saveAttempt = (panoId: string) => trainerDb.saveAttempt({
    id: `daily:${panoId}`, gameId: 'daily', roundNumber: 1, panoId, actualLat: 1, actualLng: 1,
    countryCode: 'DE', guessedLat: 2, guessedLng: 2, guessedCountryCode: 'FR', distanceKm: 100,
    score: 1000, timeSpentSeconds: 10, collectionId: 'world', canMove: true, canPan: true, canZoom: true,
    createdAt: Date.now(), source: 'play',
  });

  await trainerDb.setSetting('schedulerPreferences', { ...preferences, newCardsPerDay: 1, maximumReviewsPerDay: 1 });
  await Promise.all(['max-a', 'max-b'].map(saveAttempt));
  await Promise.all(['max-a', 'max-b'].map((panoId) => trainerDb.queueForReview(panoId, true)));
  const firstQueue = await trainerDb.reviewQueue({ due: true });
  assert.equal(firstQueue.length, 1);
  await trainerDb.gradeReview(firstQueue[0].panoId, 'again');
  assert.equal((await trainerDb.reviewQueue({ due: true })).length, 0);

  await clearTrainerDbForTesting();
  await trainerDb.setSetting('schedulerPreferences', { ...preferences, newCardsPerDay: 1, maximumReviewsPerDay: 10 });
  await Promise.all(['new-a', 'new-b'].map(saveAttempt));
  await Promise.all(['new-a', 'new-b'].map((panoId) => trainerDb.queueForReview(panoId, true)));
  const newQueue = await trainerDb.reviewQueue({ due: true });
  assert.equal(newQueue.length, 1);
  await trainerDb.gradeReview(newQueue[0].panoId, 'good');
  assert.equal((await trainerDb.reviewQueue({ due: true })).length, 0);

  await trainerDb.setSetting('review.active', { attemptIds: [newQueue[0].id], source: 'Due Today', kind: 'due', initialTotal: 1, compass: true });
  const backup = await createBackup(false);
  const active = backup.data.settings.find((item) => (item as { key?: string }).key === 'review.active') as { value?: { kind?: string } } | undefined;
  assert.equal(active?.value?.kind, 'due');
  await clearTrainerDbForTesting();
  await importBackup(backup, 'replace');
  const restored = await trainerDb.setting<{ kind?: string }>('review.active');
  assert.equal(restored?.kind, 'due');
});

test('saved game preferences are normalized before reuse', async () => {
  const { normalizeGamePreferences } = await import('./trainerDb');
  assert.deepEqual(normalizeGamePreferences({ roundCount: 999, collectionId: 7, canMove: false, timeLimitSeconds: 17, environment: 'ocean' }, false), {
    roundCount: 5, collectionId: 'world', canMove: false, canPan: true, canZoom: true, showCompass: false, aiCoachEnabled: true,
    environment: 'mixed', urbanLevel: 3, samplingMode: 'natural', timeLimitSeconds: 0,
  });
  assert.equal(normalizeGamePreferences({ roundCount: 37 }).roundCount, 37);
  assert.equal(normalizeGamePreferences({ countryCode: 'DE' }).countryCode, 'DE');
  assert.equal(normalizeGamePreferences({ countryCode: 'ZZ' }).countryCode, undefined);
  assert.deepEqual(normalizeGamePreferences({ countryCodes: ['DE', 'FR', 'DE', 'ZZ'] }).countryCodes, ['DE', 'FR']);
});
