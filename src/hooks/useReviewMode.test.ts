import assert from 'node:assert/strict';
import test from 'node:test';
import { queueAfterReview, restoredReviewProgress } from './useReviewMode';

test('restored Review sessions keep completed-card progress after reload', () => {
  const stats = Array.from({ length: 34 }, () => ({ previous: 1000, current: 2000, grade: 'good' as const }));
  const restored = restoredReviewProgress({ initialTotal: 56, stats }, 10);
  assert.equal(restored.stats.length + 1, 35);
  assert.equal(restored.initialTotal, 56);
});

test('a passed review leaves the persisted queue while Again returns to its end', () => {
  const current = { id: 'a' } as never; const next = { id: 'b' } as never;
  assert.deepEqual(queueAfterReview([current, next], current, 'good').map((item) => item.id), ['b']);
  assert.deepEqual(queueAfterReview([current, next], current, 'again').map((item) => item.id), ['b', 'a']);
});
