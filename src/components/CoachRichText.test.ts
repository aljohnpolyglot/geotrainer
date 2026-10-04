import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CoachRichText } from './CoachRichText';

test('Coach text renders safe hierarchy, labels, emphasis, and bullets without dangling paste markers', () => {
  const html = renderToStaticMarkup(createElement(CoachRichText, { text: '## Why it fits\nStrength: **High**\n- Visible road sign\n-' }));
  assert.match(html, /role="heading"/);
  assert.match(html, /<strong>Strength:<\/strong>/);
  assert.match(html, /<strong>High<\/strong>/);
  assert.match(html, /coach-rich-bullet/);
  assert.doesNotMatch(html, />-</);
});

test('Meta notes render links without splitting the URL at its colon', () => {
  const url = 'https://www.google.com/maps/@49.7445702,-84.128801,3a/data=!1spano?entry=ttu';
  const html = renderToStaticMarkup(createElement(CoachRichText, { text: `[**Kanada**](${url}) använder diamantformade skyltar.` }));
  assert.ok(html.includes(`href="${url}"`));
  assert.match(html, /<strong>Kanada<\/strong><\/a>/);
  assert.doesNotMatch(html, /\[.*https:/);
  assert.match(html, /rel="noopener noreferrer"/);
});

test('reference links preserve accented and Cyrillic labels in every supported locale', () => {
  const labels = ['Road signs', 'Señales de tráfico', 'Sinalização', 'Signalisation routière', 'Straßenschilder', 'Segnali stradali', 'Дорожные знаки', 'Vägskyltar'];
  for (const label of labels) {
    const html = renderToStaticMarkup(createElement(CoachRichText, { text: `[${label}](https://www.google.com/maps)` }));
    assert.ok(html.includes(`>${label}</a>`));
    assert.doesNotMatch(html, /\\u[0-9a-f]{4}|�/i);
  }
});
