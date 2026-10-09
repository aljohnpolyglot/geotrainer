import assert from 'node:assert/strict';
import test from 'node:test';
import { hasVisiblePixels, observePanoramaArrival } from './panoramaArrival';

test('Review waits for matching rendered panorama, position, and successful status', () => {
  const target = { panoId: 'nepal', lat: 28.22728, lng: 81.32569 };
  let panoId = 'hungary';
  let position = { lat: 46.3, lng: 18 };
  let status = 'OK';
  let imageVisible = false;
  let ready = 0;
  const events = new Map<string, () => void>();
  const panorama = {
    getPano: () => panoId,
    getStatus: () => status,
    getPosition: () => ({ lat: () => position.lat, lng: () => position.lng }),
    addListener: (name: string, callback: () => void) => { events.set(name, callback); return { remove: () => events.delete(name) }; },
  } as unknown as google.maps.StreetViewPanorama;
  const stop = observePanoramaArrival(panorama, target, () => ready++, () => imageVisible);
  assert.equal(ready, 0);
  panoId = target.panoId;
  events.get('pano_changed')!(); // New ID can arrive before its coordinates.
  assert.equal(ready, 0);
  position = target;
  status = 'ZERO_RESULTS';
  events.get('position_changed')!();
  assert.equal(ready, 0);
  status = 'OK';
  events.get('status_changed')!();
  assert.equal(ready, 0, 'a successful lookup can still display a black view');
  imageVisible = true;
  events.get('status_changed')!();
  assert.equal(ready, 1);
  assert.equal(events.size, 0);
  stop();

  panoId = 'old';
  const cancel = observePanoramaArrival(panorama, target, () => ready++);
  const late = events.get('pano_changed')!;
  cancel();
  panoId = target.panoId;
  late();
  assert.equal(ready, 1, 'a departed card cannot become ready from a late event');
});

test('black or transparent panorama frames cannot start Review', () => {
  const black = new Uint8ClampedArray(24 * 14 * 4);
  for (let index = 3; index < black.length; index += 4) black[index] = 255;
  assert.equal(hasVisiblePixels(black), false);
  for (let index = 0; index < 24; index++) black[index * 4] = 120;
  assert.equal(hasVisiblePixels(black), true);
});
