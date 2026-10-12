import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runInNewContext } from 'node:vm';

const source = await readFile(new URL('./openguessr-duel-history-console.js', import.meta.url), 'utf8');

test('downloads all duel rounds as GeoTrainer locations', async () => {
  let overviewOpen = false;
  let round = 0;
  let downloaded;
  const tabs = [0, 1].map(index => ({
    classList: { contains: name => name === 'active' && round === index },
    click: () => { round = index; },
  }));
  const frame = { get src() { return `https://www.google.com/maps/embed/v1/streetview?location=${round ? '33,-84' : '35,138'}&heading=${round ? '270' : '90'}&key=ignored`; } };
  const scoreRows = ['A', 'B'].map((name, index) => ({ querySelector: selector => ({ textContent: selector === '.score-name' ? name : String((round ? [3000, 2500] : [1000, 2000])[index]) }) }));
  const overview = {
    querySelectorAll: selector => selector === '.tabs-row button' ? tabs : selector === '.score-panel .score-row' ? scoreRows : [],
    querySelector: selector => selector.startsWith('iframe') ? frame : selector === '.close-popup-button' ? { click: () => { overviewOpen = false; } } : null,
  };
  const row = {
    querySelectorAll: selector => selector === '.player-name' ? [{ textContent: 'A' }, { textContent: 'B' }] : [],
    querySelector: selector => selector === 'button[aria-label="Match overview"]' ? { click: () => { overviewOpen = true; round = 0; } } : null,
  };
  const history = {
    querySelectorAll: selector => selector === '.match-history-item-container' ? [row] : [],
    querySelector: selector => selector === '.page-counter' ? { textContent: '1' } : selector === '.pagination-controls button:last-child' ? { disabled: true } : null,
  };
  const document = {
    querySelectorAll: selector => selector === '.ui-window' ? [
      { ...history, querySelector: selector => selector === 'h1' ? { textContent: 'Duel history' } : history.querySelector(selector) },
      ...(overviewOpen ? [{ querySelector: selector => selector === 'h1' ? { textContent: 'Overview' } : overview.querySelector(selector), querySelectorAll: overview.querySelectorAll }] : []),
    ] : [],
    createElement: () => ({ click() {}, remove() {} }),
    body: { append() {} },
  };
  const context = {
    location: { hostname: 'openguessr.com', pathname: '/multiplayer', href: 'https://openguessr.com/multiplayer' },
    window: {}, document, Blob, URL: Object.assign(class extends URL {}, { createObjectURL: blob => { downloaded = blob; return 'blob:test'; }, revokeObjectURL() {} }),
    setTimeout: callback => { queueMicrotask(callback); }, console: { log() {}, error() {} },
  };
  runInNewContext(source, context);
  await context.window.__duelExportTask;
  const result = JSON.parse(await downloaded.text());
  assert.deepEqual(result.locations, [
    { lat: 35, lng: 138, heading: 90, matchNumber: 1, round: 1, multiplier: 1, myScore: 1000, opponentScore: 2000, myBaseScore: 1000, opponentBaseScore: 2000, scoreGap: -1000, status: 'lost' },
    { lat: 33, lng: -84, heading: 270, matchNumber: 1, round: 2, multiplier: 1, myScore: 2000, opponentScore: 500, myBaseScore: 2000, opponentBaseScore: 500, scoreGap: 1500, status: 'won' },
  ]);
  assert.equal(result.reviewOrder[0].round, 1);
  assert.equal(result.games[0].status, 'won');
  assert.equal(result.games[0].myTotal, 3000);
  assert.equal(result.games.length, 1);
  assert.equal(result.errors.length, 0);
  assert.equal(overviewOpen, false);
});

test('skips an unavailable overview and resumes from a partial export', async () => {
  let open = false;
  let selected = -1;
  let downloaded;
  const previous = { name: 'My OpenGuessr duels', locations: [{ lat: 1, lng: 2 }], games: [{ matchNumber: 1, rounds: [{ round: 1, lat: 1, lng: 2, scores: [{ name: 'A', total: 1200, roundScore: 1200 }], myScore: 1200, opponentScore: 800, scoreGap: 400, status: 'won' }] }, { matchNumber: 2, rounds: [] }], errors: [] };
  const tabs = [{ classList: { contains: () => true }, click() {} }];
  const overview = {
    get textContent() { return selected === 1 ? 'No data available.' : ''; },
    querySelector: selector => selector === 'h1' ? { textContent: 'Overview' }
      : selector === '.close-popup-button' ? { click: () => { open = false; } }
        : selector.startsWith('iframe') && selected === 2 ? { src: 'https://www.google.com/maps/embed/v1/streetview?location=3,4' } : null,
    querySelectorAll: selector => selector === '.tabs-row button' ? tabs : selector === '.score-panel .score-row' ? [
      { querySelector: field => ({ textContent: field === '.score-name' ? 'A' : '1200' }) },
      { querySelector: field => ({ textContent: field === '.score-name' ? 'B' : '800' }) },
    ] : [],
  };
  const rows = [0, 1, 2].map(index => ({
    querySelectorAll: selector => selector === '.player-name' ? [{ textContent: 'A' }, { textContent: 'B' }] : [],
    querySelector: () => ({ click: () => { selected = index; open = true; } }),
  }));
  const history = {
    querySelector: selector => selector === 'h1' ? { textContent: 'Duel history' }
      : selector === '.page-counter' ? { textContent: '1' } : { disabled: true },
    querySelectorAll: selector => selector === '.match-history-item-container' ? rows : [],
  };
  const fileInput = { click() { queueMicrotask(() => { this.files = [{ text: async () => JSON.stringify(previous) }]; this.onchange(); }); } };
  const context = {
    location: { hostname: 'openguessr.com', pathname: '/multiplayer', href: 'https://openguessr.com/multiplayer' },
    window: { __duelExportResume: true },
    document: {
      querySelectorAll: () => [history, ...(open ? [overview] : [])],
      createElement: tag => tag === 'input' ? fileInput : { click() {}, remove() {} },
      body: { append() {} },
    },
    Blob, URL: Object.assign(class extends URL {}, { createObjectURL: blob => { downloaded = blob; return 'blob:test'; }, revokeObjectURL() {} }),
    setTimeout: callback => { queueMicrotask(callback); }, console: { log() {}, error() {} },
  };
  runInNewContext(source, context);
  await context.window.__duelExportTask;
  const result = JSON.parse(await downloaded.text());
  assert.deepEqual(result.locations, [
    { lat: 1, lng: 2, matchNumber: 1, round: 1, multiplier: 1, myScore: 1200, opponentScore: 800, myBaseScore: 1200, opponentBaseScore: 800, scoreGap: 400, status: 'won' },
    { lat: 3, lng: 4, matchNumber: 3, round: 1, multiplier: 1, myScore: 1200, opponentScore: 800, myBaseScore: 1200, opponentBaseScore: 800, scoreGap: 400, status: 'won' },
  ]);
  assert.equal(result.games.length, 3);
  assert.equal(result.games[1].rounds.length, 0);
  assert.match(result.errors[0].error, /No data available/);
  assert.equal(result.nextMatchNumber, null);
});
