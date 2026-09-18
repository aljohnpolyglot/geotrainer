import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import type { CityPoolRegion, LocationPoolTarget } from '../types';
import { locationTargetKey, pickLocationTargetCity } from './cityPools';

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
