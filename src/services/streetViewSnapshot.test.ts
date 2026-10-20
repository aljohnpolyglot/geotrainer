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


test('snapshot history stays bounded while retaining the active origin', () => {
  for (let i = 0; i < 200; i++) setStreetViewSnapshot({ locationPanoId: 'active-origin', panoId: `bounded-${i}`, heading: i, pitch: 0, zoom: 1 });
  assert.equal(getStreetViewSnapshot('bounded-0'), null);
  assert.equal(getStreetViewSnapshot('active-origin')?.heading, 199);
  assert.equal(getStreetViewSnapshot('bounded-199')?.heading, 199);
});

test('duplicate camera events do not notify maps, but returning to an earlier view restores its origin', () => {
  let notifications = 0;
  const unsubscribe = subscribeStreetViewSnapshot(() => notifications++);
  const view = { locationPanoId: 'dedup-origin', panoId: 'dedup-view', heading: 90, pitch: 0, zoom: 1 };
  setStreetViewSnapshot(view);
  for (let i = 0; i < 100; i++) setStreetViewSnapshot({ ...view });
  assert.equal(notifications, 1);
  setStreetViewSnapshot({ ...view, panoId: 'other-view' });
  setStreetViewSnapshot(view);
  assert.equal(getStreetViewSnapshot('dedup-origin')?.panoId, 'dedup-view');
  assert.equal(notifications, 3);
  unsubscribe();
});
