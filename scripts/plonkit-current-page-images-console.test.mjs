import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

test('exports current-page images and stops immediately on 429', async () => {
  const source = await readFile(new URL('./plonkit-current-page-images-console.js', import.meta.url), 'utf8');
  const page = { slug: 'botswana', steps: [{ title: 'Cars', items: [
    { kind: 'tip', id: 'one', data: { image: { imageUrl: '/one.png', imageLink: 'https://goo.gl/maps/one' }, text: ['One'] } },
    { kind: 'tip', id: 'two', data: { image: { imageUrl: '/two.png', imageLink: 'https://goo.gl/maps/two' }, text: ['Two'] } },
  ] }] };
  let archive;
  let calls = 0;
  const BrowserURL = class extends URL {
    static createObjectURL(blob) { archive = blob; return 'blob:archive'; }
    static revokeObjectURL() {}
  };
  const browser = {
    window: {}, location: { hostname: 'www.plonkit.net', origin: 'https://www.plonkit.net', href: 'https://www.plonkit.net/botswana' },
    document: {
      querySelector: () => ({ textContent: JSON.stringify({ success: true, data: { public: page } }) }),
      querySelectorAll: () => [],
      documentElement: { outerHTML: '<html></html>' },
      createElement: () => ({ click() {}, remove() {} }), body: { append() {} },
    },
    URL: BrowserURL, Blob, TextEncoder, Uint8Array, DataView, AbortSignal,
    fetch: async () => ++calls === 1
      ? new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/png' } })
      : new Response('', { status: 429 }),
    setTimeout: callback => { queueMicrotask(callback); return 1; },
    console: { log() {}, warn() {}, error() {} },
  };
  runInNewContext(source, browser);
  await browser.window.__plonkitImageZipTask;
  assert.equal(calls, 2);
  const bytes = new Uint8Array(await archive.arrayBuffer());
  assert.equal(new DataView(bytes.buffer).getUint32(0, true), 0x04034b50);
  assert.equal(new TextDecoder().decode(bytes).includes('manifest.json'), true);
  assert.equal(new TextDecoder().decode(bytes).includes('images/001-one.png'), true);
});

test('uses an already-loaded same-origin image without fetching it', async () => {
  const source = await readFile(new URL('./plonkit-current-page-images-console.js', import.meta.url), 'utf8');
  const page = { slug: 'botswana', steps: [{ items: [
    { kind: 'tip', id: 'loaded', data: { image: { imageUrl: '/loaded.png', imageLink: 'https://goo.gl/maps/loaded' }, text: ['Loaded'] } },
  ] }] };
  const image = { complete: true, naturalWidth: 2, naturalHeight: 1, currentSrc: 'https://www.plonkit.net/loaded.png',
    src: 'https://www.plonkit.net/loaded.png', getAttribute: () => '/loaded.png' };
  let archive;
  let calls = 0;
  const BrowserURL = class extends URL {
    static createObjectURL(blob) { archive = blob; return 'blob:archive'; }
    static revokeObjectURL() {}
  };
  const browser = {
    window: {}, location: { hostname: 'www.plonkit.net', origin: 'https://www.plonkit.net', href: 'https://www.plonkit.net/botswana' },
    document: {
      querySelector: () => ({ textContent: JSON.stringify({ success: true, data: { public: page } }) }),
      querySelectorAll: () => [image], documentElement: { outerHTML: '<html></html>' },
      createElement: tag => tag === 'canvas'
        ? { getContext: () => ({ drawImage() {} }), toBlob: callback => callback(new Blob([new Uint8Array([4, 5, 6])], { type: 'image/png' })) }
        : { click() {}, remove() {} },
      body: { append() {} },
    },
    URL: BrowserURL, Blob, TextEncoder, Uint8Array, DataView, AbortSignal,
    fetch: async () => { calls++; throw new Error('unexpected image request'); },
    setTimeout: callback => { queueMicrotask(callback); return 1; },
    console: { log() {}, warn() {}, error() {} },
  };
  runInNewContext(source, browser);
  await browser.window.__plonkitImageZipTask;
  assert.equal(calls, 0);
  const zipText = new TextDecoder().decode(new Uint8Array(await archive.arrayBuffer()));
  assert.equal(zipText.includes('images/001-loaded.png'), true);
  assert.equal(zipText.includes('loadedFromDocument'), true);
});
