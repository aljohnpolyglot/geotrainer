import assert from 'node:assert/strict';
import test from 'node:test';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';
import type { Attempt, ClueRecord, CoachAnalysis, CoachHistoryNote } from '../types';
import { repairNotebookAssistance } from './assistanceRepair';

const storage = new Map<string, string>();
Object.assign(globalThis, { indexedDB, IDBKeyRange, localStorage: { getItem: (key: string) => storage.get(key) ?? null, setItem: (key: string, value: string) => storage.set(key, value), removeItem: (key: string) => storage.delete(key) } });

test('repairs proven plain Notebook labels while retaining clue/360 analysis and sync evidence', async () => {
  const { trainerDb, initTrainerDb, importBackup, STORE_NAMES } = await import('./trainerDb');
  const { mergeBackups } = await import('../services/cloudSync');
  const attempt: Attempt = { id: 'plain', gameId: 'game', roundNumber: 1, panoId: 'pano', actualLat: 0, actualLng: 0, countryCode: 'SE', guessedLat: 1, guessedLng: 1, distanceKm: 150, score: 3500, timeSpentSeconds: 10, collectionId: 'world', canMove: false, canPan: true, canZoom: true, createdAt: 20000, source: 'play', aiAssisted: true };
  const empty: CoachAnalysis = { confidence: 'low', region: '', candidates: [], strongClues: [], weakClues: [], confusions: [], nextThingsToInspect: [], extraCards: [] };
  const plain: ClueRecord = { id: 'plain-note', countryCode: 'SE', panoId: 'pano', createdAt: 15000, imageDataUrl: 'saved-image', model: 'Notebook', analysis: empty };
  const ai: ClueRecord = { ...plain, id: 'ai-note', model: 'Gemini', analysis: { ...empty, strongClues: ['Blue sign'] } };
  const coach: CoachHistoryNote = { id: '360', countryCode: 'SE', panoId: 'pano', mode: 'analyze360', generatedAt: 16000, model: 'Gemini', analysis: ai.analysis, deletedAt: 21000 };
  assert.deepEqual(repairNotebookAssistance([attempt], [plain], []), [{ ...attempt, aiAssisted: false }]);
  for (const clues of [[plain, ai], [plain, { ...ai, model: 'Notebook' }], [], [{ ...plain, createdAt: 9000 }], [{ ...plain, createdAt: 21000 }]]) assert.equal(repairNotebookAssistance([attempt], clues, [])[0], attempt);
  assert.equal(repairNotebookAssistance([attempt], [plain], [coach])[0], attempt);
  assert.equal(repairNotebookAssistance([{ ...attempt, coachUsed: true }], [plain], [])[0].aiAssisted, true);
  assert.equal(repairNotebookAssistance([{ ...attempt, source: 'review' }], [plain], [])[0].aiAssisted, true);
  assert.equal(repairNotebookAssistance([attempt], [{ ...plain, panoId: 'nearby', lat: 0.0001, lng: 0 }], [])[0].aiAssisted, false);
  assert.equal(repairNotebookAssistance([attempt], [{ ...plain, panoId: 'distant', lat: 1, lng: 0 }], [])[0], attempt);
  await trainerDb.saveAttempt(attempt); await trainerDb.saveClue(plain); await initTrainerDb();
  assert.equal((await trainerDb.attempts()).find(({ id }) => id === attempt.id)?.aiAssisted, false);
  const backup = { format: 'street-view-trainer' as const, schemaVersion: 1 as const, exportedAt: 'today', data: Object.fromEntries(STORE_NAMES.map((name) => [name, name === 'attempts' ? [attempt] : name === 'clues' ? [plain] : []])) as import('./trainerDb').TrainerBackup['data'] };
  await importBackup(backup, 'merge');
  assert.equal((await trainerDb.attempts()).find(({ id }) => id === attempt.id)?.aiAssisted, false);
  assert.equal((mergeBackups(backup, backup).data.attempts[0] as Attempt).aiAssisted, false);
  const genuine = structuredClone(backup); genuine.data.clues.push(ai);
  assert.equal((mergeBackups(genuine, backup).data.attempts[0] as Attempt).aiAssisted, true);
  assert.equal(attempt.aiAssisted, true);
});
