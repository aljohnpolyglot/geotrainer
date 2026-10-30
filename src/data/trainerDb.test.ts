import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { IDBKeyRange, IDBObjectStore, indexedDB } from 'fake-indexeddb';

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
  const { clearTrainerDbForTesting, createBackup, importBackup, initTrainerDb, isCountryMistake, reviewGradeForCorrection, reviewGradeForPerformance, shouldAutoSchedulePlayReview, trainerDb } = await import('./trainerDb');
  await initTrainerDb();
  await initTrainerDb();
  assert.equal((await trainerDb.locations()).length, 1);
  assert.equal((await trainerDb.attempts()).length, 1);
  assert.equal(await trainerDb.count('locations'), 1);
  assert.equal(await trainerDb.count('attempts'), 1);
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
  assert.deepEqual((await trainerDb.attemptsForPano('pano-new')).map(({ id }) => id).sort(), ['attempt-a', 'attempt-b']);
  assert.equal((await trainerDb.attempts()).length, 3);
  assert.equal(await trainerDb.count('attempts'), 3);
  assert.equal((await trainerDb.reviewQueue({ maxScore: 4000 })).length, 2);
  assert.equal((await trainerDb.reviewQueue({ maxScore: 2000 })).length, 1);
  assert.equal((await trainerDb.reviewQueue({ minScore: 2000, maxScore: 4000 })).length, 1);
  assert.equal((await trainerDb.reviewQueue({ wrongCountry: true })).length, 1);
  assert.equal((await trainerDb.reviewQueue({ recentDays: 1 })).length, 1);
  assert.equal((await trainerDb.reviewQueue({ recentDays: 1, wrongCountry: true, maxScore: 2000 })).length, 1);
  await trainerDb.saveAttempt({ ...baseAttempt, id: 'attempt-low-correct', panoId: 'pano-low-correct', actualLat: 51, actualLng: 9, score: 3000, guessedCountryCode: 'DE' });
  const anyMistake = await trainerDb.reviewQueue({ wrongCountry: true, minScore: 2000, maxScore: 4000 });
  assert.equal(anyMistake.some((item) => item.panoId === 'pano-new'), true);
  assert.equal(anyMistake.some((item) => item.panoId === 'pano-low-correct'), true);
  assert.equal((await trainerDb.reviewQueue({ due: true })).some((item) => item.panoId === 'pano-new'), false);

  await trainerDb.saveAttempt({ ...baseAttempt, id: 'study-card:pano-study', panoId: 'pano-study', actualLat: 40, actualLng: 10, source: 'study', score: 0, guessedLat: null, guessedLng: null, guessedCountryCode: undefined });
  await trainerDb.queueForReview('pano-study');
  assert.equal((await trainerDb.reviewQueue({ wrongCountry: true })).some((item) => item.panoId === 'pano-study'), false);
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
  const automaticReview = await trainerDb.schedulerPreferences();
  assert.equal(automaticReview.autoReviewScore, 3000);
  assert.equal(shouldAutoSchedulePlayReview(2999, 'IT', 'IT', automaticReview), true);
  assert.equal(shouldAutoSchedulePlayReview(3000, 'IT', 'IT', automaticReview), false);
  assert.equal(shouldAutoSchedulePlayReview(3200, 'IT', 'FR', automaticReview), true);
  assert.equal(shouldAutoSchedulePlayReview(3200, 'IT', 'IT', automaticReview), false);
  assert.equal(isCountryMistake(4900, 'IT', 'FR'), true);
  assert.equal(reviewGradeForCorrection(3200, 'IT', 'IT'), 'hard');
  assert.equal(reviewGradeForCorrection(2999, 'IT', 'IT'), 'again');

  await trainerDb.saveAttempt({ ...baseAttempt, id: 'attempt-notebook-play', panoId: 'pano-notebook-play', actualLat: 41.9, actualLng: 12.5, countryCode: 'IT', score: 4000, guessedCountryCode: 'IT' });
  const notebookPlay = await trainerDb.queueForReview('pano-notebook-play', false, { lat: 41.9, lng: 12.5, countryCode: 'IT' });
  assert.equal(notebookPlay.intervalDays, 0);
  assert.equal(notebookPlay.reviewCount, 0);

  const correctRound = { ...baseAttempt, id: 'attempt-manual-correct', panoId: 'pano-manual-correct', actualLat: 59.33, actualLng: 18.06, countryCode: 'SE', score: 5000, guessedCountryCode: 'SE' };
  await trainerDb.saveAttempt(correctRound);
  assert.equal(await trainerDb.reviewState(correctRound.panoId), undefined);
  const manualReview = await trainerDb.queueForReview(correctRound.panoId, false, { lat: 59.33, lng: 18.06, countryCode: 'SE' });
  assert.equal(manualReview.intervalDays, 0);
  assert.equal(manualReview.reviewCount, 0);
  const { panoramaHash, ...savedAttempt } = (await trainerDb.attempts()).find((item) => item.id === correctRound.id)!;
  assert.match(panoramaHash!, /^[a-f0-9]{64}$/);
  assert.deepEqual(savedAttempt, correctRound);
  assert.deepEqual(await trainerDb.queueForReview(correctRound.panoId), manualReview);
  assert.deepEqual(await trainerDb.reviewState('reimported-nearby', { lat: 59.3301, lng: 18.06, countryCode: 'SE' }), manualReview);
  assert.equal(await trainerDb.reviewState('reimported-other-country', { lat: 59.3301, lng: 18.06, countryCode: 'NO' }), undefined);
  await trainerDb.saveAttempt({ ...correctRound, id: 'attempt-manual-nearby', panoId: 'pano-manual-nearby', actualLat: 59.3301 });
  assert.deepEqual(await trainerDb.reviewState('pano-manual-nearby'), manualReview);
  assert.deepEqual(await trainerDb.queueForReview('pano-manual-nearby', false, { lat: 59.3301, lng: 18.06, countryCode: 'SE' }), manualReview);

  const firstPlay = await trainerDb.scheduleFirstPlay('pano-first-play', 'easy');
  assert.equal(firstPlay.intervalDays, 21);
  assert.equal((await trainerDb.scheduleFirstPlay('pano-first-play', 'again')).intervalDays, 21);
  await trainerDb.setSetting('schedulerPreferences', { ...(await trainerDb.schedulerPreferences()), maximumIntervalDays: 30, easyFirstIntervalDays: 90 });
  assert.equal((await trainerDb.scheduleFirstPlay('pano-clamped-play', 'easy')).intervalDays, 30);
  await trainerDb.setSetting('schedulerPreferences', { ...(await trainerDb.schedulerPreferences()), strictness: 'pro', maximumAnswerSeconds: 45, reviewViewVariationStandardDifficulty: 73, reviewViewVariationNoMoveDifficulty: 73, reviewViewVariationNmpzDifficulty: 73 });
  assert.equal((await trainerDb.schedulerPreferences()).strictness, 'pro');

  await trainerDb.saveVisit({ id: 'visit-1', panoId: 'pano-new', lat: 52.5, lng: 13.4, countryCode: 'DE', collectionId: 'world', openedAt: 1, closedAt: 2, activeTimeSeconds: 1, wasRevealed: false, bookmarked: false });
  await trainerDb.saveVisit({ id: 'visit-2', panoId: 'pano-new', lat: 52.5, lng: 13.4, countryCode: 'DE', collectionId: 'world', openedAt: 3, closedAt: 4, activeTimeSeconds: 1, wasRevealed: true, bookmarked: true });
  assert.equal((await trainerDb.locations()).filter((item) => item.id === 'pano-new').length, 1);
  assert.equal((await trainerDb.studyVisits()).filter((item) => item.panoId === 'pano-new').length, 2);

  await trainerDb.saveClue({ id: 'clue-1', panoId: 'pano-new', countryCode: 'DE', lat: 52.5, lng: 13.4, createdAt: 500, imageDataUrl: 'data:image/jpeg;base64,AQID', model: 'test', analysis: { confidence: 'low', region: '', candidates: [{ countryCode: 'AT', confidence: .6 }], strongClues: ['Black reflector'], weakClues: [], confusions: [], nextThingsToInspect: [], extraCards: [] } });
  assert.equal((await trainerDb.clues())[0].countryCode, 'DE');
  assert.deepEqual([(await trainerDb.clues())[0].lat, (await trainerDb.clues())[0].lng], [52.5, 13.4]);
  await trainerDb.setSetting('notebook.notes', [{ id: 'note-1', panoId: 'pano-new', countryCode: 'DE', text: '', clueId: 'clue-1', updatedAt: 500 }]);
  const note = (await trainerDb.setting<Array<{ clueId?: string }>>('notebook.notes'))![0];
  assert.equal((await trainerDb.clues()).find((clue) => clue.id === note.clueId)?.imageDataUrl, 'data:image/jpeg;base64,AQID');

  const backup = await createBackup();
  const expected = Object.fromEntries(await Promise.all(['locations', 'attempts', 'games', 'studyVisits', 'reviews', 'bookmarks', 'collections', 'sessions'].map(async (name) => [name, backup.data[name as keyof typeof backup.data].length])));
  await clearTrainerDbForTesting();
  await importBackup(backup, 'replace');
  assert.equal((await trainerDb.locationMetadata()).some((location) => !!location.imageDataUrl), false);
  assert.equal((await trainerDb.clueMetadata()).some((clue) => clue.imageDataUrl.startsWith('data:')), false);
  assert.equal((await trainerDb.locations()).length, expected.locations);
  assert.equal((await trainerDb.attempts()).length, expected.attempts);
  assert.equal((await trainerDb.studyVisits()).length, expected.studyVisits);
  assert.equal((await trainerDb.collections()).length, expected.collections);
  assert.equal((await trainerDb.reviews()).length, expected.reviews);
  assert.equal((await trainerDb.clues()).length, 1);
  assert.equal((await trainerDb.schedulerPreferences()).maximumAnswerSeconds, 45);
  assert.deepEqual([
    (await trainerDb.schedulerPreferences()).reviewViewVariationStandardDifficulty,
    (await trainerDb.schedulerPreferences()).reviewViewVariationNoMoveDifficulty,
    (await trainerDb.schedulerPreferences()).reviewViewVariationNmpzDifficulty,
  ], [73, 73, 73]);
  await importBackup(backup, 'merge');
  assert.equal((await trainerDb.locations()).length, expected.locations);
  assert.equal((await trainerDb.attempts()).length, expected.attempts);
  await trainerDb.saveClue({ ...(await trainerDb.clues())[0], id: 'saved-during-cloud-import' });
  await importBackup(backup, 'merge');
  assert.equal((await trainerDb.clues()).some((clue) => clue.id === 'saved-during-cloud-import'), true);

  const beforeMalformed = (await trainerDb.attempts()).length;
  await assert.rejects(() => importBackup({ format: 'wrong' }, 'replace'));
  assert.equal((await trainerDb.attempts()).length, beforeMalformed);
});

