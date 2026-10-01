import type { Attempt } from '../types';
import { trainerDb } from './trainerDb';

export type SeenMeta = { id: string; courseId: string; updatedAt: number };

export function metaSeenIds(rows: SeenMeta[] | undefined, attempts: Pick<Attempt, 'source' | 'metaLessonId'>[] = []): Set<string> {
  return new Set([...(rows || []).map((row) => row.id), ...attempts.flatMap((attempt) => attempt.source === 'study' && attempt.metaLessonId ? [attempt.metaLessonId] : [])]);
}

export async function readMetaSeen(): Promise<Set<string>> {
  const [rows, attempts] = await Promise.all([trainerDb.setting<SeenMeta[]>('meta.seen'), trainerDb.attempts()]);
  return metaSeenIds(rows, attempts);
}

export async function markMetaSeen(courseId: string, id: string): Promise<void> {
  const rows = await trainerDb.setting<SeenMeta[]>('meta.seen') || [];
  if (rows.some((row) => row.id === id)) return;
  await trainerDb.setSetting('meta.seen', [...rows, { id, courseId, updatedAt: Date.now() }]);
}
