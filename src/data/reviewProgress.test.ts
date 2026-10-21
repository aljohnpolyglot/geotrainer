import assert from 'node:assert/strict';
import test from 'node:test';
import { indexedDB, IDBKeyRange } from 'fake-indexeddb';
import type { Attempt, ReviewRecord } from '../types';
import { commitReviewProgress, type SavedReviewSession } from './reviewProgress';
import { openDatabase, request } from './trainerDatabase';
import { gradedReviewRecord, generalizedReviewRecord } from './reviewSchedule';
import { DEFAULT_SCHEDULER_PREFERENCES } from './reviewPreferences';

Object.assign(globalThis, { indexedDB, IDBKeyRange });
test('new grading replaces a balanced due date while practice preserves the schedule', () => {
  const previous: ReviewRecord = { id: 'pano', panoId: 'pano', dueAt: 200, naturalDueAt: 100, dueAdjustedAt: 150, intervalDays: 1, gradingHistory: [], lapseCount: 0, reviewCount: 1 };
  const next = gradedReviewRecord('pano', 'good', previous, DEFAULT_SCHEDULER_PREFERENCES, undefined, undefined, 1000);
  assert.equal(next.naturalDueAt, undefined);
  assert.equal(next.dueAdjustedAt, undefined);
  assert.equal(next.reviewCount, 2);
  assert.deepEqual(next.gradingHistory, [{ grade: 'good', at: 1000 }]);
  assert.equal(generalizedReviewRecord(previous, 'good', { kind: 'original' }), previous);
  assert.equal(previous.naturalDueAt, 100);
});
test('Review commits its attempt, schedule and position together, rolling everything back on failure', async () => {
  const attempt = { id: 'answer', panoId: 'pano', score: 4500 } as Attempt;
  const review: ReviewRecord = { id: 'pano', panoId: 'pano', dueAt: 200, intervalDays: 1, gradingHistory: [], lapseCount: 0, reviewCount: 1 };
  const session: SavedReviewSession = { attemptIds: ['card90'], source: 'Due Today', initialTotal: 150, stats: Array.from({ length: 89 }, () => ({ previous: 1000, current: 4500, grade: 'good' })) };
  await commitReviewProgress(attempt, review, session);
  const db = await openDatabase();
  const read = (store: string, id: string) => request(db.transaction(store).objectStore(store).get(id));
  assert.deepEqual((await read('settings', 'review.active')).value, session);
  assert.equal((await read('reviews', 'pano')).reviewCount, 1);
  await assert.rejects(commitReviewProgress({ ...attempt, score: 0 }, { ...review, reviewCount: 2 }, { ...session, invalid: () => {} } as SavedReviewSession));
  assert.equal((await read('attempts', 'answer')).score, 4500);
  assert.equal((await read('reviews', 'pano')).reviewCount, 1);
  assert.deepEqual((await read('settings', 'review.active')).value, session);
  const result = { ...session, attemptIds: [], result: { sourceAttemptId: 'source', attemptId: 'answer', round: { score: 4500 } as never } };
  await commitReviewProgress(attempt, undefined, result);
  assert.deepEqual((await read('settings', 'review.active')).value, result);
  assert.equal((await read('reviews', 'pano')).reviewCount, 1);
});
