import assert from 'node:assert/strict';
import test from 'node:test';
import { expandedGuessMapRect } from './GuessMap';

test('enlarged guess map stays floating on desktop and inside a mobile viewport', () => {
  assert.deepEqual(expandedGuessMapRect({ left: 0, top: 0, right: 1920, bottom: 900 }, false, 'enlarge'),
    { left: 1236, top: 328, width: 672, height: 560 });
  assert.deepEqual(expandedGuessMapRect({ left: 0, top: 20, right: 390, bottom: 820 }, true, 'enlarge'),
    { left: 12, top: 448, width: 366, height: 360 });
  assert.deepEqual(expandedGuessMapRect({ left: 0, top: 20, right: 390, bottom: 820 }, true, 'fullscreen'),
    { left: 0, top: 20, width: 390, height: 800 });
});
