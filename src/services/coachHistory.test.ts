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

test('concurrent Notebook saves are both retained', async () => {
  const { NOTEBOOK_NOTE_MAX_LENGTH, saveNotebookHistoryNote } = await import('./coachHistory');
  const { trainerDb } = await import('../data/trainerDb');
  await Promise.all([1, 2].map((updatedAt) => saveNotebookHistoryNote({ id: `personal-${updatedAt}`, panoId: 'pano', countryCode: 'IT', text: `Note ${updatedAt}`, updatedAt })));
  assert.deepEqual((await trainerDb.setting<Array<{ id: string }>>('notebook.notes'))?.map(({ id }) => id), ['personal-2', 'personal-1']);
  await saveNotebookHistoryNote({ id: 'personal-long', panoId: 'pano', countryCode: 'IT', text: 'å'.repeat(NOTEBOOK_NOTE_MAX_LENGTH + 5), updatedAt: 3 });
  assert.equal((await trainerDb.setting<Array<{ id: string; text: string }>>('notebook.notes'))?.find(({ id }) => id === 'personal-long')?.text.length, NOTEBOOK_NOTE_MAX_LENGTH);
});

test('Personal Notebook deletion leaves a sync-safe hidden marker', async () => {
  const { deleteNotebookHistoryNote, saveNotebookHistoryNote } = await import('./coachHistory');
  const { trainerDb } = await import('../data/trainerDb');
  const note = { id: 'personal-delete', panoId: 'pano', countryCode: 'SE', text: 'bollard', updatedAt: 50 };
  await saveNotebookHistoryNote(note); await deleteNotebookHistoryNote(note);
  const saved = (await trainerDb.setting<Array<{ id: string; deletedAt?: number }>>('notebook.notes'))?.find(({ id }) => id === note.id);
  assert.ok(saved?.deletedAt);
});
