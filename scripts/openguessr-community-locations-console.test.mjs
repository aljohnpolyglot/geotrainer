import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('./openguessr-community-locations-console.js', import.meta.url), 'utf8');

test('collects unique location tuples across games and downloads GeoTrainer JSON on request', async () => {
  let blob;
  const link = { click() {}, remove() {} };
  let batch = 0;
  const responses = [
    [[53.9, -122.8, { heading: 90, panoramaId: 'abc' }], [-41.3, 146.4], [99, 0]],
    [[-41.3, 146.4], [-40.3, -72.7]],
  ];
  const originalFetch = async () => ({ ok: true, clone: () => ({ json: async () => ({ locations: responses[batch++] }) }) });
  const context = {
    location: { hostname: 'openguessr.com', pathname: '/maps/community/equalized_world', href: 'https://openguessr.com/maps/community/equalized_world' },
    window: { fetch: originalFetch },
    document: { querySelector: selector => ({ textContent: selector === '.map-title' ? 'Equalized World' : '1,800 Locations' }), createElement: () => link, body: { append() {} } },
    URL: Object.assign(URL, { createObjectURL: value => { blob = value; return 'blob:test'; }, revokeObjectURL() {} }),
    Blob, setTimeout(callback) { queueMicrotask(callback); },
    console: { log() {}, warn() {} },
  };
  runInNewContext(source, context);
  assert.notEqual(context.window.fetch, originalFetch);
  await context.window.fetch('https://maps.googleapis.com/$rpc/google.internal.maps.mapsjs.v1.MapsJsInternalService/GetMetadata');
  assert.equal(blob, undefined);
  assert.notEqual(context.window.fetch, originalFetch);
  await context.window.fetch('https://accounts.openguessr.com/locations', { method: 'PUT' });
  await context.window.fetch('https://accounts.openguessr.com/locations', { method: 'PUT' });
  assert.equal(blob, undefined);
  context.window.downloadOpenGuessrLocations();
  assert.notEqual(context.window.fetch, originalFetch);
  context.window.stopOpenGuessrLocationCapture();
  assert.equal(context.window.fetch, originalFetch);
  assert.equal(link.download, 'geotrainer-equalized_world.json');
  const result = JSON.parse(await blob.text());
  assert.equal(result.name, 'Equalized World');
  assert.equal(result.source, context.location.href);
  assert.deepEqual(result.locations, [
    { lat: 53.9, lng: -122.8, heading: 90, panoId: 'abc' },
    { lat: -41.3, lng: 146.4 },
    { lat: -40.3, lng: -72.7 },
  ]);
});
