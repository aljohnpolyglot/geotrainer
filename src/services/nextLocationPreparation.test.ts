import assert from 'node:assert/strict';
import test from 'node:test';
import { NextLocationPreparation } from './nextLocationPreparation';

test('prepared locations are consumed once and stale searches are aborted', async () => {
  const queue = new NextLocationPreparation<string>();
  let signal: AbortSignal | undefined;
  queue.prepare('first', async (value) => { signal = value; return 'ready'; });
  assert.equal(await queue.take('first'), 'ready');
  assert.equal(queue.take('first'), undefined);
  queue.prepare('old', async (value) => { signal = value; return 'old'; });
  queue.prepare('new', async () => 'new');
  assert.equal(signal?.aborted, true);
  assert.equal(await queue.take('new'), 'new');
  const opened = new AbortController();
  queue.prepare('taken', (value) => new Promise((_, reject) => { signal = value; value.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))); }));
  const taken = queue.take('taken', opened.signal);
  opened.abort();
  await assert.rejects(taken, { name: 'AbortError' });
  assert.equal(signal?.aborted, true);
});
