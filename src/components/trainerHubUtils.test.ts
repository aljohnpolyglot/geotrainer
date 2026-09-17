import assert from 'node:assert/strict';
import test from 'node:test';
import type { CountryStats } from './trainerHubTypes';
import { coverageCountryCounts, coverageCountryValues, elapsed, missingNotebookPhotoNotes, notebookClueLinks, pageBounds, savedClueCount, sortCoverageCountries, timestampRange, visibleNotebookNotes } from './trainerHubUtils';

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

test('orphaned personal clue images reconnect to nearby Notebook saves on the same panorama', () => {
  const clues = [{ id: 'image-a', panoId: 'pano-a', origin: 'personal', createdAt: 1_000 }, { id: 'image-b', panoId: 'pano-a', origin: 'personal', createdAt: 180_000 }];
  const notes = [{ panoId: 'pano-a', countryCode: 'FR', text: 'shark teeth', updatedAt: 170_000 }];
  assert.equal(notebookClueLinks(clues as never, notes).get(notes[0] as never), 'image-b');
  assert.equal(savedClueCount(clues as never, notes, [], []), 2);
});

test('walking reconnects a nearby same-country Notebook image and rounds active time', () => {
  const clue = { id: 'walked-image', panoId: 'pano-b', countryCode: 'MN', origin: 'personal', createdAt: 100_000 };
  const note = { panoId: 'pano-a', countryCode: 'MN', updatedAt: 110_000 };
  assert.equal(notebookClueLinks([clue] as never, [note] as never).get(note as never), clue.id);
  assert.equal(elapsed(82.56000000000002), '1m 23s');
});

test('a richer nearby note inherits an image from an empty legacy save', () => {
  const clue = { id: 'image', panoId: 'walk-b', countryCode: 'IL', origin: 'personal', createdAt: 100_000 };
  const empty = { id: 'empty', panoId: 'walk-b', countryCode: 'IL', text: '', clueId: 'image', updatedAt: 100_000 };
  const rich = { id: 'rich', panoId: 'walk-a', countryCode: 'IL', text: 'Tel Aviv skyline', updatedAt: 140_000 };
  const links = notebookClueLinks([clue] as never, [empty, rich]);
  assert.equal(links.get(rich), 'image');
  assert.deepEqual(visibleNotebookNotes([empty, rich], links), [rich]);
});

test('an explicit missing image stays broken instead of stealing another same-panorama image', () => {
  const clue = { id: 'surviving-image', panoId: 'same-pano', countryCode: 'TW', origin: 'personal', createdAt: 100_000 };
  const broken = { id: 'broken', panoId: 'same-pano', countryCode: 'TW', text: 'pedestrian sign', clueId: 'missing-image', updatedAt: 100_000 };
  const independent = { id: 'independent', panoId: 'same-pano', countryCode: 'TW', text: 'bamboo stakes', updatedAt: 101_000 };
  const links = notebookClueLinks([clue] as never, [broken, independent] as never);
  assert.equal(links.has(broken as never), false);
  assert.equal(links.get(independent as never), clue.id);
  assert.deepEqual(visibleNotebookNotes([broken] as never, links), [broken]);
});

test('deleted Personal notes and their linked images stay out of My Clues totals', () => {
  const clue = { id: 'deleted-image', panoId: 'pano', countryCode: 'SE', origin: 'personal' };
  const note = { id: 'deleted-note', panoId: 'pano', countryCode: 'SE', text: 'bollard', clueId: clue.id, updatedAt: 10, deletedAt: 20 };
  const links = notebookClueLinks([clue] as never, [note]);
  assert.equal(visibleNotebookNotes([note], links).length, 0);
  assert.equal(savedClueCount([clue] as never, [note], [], []), 0);
});

test('photo integrity detects absent records, unresolved paths, and failed signed images only', () => {
  const notes = [{ id: 'absent', clueId: 'missing' }, { id: 'unsigned', clueId: 'path' }, { id: 'failed', clueId: 'url' }, { id: 'text' }];
  const clues = [{ id: 'path', imagePath: 'u/path.jpg', imageDataUrl: '' }, { id: 'url', imagePath: 'u/url.jpg', imageDataUrl: 'https://signed' }];
  assert.deepEqual(missingNotebookPhotoNotes(clues as never, notes as never, new Set(['url'])).map((note) => note.id), ['absent', 'unsigned', 'failed']);
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

test('same-day session ranges show the date once with a compact time span', () => {
  const value = timestampRange(new Date(2026, 8, 17, 12, 50).getTime(), new Date(2026, 8, 17, 13, 11).getTime(), 'en');
  assert.equal((value.match(/2026/g) || []).length, 1);
  assert.match(value, /12:50.*1:11/);
});
