import type { Attempt, GameRound, ReviewGrade, ReviewRecord, ReviewSessionKind } from '../types';
import { complete, openDatabase } from './trainerDatabase';

export type ReviewStat = { previous: number; current: number; grade: ReviewGrade; attemptId?: string };
export type SavedReviewSession = { attemptIds: string[]; source: string; kind?: ReviewSessionKind; initialTotal: number; compass?: boolean; stats?: ReviewStat[]; result?: { sourceAttemptId: string; attemptId: string; round: GameRound } };

export async function commitReviewProgress(attempt: Attempt, review: ReviewRecord | undefined, session: SavedReviewSession) {
  const db = await openDatabase();
  const tx = db.transaction(['attempts', 'reviews', 'settings'], 'readwrite', { durability: 'strict' });
  const done = complete(tx);
  try {
    tx.objectStore('attempts').put(attempt);
    if (review) tx.objectStore('reviews').put(review);
    tx.objectStore('settings').put({ key: 'review.active', value: session, updatedAt: Date.now() });
  } catch (error) { tx.abort(); await done.catch(() => {}); throw error; }
  await done;
}