test('workspace settings preserve Coach history and scoped drafts', async () => {
  const { clearTrainerDbForTesting, initTrainerDb, trainerDb } = await import('./trainerDb');
  const { readWorkspaceDraft, writeWorkspaceDraft } = await import('../services/workspaceDrafts');
  await initTrainerDb();
  await clearTrainerDbForTesting();
  const analysis = { confidence: 'low', region: '', candidates: [], strongClues: ['red soil'], weakClues: [], confusions: [], nextThingsToInspect: [], extraCards: [] };
  const coach = { panoId: 'pano-workspace', mode: 'analyze', model: 'test', generatedAt: 10, analysis };
  const clue = { panoId: 'pano-workspace', imageDataUrl: 'data:image/jpeg;base64,AQID', analysis, saved: true };

  const otherClue = { ...clue, panoId: 'pano-other', imageDataUrl: 'data:image/jpeg;base64,BAUG' };
  await Promise.all([trainerDb.setSetting('coach.notes', [coach]), writeWorkspaceDraft('clue', clue), writeWorkspaceDraft('clue', otherClue), writeWorkspaceDraft('note', { panoId: 'pano-a', text: 'bollard', category: 'Bollards' })]);

  assert.deepEqual(await trainerDb.setting('coach.notes'), [coach]);
  assert.deepEqual(await readWorkspaceDraft('clue', 'pano-workspace'), clue);
  assert.deepEqual(await readWorkspaceDraft('clue', 'pano-other'), otherClue);
  assert.equal((await readWorkspaceDraft<{ panoId: string; text: string }>('note', 'pano-a'))?.text, 'bollard');
});

