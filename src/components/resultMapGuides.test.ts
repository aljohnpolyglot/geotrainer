import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ResultMap } from './ResultMap';

test('revealed result maps show subtle guide buttons while selectable maps keep their coverage-only interaction', () => {
  const props = { actual: { lat: 0, lng: 0 }, guess: null };
  const revealed = renderToStaticMarkup(createElement(ResultMap, props));
  assert.match(revealed, /class="result-map-guides"/);
  assert.match(revealed, /aria-label="Show Street View coverage"/);
  assert.match(revealed, /aria-label="Show road names"/);
  const selectable = renderToStaticMarkup(createElement(ResultMap, { ...props, onSelect: () => {} }));
  assert.doesNotMatch(selectable, /result-map-guides/);
});
