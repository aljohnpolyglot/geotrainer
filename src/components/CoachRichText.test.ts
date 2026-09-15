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
