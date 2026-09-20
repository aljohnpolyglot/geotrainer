import assert from 'node:assert/strict';
import test from 'node:test';
import { getFlagCdnUrl, normalizeReverseGeocodeCountry } from './geocoding';

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
