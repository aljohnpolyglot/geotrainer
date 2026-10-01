import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('./plonkit-guide-images-console.js', import.meta.url), 'utf8');

function browserWithState(initialState, fetchImage) {
  let state = initialState, archive, input;
  const BrowserURL = class extends URL {
    static createObjectURL(blob) { archive = blob; return 'blob:archive'; }
    static revokeObjectURL() {}
  };
  const db = {
    close() {},
    transaction() {
      const tx = {
        objectStore() {
          return {
            get() {
              const request = { result: state };
              queueMicrotask(() => request.onsuccess());
              return request;
            },
            put(value) {
              state = structuredClone(value);
              queueMicrotask(() => tx.oncomplete());
            },
          };
        },
      };
      return tx;
    },
  };
  const browser = {
    window: {},
    location: { hostname: 'www.plonkit.net', pathname: '/guide', href: 'https://www.plonkit.net/guide' },
    indexedDB: {
      open() {
        const request = { result: db };
        queueMicrotask(() => request.onsuccess());
        return request;
      },
    },
    document: {
      createElement(tag) {
        const element = { tag, style: {}, append(...children) { this.children = children; }, remove() {}, click() {} };
        if (tag === 'input') input = element;
        return element;
      },
      body: { append() {} },
    },
    URL: BrowserURL, Blob, TextEncoder, Uint8Array, Uint32Array, DataView, AbortSignal,
    fetch: fetchImage,
    setTimeout: callback => { queueMicrotask(callback); return 1; },
    console: { log() {}, warn() {} },
  };
  return { browser, getState: () => state, getArchive: () => archive, getInput: () => input };
}

test('exports from guide JSON URLs and saves a partial batch when rate limited', async () => {
  const urls = ['https://www.plonkit.net/images/one.png', 'https://www.plonkit.net/images/two.png'];
  let calls = 0;
  const env = browserWithState({ version: 1, entries: urls.map((url, index) => ({ url, id: `tip${index}` })), done: [], cooldownUntil: 0 },
    async () => ++calls === 1
      ? new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/png' } })
      : new Response('', { status: 429 }));
  runInNewContext(source, env.browser);
  await env.browser.window.__plonkitImageZipTask;
  assert.equal(calls, 2);
  assert.deepEqual(env.getState().done, [urls[0]]);
  assert.ok(env.getState().cooldownUntil > Date.now());
  const zip = new Uint8Array(await env.getArchive().arrayBuffer());
  assert.equal(new DataView(zip.buffer).getUint32(0, true), 0x04034b50);
  assert.match(new TextDecoder().decode(zip), /images\/001-tip0\.png/);
});

test('first run accepts the existing map-tip JSON without visiting country pages', async () => {
  const image = 'https://www.plonkit.net/images/botswana/car.png';
  let calls = 0;
  const env = browserWithState(null, async url => {
    calls++;
    assert.equal(url, image);
    return new Response(new Uint8Array([1]), { headers: { 'Content-Type': 'image/webp' } });
  });
  runInNewContext(source, env.browser);
  for (let i = 0; i < 10 && !env.getInput(); i++) await new Promise(resolve => queueMicrotask(resolve));
  assert.ok(env.getInput(), 'file picker appears when there is no saved image list');
  env.getInput().files = [{ text: async () => JSON.stringify({ countries: [{ code: 'BW', tips: [{ id: 'one', image }] }] }) }];
  await env.getInput().onchange();
  await env.browser.window.__plonkitImageZipTask;
  assert.equal(calls, 1);
  assert.deepEqual(env.getState().done, [image]);
  assert.match(new TextDecoder().decode(new Uint8Array(await env.getArchive().arrayBuffer())), /manifest\.json/);
});
