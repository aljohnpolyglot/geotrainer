import assert from 'node:assert/strict';
import test from 'node:test';

test('Explore Map combines imagery and indoor filters', async () => {
  (globalThis as any).google = { maps: { StreetViewSource: { DEFAULT: 'default', GOOGLE: 'google', OUTDOOR: 'outdoor' } } };
  const { exploreStreetViewSources } = await import('./exploreMap');
  assert.deepEqual(exploreStreetViewSources({ panoramaSource: 'official', allowInteriors: false }), ['google', 'outdoor']);
  assert.deepEqual(exploreStreetViewSources({ panoramaSource: 'mixed', allowInteriors: true }), ['default']);
});
