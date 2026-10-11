import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('./openguessr-community-html-console.js', import.meta.url), 'utf8');

test('captures the current map title, author, count, description, and preview HTML', async () => {
  let downloaded;
  const elements = {
    '.header-container .map-title': { textContent: 'Equalized World' },
    '.author-text': { textContent: 'by Eryk125' },
    '.location-amount-text': { textContent: '1,800 Locations' },
    '#likes-text': { textContent: '485' },
    '.map-container svg': { querySelectorAll: () => [{}, {}] },
    '.header-container': { outerHTML: '<div class="header-container">title</div>' },
    '.information': { outerHTML: '<div class="information">details</div>' },
    '.map-container': { outerHTML: '<div class="map-container"><svg><g class="point-feature"/></svg></div>' },
  };
  const link = { click() {}, remove() {} };
  const context = {
    location: { hostname: 'openguessr.com', origin: 'https://openguessr.com', href: 'https://openguessr.com/maps/community/equalized_world' },
    window: {}, URL: Object.assign(URL, { createObjectURL: value => { downloaded = value; return 'blob:test'; }, revokeObjectURL() {} }), Blob, Date,
    document: { querySelector: selector => elements[selector], querySelectorAll: selector => selector === '.description-scroll p' ? [{ textContent: 'Equal chance for each country.' }] : [],
      createElement: () => link, body: { append() {} } },
    setTimeout(callback) { queueMicrotask(callback); }, console: { log() {}, warn() {} },
  };
  runInNewContext(source, context);
  const counts = await context.window.__openGuessrHtmlTask;
  assert.equal(counts.captured, 1);
  assert.equal(counts.failed, 0);
  assert.equal(counts.found, 1);
  const result = JSON.parse(await downloaded.text());
  assert.equal(result.maps[0].title, 'Equalized World');
  assert.equal(result.maps[0].author, 'Eryk125');
  assert.equal(result.maps[0].locationCount, 1800);
  assert.equal(result.maps[0].previewPointCount, 2);
  assert.match(result.maps[0].html, /point-feature/);
});
