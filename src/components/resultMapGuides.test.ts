import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ResultMap } from './ResultMap';

test('revealed and selectable result maps show guide buttons', () => {
  const props = { actual: { lat: 0, lng: 0 }, guess: null };
  const revealed = renderToStaticMarkup(createElement(ResultMap, props));
  assert.match(revealed, /class="result-map-guides"/);
  assert.match(revealed, /aria-label="Show Street View coverage"/);
  assert.match(revealed, /aria-label="Show road names"/);
  assert.match(revealed, /aria-label="Zoom to answer"/);
  assert.match(revealed, /aria-label="Zoom to country"/);
  const selectable = renderToStaticMarkup(createElement(ResultMap, { ...props, onSelect: () => {} }));
  assert.match(selectable, /result-map-guides/);
  assert.match(selectable, /aria-label="Hide Street View coverage"/);
  assert.match(selectable, /aria-label="Show road names"/);
});
