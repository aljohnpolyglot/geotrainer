import { trainerDb } from '../data/trainerDb';
import type { CoachHistoryNote } from '../types';

let writes = Promise.resolve();

export function saveCoachHistoryNote(note: CoachHistoryNote): Promise<void> {
  const next = writes.then(async () => {
    const saved = await trainerDb.setting<CoachHistoryNote[]>('coach.notes') || [];
    await trainerDb.setSetting('coach.notes', [note, ...saved]);
  });
  writes = next.catch(() => {});
  return next;
}
