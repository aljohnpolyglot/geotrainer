import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';
import { extractCountry, requestPage, retryAfterMs } from './scrape-plonkit-map-tips.mjs';

test('extracts only map-linked tips and honors a 429 cooldown', async () => {
  const country = { slug: 'botswana', title: 'Botswana', code: 'BW', updatedAt: '2026-04-09' };
  const html = `<script id="__PRELOADED_DATA__" type="application/json">${JSON.stringify({
    success: true,
    data: { public: { slug: 'botswana', steps: [{ title: 'Identifying Botswana', items: [
      { kind: 'tip', id: 'map', data: { image: { imageUrl: '/car.png', imageLink: 'https://goo.gl/maps/example' }, text: ['White car.', 'NOTE: Also in Eswatini.'] } },
      { kind: 'tip', id: 'image', data: { image: { imageUrl: '/plate.png', imageLink: '/plate.png' }, text: ['Yellow plate.'] } },
    ] }] } },
  })}</script>`;
  const result = extractCountry(country, html);
  assert.equal(result.mapTipCount, 1);
  assert.deepEqual(result.tips[0], {
    id: 'map', section: 'Identifying Botswana', mapUrl: 'https://goo.gl/maps/example',
    image: 'https://www.plonkit.net/car.png', text: 'White car.',
    note: 'Also in Eswatini.', fullText: 'White car.\n\nNOTE: Also in Eswatini.',
  });
  assert.equal(retryAfterMs('3', 1000), 3000);

  const state = { cooldownUntil: 0 };
  const waits = [];
  let calls = 0;
  const body = await requestPage('https://www.plonkit.net/botswana', state, async () => {},
    async () => ++calls === 1
      ? new Response('', { status: 429, headers: { 'Retry-After': '90' } })
      : new Response('ok'),
    async ms => { waits.push(ms); });
  assert.equal(body, 'ok');
  assert.deepEqual(waits, [90_000]);
  assert.equal(state.cooldownUntil, 0);

  const blocked = { cooldownUntil: 0 };
  let saved = 0;
  await assert.rejects(
    requestPage('https://www.plonkit.net/botswana', blocked, async () => { saved++; },
      async () => new Response('', { status: 429 }), async ms => { waits.push(ms); }),
    /HTTP 429 cooldown saved/,
  );
  assert.equal(saved, 3);
  assert.ok(blocked.cooldownUntil > Date.now());
  assert.deepEqual(waits.slice(1), [60_000, 120_000]);
});

test('browser snippet runs without imports, downloads JSON, and resumes in memory', async () => {
  const source = await readFile(new URL('./scrape-plonkit-map-tips-console.js', import.meta.url), 'utf8');
  const country = { slug: 'botswana', title: 'Botswana', code: 'BW', updatedAt: '2026-04-09' };
  const html = data => `<script id="__PRELOADED_DATA__">${JSON.stringify({ success: true, data })}</script>`;
  const guideHtml = html([country]);
  const countryHtml = html({ public: { slug: 'botswana', steps: [{ title: 'Identifying Botswana', items: [
    { kind: 'tip', id: 'map', data: { image: { imageUrl: '/car.png', imageLink: 'https://goo.gl/maps/example' }, text: ['White car.', 'NOTE: Also in Eswatini.'] } },
    { kind: 'tip', id: 'image', data: { image: { imageUrl: '/plate.png', imageLink: '/plate.png' }, text: ['Yellow plate.'] } },
  ] }] } });
  const requests = [];
  let downloaded;
  class BrowserURL extends URL {
    static createObjectURL(blob) { downloaded = blob; return 'blob:fixture'; }
    static revokeObjectURL() {}
  }
  const browser = {
    window: {}, location: { hostname: 'www.plonkit.net', origin: 'https://www.plonkit.net' },
    URL: BrowserURL, Blob, AbortSignal, Response,
    indexedDB: { open() { throw new Error('unavailable'); } },
    DOMParser: class {
      parseFromString(markup) {
        return { querySelector: () => ({ textContent: markup.match(/<script[^>]*>([\s\S]*?)<\/script>/)[1] }) };
      }
    },
    document: {
      body: { append() {} },
      createElement: () => ({ click() {}, remove() {} }),
    },
    fetch: async url => {
      requests.push(url);
      return new Response(url.endsWith('/guide') ? guideHtml : countryHtml);
    },
    setTimeout: callback => { queueMicrotask(callback); return 1; },
    console: { log() {}, warn() {}, error(message) { throw new Error(message); } },
  };

  runInNewContext(source, browser);
  await browser.window.__plonkitMapTipsTask;
  const output = JSON.parse(await downloaded.text());
  assert.equal(output.completedCountries, 1);
  assert.equal(output.totalMapTips, 1);
  assert.equal(output.countries[0].tips[0].note, 'Also in Eswatini.');

  runInNewContext(source, browser);
  await browser.window.__plonkitMapTipsTask;
  assert.deepEqual(requests, [
    'https://www.plonkit.net/guide', 'https://www.plonkit.net/botswana',
    'https://www.plonkit.net/guide',
  ]);
});
