import assert from 'node:assert/strict';
import test from 'node:test';
import type { CountryStats } from './trainerHubTypes';
import { sortCoverageCountries } from './trainerHubUtils';

const row = (name: string, seen: number): CountryStats => ({ code: name, name, seen, played: 0, reviewed: 0, correct: 0, wrong: 0, accuracy: 0, average: 0, best: 0, lastSeen: 0, clues: 0 });

test('coverage columns sort in both directions without mutating source rows', () => {
  const source = [row('Brazil', 2), row('Andorra', 1)];
  assert.deepEqual(sortCoverageCountries(source, 'name', 1).map((item) => item.name), ['Andorra', 'Brazil']);
  assert.deepEqual(sortCoverageCountries(source, 'seen', -1).map((item) => item.seen), [2, 1]);
  assert.equal(source[0].name, 'Brazil');
});
