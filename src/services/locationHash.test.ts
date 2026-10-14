import assert from 'node:assert/strict';
import test from 'node:test';
import { panoramaHash, sourcePointHash } from './locationHash';

test('location hashes are stable across uploads and distinguish source points', async () => {
  const point = { lat: 45.123456, lng: 16.654321 };
  const withHeading = { ...point, heading: 90 };
  const hash = await sourcePointHash(point);
  assert.equal(hash, await sourcePointHash(withHeading));
  assert.notEqual(hash, await sourcePointHash({ ...point, lat: point.lat + .001 }));
  assert.notEqual(hash, await panoramaHash('google-pano'));
  assert.equal(await panoramaHash('google-pano'), await panoramaHash('google-pano'));
});
