import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
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

test('Australia regional coverage includes every state and territory pool', () => {
  const directory = path.resolve(process.cwd(), 'public/admin1-regions/au');
  const regions = JSON.parse(fs.readFileSync(path.join(directory, 'regions.json'), 'utf8')) as Record<string, string>;
  const svg = fs.readFileSync(path.join(directory, 'au.svg'), 'utf8');
  assert.equal(Object.keys(regions).length, 8);
  for (const id of Object.keys(regions)) assert.match(svg, new RegExp(`id="${id}"`));
});
