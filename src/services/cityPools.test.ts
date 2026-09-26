import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { CityPoolRegion, LocationPoolTarget } from '../types';
import { localizedPoolName, locationPoolChoices, locationTargetKey, pickLocationPoolFocus, pickLocationTargetCity, selectPoolCity, selectPoolRegion } from './cityPools';

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

test('pool names and alphabetical sorting follow the interface language with canonical fallback', () => {
  const cities = [
    { name: 'Aachen', names: { sv: 'Örebro' }, lat: 1, lng: 1, population: 1, class: 'local' as const, urbanRadiusKm: 8 },
    { name: 'Zurich', names: { sv: 'Alingsås' }, lat: 2, lng: 2, population: 1, class: 'local' as const, urbanRadiusKm: 8 },
  ];
  const pools = { DE: [{ id: 'DE.1', name: 'Alpha', names: { sv: 'Östra' }, cities }, { id: 'DE.2', name: 'Zulu', names: { sv: 'Västra' }, cities: [] }] };
  const choices = locationPoolChoices(['DE'], pools, [], 'alphabetical', 'sv');
  assert.deepEqual(choices[0].regions.map((region) => localizedPoolName(region, 'sv')), ['Västra', 'Östra']);
  assert.deepEqual(choices[0].regions[1].targets.filter((target) => target.kind === 'city').map((target) => localizedPoolName(target.city, 'sv')), ['Alingsås', 'Örebro']);
  assert.equal(localizedPoolName(cities[0], 'fr'), 'Aachen');
});

test('countries without selected regions remain country-wide in a mixed location pool', () => {
  const target: LocationPoolTarget = { kind: 'region', countryCode: 'IT', regionId: 'IT.01', regionName: 'Abruzzo' };
  const resolved = [{ target, cities: [{ name: 'Pescara', lat: 1, lng: 1, population: 1, class: 'local' as const, urbanRadiusKm: 8 }] }];
  assert.equal(pickLocationPoolFocus(resolved, ['IT', 'AL', 'MK'], () => .99)?.countryCode, 'MK');
  const focused = pickLocationPoolFocus(resolved, ['IT', 'AL', 'MK'], () => 0);
  assert.equal(focused?.kind === 'target' ? focused.target.regionId : undefined, 'IT.01');
});
