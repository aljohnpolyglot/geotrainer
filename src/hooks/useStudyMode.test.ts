import assert from 'node:assert/strict';
import test from 'node:test';
import { consumeRestoredStudyPano, latestStudyVisit } from './useStudyMode';

test('a restored study panorama suppresses exactly one duplicate encounter', () => {
  const restored = { current: 'pano-1' };
  assert.equal(consumeRestoredStudyPano(restored, 'pano-1'), true);
  assert.equal(consumeRestoredStudyPano(restored, 'pano-1'), false);
  assert.equal(consumeRestoredStudyPano({ current: 'pano-2' }, 'pano-1'), false);
});

test('a restored workspace resumes its latest visit instead of creating a reload row', () => {
  const visits = [{ id: 'old', panoId: 'pano-1', openedAt: 10 }, { id: 'latest', panoId: 'pano-1', openedAt: 20 }, { id: 'other', panoId: 'pano-2', openedAt: 30 }] as never;
  assert.equal(latestStudyVisit(visits, 'pano-1')?.id, 'latest');
});
