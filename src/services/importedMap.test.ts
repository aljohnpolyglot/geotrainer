import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import { moveImportedHistory, parseImportedMap, remainingImportedPoints, varyImportedPoint } from './importedMap';
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

test('bundled official-only NBA fixture is ready for headless uploaded-map checks', () => {
  const file = path.resolve(process.cwd(), 'test-maps/nba-teams-city-vicinity-OFFICIAL-GOOGLE.json');
  const map = parseImportedMap(fs.readFileSync(file, 'utf8'), path.basename(file));
  assert.equal(map.points.length, 29);
  assert.ok(map.points.every((point) => point.panoId));
});

test('uploaded Learn visits move backward and forward before drawing a new location', () => {
  const first = { lat: 1, lng: 2, panoId: 'first', countryCode: 'SG' };
  const second = { lat: 3, lng: 4, panoId: 'second', countryCode: 'SG' };
  const start = moveImportedHistory({ locations: [], index: -1 }, 'next', first);
  assert.strictEqual(moveImportedHistory(start, 'previous'), start);
  const pair = moveImportedHistory(start, 'next', second);
  const back = moveImportedHistory(pair, 'previous');
  assert.equal(back.locations[back.index].panoId, 'first');
  assert.deepEqual(moveImportedHistory(back, 'next').locations, pair.locations);
  assert.equal(moveImportedHistory(back, 'next').index, 1);
});

test('uploaded variation keeps zero exact and bounds nearby positions', () => {
  const point = { lat: 42.615, lng: 1.538, panoId: 'exact-pano', heading: 123 };
  assert.strictEqual(varyImportedPoint(point, 0), point);
  const varied = varyImportedPoint(point, 100, () => 1);
  assert.equal(varied.panoId, undefined);
  assert.equal(varied.heading, 123);
  assert.ok(Math.abs(varied.lat - point.lat) < .01);
  assert.ok(Math.abs(varied.lng - point.lng) < .02);
  assert.deepEqual(varyImportedPoint(point, -5), point);
  assert.strictEqual(varyImportedPoint(point, Number.NaN), point);
});

test('completed uploaded source entries cannot be selected again', () => {
  const points = [{ lat: 1, lng: 1 }, { lat: 2, lng: 2 }, { lat: 3, lng: 3 }];
  assert.deepEqual(remainingImportedPoints(points, new Set([0, 2])), [{ point: points[1], index: 1 }]);
});
