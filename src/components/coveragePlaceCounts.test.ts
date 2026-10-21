import assert from 'node:assert/strict';
import test from 'node:test';
import type { TrainerLocation } from '../types';
import { nearbyReviewPoint } from '../data/reviewIdentity';
import { coveragePlaceCounts } from './trainerHubUtils';

test('indexed coverage preserves ordered anchors, country boundaries, source identity, poles and date line', () => {
  const points = Array.from({ length: 500 }, (_, i) => ({ id: String(i), panoId: String(i), lat: (i % 100) * .0002, lng: Math.floor(i / 100), countryCode: i % 3 ? 'US' : 'CA', firstSeenAt: i })) as TrainerLocation[];
  points.push(...[
    { lat: 89.9999, lng: 179, countryCode: 'US' }, { lat: 89.9999, lng: -179, countryCode: 'US' },
    { lat: 0, lng: 179.9999, countryCode: 'US' }, { lat: 0, lng: -179.9999, countryCode: 'US' },
    { lat: 10, lng: 0, countryCode: 'US', sourcePointHash: 'same' }, { lat: 40, lng: 0, countryCode: 'US', sourcePointHash: 'same' },
    { lat: 40, lng: 0, countryCode: 'CA', sourcePointHash: 'same' },
  ].map((point, i) => ({ ...point, id: `edge-${i}`, panoId: `edge-${i}`, firstSeenAt: 1000 + i }) as TrainerLocation));
  const anchors: TrainerLocation[] = []; const expected: Record<string, number> = {};
  for (const point of [...points].sort((a, b) => a.firstSeenAt - b.firstSeenAt || a.id.localeCompare(b.id))) {
    if (anchors.some((anchor) => nearbyReviewPoint(anchor, point))) continue;
    anchors.push(point); expected[point.countryCode] = (expected[point.countryCode] || 0) + 1;
  }
  assert.deepEqual(coveragePlaceCounts(points.reverse()), expected);
});
