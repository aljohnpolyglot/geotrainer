import assert from 'node:assert/strict';
import test from 'node:test';
import { openAvailableMetaTip } from './metaNavigation';

test('Meta skips unavailable panoramas, stops at a playable lesson, and respects cancellation', async () => {
  const tips = ['missing', 'available', 'missing-again'];
  const opened: string[] = [];
  assert.equal(await openAvailableMetaTip(tips, 0, async (tip) => { opened.push(tip); return tip === 'available'; }), 1);
  assert.deepEqual(opened, ['missing', 'available']);
  assert.equal(await openAvailableMetaTip(tips, 2, async (tip) => tip === 'available', -1), 1);
  assert.equal(await openAvailableMetaTip(tips, 0, async () => false), null);
  opened.length = 0;
  assert.equal(await openAvailableMetaTip(tips, 0, async (tip) => { opened.push(tip); return undefined; }), undefined);
  assert.deepEqual(opened, ['missing']);
});
