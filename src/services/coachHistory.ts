import { trainerDb } from '../data/trainerDb';
import type { CoachHistoryNote, NotebookNote } from '../types';

let writes = Promise.resolve();
let notebookWrites = Promise.resolve();

export function saveCoachHistoryNote(note: CoachHistoryNote): Promise<void> {
  const next = writes.then(async () => {
    const saved = await trainerDb.setting<CoachHistoryNote[]>('coach.notes') || [];
    await trainerDb.setSetting('coach.notes', [note, ...saved]);
  });
  writes = next.catch(() => {});
  return next;
}

export function saveNotebookHistoryNote(note: NotebookNote): Promise<void> {
  const next = notebookWrites.then(async () => {
    const saved = await trainerDb.setting<NotebookNote[]>('notebook.notes') || [];
    await trainerDb.setSetting('notebook.notes', [note, ...saved]);
  });
  notebookWrites = next.catch(() => {});
  return next;
}
