import assert from 'node:assert/strict';
import test, { mock } from 'node:test';
import { indexedDB, IDBKeyRange, IDBObjectStore, IDBIndex } from 'fake-indexeddb';
import { readPanoramaHistory, upgradePanoramaHistoryIndexes } from './panoramaHistory';
import { complete, request } from './trainerDatabase';
import { nearbyReviewPoint } from './reviewIdentity';

Object.assign(globalThis, { IDBKeyRange });

test('upgraded panorama indexes preserve exact and 50-metre history without full-store reads', async () => {
  const opening = indexedDB.open(`panorama-index-${Date.now()}`, 4);
  const names = ['locationMetadata', 'attempts', 'studyVisits', 'clueMetadata'];
  opening.onupgradeneeded = () => names.forEach((name) => opening.result.createObjectStore(name, { keyPath: 'id' }));
  const old = await request(opening);
  const current = { panoId: 'current', lat: 0, lng: 179.9999, countryCode: 'FJ' };
  const points = [
    current,
    { ...current, panoId: 'near', lat: .0002 },
    { ...current, panoId: 'dateline', lng: -179.9999 },
    { ...current, panoId: 'far-longitude', lng: 179 },
    { ...current, panoId: 'border', countryCode: 'TO' },
    { ...current, panoId: 'clue-only', lat: .0001 },
    { ...current, panoId: 'current', lat: 80, countryCode: 'SE' },
    ...Array.from({ length: 500 }, (_, i) => ({ ...current, panoId: `unrelated-${i}`, lat: 10 + i / 100 })),
  ];
  const locations = points.filter((point) => point.panoId !== 'clue-only').map((point, i) => ({ ...point, id: `l-${i}` }));
  const attempts = points.map((point, i) => ({ ...point, id: `a-${i}`, actualLat: point.panoId === 'clue-only' ? 70 : point.lat, actualLng: point.lng }));
  const visits = points.filter((point) => point.panoId !== 'clue-only').map((point, i) => ({ ...point, id: `v-${i}` }));
  const clues = points.map((point, i) => ({ ...point, id: `c-${i}`, imageDataUrl: '' }));
  const tx = old.transaction(names, 'readwrite');
  [locations, attempts, visits, clues].forEach((rows, i) => rows.forEach((row) => tx.objectStore(names[i]).put(row)));
  await complete(tx);
  const dbName = old.name;
  old.close();
  const upgrade = indexedDB.open(dbName, 5);
  upgrade.onupgradeneeded = () => upgradePanoramaHistoryIndexes(upgrade.transaction!);
  const db = await request(upgrade);
  const fullReads = mock.method(IDBObjectStore.prototype, 'getAll');
  const indexedReads = mock.method(IDBIndex.prototype, 'getAll');
  try {
    const result = await readPanoramaHistory(db, current);
    const related = new Set([current.panoId]);
    [...locations, ...visits].forEach((point) => { if (nearbyReviewPoint(current, point)) related.add(point.panoId); });
    attempts.forEach((point) => { if (nearbyReviewPoint(current, { ...point, lat: point.actualLat, lng: point.actualLng })) related.add(point.panoId); });
    const expectedClues = clues.filter((point) => related.has(point.panoId) || nearbyReviewPoint(current, point));
    expectedClues.forEach((point) => related.add(point.panoId));
    const ids = (rows: { id: string }[]) => rows.map((row) => row.id).sort();
    assert.deepEqual(ids(result.clues), ids(expectedClues));
    assert.deepEqual(ids(result.attempts), ids(attempts.filter((row) => related.has(row.panoId))));
    assert.deepEqual(ids(result.visits), ids(visits.filter((row) => related.has(row.panoId))));
    assert.deepEqual(result.relatedPanos, related);
    assert.equal(fullReads.mock.callCount(), 0);
    assert.ok(indexedReads.mock.calls.every((call) => call.arguments[0] !== undefined));
    const exactOnly = await readPanoramaHistory(db, { ...current, lat: NaN });
    assert.ok(exactOnly.attempts.every((row) => row.panoId === current.panoId));
    assert.equal(exactOnly.attempts.length, 2);
  } finally {
    fullReads.mock.restore(); indexedReads.mock.restore();
    db.close(); await request(indexedDB.deleteDatabase(dbName));
  }
});
