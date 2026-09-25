import assert from 'node:assert/strict';
import test from 'node:test';
import { hostedCluePaths } from './clueImages';

test('manual image caching downloads each missing hosted clue only once', () => {
  assert.deepEqual(hostedCluePaths([
    { imagePath: 'user/a.jpg', imageDataUrl: '' },
    { imagePath: 'user/a.jpg', imageDataUrl: '' },
    { imagePath: 'user/b.jpg', imageDataUrl: 'data:image/jpeg;base64,AQ==' },
    { imageDataUrl: '' },
  ] as never), ['user/a.jpg']);
});
