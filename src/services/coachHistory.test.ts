import assert from 'node:assert/strict';
import test from 'node:test';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import type { CoachAnalysis } from '../types';

Object.assign(globalThis, { indexedDB, IDBKeyRange });

test('concurrent Coach completions are both retained', async () => {
  const { saveCoachHistoryNote } = await import('./coachHistory');
  const { trainerDb } = await import('../data/trainerDb');
  const analysis: CoachAnalysis = { confidence: 'low', region: '', candidates: [], strongClues: [], weakClues: [], confusions: [], nextThingsToInspect: [], extraCards: [] };
  await Promise.all([1, 2].map((generatedAt) => saveCoachHistoryNote({ id: `note-${generatedAt}`, panoId: 'pano', countryCode: 'IT', mode: 'analyze', model: 'test', generatedAt, analysis })));
  assert.deepEqual((await trainerDb.setting<Array<{ id: string }>>('coach.notes'))?.map(({ id }) => id), ['note-2', 'note-1']);
});
