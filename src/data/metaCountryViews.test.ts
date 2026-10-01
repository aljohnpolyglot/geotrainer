import assert from 'node:assert/strict';
import test from 'node:test';
import { loadMetaCountryViews, viewFromGoogleMapsUrl } from './metaCountryViews';

test('parses exact Google Maps panorama and camera metadata', () => {
  assert.deepEqual(viewFromGoogleMapsUrl('https://www.google.com/maps/@-23.6472253,24.7278454,3a,89.7y,193.88h,77.11t/data=!3m6!1e1!3m4!1sWiSQDwoE9rS_VG_mIQKFfw!2e0'), {
    panoId: 'WiSQDwoE9rS_VG_mIQKFfw', lat: -23.6472253, lng: 24.7278454, heading: 193.88, pitch: 12.89,
  });
  assert.deepEqual(viewFromGoogleMapsUrl('https://www.google.com/maps/@?api=1&map_action=pano&pano=pano-1&viewpoint=34.646087,-118.059372&heading=361&pitch=-7'), {
    panoId: 'pano-1', lat: 34.646087, lng: -118.059372, heading: 1, pitch: -7,
  });
  assert.equal(viewFromGoogleMapsUrl('https://google.example/maps/@0,0,3a/data=!1sno'), null);
  assert.equal(viewFromGoogleMapsUrl('https://maps.google.com/maps/@91,0,3a/data=!1sno'), null);
});

test('loads listed sidecars and tolerates missing or unlisted optional views', async () => {
  const originalFetch = globalThis.fetch;
  const calls: string[] = [];
  let manifestRequests = 0;
  globalThis.fetch = async (input) => {
    const url = String(input);
    calls.push(url);
    if (url.endsWith('manifest.json')) {
      if (++manifestRequests === 4) return new Response('', { status: 404 });
      return new Response(JSON.stringify({ countries: [
        { code: 'ZZ', file: 'ZZ.json' }, { code: 'AB', file: 'AB.json' },
      ] }));
    }
    if (url.endsWith('/ZZ.json')) return new Response(JSON.stringify({ code: 'ZZ', views: [
      { id: 'ZZ-a', panoId: 'pano-a', lat: 1, lng: 2, heading: 359, pitch: 100 },
      { id: 'ZZ-bad', panoId: '', lat: 0, lng: 0, heading: 0, pitch: 0 },
      { id: 'US-other', panoId: 'wrong-country', lat: 0, lng: 0, heading: 0, pitch: 0 },
    ] }));
    return new Response('', { status: 404 });
  };
  try {
    const views = await loadMetaCountryViews('ZZ');
    assert.deepEqual(views.get('ZZ-a'), { panoId: 'pano-a', lat: 1, lng: 2, heading: 359, pitch: 90 });
    assert.equal(views.size, 1);
    assert.deepEqual(await loadMetaCountryViews('AB'), new Map());
    assert.deepEqual(await loadMetaCountryViews('XY'), new Map());
    assert.deepEqual(await loadMetaCountryViews('MN'), new Map());
    assert.equal(calls.filter((url) => url.endsWith('manifest.json')).length, 4);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
