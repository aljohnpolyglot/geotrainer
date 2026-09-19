import assert from 'node:assert/strict';
import test from 'node:test';
import { moveImageCrop, resizeImageCrop } from './imageCrop';

test('image crop movement and corner resizing stay inside the image', () => {
  const crop = { x: .2, y: .2, width: .5, height: .5 };
  assert.deepEqual(moveImageCrop(crop, 1, -1), { x: .5, y: 0, width: .5, height: .5 });
  assert.deepEqual(resizeImageCrop(crop, 'se', 1, 1), { x: .2, y: .2, width: .8, height: .8 });
  const minimum = resizeImageCrop(crop, 'nw', 1, 1);
  assert.ok(minimum.width >= .079999 && minimum.height >= .079999);
});
