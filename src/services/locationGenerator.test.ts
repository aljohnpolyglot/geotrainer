import assert from 'node:assert/strict';
import test from 'node:test';

type Result = { lat: number; lng: number; pano: string; countryCode: string; delay?: number; status?: string; links?: unknown[]; copyright?: string };
let results: Result[] = [];
let panoramaCalls = 0;
let panoramaRequests: Array<{ source?: string; location?: LatLng; radius?: number }> = [];
const rural = { environment: 'rural', urbanLevel: 3 } as const;

class LatLng {
  constructor(private latitude: number, private longitude: number) {}
  lat() { return this.latitude; }
  lng() { return this.longitude; }
}

class StreetViewService {
  getPanorama(request: unknown, callback: (data: unknown, status: string) => void) {
    panoramaCalls++;
    panoramaRequests.push(request as { source?: string; location?: LatLng; radius?: number });
    const result = results.shift()!;
    setTimeout(() => callback(result.status ? null : { location: { pano: result.pano, latLng: new LatLng(result.lat, result.lng) }, links: result.links, copyright: result.copyright ?? '© Google' }, result.status || 'OK'), result.delay || 0);
  }
}

class Geocoder {
  async geocode({ location }: { location: { lat: number } }) {
    const result = currentResults.find((item) => item.lat === location.lat)!;
    return { results: [{ formatted_address: 'Test', address_components: [{ long_name: result.countryCode, short_name: result.countryCode, types: ['country'] }] }] };
  }
}

let currentResults: Result[] = [];
Object.assign(globalThis, {
  google: { maps: {
    StreetViewService, Geocoder, LatLng,
    StreetViewStatus: { OK: 'OK' },
    StreetViewPreference: { NEAREST: 'NEAREST' },
    StreetViewSource: { OUTDOOR: 'OUTDOOR' },
  } },
});

test('randomizer rejects a panorama outside the selected country', async () => {
  currentResults = [
    { lat: 1.11, lng: 1, pano: 'wrong-country', countryCode: 'UA' },
    { lat: 2.22, lng: 2, pano: 'right-country', countryCode: 'IT' },
  ];
  results = [...currentResults];
  panoramaCalls = 0;
  const { StreetViewLocationGenerator } = await import('./locationGenerator');
  const found = await new StreetViewLocationGenerator().findRandomLocation(['IT'], undefined, undefined, rural);
  assert.equal(found.panoId, 'right-country');
  assert.equal(found.countryCode, 'IT');
  assert.equal(panoramaCalls, 2);
});

test('randomizer rejects a different country even when it belongs to the same collection', async () => {
  currentResults = [
    { lat: 4.44, lng: 4, pano: 'inside-collection-wrong-country', countryCode: 'UA' },
    { lat: 5.55, lng: 5, pano: 'requested-country', countryCode: 'IT' },
  ];
  results = [...currentResults];
  panoramaCalls = 0;
  const originalRandom = Math.random;
  Math.random = () => 0;
  try {
    const { StreetViewLocationGenerator } = await import('./locationGenerator');
    const found = await new StreetViewLocationGenerator().findRandomLocation(['IT', 'UA'], undefined, undefined, rural);
    assert.equal(found.panoId, 'requested-country');
    assert.equal(found.countryCode, 'IT');
    assert.equal(panoramaCalls, 2);
  } finally {
    Math.random = originalRandom;
  }
});

test('recent panorama exclusion turns A, A, B into visible A, B', async () => {
  currentResults = [
    { lat: 6.66, lng: 6, pano: 'pano-a', countryCode: 'IT' },
    { lat: 6.67, lng: 6, pano: 'pano-a', countryCode: 'IT' },
    { lat: 6.68, lng: 6, pano: 'pano-b', countryCode: 'IT' },
  ];
  results = [...currentResults];
  const { StreetViewLocationGenerator } = await import('./locationGenerator');
  const generator = new StreetViewLocationGenerator();
  const first = await generator.findRandomLocation(['IT'], undefined, undefined, rural);
  const second = await generator.findRandomLocation(['IT'], undefined, undefined, rural, { excludedPanoIds: new Set([first.panoId]) });
  assert.deepEqual([first.panoId, second.panoId], ['pano-a', 'pano-b']);
});

