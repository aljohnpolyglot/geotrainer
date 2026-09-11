import assert from 'node:assert/strict';
import test from 'node:test';
import { consumeRestoredStudyPano } from './useStudyMode';

test('a restored study panorama suppresses exactly one duplicate encounter', () => {
  const restored = { current: 'pano-1' };
  assert.equal(consumeRestoredStudyPano(restored, 'pano-1'), true);
  assert.equal(consumeRestoredStudyPano(restored, 'pano-1'), false);
  assert.equal(consumeRestoredStudyPano({ current: 'pano-2' }, 'pano-1'), false);
});
