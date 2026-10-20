import assert from 'node:assert/strict';
import test from 'node:test';
import { reverseGeocodeLocation, creditedGuessCountry, getFlagCdnUrl, nearbyIslandGuess, normalizeReverseGeocodeCountry } from './geocoding';

test('flag URLs use the resolved ISO country code', () => {
  assert.equal(getFlagCdnUrl('AL', 40), 'https://flagcdn.com/w40/al.png');
  assert.equal(getFlagCdnUrl('MA', 80), 'https://flagcdn.com/w80/ma.png');
  assert.equal(getFlagCdnUrl('AX', 40), 'https://flagcdn.com/w40/ax.png');
});

test('Kosovo coordinates recover XK only when Google omits a country code', () => {
  assert.equal(normalizeReverseGeocodeCountry(undefined, 42.9075, 20.84028), 'XK');
  assert.equal(normalizeReverseGeocodeCountry('RS', 42.9075, 20.84028), 'RS');
  assert.equal(normalizeReverseGeocodeCountry(undefined, 48.8566, 2.3522), undefined);
});

test('nearby water misses credit isolated islands without changing distance or land guesses', () => {
  assert.equal(creditedGuessCountry('GU', undefined, 12), 'GU');
  assert.equal(creditedGuessCountry('MP', 'GU', 12), 'MP');
  assert.equal(creditedGuessCountry('CX', 'ID', 20), 'CX');
  assert.equal(creditedGuessCountry('FR', 'DE', 5), 'DE');
  assert.equal(creditedGuessCountry('GU', 'JP', 26), 'JP');
  assert.equal(creditedGuessCountry('GU', undefined, null), undefined);
});

test('nearby isolated-island Review guesses can advance without a perfect pin', () => {
  assert.equal(nearbyIslandGuess('CX', 'CX', 23), true);
  assert.equal(nearbyIslandGuess('GU', 'GU', 25), true);
  assert.equal(nearbyIslandGuess('MP', 'GU', 10), false);
  assert.equal(nearbyIslandGuess('FR', 'FR', 10), false);
  assert.equal(nearbyIslandGuess('CX', 'CX', 25.01), false);
  assert.equal(nearbyIslandGuess('CX', undefined, null), false);
});


test('pin preparation and submission share a lookup, with bounded caching and retryable empty results', async () => {
  let calls = 0;
  let empty = false;
  Object.assign(globalThis, { google: { maps: { Geocoder: class {
    async geocode() {
      calls++;
      await Promise.resolve();
      return { results: empty ? [] : [{ formatted_address: 'test', address_components: [{ types: ['country'], long_name: 'France', short_name: 'FR' }] }] };
    }
  } } } });
  const [first, second] = await Promise.all([reverseGeocodeLocation(1, 1), reverseGeocodeLocation(1, 1)]);
  assert.deepEqual(first, second);
  assert.equal(calls, 1);
  await reverseGeocodeLocation(1, 1);
  assert.equal(calls, 1);
  empty = true;
  assert.equal(await reverseGeocodeLocation(2, 2), null);
  empty = false;
  assert.equal((await reverseGeocodeLocation(2, 2))?.countryCode, 'FR');
  assert.equal(calls, 3);
  for (let i = 0; i < 256; i++) await reverseGeocodeLocation(10 + i / 1000, 3);
  const before = calls;
  await reverseGeocodeLocation(1, 1);
  assert.equal(calls, before + 1);
});
