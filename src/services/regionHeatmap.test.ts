import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import path from 'node:path';
import { findRegionId, regionNameAliases } from './regionHeatmap';

test('regional names and Google administrative codes resolve to bundled SVG ids', () => {
  const sweden = { SEAB: 'Stockholm', SEAC: 'Västerbotten' };
  const germany = { DEBY: 'Bayern', DENW: 'Nordrhein-Westfalen' };
  assert.equal(findRegionId('SE', sweden, 'Stockholm County'), 'SEAB');
  assert.equal(findRegionId('DE', germany, 'Bavaria'), 'DEBY');
  assert.equal(findRegionId('DE', germany, 'North Rhine-Westphalia'), 'DENW');
  assert.equal(findRegionId('DE', germany, undefined, 'BY'), 'DEBY');
  assert.equal(findRegionId('SE', sweden, 'Unknown'), undefined);
});

test('Russian and Swedish translated region names resolve to the saved SVG regions', () => {
  const directory = path.resolve(process.cwd(), 'public');
  const russian = JSON.parse(fs.readFileSync(path.join(directory, 'admin1-regions/ru/regions.json'), 'utf8')) as Record<string, string>;
  const swedish = JSON.parse(fs.readFileSync(path.join(directory, 'admin1-regions/se/regions.json'), 'utf8')) as Record<string, string>;
  const russianPools = JSON.parse(fs.readFileSync(path.join(directory, 'city-pools/ru.json'), 'utf8'));
  const swedishPools = JSON.parse(fs.readFileSync(path.join(directory, 'city-pools/se.json'), 'utf8'));
  const ruAliases = regionNameAliases('RU', russian, russianPools);
  const seAliases = regionNameAliases('SE', swedish, swedishPools);
  for (const pool of russianPools) assert.ok(findRegionId('RU', russian, pool.name, undefined, ruAliases), pool.name);
  for (const pool of swedishPools) assert.ok(findRegionId('SE', swedish, pool.name, undefined, seAliases), pool.name);
  assert.equal(findRegionId('RU', russian, 'Республика Адыгея', undefined, ruAliases), 'RUAD');
  assert.equal(findRegionId('RU', russian, 'Moscow Oblast', undefined, ruAliases), 'RUMOW');
  assert.equal(findRegionId('RU', russian, 'Moscow', undefined, ruAliases), 'RUMOS');
  assert.equal(findRegionId('SE', swedish, 'Stockholms län', undefined, seAliases), 'SEAB');
  assert.equal(findRegionId('SE', swedish, 'Вестерботтен', undefined, seAliases), 'SEAC');
});

test('Australia regional coverage includes every state and territory pool', () => {
  const directory = path.resolve(process.cwd(), 'public/admin1-regions/au');
  const regions = JSON.parse(fs.readFileSync(path.join(directory, 'regions.json'), 'utf8')) as Record<string, string>;
  const svg = fs.readFileSync(path.join(directory, 'au.svg'), 'utf8');
  assert.equal(Object.keys(regions).length, 8);
  for (const id of Object.keys(regions)) assert.match(svg, new RegExp(`id="${id}"`));
});

test('Canada regional coverage includes every province and territory', () => {
  const directory = path.resolve(process.cwd(), 'public/admin1-regions/ca');
  const regions = JSON.parse(fs.readFileSync(path.join(directory, 'regions.json'), 'utf8')) as Record<string, string>;
  const svg = fs.readFileSync(path.join(directory, 'ca.svg'), 'utf8');
  assert.equal(Object.keys(regions).length, 13);
  for (const id of Object.keys(regions)) assert.match(svg, new RegExp(`id="${id}"`));
  assert.equal(findRegionId('CA', regions, 'Québec', 'QC'), 'CAQC');
  assert.equal(findRegionId('CA', regions, 'Newfoundland and Labrador', 'NL'), 'CANL');
});
