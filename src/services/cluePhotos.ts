import type { ClueRecord } from '../types';

export async function readCluePhotos(clues: ClueRecord[], ids: string[], read: (id: string) => Promise<ClueRecord | undefined>) {
  const selected = new Set(ids);
  const rows = await Promise.all(clues.filter((clue) => selected.has(clue.id) && !clue.imageDataUrl).map(async (clue) => [clue.id, (await read(clue.id))?.imageDataUrl || ''] as const));
  return new Map(rows);
}