test('rapid local workspace saves finish in call order', async () => {
  const { clearTrainerDbForTesting, initTrainerDb, trainerDb } = await import('./trainerDb');
  await initTrainerDb(); await clearTrainerDbForTesting();
  await Promise.all([
    trainerDb.setSetting('workspace.active', { mode: 'study', location: 'first' }),
    trainerDb.setSetting('workspace.active', { mode: 'study', location: 'latest' }),
  ]);
  assert.deepEqual(await trainerDb.setting('workspace.active'), { mode: 'study', location: 'latest' });
});

test('due queue enforces same-day limits and persists review session kind', async () => {
  const { clearTrainerDbForTesting, createBackup, importBackup, initTrainerDb, trainerDb } = await import('./trainerDb');
  await initTrainerDb();
  await clearTrainerDbForTesting();
  const preferences = await trainerDb.schedulerPreferences();
  const saveAttempt = (panoId: string) => trainerDb.saveAttempt({
    id: `daily:${panoId}`, gameId: 'daily', roundNumber: 1, panoId, actualLat: panoId.endsWith('a') ? 1 : 2, actualLng: 1,
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
  assert.equal((await trainerDb.locationMetadata()).some((location) => !!location.imageDataUrl), false);
  assert.equal((await trainerDb.clueMetadata()).some((clue) => clue.imageDataUrl.startsWith('data:')), false);
  const restored = await trainerDb.setting<{ kind?: string }>('review.active');
  assert.equal(restored?.kind, 'due');
});

test('an already merged nearby Review card recovers the newest saved due date', async () => {
  const { clearTrainerDbForTesting, createBackup, importBackup, trainerDb } = await import('./trainerDb');
  await clearTrainerDbForTesting();
  const now = Date.now(); const reviewedAt = now - 3600e3; const nextDueAt = now + 3 * 864e5;
  const place = (panoId: string, lat: number) => ({ id: panoId, panoId, lat, lng: 13.4, countryCode: 'DE', firstSeenAt: now, lastSeenAt: now, encounterCount: 1 });
  const backup = await createBackup(false);
  backup.data.locations.push(place('phone', 52.5), place('pc', 52.5002));
  backup.data.reviews.push({ id: 'phone', panoId: 'phone', dueAt: now - 1000, intervalDays: 1, gradingHistory: [{ grade: 'good', at: reviewedAt }], lapseCount: 0, reviewCount: 1, lastReviewedAt: reviewedAt });
  const attempt = { gameId: 'sync', roundNumber: 1, actualLat: 52.5002, actualLng: 13.4, countryCode: 'DE', guessedLat: 52.5002, guessedLng: 13.4, guessedCountryCode: 'DE', distanceKm: 0, score: 5000, timeSpentSeconds: 10, collectionId: 'world', canMove: true, canPan: true, canZoom: true, createdAt: reviewedAt };
  backup.data.attempts.push({ ...attempt, id: 'source', panoId: 'phone', source: 'play' }, { ...attempt, id: 'grade', panoId: 'pc', source: 'review', reviewedAt, grade: 'good', nextDueAt, intervalDays: 3 });
  await importBackup(backup, 'replace');
  assert.equal((await trainerDb.reviews())[0].dueAt, nextDueAt);
  assert.equal((await trainerDb.reviewQueue({ due: true })).length, 0);
});

test('saved game preferences are normalized before reuse', async () => {
  const { normalizeGamePreferences } = await import('./trainerDb');
  assert.deepEqual(normalizeGamePreferences({ roundCount: 999, collectionId: 7, canMove: false, timeLimitSeconds: -1, environment: 'ocean' }, false), {
    roundCount: 5, collectionId: 'world', canMove: false, canPan: true, canZoom: true, showCompass: false, aiCoachEnabled: true,
    environment: 'mixed', urbanLevel: 3, samplingMode: 'natural', priority: 'random', panoramaSource: 'official', allowContributors: false, allowInteriors: false, includeWater: true, importedMapOrder: 'shuffle', skipSeenImported: true, timeLimitSeconds: 0,
  });
  assert.equal(normalizeGamePreferences({ priority: 'least-exposure' }).priority, 'least-exposure');
  assert.equal(normalizeGamePreferences({ samplingMode: 'shuffle' }).samplingMode, 'shuffle');
  assert.equal(normalizeGamePreferences({ priority: 'invalid' }).priority, 'random');
  assert.equal(normalizeGamePreferences({ roundCount: 37 }).roundCount, 37);
  assert.equal(normalizeGamePreferences({ timeLimitSeconds: 17 }).timeLimitSeconds, 17);
  assert.equal(normalizeGamePreferences({ timeLimitSeconds: 3600 }).timeLimitSeconds, 3600);
  assert.equal(normalizeGamePreferences({ timeLimitSeconds: 3601 }).timeLimitSeconds, 0);
  assert.equal(normalizeGamePreferences({ timeLimitSeconds: 1.5 }).timeLimitSeconds, 0);
  assert.equal(normalizeGamePreferences({ includeWater: false }).includeWater, false);
  assert.equal(normalizeGamePreferences({ countryCode: 'DE' }).countryCode, 'DE');
  assert.equal(normalizeGamePreferences({ countryCode: 'ZZ' }).countryCode, undefined);
  assert.deepEqual(normalizeGamePreferences({ countryCodes: ['DE', 'FR', 'DE', 'ZZ'] }).countryCodes, ['DE', 'FR']);
  assert.equal(normalizeGamePreferences({ locationTargets: [{ kind: 'region', countryCode: 'PH', regionId: 'PH.NCR', regionName: 'National Capital Region' }, { kind: 'city', countryCode: 'ZZ' }] }).locationTargets?.length, 1);
  assert.equal(normalizeGamePreferences({ allowInteriors: true }).allowInteriors, true);
  assert.equal(normalizeGamePreferences({ importedMapOrder: 'source', skipSeenImported: false }).importedMapOrder, 'source');
  assert.equal(normalizeGamePreferences({ importedMapOrder: 'invalid' as 'source' }).importedMapOrder, 'shuffle');
});

test('fresh review settings randomize with a deterministic Fisher-Yates shuffle', async () => {
  const { normalizeSchedulerPreferences, reviewViewVariationDifficultyFor, shuffleInPlace } = await import('./trainerDb');
  assert.equal(normalizeSchedulerPreferences(undefined).reviewOrder, 'random');
  assert.deepEqual(shuffleInPlace([1, 2, 3, 4], () => 0), [2, 3, 4, 1]);
  assert.equal(normalizeSchedulerPreferences({ reviewOrder: 'due' }).reviewOrder, 'due');
  const defaults = normalizeSchedulerPreferences(undefined);
  assert.deepEqual([defaults.reviewViewVariationStandardDifficulty, defaults.reviewViewVariationNoMoveDifficulty, defaults.reviewViewVariationNmpzDifficulty], [0, 0, 0]);
  const migrated = normalizeSchedulerPreferences({ reviewViewVariationEnabled: true, reviewViewVariationDifficulty: 73 });
  assert.deepEqual([migrated.reviewViewVariationStandardDifficulty, migrated.reviewViewVariationNoMoveDifficulty, migrated.reviewViewVariationNmpzDifficulty], [73, 73, 73]);
  const split = normalizeSchedulerPreferences({ reviewViewVariationStandardDifficulty: 10, reviewViewVariationNoMoveDifficulty: 50, reviewViewVariationNmpzDifficulty: 140 });
  assert.deepEqual([reviewViewVariationDifficultyFor(split, true, true, true), reviewViewVariationDifficultyFor(split, false, true, true), reviewViewVariationDifficultyFor(split, false, false, false)], [10, 50, 100]);
});

test('Random order shuffles saved Meta cards in custom Review queues', async () => {
  const { clearTrainerDbForTesting, initTrainerDb, trainerDb } = await import('./trainerDb');
  await initTrainerDb(); await clearTrainerDbForTesting();
  const preferences = await trainerDb.schedulerPreferences();
  for (let index = 0; index < 3; index++) await trainerDb.saveAttempt({
    id: `meta-${index}`, gameId: 'study', roundNumber: 1, panoId: `meta-${index}`,
    actualLat: index, actualLng: 0, countryCode: 'DE', guessedLat: null, guessedLng: null,
    distanceKm: null, score: 0, timeSpentSeconds: 0, collectionId: 'world',
    canMove: true, canPan: true, canZoom: true, createdAt: 1000 + index,
    source: 'study', learnSource: 'meta',
  });
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    assert.deepEqual((await trainerDb.reviewQueue({})).map((item) => item.id), ['meta-1', 'meta-0', 'meta-2']);
    for (let index = 0; index < 3; index++) await trainerDb.queueForReview(`meta-${index}`, true);
    assert.deepEqual((await trainerDb.reviewQueue({ due: true })).map((item) => item.id), ['meta-1', 'meta-2', 'meta-0']);
    await trainerDb.setSetting('schedulerPreferences', { ...preferences, reviewOrder: 'due' });
    assert.deepEqual((await trainerDb.reviewQueue({})).map((item) => item.id), ['meta-2', 'meta-1', 'meta-0']);
  } finally { Math.random = originalRandom; }
});

test('nearby Review card keeps the Play movement rule over Study and Review sources', async () => {
  const { clearTrainerDbForTesting, initTrainerDb, trainerDb } = await import('./trainerDb');
  await initTrainerDb(); await clearTrainerDbForTesting();
  const source = {
    gameId: 'game', roundNumber: 1, actualLat: -33.87, actualLng: 151.21, countryCode: 'AU',
    guessedLat: null, guessedLng: null, distanceKm: null, timeSpentSeconds: 0,
    collectionId: 'world', createdAt: Date.now(),
  };
  await trainerDb.saveAttempt({ ...source, id: 'study', panoId: 'nearby-study', score: 0, source: 'study', canMove: true, canPan: true, canZoom: true });
  await trainerDb.queueForReview('nearby-study', true);
  await trainerDb.saveAttempt({ ...source, id: 'review', panoId: 'nearby-review', score: 1000, source: 'review', canMove: true, canPan: true, canZoom: true });
  await trainerDb.saveAttempt({ ...source, id: 'nmpz', panoId: 'nearby-play', score: 3000, source: 'play', canMove: false, canPan: false, canZoom: false });
  const queue = await trainerDb.reviewQueue({ due: true });
  assert.deepEqual(queue.map((item) => item.id), ['nmpz']);
  assert.deepEqual([queue[0].canMove, queue[0].canPan, queue[0].canZoom], [false, false, false]);
});

test('an older uploaded save matches its source point after Google resolves a farther panorama', async () => {
  const { clearTrainerDbForTesting, initTrainerDb, trainerDb } = await import('./trainerDb');
  const { matchSavedImportedPoints, withImportedSourceHash } = await import('../services/importedMap');
  await initTrainerDb(); await clearTrainerDbForTesting();
  const map = { id: 'map', name: 'Map', points: [{ lat: 52.5, lng: 13.4 }] };
  const old = { panoId: 'old-view', lat: 52.5, lng: 13.4, countryCode: 'DE', importedMapPointIndex: 0 };
  await trainerDb.encounter(old);
  const card = await trainerDb.queueForReview(old.panoId, false, old);
  const next = await withImportedSourceHash({ panoId: 'new-view', lat: 52.501, lng: 13.4, countryCode: 'DE', importedMapPointIndex: 0 }, map);
  assert.equal(await trainerDb.reviewState(next.panoId, next), undefined);
  await matchSavedImportedPoints(map);
  assert.equal((await trainerDb.reviewState(next.panoId, next))?.id, card.id);
  assert.equal((await trainerDb.locations())[0].encounterCount, 1);
});

test('location matching reads omit photos while full reads preserve them', async () => {
  const { clearTrainerDbForTesting, initTrainerDb, trainerDb } = await import('./trainerDb');
  await initTrainerDb(); await clearTrainerDbForTesting();
  await trainerDb.encounter({ panoId: 'photo-view', lat: 52.5, lng: 13.4, countryCode: 'DE' });
  await trainerDb.saveLocationImage('photo-view', 'data:image/jpeg;base64,AQ==');
  assert.equal((await trainerDb.locationMetadata())[0].imageDataUrl, undefined);
  assert.equal((await trainerDb.locations())[0].imageDataUrl, 'data:image/jpeg;base64,AQ==');
});


test('Review submission reuses its read context and prefix reads exclude image drafts', async () => {
  const { clearTrainerDbForTesting, trainerDb } = await import('./trainerDb');
  await clearTrainerDbForTesting();
  await trainerDb.setSetting('map.history.a', { id: 'a' });
  await trainerDb.setSetting('coach.draft', { imageDataUrl: 'data:image/png;base64,large' });
  assert.deepEqual((await trainerDb.settingsByPrefix('map.history.')).map((item) => item.key), ['map.history.a']);
  const preferences = await trainerDb.schedulerPreferences();
  const originalRead = trainerDb.reviewState;
  trainerDb.reviewState = async () => { throw new Error('Submission must reuse its saved-card lookup'); };
  try {
    const first = await trainerDb.gradeReview('context-view', 'good', undefined, undefined, { preferences });
    const second = await trainerDb.gradeReview('context-view', 'easy', undefined, undefined, { previous: first, preferences });
    assert.equal(second.reviewCount, 2);
    assert.deepEqual(second.gradingHistory.map((item) => item.grade), ['good', 'easy']);
    assert.equal((await trainerDb.reviews())[0].dueAt, second.dueAt);
  } finally { trainerDb.reviewState = originalRead; }
});


test('existing Review cards use keyed reads while nearby aliases retain canonical scheduling', async () => {
  const { clearTrainerDbForTesting, trainerDb } = await import('./trainerDb');
  await clearTrainerDbForTesting();
  const anchor = { panoId: 'keyed-anchor', lat: 52.5, lng: 13.4, countryCode: 'DE' };
  await trainerDb.encounter(anchor);
  const saved = await trainerDb.queueForReview(anchor.panoId, false, anchor);
  await trainerDb.reviews();
  const reads = mock.method(IDBObjectStore.prototype, 'getAll');
  try {
    assert.deepEqual(await trainerDb.reviewState(anchor.panoId), saved);
    assert.deepEqual(await trainerDb.scheduleFirstPlay(anchor.panoId, 'again', anchor), saved);
    assert.equal(reads.mock.callCount(), 0, 'Exact cards must not materialize whole stores');
    await trainerDb.stampSourcePointHash(anchor.panoId, 'new-source');
    assert.equal((await trainerDb.reviewState(anchor.panoId))?.id, saved.id);
    assert.ok(reads.mock.callCount() > 0, 'Identity changes must invalidate the exact-card shortcut');
    const alias = { ...anchor, panoId: 'keyed-alias', lat: 52.5001 };
    await trainerDb.encounter(alias);
    assert.equal((await trainerDb.reviewState(alias.panoId))?.id, saved.id);
    assert.ok(reads.mock.callCount() > 0, 'Unknown aliases still use the full nearby-card rules');
    const graded = await trainerDb.gradeReview(alias.panoId, 'good');
    assert.equal(graded.id, saved.id);
    assert.equal(graded.reviewCount, 1);
    assert.equal((await trainerDb.reviewState(anchor.panoId))?.dueAt, graded.dueAt);
  } finally { reads.mock.restore(); }
});


test('homepage and hub readers share concurrent Review maintenance', async () => {
  const { clearTrainerDbForTesting, trainerDb } = await import('./trainerDb');
  await clearTrainerDbForTesting();
  const reads = mock.method(IDBObjectStore.prototype, 'getAll');
  try {
    const [reviews, queue] = await Promise.all([trainerDb.reviews(), trainerDb.reviewQueue({ due: true })]);
    assert.deepEqual(reviews, []); assert.deepEqual(queue, []);
    const attemptReads = reads.mock.calls.filter((call) => (call.this as IDBObjectStore).name === 'attempts');
    assert.equal(attemptReads.length, 3, 'One maintenance scan plus one scan per result');
  } finally { reads.mock.restore(); }
});


test('shared Review maintenance can retry after a database read fails', async () => {
  const { clearTrainerDbForTesting, trainerDb } = await import('./trainerDb');
  await clearTrainerDbForTesting();
  const reads = mock.method(IDBObjectStore.prototype, 'getAll', () => { throw new Error('Read unavailable'); });
  try {
    const results = await Promise.allSettled([trainerDb.reviews(), trainerDb.reviewQueue({ due: true })]);
    assert.ok(results.every((result) => result.status === 'rejected'));
  } finally { reads.mock.restore(); }
  assert.deepEqual(await trainerDb.reviews(), []);
});
