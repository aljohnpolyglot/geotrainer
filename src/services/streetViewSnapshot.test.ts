import assert from 'node:assert/strict';
import test from 'node:test';
import { getCaptureCrop } from './streetViewSnapshot';

test('screen capture crops to the Street View viewport at display scale', () => {
  assert.deepEqual(
    getCaptureCrop({ width: 2400, height: 1600 }, { width: 1200, height: 800 }, { left: 0, top: 60, width: 1200, height: 740 }),
    { sx: 0, sy: 120, sw: 2400, sh: 1480, width: 1280, height: 789 },
  );
});
