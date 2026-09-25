import assert from 'node:assert/strict';
import test from 'node:test';
import { exactMapPlace, searchMapPlaces } from './mapSearch';

test('local map search suggests cities, regions, and countries without accent-sensitive matching', () => {
  assert.equal(searchMapPlaces('sao paulo')[0]?.label, 'São Paulo, Brazil');
  assert.equal(searchMapPlaces('sweden')[0]?.id, 'country:SE');
  assert.equal(searchMapPlaces('andalucia')[0]?.id, 'region:ES:ES.51');
  assert.equal(searchMapPlaces('andalucia')[0]?.kind, 'region');
  assert.equal(searchMapPlaces('paris', 3).length, 3);
  assert.equal(exactMapPlace('Malmö, Sweden')?.lat, 55.60587);
  assert.deepEqual(searchMapPlaces(''), []);
});
