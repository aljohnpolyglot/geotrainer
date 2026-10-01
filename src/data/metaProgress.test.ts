import assert from 'node:assert/strict';
import test from 'node:test';
import { metaSeenIds } from './metaProgress';

test('a saved legacy Meta lesson and a skipped lesson count as seen independently', () => {
  const seen = metaSeenIds([{ id: 'BW-a', courseId: 'BW', updatedAt: 1 }], [
    { source: 'study', metaLessonId: 'beginner-a' },
    { source: 'review', metaLessonId: 'beginner-b' },
  ]);
  assert.deepEqual([...seen].sort(), ['BW-a', 'beginner-a']);
});
