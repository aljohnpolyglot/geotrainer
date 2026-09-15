import assert from 'node:assert/strict';
import test from 'node:test';
import type { CountryStats } from './trainerHubTypes';
import { coverageCountryCounts, coverageCountryValues, notebookClueLinks, pageBounds, savedClueCount, sortCoverageCountries } from './trainerHubUtils';

const row = (name: string, seen: number): CountryStats => ({ code: name, name, seen, played: 0, reviewed: 0, correct: 0, wrong: 0, accuracy: 0, average: 0, best: 0, lastSeen: 0, clues: 0 });

test('coverage columns sort in both directions without mutating source rows', () => {
  const source = [row('Brazil', 2), row('Andorra', 1)];
  assert.deepEqual(sortCoverageCountries(source, 'name', 1).map((item) => item.name), ['Andorra', 'Brazil']);
  assert.deepEqual(sortCoverageCountries(source, 'seen', -1).map((item) => item.seen), [2, 1]);
  assert.equal(source[0].name, 'Brazil');
});

test('saved clue total counts personal, AI, and Meta entries without double-counting a note image', () => {
  const clues = [{ id: 'note-image' }, { id: 'coach' }]; const notes = [{ clueId: 'note-image' }]; const metas = [{ id: 'meta' }];
  assert.equal(savedClueCount(clues as never, notes as never, metas as never, [{ id: 'coach-note' }] as never), 4);
  assert.equal(savedClueCount(clues as never, notes as never, metas as never, [{ id: 'coach-note', clueId: 'coach' }] as never), 3);
});

test('orphaned personal clue images reconnect to Notebook text by exact panorama and save time', () => {
  const clues = [{ id: 'image-a', panoId: 'pano-a', origin: 'personal', createdAt: 10 }, { id: 'image-b', panoId: 'pano-a', origin: 'personal', createdAt: 20 }];
  const notes = [{ panoId: 'pano-a', countryCode: 'FR', text: 'shark teeth', updatedAt: 20 }];
  assert.equal(notebookClueLinks(clues as never, notes).get(notes[0] as never), 'image-b');
  assert.equal(savedClueCount(clues as never, notes, [], []), 2);
});

test('clue pagination uses twenty rows and clamps an emptied last page', () => {
  assert.deepEqual(pageBounds(97, 5), { current: 5, pages: 5, start: 80, end: 100 });
  assert.deepEqual(pageBounds(39, 5), { current: 2, pages: 2, start: 20, end: 40 });
});

test('country heat values normalize counts and preserve score and weakness scales', () => {
  const locations = [{ id: 'it-1', countryCode: 'IT', encounterCount: 4 }, { id: 'se-1', countryCode: 'SE', encounterCount: 2 }];
  const attempts = [{ panoId: 'it-1', countryCode: 'IT', guessedCountryCode: 'FR', score: 1000 }, { panoId: 'se-1', countryCode: 'SE', guessedCountryCode: 'SE', score: 4000 }];
  assert.deepEqual(coverageCountryValues(locations as never, attempts as never, [], 'exposure'), { IT: 1, SE: .5 });
  assert.deepEqual(coverageCountryValues(locations as never, attempts as never, [], 'weakness'), { IT: 1, SE: 0 });
  assert.deepEqual(coverageCountryValues(locations as never, attempts as never, [], 'score'), { IT: .2, SE: .8 });
});

test('coverage distinguishes unique panoramas from repeated encounters', () => {
  const locations = [{ countryCode: 'IE', encounterCount: 50 }, { countryCode: 'IE', encounterCount: 33 }, { countryCode: 'HU', encounterCount: 2 }];
  assert.deepEqual(coverageCountryCounts(locations as never), { IE: { panoramas: 2, encounters: 83 }, HU: { panoramas: 1, encounters: 2 } });
});
