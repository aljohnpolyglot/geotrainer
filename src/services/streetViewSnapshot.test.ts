import assert from 'node:assert/strict';
import test from 'node:test';
import { getStreetViewSnapshot, setStreetViewSnapshot } from './streetViewSnapshot';

test('Coach keeps the current moved view under the round panorama', () => {
  setStreetViewSnapshot({ locationPanoId: 'round-origin', panoId: 'moved-view', heading: 90, pitch: 2, zoom: 1 });

  assert.equal(getStreetViewSnapshot('round-origin')?.panoId, 'moved-view');
  assert.equal(getStreetViewSnapshot('moved-view')?.heading, 90);
  assert.equal(getStreetViewSnapshot('unrelated-view'), null);
});
