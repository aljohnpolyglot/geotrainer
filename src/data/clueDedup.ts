import type { ClueRecord, NotebookNote } from '../types';

const normalize = (value = '') => value.trim().replace(/\s+/g, ' ').toLocaleLowerCase();

export const clueImageFingerprint = (value = '') => {
  if (!value.startsWith('data:image/')) return '';
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  return `${value.length}:${(hash >>> 0).toString(36)}`;
};

export function splitDuplicateClues(clues: ClueRecord[], notes: NotebookNote[] = []) {
  const noteText = new Map<string, string[]>();
  notes.filter((note) => !note.deletedAt && note.clueId).forEach((note) => noteText.set(note.clueId!, [...(noteText.get(note.clueId!) || []), note.text, note.category || '']));
  const text = (clue: ClueRecord) => normalize([clue.analysis?.description, ...(clue.analysis?.strongClues || []), ...(noteText.get(clue.id) || [])].filter(Boolean).join('\n'));
  const image = (clue: ClueRecord) => clue.imageFingerprint || clueImageFingerprint(clue.imageDataUrl);
  const unique: ClueRecord[] = []; const duplicates: ClueRecord[] = [];
  for (const clue of clues) {
    const key = image(clue);
    if (!key) { unique.push(clue); continue; }
    const sameImage = unique.filter((item) => image(item) === key); const meaningful = text(clue);
    const blank = sameImage.find((item) => !text(item));
    const match = sameImage.find((item) => text(item) === meaningful) || (!meaningful ? sameImage.find((item) => text(item)) : blank);
    if (!match) unique.push(clue);
    else if (meaningful && !text(match)) { unique[unique.indexOf(match)] = clue; duplicates.push(match); }
    else duplicates.push(clue);
  }
  return { unique, duplicates };
}
