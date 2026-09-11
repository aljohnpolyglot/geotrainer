import assert from 'node:assert/strict';
import test from 'node:test';
import { sortRows } from './tableSorting';

test('sortRows orders numeric and text columns while keeping missing values last', () => {
  const rows = [{ name: '10', value: 10 }, { name: '2', value: null }, { name: '1', value: 1 }];
  assert.deepEqual(sortRows(rows, (row) => row.name, 'asc').map((row) => row.name), ['1', '2', '10']);
  assert.deepEqual(sortRows(rows, (row) => row.value, 'desc').map((row) => row.name), ['10', '1', '2']);
});
