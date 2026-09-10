import assert from 'node:assert/strict';
import test from 'node:test';
import cities from './cities.json';
import catalog from './countryCatalog.json';
import { sampleEnvironmentCandidate } from '../services/locationGenerator';
import { calculateDistanceKm } from '../services/gameLogic';

const cityData = cities as Record<string, Array<{ name: string; lat: number; lng: number; class: 'major' | 'regional' | 'local'; urbanRadiusKm: number }>>;
const random = (seed = 7) => () => ((seed = seed * 16807 % 2147483647) - 1) / 2147483646;

test('country and city catalogs provide broad, structured coverage', () => {
  assert.equal(Object.keys(catalog).length, 244);
  for (const code of Object.keys(catalog)) assert.ok(cityData[code]?.length, `${code} needs a city seed`);
  assert.ok(cityData.JP.some((city) => city.class === 'regional'));
  assert.ok(cityData.FR.some((city) => city.class === 'local'));
});

test('30 urban and 30 rural samples follow their city-distance strategy', () => {
  const urbanRandom = random(11);
  const ruralRandom = random(19);
  const urban = Array.from({ length: 30 }, () => sampleEnvironmentCandidate('JP', { environment: 'urban', urbanLevel: 3 }, urbanRandom));
  const rural = Array.from({ length: 30 }, () => sampleEnvironmentCandidate('FR', { environment: 'rural', urbanLevel: 3 }, ruralRandom));
  assert.ok(new Set(urban.map((point) => 'city' in point ? point.city.name : '')).size >= 10, 'urban sampling should not collapse to capitals');
  assert.ok(urban.every((point) => 'city' in point && calculateDistanceKm(point.lat, point.lng, point.city.lat, point.city.lng) <= point.city.urbanRadiusKm * .7 + .01));
  assert.ok(rural.every((point) => cityData.FR.every((city) => calculateDistanceKm(point.lat, point.lng, city.lat, city.lng) > Math.max(10, city.urbanRadiusKm * 1.25))));
});
