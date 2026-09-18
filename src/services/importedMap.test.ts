import assert from 'node:assert/strict';
import { test } from 'node:test';
import { parseImportedMap } from './importedMap';
import { withoutImportedMaps } from './cloudSync';

test('Map Maker exports retain valid exact locations without adding the map to cloud backup', () => {
  const map = parseImportedMap(JSON.stringify({ customCoordinates: [
    { lat: 42.615, lng: 1.538, panoId: 'exact-pano', heading: 123, pitch: -2 },
    { lat: 999, lng: 1 },
    { lat: 40, lng: -3 },
  ] }), 'training.json');
  assert.equal(map.name, 'training');
  assert.deepEqual(map.points, [{ lat: 42.615, lng: 1.538, panoId: 'exact-pano', heading: 123 }, { lat: 40, lng: -3 }]);
  assert.deepEqual(withoutImportedMaps([{ key: `local.importedMap:${map.id}` }, { key: 'local.currentMapId' }, { key: 'gamePreferences' }]), [{ key: 'gamePreferences' }]);
  assert.throws(() => parseImportedMap('{"customCoordinates":[{"lat":91,"lng":0}]}', 'bad.json'), /no valid/i);
});
