import assert from 'node:assert/strict';
import test from 'node:test';
import { getStreetViewSnapshot, panoramaCaptureHeadings, setStreetViewSnapshot, subscribeStreetViewSnapshot } from './streetViewSnapshot';

test('Coach keeps the current moved view under the round panorama', () => {
  setStreetViewSnapshot({ locationPanoId: 'round-origin', panoId: 'moved-view', heading: 90, pitch: 2, zoom: 1 });

  assert.equal(getStreetViewSnapshot('round-origin')?.panoId, 'moved-view');
  assert.equal(getStreetViewSnapshot('moved-view')?.heading, 90);
  assert.equal(getStreetViewSnapshot('unrelated-view'), null);
});

test('360 capture covers four quarter-turn headings and wraps north', () => {
  assert.deepEqual(panoramaCaptureHeadings(315), [315, 45, 135, 225]);
});

test('result maps receive live heading changes and stop after unmount', () => {
  const headings: number[] = [];
  const unsubscribe = subscribeStreetViewSnapshot((view) => { if (view.locationPanoId === 'result-origin') headings.push(view.heading); });
  setStreetViewSnapshot({ locationPanoId: 'result-origin', panoId: 'result-view', heading: 45, pitch: 0, zoom: 1 });
  unsubscribe();
  setStreetViewSnapshot({ locationPanoId: 'result-origin', panoId: 'result-view', heading: 90, pitch: 0, zoom: 1 });
  assert.deepEqual(headings, [45]);
});