test('movable games reject isolated panoramas', async () => {
  currentResults = [
    { lat: 7.1, lng: 7, pano: 'isolated', countryCode: 'IT', links: [] },
    { lat: 7.2, lng: 7, pano: 'connected', countryCode: 'IT', links: [{}] },
  ];
  results = [...currentResults];
  const { StreetViewLocationGenerator } = await import('./locationGenerator');
  const found = await new StreetViewLocationGenerator().findRandomLocation(['IT'], undefined, undefined, rural, { requireNavigation: true });
  assert.equal(found.panoId, 'connected');
});

test('official-only generation rejects contributor panoramas', async () => {
  currentResults = [
    { lat: 7.3, lng: 7, pano: 'contributor', countryCode: 'IT', copyright: '© Ada Example' },
    { lat: 7.4, lng: 7, pano: 'official', countryCode: 'IT', copyright: '© 2026 Google' },
  ];
  results = [...currentResults];
  const { StreetViewLocationGenerator } = await import('./locationGenerator');
  const found = await new StreetViewLocationGenerator().findRandomLocation(['IT'], undefined, undefined, { ...rural, allowContributors: false });
  assert.equal(found.panoId, 'official');
});

test('contributor-only generation rejects official panoramas', async () => {
  currentResults = [
    { lat: 7.5, lng: 7, pano: 'official', countryCode: 'IT', copyright: '© 2026 Google' },
    { lat: 7.6, lng: 7, pano: 'contributor', countryCode: 'IT', copyright: '© Ada Example' },
  ];
  results = [...currentResults];
  const { StreetViewLocationGenerator } = await import('./locationGenerator');
  const found = await new StreetViewLocationGenerator().findRandomLocation(['IT'], undefined, undefined, { ...rural, panoramaSource: 'contributor' });
  assert.equal(found.panoId, 'contributor');
});

test('interiors are excluded by default and allowed only when enabled', async () => {
  const { StreetViewLocationGenerator } = await import('./locationGenerator');
  const generator = new StreetViewLocationGenerator();
  currentResults = [{ lat: 7.7, lng: 7, pano: 'outdoor', countryCode: 'IT' }]; results = [...currentResults]; panoramaRequests = [];
  await generator.findRandomLocation(['IT'], undefined, undefined, rural);
  assert.equal(panoramaRequests[0].source, 'OUTDOOR');
  currentResults = [{ lat: 7.8, lng: 7, pano: 'indoor-eligible', countryCode: 'IT' }]; results = [...currentResults]; panoramaRequests = [];
  await generator.findRandomLocation(['IT'], undefined, undefined, { ...rural, allowInteriors: true });
  assert.equal('source' in panoramaRequests[0], false);
});

test('least-exposure searches the target before jitter and Mixed retries recover around coverage seeds', async () => {
  const { StreetViewLocationGenerator } = await import('./locationGenerator');
  const { COUNTRIES } = await import('../data/countries');
  const anchor = { countryCode: 'DE', lat: 52.52, lng: 13.405, radiusKm: 40 };
  currentResults = [
    ...Array.from({ length: 10 }, (_, index) => ({ lat: 80 + index, lng: 0, pano: `missing-${index}`, countryCode: 'DE', status: 'ZERO_RESULTS' })),
    { lat: 50.08, lng: 14.43, pano: 'wrong-border', countryCode: 'CZ', links: [{}] },
    { lat: 52.52, lng: 13.405, pano: 'german-coverage', countryCode: 'DE', links: [{}] },
  ];
  results = [...currentResults]; panoramaRequests = [];
  const originalRandom = Math.random; Math.random = () => .5;
  try {
    const found = await new StreetViewLocationGenerator().findRandomLocation(['DE'], undefined, undefined, { environment: 'mixed', urbanLevel: 3 }, { preferredCandidate: anchor, requireNavigation: true });
    assert.equal(panoramaRequests[0].location!.lat(), anchor.lat);
    assert.equal(panoramaRequests[0].location!.lng(), anchor.lng);
    assert.equal(panoramaRequests[0].radius, 12000);
    assert.equal(panoramaRequests[1].radius, 16000);
    assert.equal(panoramaRequests[2].radius, 32000);
    const seed = COUNTRIES.DE.samplePoints[Math.floor(COUNTRIES.DE.samplePoints.length * .5)];
    assert.notEqual(panoramaRequests[10].location!.lat(), seed.lat);
    assert.notEqual(panoramaRequests[10].location!.lng(), seed.lng);
    assert.equal(found.panoId, 'german-coverage');
    assert.equal(found.countryCode, 'DE');
  } finally { Math.random = originalRandom; }
});

