import assert from 'node:assert/strict';
import test from 'node:test';
import { wikipediaPlaceUrl } from './wikipediaPlace';

test('Wikipedia link requires a matching article and handles failed lookups', async () => {
  const original = globalThis.fetch;
  try {
    globalThis.fetch = async (url) => { assert.equal(new URL(String(url)).searchParams.get('origin'), '*'); return new Response(JSON.stringify(['Alexandria', ['Alexandria, New South Wales'], [], []])); };
    assert.equal(await wikipediaPlaceUrl('Alexandria', 'New South Wales'), 'https://en.wikipedia.org/wiki/Alexandria%2C_New_South_Wales');
    assert.equal(await wikipediaPlaceUrl('Alexandria', 'Louisiana'), 'https://en.wikipedia.org/w/index.php?search=Alexandria%20Louisiana');
    globalThis.fetch = async () => new Response(JSON.stringify(['Unknown place', [], [], []]));
    assert.equal(await wikipediaPlaceUrl('Unknown place'), null);
    globalThis.fetch = async () => new Response('', { status: 503 });
    await assert.rejects(wikipediaPlaceUrl('Alexandria'), /lookup failed/);
  } finally { globalThis.fetch = original; }
});
