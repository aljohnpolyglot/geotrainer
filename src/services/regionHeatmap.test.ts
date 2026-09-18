import assert from 'node:assert/strict';
import test from 'node:test';
import { findRegionId } from './regionHeatmap';

test('regional names and Google administrative codes resolve to bundled SVG ids', () => {
  const sweden = { SEAB: 'Stockholm', SEAC: 'Västerbotten' };
  const germany = { DEBY: 'Bayern', DENW: 'Nordrhein-Westfalen' };
  assert.equal(findRegionId('SE', sweden, 'Stockholm County'), 'SEAB');
  assert.equal(findRegionId('DE', germany, 'Bavaria'), 'DEBY');
  assert.equal(findRegionId('DE', germany, 'North Rhine-Westphalia'), 'DENW');
  assert.equal(findRegionId('DE', germany, undefined, 'BY'), 'DEBY');
  assert.equal(findRegionId('SE', sweden, 'Unknown'), undefined);
});
