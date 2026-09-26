import assert from 'node:assert/strict';
import test from 'node:test';
import { placeNameMatches } from './poolSuggestion';

test('AI pool place names resolve across supported languages and accents', () => {
  const sicily = { name: 'Sicily', names: { es: 'Sicilia', de: 'Sizilien', it: 'Sicilia', ru: 'Сицилия', sv: 'Sicilien' } };
  assert.equal(placeNameMatches(sicily, 'Sizilien'), true);
  assert.equal(placeNameMatches(sicily, 'Сицилия'), true);
  assert.equal(placeNameMatches({ name: 'Córdoba' }, 'Cordoba'), true);
  assert.equal(placeNameMatches(sicily, 'Sardegna'), false);
});
