import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ResultMap } from './ResultMap';
import { LocationCard } from './LocationCard';

test('revealed and selectable result maps show guide buttons', () => {
  const props = { actual: { lat: 0, lng: 0 }, guess: null };
  const revealed = renderToStaticMarkup(createElement(ResultMap, props));
  assert.match(revealed, /class="result-map-guides"/);
  assert.match(revealed, /aria-label="Show Street View coverage"/);
  assert.match(revealed, /aria-label="Show road names"/);
  assert.match(revealed, /aria-label="Zoom to answer"/);
  assert.match(revealed, /aria-label="Zoom to city scale"/);
  assert.match(revealed, /aria-label="Zoom to country"/);
  const selectable = renderToStaticMarkup(createElement(ResultMap, { ...props, onSelect: () => {} }));
  assert.match(selectable, /result-map-guides/);
  assert.match(selectable, /aria-label="Hide Street View coverage"/);
  assert.match(selectable, /aria-label="Show road names"/);
});

test('Learn reveal card defaults to selectable blue coverage and keeps map zoom shortcuts', () => {
  const learn = renderToStaticMarkup(createElement(LocationCard, { location: { countryCode: 'SE', lat: 59.33, lng: 18.06, panoId: 'learn-view' }, onMapSelect: () => {} }));
  assert.match(learn, /class="result-map-wrap study-result-map selectable"/);
  assert.match(learn, /aria-label="Hide Street View coverage"/);
  assert.match(learn, /aria-label="Zoom to answer"/);
  assert.match(learn, /aria-label="Zoom to city scale"/);
  assert.match(learn, /aria-label="Zoom to country"/);
});
