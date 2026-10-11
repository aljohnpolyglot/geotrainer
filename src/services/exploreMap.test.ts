import assert from 'node:assert/strict';
import test from 'node:test';

test('Explore Map combines imagery and indoor filters', async () => {
  (globalThis as any).google = { maps: { StreetViewSource: { DEFAULT: 'default', GOOGLE: 'google', OUTDOOR: 'outdoor' } } };
  const { exploreStreetViewSources } = await import('./exploreMap');
  assert.deepEqual(exploreStreetViewSources({ panoramaSource: 'official', allowInteriors: false }), ['google', 'outdoor']);
  assert.deepEqual(exploreStreetViewSources({ panoramaSource: 'mixed', allowInteriors: true }), ['default']);
});

test('Explore Map opens a pasted Google Maps panorama at its saved heading', async () => {
  const { findExplorePanoramaFromLink, googleStreetViewLink } = await import('./exploreMap');
  const link = googleStreetViewLink('https://www.google.com/maps/@39.2926546,21.8887699,154a,75y,161.55h,90t/data=!3m7!1e1!3m5!1syC-mcdjDoG-MrOmu7cGnBw!2e0');
  assert.deepEqual(link, { pano: 'yC-mcdjDoG-MrOmu7cGnBw', lat: 39.2926546, lng: 21.8887699, heading: 161.55 });
  assert.equal(googleStreetViewLink('https://example.com/maps/@39.2926546,21.8887699/data=!1syC-mcdjDoG-MrOmu7cGnBw'), null);
  assert.equal(googleStreetViewLink('https://www.google.com/maps/@99,21/data=!1spano'), null);
  const calls: unknown[] = [];
  const data = { copyright: '© Google', location: { pano: link!.pano, latLng: { lat: () => link!.lat, lng: () => link!.lng } } };
  (globalThis as any).google = { maps: { StreetViewSource: { DEFAULT: 'default', GOOGLE: 'google', OUTDOOR: 'outdoor' }, StreetViewService: class { getPanorama(request: unknown) { calls.push(request); return Promise.resolve({ data }); } } } };
  assert.deepEqual(await findExplorePanoramaFromLink(link!, { panoramaSource: 'official', allowInteriors: false }), { panoId: link!.pano, lat: link!.lat, lng: link!.lng, heading: 161.55 });
  assert.deepEqual(calls[0], { pano: link!.pano });
  assert.deepEqual(calls[1], { location: data.location.latLng, radius: 2, sources: ['google', 'outdoor'] });
  await assert.rejects(findExplorePanoramaFromLink(link!, { panoramaSource: 'contributor', allowInteriors: true }));
  await assert.rejects(findExplorePanoramaFromLink({ ...link!, lat: 0 }, { panoramaSource: 'mixed', allowInteriors: true }));
});
