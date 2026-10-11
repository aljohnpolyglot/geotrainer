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

test('Wikipedia links use the chosen edition and fall back to English', async () => {
  const original = globalThis.fetch;
  try {
    const calls: string[] = [];
    globalThis.fetch = async (url) => {
      const request = new URL(String(url));
      calls.push(request.host);
      if (request.searchParams.get('prop') === 'langlinks') return new Response(JSON.stringify({ query: { pages: { 1: { langlinks: [{ '*': 'Berlin (Allemagne)' }] } } } }));
      const titles = request.host === 'fr.wikipedia.org' && request.searchParams.get('search') === 'Paris' ? ['Paris'] : request.host === 'en.wikipedia.org' ? ['Berlin'] : [];
      return new Response(JSON.stringify(['place', titles, [], []]));
    };
    assert.equal(await wikipediaPlaceUrl('Paris', undefined, 'fr'), 'https://fr.wikipedia.org/wiki/Paris');
    assert.equal(await wikipediaPlaceUrl('Berlin', undefined, 'fr'), 'https://fr.wikipedia.org/wiki/Berlin_(Allemagne)');
    assert.deepEqual(calls, ['fr.wikipedia.org', 'fr.wikipedia.org', 'en.wikipedia.org', 'en.wikipedia.org']);
    globalThis.fetch = async (url) => { const request = new URL(String(url)); return new Response(JSON.stringify(request.searchParams.get('prop') === 'langlinks' ? { query: { pages: { 1: {} } } } : ['place', request.host === 'en.wikipedia.org' ? ['Berlin'] : [], [], []])); };
    assert.equal(await wikipediaPlaceUrl('Berlin', undefined, 'fr'), 'https://en.wikipedia.org/wiki/Berlin');
  } finally { globalThis.fetch = original; }
});
