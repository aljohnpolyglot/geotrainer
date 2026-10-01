import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('./plonkit-guide-images-console.js', import.meta.url), 'utf8');
const base = 'https://www.plonkit.net/images/';

function browserWithState(initialState, fetchImage) {
  let state = initialState, input, now = Date.now();
  const files = new Map(), buttons = [];
  const Clock = class extends Date {
    constructor(...args) { super(...(args.length ? args : [now])); }
    static now() { return now; }
  };
  const folder = {
    async getFileHandle(name) {
      return { async createWritable() {
        let blob;
        return { async write(value) { blob = value; }, async close() { files.set(name, blob); }, async abort() {} };
      } };
    },
  };
  const db = {
    close() {},
    transaction() {
      const tx = { objectStore() { return {
        get() {
          const request = { result: state };
          queueMicrotask(() => request.onsuccess());
          return request;
        },
        put(value) {
          state = structuredClone(value);
          queueMicrotask(() => tx.oncomplete());
        },
      }; } };
      return tx;
    },
  };
  const browser = {
    window: { showDirectoryPicker: async () => folder },
    location: { hostname: 'www.plonkit.net', href: 'https://www.plonkit.net/guide' },
    indexedDB: { open() {
      const request = { result: db };
      queueMicrotask(() => request.onsuccess());
      return request;
    } },
    document: {
      createElement(tag) {
        const element = { tag, style: {}, append(...children) { this.children = children; }, remove() {} };
        if (tag === 'input') input = element;
        if (tag === 'button') buttons.push(element);
        return element;
      },
      body: { append() {} },
    },
    Date: Clock, URL, Blob, TextEncoder, Uint8Array, Uint32Array, DataView, AbortSignal,
    fetch: fetchImage,
    setTimeout: (callback, ms) => { now += ms; queueMicrotask(callback); return 1; },
    console: { log() {}, warn() {}, error() {} },
  };
  const waitFor = async predicate => {
    for (let i = 0; i < 30 && !predicate(); i++) await new Promise(resolve => queueMicrotask(resolve));
    assert.ok(predicate(), 'expected browser control appeared');
  };
  const start = async () => {
    await waitFor(() => buttons.some(button => button.textContent === 'Choose folder and start'));
    await buttons.find(button => button.textContent === 'Choose folder and start').onclick();
    await browser.window.__plonkitImageZipTask;
  };
  return { browser, files, start, waitFor, getState: () => state, getInput: () => input };
}

test('one start continues after 429, writes successive ZIPs, and filters old extra courses', async () => {
  const first = `${base}botswana/one.png`, second = `${base}botswana/two.png`;
  let calls = 0;
  const env = browserWithState({ version: 1, entries: [
    { url: first, id: 'BW-0001' }, { url: `${base}alaska/extra.png`, id: 'US-AK-0001' },
    { url: second, id: 'BW-0002' },
  ], done: [], cooldownUntil: 0 }, async () => {
    calls++;
    return calls === 2 ? new Response('', { status: 429 })
      : new Response(new Uint8Array([1, 2, 3]), { headers: { 'Content-Type': 'image/png' } });
  });
  runInNewContext(source, env.browser);
  await env.start();
  assert.equal(calls, 3);
  assert.equal(env.getState().entries.length, 2);
  assert.deepEqual(env.getState().done, [first, second]);
  assert.equal(env.getState().paceMs, 3000);
  assert.equal(env.files.size, 2);
  for (const blob of env.files.values()) {
    const zip = new Uint8Array(await blob.arrayBuffer());
    assert.equal(new DataView(zip.buffer).getUint32(0, true), 0x04034b50);
    assert.match(new TextDecoder().decode(zip), /manifest\.json/);
  }
});

test('first run loads the existing JSON and selects a folder only once', async () => {
  const image = `${base}botswana/car.png`;
  let calls = 0;
  const env = browserWithState(null, async url => {
    calls++;
    assert.equal(url, image);
    return new Response(new Uint8Array([1]), { headers: { 'Content-Type': 'image/webp' } });
  });
  runInNewContext(source, env.browser);
  await env.waitFor(() => env.getInput());
  env.getInput().files = [{ text: async () => JSON.stringify({ countries: [
    { code: 'BW', tips: [{ id: '0001', image }] },
    { code: 'US-AK', tips: [{ id: '0001', image: `${base}alaska/extra.png` }] },
  ] }) }];
  await env.getInput().onchange();
  await env.start();
  assert.equal(calls, 1);
  assert.equal(env.getState().entries.length, 1);
  assert.deepEqual(env.getState().done, [image]);
  assert.equal(env.files.size, 1);
});

test('more than 50 images continue into the next ZIP without another start', async () => {
  const entries = Array.from({ length: 51 }, (_, index) => ({
    id: `BW-${String(index).padStart(4, '0')}`,
    url: `${base}botswana/${index}.png`,
  }));
  let calls = 0;
  const env = browserWithState({ version: 1, entries, done: [], cooldownUntil: 0 }, async () => {
    calls++;
    return new Response(new Uint8Array([1]), { headers: { 'Content-Type': 'image/png' } });
  });
  runInNewContext(source, env.browser);
  await env.start();
  assert.equal(calls, 51);
  assert.equal(env.files.size, 2);
  assert.equal(env.getState().done.length, 51);
});

test('a prior partial ZIP remains counted after the old 4,694-entry list is filtered', async () => {
  const saved = `${base}united-states/saved.png`, next = `${base}united-states/next.png`;
  let calls = 0;
  const env = browserWithState({ version: 1, entries: [
    { id: 'US-0001', url: saved }, { id: 'US-AK-0001', url: `${base}alaska/extra.png` },
    { id: 'US-0002', url: next },
  ], done: [saved, `${base}alaska/extra.png`], cooldownUntil: 0 }, async url => {
    calls++;
    assert.equal(url, next);
    return new Response(new Uint8Array([1]), { headers: { 'Content-Type': 'image/png' } });
  });
  runInNewContext(source, env.browser);
  await env.start();
  assert.equal(calls, 1);
  assert.equal(env.getState().entries.length, 2);
  assert.deepEqual(env.getState().done, [saved, next]);
});