test('a prioritized country widens to the selected pool after its search batch', async () => {
  currentResults = [
    ...Array.from({ length: 4 }, (_, index) => ({ lat: 70 + index, lng: 0, pano: '', countryCode: 'DE', status: 'ZERO_RESULTS' })),
    { lat: 41.9, lng: 12.5, pano: 'italian-fallback', countryCode: 'IT', links: [{}] },
  ];
  results = [...currentResults]; panoramaCalls = 0;
  const originalRandom = Math.random; Math.random = () => 0;
  try {
    const { StreetViewLocationGenerator } = await import('./locationGenerator');
    const found = await new StreetViewLocationGenerator().findRandomLocation(['DE', 'IT'], undefined, undefined, { environment: 'mixed', urbanLevel: 3 }, { preferredCountryCodes: ['DE', 'IT'], requireNavigation: true, maxAttempts: 5 });
    assert.equal(found.panoId, 'italian-fallback');
    assert.equal(found.countryCode, 'IT');
    assert.equal(panoramaCalls, 5);
  } finally { Math.random = originalRandom; }
});

test('an aborted lookup cannot return a stale panorama', async () => {
  currentResults = [{ lat: 3.33, lng: 3, pano: 'stale', countryCode: 'IT', delay: 10 }];
  results = [...currentResults];
  const controller = new AbortController();
  const { StreetViewLocationGenerator } = await import('./locationGenerator');
  const lookup = new StreetViewLocationGenerator().findRandomLocation(['IT'], controller.signal);
  controller.abort();
  await assert.rejects(lookup, (error: Error) => error.name === 'AbortError');
});

test('normal generation keeps retrying while diagnostics can set a ceiling', async () => {
  currentResults = [
    { lat: 0, lng: 0, pano: '', countryCode: 'IT', status: 'ZERO_RESULTS' },
    { lat: 0, lng: 0, pano: '', countryCode: 'IT', status: 'ZERO_RESULTS' },
  ];
  results = [...currentResults]; panoramaCalls = 0;
  const { StreetViewLocationGenerator } = await import('./locationGenerator');
  await assert.rejects(new StreetViewLocationGenerator().findRandomLocation(['IT'], undefined, undefined, rural, { maxAttempts: 2 }), /Could not find/);
  assert.equal(panoramaCalls, 2);
});

test('review reopen tries pano id before marking a coordinate fallback', async () => {
  results = [
    { lat: 0, lng: 0, pano: 'missing', countryCode: 'SI', status: 'ZERO_RESULTS' },
    { lat: 46.05, lng: 14.51, pano: 'nearby', countryCode: 'SI' },
  ];
  panoramaCalls = 0;
  const { StreetViewLocationGenerator } = await import('./locationGenerator');
  const found = await new StreetViewLocationGenerator().reopenLocation({ panoId: 'old-pano', lat: 46, lng: 14.5, countryCode: 'SI' });
  assert.equal(panoramaCalls, 2);
  assert.equal(found.originalPanoId, 'old-pano');
  assert.equal(found.isFallbackPanorama, true);
});

test('latest-request and reveal guards reject stale async completions', async () => {
  const { isCurrentPanorama, isLatestRequest } = await import('./requestIntegrity');
  let latest = 0;
  let visible = '';
  const run = async (name: string, delay: number) => {
    const requestId = ++latest;
    await new Promise((resolve) => setTimeout(resolve, delay));
    if (isLatestRequest(requestId, latest)) visible = name;
  };
  await Promise.all([run('A', 10), run('B', 0)]);
  assert.equal(visible, 'B');
  assert.equal(isCurrentPanorama('pano-a', 'pano-b'), false);
});

test('100 accepted Study locations contain no consecutive panorama duplicate', async () => {
  currentResults = [];
  for (let index = 0; index < 100; index++) {
    if (index > 0 && index % 10 === 0) currentResults.push({ lat: 1000 + index - 1, lng: 8, pano: `study-${index - 1}`, countryCode: 'IT' });
    currentResults.push({ lat: 1000 + index, lng: 8, pano: `study-${index}`, countryCode: 'IT' });
  }
  results = [...currentResults];
  const { StreetViewLocationGenerator } = await import('./locationGenerator');
  const generator = new StreetViewLocationGenerator();
  const visible: string[] = [];
  for (let index = 0; index < 100; index++) {
    const location = await generator.findRandomLocation(['IT'], undefined, undefined, rural, { excludedPanoIds: new Set(visible.slice(-15)) });
    visible.push(location.panoId);
  }
  assert.equal(visible.length, 100);
  assert.equal(visible.some((panoId, index) => index > 0 && panoId === visible[index - 1]), false);
});
