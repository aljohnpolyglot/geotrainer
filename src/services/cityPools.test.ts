import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { CityPoolRegion, LocationPoolTarget } from '../types';
import { locationPoolChoices, locationTargetKey, pickLocationTargetCity, selectPoolCity, selectPoolRegion } from './cityPools';

test('regional pools include Philippine regions and choose cities deterministically', () => {
  const regions = JSON.parse(readFileSync(new URL('../../public/city-pools/ph.json', import.meta.url), 'utf8')) as CityPoolRegion[];
  const easternVisayas = regions.find((region) => region.name === 'Eastern Visayas');
  const metroManila = regions.find((region) => region.id === 'PH.NCR');
  assert.ok(easternVisayas?.cities.some((city) => city.name === 'Tacloban'));
  assert.ok(metroManila?.cities.some((city) => city.name === 'Quezon City'));
  const target: LocationPoolTarget = { kind: 'region', countryCode: 'PH', regionId: easternVisayas!.id, regionName: easternVisayas!.name };
  assert.equal(pickLocationTargetCity([{ target, cities: easternVisayas!.cities }], () => 0)?.city.name, 'Tacloban');
  assert.equal(locationTargetKey(target), 'PH:PH.08:all');
});

test('separate region and city picks narrow a region and clearing cities restores its default', () => {
  const region: LocationPoolTarget = { kind: 'region', countryCode: 'FR', regionId: 'FR.1', regionName: 'Auvergne-Rhône-Alpes' };
  const other: LocationPoolTarget = { kind: 'region', countryCode: 'FR', regionId: 'FR.2', regionName: 'Île-de-France' };
  const lyon: LocationPoolTarget = { ...region, kind: 'city', city: { name: 'Lyon', lat: 45.76, lng: 4.84, population: 500000, urbanRadiusKm: 5, class: 'major' } };
  const annecy: LocationPoolTarget = { ...lyon, city: { ...lyon.city, name: 'Annecy', lat: 45.9, population: 130000 } };
  const first = selectPoolCity([region, other], lyon);
  assert.deepEqual(first, [other, lyon]);
  const second = selectPoolCity(first, annecy);
  assert.deepEqual(selectPoolRegion(second, region), [other, region]);
  assert.deepEqual(selectPoolCity(selectPoolCity(second, lyon, true), annecy, true), [other, region]);
  const pools = { FR: [{ id: region.regionId, name: region.regionName, cities: [annecy.city, lyon.city] }] };
  assert.deepEqual(locationPoolChoices(['FR'], pools, [], 'importance')[0].regions[0].targets.map((item) => item.kind === 'city' ? item.city.name : 'all'), ['all', 'Lyon', 'Annecy']);
  assert.deepEqual(locationPoolChoices(['FR'], pools, [region], 'alphabetical')[0].regions[0].targets.map((item) => item.kind === 'city' && item.city.name), ['Annecy', 'Lyon']);
  assert.deepEqual(locationPoolChoices(['DE'], pools, [], 'importance'), []);
});
