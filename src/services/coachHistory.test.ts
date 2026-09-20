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

test('Available notes remove only same-image blanks or exact repeats', async () => {
  const { splitDuplicateNotes } = await import('./coachHistory');
  const rows = [
    { id: 'image-only', text: '', imageUrl: 'image-a' },
    { id: 'rich', text: ' Bus sign ', category: 'Signs', imageUrl: 'image-a' },
    { id: 'caption-only', text: 'bus   sign' },
    { id: 'other-caption', text: 'Yellow center line', imageUrl: 'image-a' },
    { id: 'different', text: 'Blue bus', imageUrl: 'image-b' },
    { id: 'empty', text: '' },
  ];
  const result = splitDuplicateNotes(rows);
  assert.deepEqual(result.unique.map(({ id }) => id), ['rich', 'other-caption', 'different', 'empty']);
  assert.deepEqual(result.duplicates.map(({ id }) => id), ['image-only', 'caption-only']);
});

test('editing a Notebook note replaces its previous version', async () => {
  const { saveNotebookHistoryNote } = await import('./coachHistory');
  const { trainerDb } = await import('../data/trainerDb');
  const id = 'editable-note';
  await saveNotebookHistoryNote({ id, panoId: 'edit-pano', countryCode: 'UY', text: 'Old', updatedAt: 1 });
  await saveNotebookHistoryNote({ id, panoId: 'edit-pano', countryCode: 'UY', text: 'New', updatedAt: 2 });
  const saved = (await trainerDb.setting<Array<{ id: string; text: string }>>('notebook.notes'))?.filter((note) => note.id === id);
  assert.deepEqual(saved, [{ id, panoId: 'edit-pano', countryCode: 'UY', text: 'New', updatedAt: 2, deletedAt: undefined }]);
});

test('Coach deletion creates a sync-safe marker even for legacy history', async () => {
  const { deleteCoachHistoryNote } = await import('./coachHistory');
  const { trainerDb } = await import('../data/trainerDb');
  const analysis: CoachAnalysis = { confidence: 'low', region: '', candidates: [], strongClues: [], weakClues: [], confusions: [], nextThingsToInspect: [], extraCards: [] };
  await deleteCoachHistoryNote({ id: 'legacy', panoId: 'pano', countryCode: 'SE', mode: 'analyze', model: 'test', generatedAt: 70, analysis });
  assert.ok((await trainerDb.setting<Array<{ id: string; deletedAt?: number }>>('coach.notes'))?.find(({ id }) => id === 'legacy')?.deletedAt);
});
