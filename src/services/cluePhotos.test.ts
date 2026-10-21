import assert from 'node:assert/strict';
import test from 'node:test';
import type { ClueRecord } from '../types';
import { readCluePhotos } from './cluePhotos';

test('only selected local clue photos are read; hosted previews need no database read', async () => {
  const clues = Array.from({ length: 1000 }, (_, i) => ({ id: String(i), imageDataUrl: i === 0 ? 'https://example.com/exact-clue.jpg' : '' })) as ClueRecord[];
  const reads: string[] = [];
  const photos = await readCluePhotos(clues, [...clues.slice(0, 20).map((clue) => clue.id), '1'], async (id) => { reads.push(id); return { id, imageDataUrl: `data:image/jpeg;base64,${id}` } as ClueRecord; });
  assert.equal(reads.length, 19);
  assert.equal(photos.size, 19);
  assert.equal(photos.get('1'), 'data:image/jpeg;base64,1');
  assert.equal(photos.has('20'), false);
  assert.equal(photos.has('0'), false);
});

test('empty selection does not read photos; missing records stay distinguishable from pending reads', async () => {
  const clues = [{ id: 'missing', imageDataUrl: '' }] as ClueRecord[];
  assert.equal((await readCluePhotos(clues, [], async () => { throw new Error('Unexpected read'); })).size, 0);
  assert.equal((await readCluePhotos(clues, ['missing'], async () => undefined)).get('missing'), '');
});
