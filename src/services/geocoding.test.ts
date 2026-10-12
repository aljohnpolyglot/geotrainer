import assert from 'node:assert/strict';
import test from 'node:test';
import { creditedGuessCountry, getFlagCdnUrl, nearbyIslandGuess, normalizeReverseGeocodeCountry } from './geocoding';

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
