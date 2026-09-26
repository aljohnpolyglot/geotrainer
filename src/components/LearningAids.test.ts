import assert from 'node:assert/strict';
import test from 'node:test';
import type { ClueRecord } from '../types';
import { cluesForPanorama } from './LearningAids';

const clue = (id: string, panoId: string, lat: number, countryCode = 'DE') => ({ id, panoId, lat, lng: 13.4, countryCode, createdAt: 1 } as ClueRecord);

test('panorama clues exclude unrelated locations while retaining the 50-metre identity', () => {
  const current = { panoId: 'current', lat: 52.5, lng: 13.4, countryCode: 'DE' };
  const result = cluesForPanorama([clue('exact', 'current', 0), clue('near', 'near', 52.5002), clue('far', 'far', 52.51), clue('border', 'border', 52.5002, 'PL')], new Set(['current']), current);
  assert.deepEqual(result.map(({ id }) => id), ['exact', 'near']);
});
