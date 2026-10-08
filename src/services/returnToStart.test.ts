import assert from 'node:assert/strict';
import test from 'node:test';
import { returnToStart, startDirection, viewPositionFromPano } from './returnToStart';

test('movement events keep the round spawn fixed and measure the new panorama', () => {
  const start = { panoId: 'spawn', lat: 0, lng: 0 };
  const moved = { lat: 0.001, lng: 0 };
  assert.equal(startDirection(start, viewPositionFromPano(start, 'spawn', moved), 0).meters, 0);
  assert.equal(startDirection(start, viewPositionFromPano(start, 'next', moved), 0).meters, 111);
});

test('return uses the shown round start and respects movement restrictions and missing views', () => {
  const calls: string[] = [];
  const panorama = { setPano: (pano: string) => { calls.push(pano); } };
  returnToStart(panorama, 'review-varied-spawn', true);
  returnToStart(panorama, 'play-spawn', true);
  returnToStart(panorama, 'locked-spawn', false);
  returnToStart(panorama, undefined, true);
  returnToStart(null, 'unloaded-spawn', true);
  assert.deepEqual(calls, ['review-varied-spawn', 'play-spawn']);
});

test('start indicator measures distance and turns with camera heading, including the date line', () => {
  const position = { lat: 0, lng: 0 };
  assert.deepEqual(startDirection(position, position, 0), { meters: 0, angle: 0 });
  assert.equal(startDirection({ lat: .001, lng: 0 }, position, 0).meters, 111);
  assert.equal(startDirection({ lat: .001, lng: 0 }, position, 90).angle, 270);
  assert.equal(startDirection({ lat: 0, lng: .001 }, position, 90).angle, 0);
  const across = startDirection({ lat: 0, lng: -179.999 }, { lat: 0, lng: 179.999 }, 0);
  assert.equal(across.meters, 222);
  assert.equal(across.angle, 90);
});
