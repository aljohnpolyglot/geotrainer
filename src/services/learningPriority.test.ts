import assert from 'node:assert/strict';
import test from 'node:test';
import type { TrainerLocation } from '../types';
import { COUNTRIES } from '../data/countries';
import { learningPriorityTarget } from './learningPriority';

const location = (countryCode: string, lat: number, lng: number, encounterCount = 1): TrainerLocation => ({ id: `${countryCode}-${lat}-${lng}`, panoId: `${countryCode}-${lat}-${lng}`, countryCode, lat, lng, encounterCount, firstSeenAt: 1, lastSeenAt: 1 });

test('learning priorities reuse familiar areas and send least exposure toward geographic gaps', () => {
  const known = [location('SE', 55.4, 13), location('SE', 69, 20), location('NO', 60, 10, 4)];
  const familiar = learningPriorityTarget('familiar', ['SE', 'NO'], known, () => 0);
  assert.equal(familiar.preferredCandidate?.lat, 55.4);
  assert.equal(familiar.preferredCandidate?.minRadiusKm, 1);
  const weakCountry = learningPriorityTarget('least-exposure', ['SE', 'NO'], known, () => 0);
  assert.deepEqual(weakCountry.countryCodes, ['SE']);
  assert.notEqual(weakCountry.preferredCandidate?.lat, known[0].lat);
  const unseen = learningPriorityTarget('least-exposure', ['SE', 'FI'], known, () => 0);
  assert.deepEqual(unseen.countryCodes, ['FI']);
});

test('least exposure keeps the same rule for one country, mixed pools, continents, and world', () => {
  const known = [location('SE', 56, 13, 2), location('NO', 60, 10, 4), location('JP', 35, 139, 1)];
  assert.deepEqual(learningPriorityTarget('least-exposure', ['SE'], known, () => 0).countryCodes, ['SE']);
  assert.deepEqual(learningPriorityTarget('least-exposure', ['SE', 'NO'], known, () => 0).countryCodes, ['SE']);
  assert.deepEqual(learningPriorityTarget('least-exposure', ['SE', 'NO', 'FI'], known, () => 0).countryCodes, ['FI']);
  assert.deepEqual(learningPriorityTarget('least-exposure', ['SE', 'NO', 'JP', 'BR'], known, () => 0).countryCodes, ['BR']);
});

test('equal country exposure is resolved by the larger normalized geographic blind spot', () => {
  const denseSweden = [location('SE', 55.5, 13), location('SE', 59.3, 18), location('SE', 63.8, 20), location('SE', 67.8, 21)];
  const sparseNorway = [location('NO', 60, 10, 4)];
  assert.deepEqual(learningPriorityTarget('least-exposure', ['SE', 'NO'], [...denseSweden, ...sparseNorway], () => 0).countryCodes, ['NO']);
});

test('least exposure targets verified in-country seeds instead of bounding-box ocean points', () => {
  const target = learningPriorityTarget('least-exposure', ['AU'], [location('AU', -33.87, 151.21)], () => 0).preferredCandidate;
  assert.ok(target);
  assert.ok(COUNTRIES.AU.samplePoints.some((point) => point.lat === target.lat && point.lng === target.lng));
});

test('least exposure keeps a valid country when no geographic seed is available', () => {
  const original = COUNTRIES.DE.samplePoints;
  COUNTRIES.DE.samplePoints = [];
  try { assert.deepEqual(learningPriorityTarget('least-exposure', ['DE'], [location('DE', 52.52, 13.405)], () => 0), { countryCodes: ['DE'] }); }
  finally { COUNTRIES.DE.samplePoints = original; }
});

test('least exposure fills grey regional coverage before revisiting a represented region', () => {
  const regions = [
    { id: 'SE.1', name: 'South', cities: [{ name: 'South', lat: 55.6, lng: 13, population: 1, class: 'local' as const, urbanRadiusKm: 8 }] },
    { id: 'SE.2', name: 'North', cities: [{ name: 'North', lat: 65.6, lng: 22, population: 1, class: 'local' as const, urbanRadiusKm: 8 }] },
  ];
  const known = [{ ...location('SE', 55.6, 13, 8), adminArea: 'South County' }];
  const target = learningPriorityTarget('least-exposure', ['SE'], known, () => 0, regions);
  assert.equal(target.preferredCandidate?.lat, 65.6);
  assert.equal(target.preferredCandidate?.lng, 22);
});
