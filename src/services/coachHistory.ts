import { trainerDb } from '../data/trainerDb';
import type { CoachHistoryNote, NotebookNote } from '../types';

let writes = Promise.resolve();
let notebookWrites = Promise.resolve();
export const NOTEBOOK_NOTE_MAX_LENGTH = 1000;

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
    const trimmed = { ...note, text: note.text.slice(0, NOTEBOOK_NOTE_MAX_LENGTH), deletedAt: undefined };
    await trainerDb.setSetting('notebook.notes', [trimmed, ...saved.filter((item) => !note.id || item.id !== note.id)]);
  });
  notebookWrites = next.catch(() => {});
  return next;
}

export function deleteNotebookHistoryNote(note: NotebookNote): Promise<void> {
  const next = notebookWrites.then(async () => {
    const saved = await trainerDb.setting<NotebookNote[]>('notebook.notes') || [];
    const matches = (item: NotebookNote) => note.id ? item.id === note.id : item.panoId === note.panoId && item.updatedAt === note.updatedAt && item.text === note.text;
    await trainerDb.setSetting('notebook.notes', saved.map((item) => matches(item) ? { ...item, deletedAt: Date.now() } : item));
  });
  notebookWrites = next.catch(() => {});
  return next;
}

export function deleteCoachHistoryNote(note: CoachHistoryNote): Promise<void> {
  const next = writes.then(async () => {
    const saved = await trainerDb.setting<CoachHistoryNote[]>('coach.notes') || [];
    const deleted = { ...note, deletedAt: Date.now() };
    await trainerDb.setSetting('coach.notes', saved.some((item) => item.id === note.id) ? saved.map((item) => item.id === note.id ? deleted : item) : [deleted, ...saved]);
  });
  writes = next.catch(() => {});
  return next;
}

export function splitDuplicateNotes<T extends { text: string; category?: string; imageUrl?: string; imageKey?: string; analysis?: unknown }>(notes: T[]) {
  const body = (note: T) => note.text.trim().replace(/\s+/g, ' ').toLocaleLowerCase();
  const text = (note: T) => `${body(note)}\n${note.category || ''}`;
  const image = (note: T) => note.imageKey || note.imageUrl;
  const score = (note: T) => Number(!!image(note)) * 4 + Number(!!text(note).trim()) * 2 + Number(!!note.category) + Number(!!note.analysis);
  const unique: T[] = []; const duplicates: T[] = [];
  for (const note of notes) {
    const meaningful = !!text(note).trim();
    const sameImage = image(note) ? unique.filter((item) => image(item) === image(note)) : [];
    const blank = sameImage.find((item) => !text(item).trim());
    const match = sameImage.find((item) => text(item) === text(note)) || (!meaningful ? sameImage.find((item) => text(item).trim()) : blank) || (body(note) ? unique.find((item) => body(item) === body(note) && (!image(item) || !image(note))) : !image(note) ? unique.find((item) => !image(item) && text(item) === text(note)) : undefined);
    if (!match) unique.push(note);
    else if (score(note) > score(match)) { unique[unique.indexOf(match)] = note; duplicates.push(match); }
    else duplicates.push(note);
  }
  return { unique, duplicates };
}
