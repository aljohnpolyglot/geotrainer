import assert from 'node:assert/strict';
import test from 'node:test';
import { IDBKeyRange, indexedDB } from 'fake-indexeddb';
import { planReviewReset } from './reviewRebalance';

Object.assign(globalThis, { indexedDB, IDBKeyRange, localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} } });

test('balancing saves the natural due date and reset restores it in IndexedDB', async () => {
  const { initTrainerDb, trainerDb } = await import('./trainerDb');
  await initTrainerDb();
  const original = await trainerDb.scheduleFirstPlay('reset-card', 'good');
  await trainerDb.rebalanceReviews([{ id: original.id, fromDueAt: original.dueAt, toDueAt: original.dueAt + 864e5 }]);
  const balanced = (await trainerDb.reviews()).find((review) => review.id === original.id)!;
  assert.equal(balanced.naturalDueAt, original.dueAt);
  assert.equal(balanced.dueAt, original.dueAt + 864e5);
  await trainerDb.rebalanceReviews(planReviewReset([balanced]));
  const restored = (await trainerDb.reviews()).find((review) => review.id === original.id)!;
  assert.equal(restored.dueAt, original.dueAt);
  assert.equal(restored.naturalDueAt, original.dueAt);
  assert.deepEqual(restored.gradingHistory, original.gradingHistory);
  assert.equal(restored.reviewCount, original.reviewCount);
  assert.ok(restored.dueAdjustedAt! >= balanced.dueAdjustedAt!);
});
