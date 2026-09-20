import assert from 'node:assert/strict';
import test from 'node:test';
import type { TrainerLocation } from '../types';
import { COUNTRIES } from '../data/countries';
import { learningPriorityTarget, leastExposureCountryOrder } from './learningPriority';

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
  assert.deepEqual(leastExposureCountryOrder(['SE', 'NO', 'JP', 'BR'], known, 'BR'), ['BR', 'JP', 'SE', 'NO']);
});

test('real learner pools keep least-exposure fallback order', () => {
  const histories = [
    { name: 'confusion pair', codes: ['NL', 'BE'], known: [location('NL', 52.1, 5.3, 2), location('BE', 50.8, 4.4, 7)], first: 'NL', expected: ['NL', 'BE'] },
    { name: 'continental study', codes: ['FR', 'DE', 'ES', 'IT'], known: [location('FR', 48.8, 2.3, 8), location('DE', 52.5, 13.4, 4), location('IT', 41.9, 12.5, 2)], first: 'ES', expected: ['ES', 'IT', 'DE', 'FR'] },
    { name: 'world study', codes: ['US', 'BR', 'JP', 'ZA'], known: [location('US', 40.7, -74, 12), location('BR', -23.5, -46.6, 3), location('JP', 35.7, 139.7, 6)], first: 'ZA', expected: ['ZA', 'BR', 'JP', 'US'] },
  ];
  histories.forEach(({ name, codes, known, first, expected }) => assert.deepEqual(leastExposureCountryOrder(codes, known, first), expected, name));
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

test('a large-country study targets its grey region before revisiting the encountered side', () => {
  const regions = [
    { id: 'AU.NSW', name: 'New South Wales', cities: [{ name: 'Sydney', lat: -33.87, lng: 151.21, population: 1, class: 'major' as const, urbanRadiusKm: 16 }] },
    { id: 'AU.WA', name: 'Western Australia', cities: [{ name: 'Perth', lat: -31.95, lng: 115.86, population: 1, class: 'major' as const, urbanRadiusKm: 16 }] },
  ];
  const target = learningPriorityTarget('least-exposure', ['AU'], [{ ...location('AU', -33.87, 151.21, 12), adminArea: 'New South Wales' }], () => 0, regions);
  assert.equal(target.preferredCandidate?.lat, -31.95);
  assert.equal(target.preferredCandidate?.lng, 115.86);
});
