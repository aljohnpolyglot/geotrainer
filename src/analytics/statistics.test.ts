import assert from 'node:assert/strict';
import test from 'node:test';
import type { Attempt } from '../types';
import { breakdown, confusions, environmentOf, filterByRange, metrics, performanceAttempts, rangeBounds, reviewAnalytics } from './statistics';
import { sessionStatistics } from './advanced';

let serial = 0;
const attempt = (actual: string, guess?: string, extra: Partial<Attempt> = {}): Attempt => ({
  id: `a${++serial}`, gameId: 'g', roundNumber: serial, panoId: `p${serial}`, actualLat: 0, actualLng: 0,
  countryCode: actual, guessedLat: guess ? 1 : null, guessedLng: guess ? 1 : null, guessedCountryCode: guess,
  distanceKm: guess ? 100 : null, score: guess ? 3000 : 0, timeSpentSeconds: 20, collectionId: 'world',
  canMove: true, canPan: true, canZoom: true, createdAt: Date.now(), source: 'play', ...extra,
});

test('recognition ladder keeps continent, region, country, and unknown denominators separate', () => {
  const items = [
    attempt('EE', 'EE'), attempt('HU', 'HU'), attempt('JP', 'JP'), attempt('BR', 'BR'),
    attempt('EE', 'LV'), attempt('HU', 'AT'), attempt('EE', 'HU'), attempt('HU', 'RO'),
    attempt('JP', 'BR'), attempt('BR', 'JP'),
  ];
  const ladder = metrics(items).ladder;
  assert.deepEqual([ladder.continent.rate, ladder.region.rate, ladder.country.rate], [.8, .6, .4]);
  const withUnknown = metrics([...items, attempt('EE')]).ladder.country;
  assert.equal(withUnknown.eligible, 10);
  assert.equal(withUnknown.unknown, 1);
  assert.equal(metrics([]).ladder.country.rate, null);
});

test('filters exclude Study, Review, and AI-assisted Play by default and respect local date bounds', () => {
  const normal = attempt('EE', 'EE');
  const review = attempt('EE', 'EE', { source: 'review' });
  const study = attempt('EE', undefined, { source: 'study' });
  const assisted = attempt('EE', 'EE', { aiAssisted: true });
  assert.deepEqual(performanceAttempts([normal, review, study, assisted]).map((item) => item.id), [normal.id]);
  assert.equal(performanceAttempts([normal, review], true).length, 2);
  const noon = new Date(2026, 8, 10, 12).getTime();
  const bounds = rangeBounds('today', noon);
  assert.equal(filterByRange([new Date(2026, 8, 10, 0).getTime(), new Date(2026, 8, 9, 23, 59).getTime()], (value) => value, bounds).length, 1);
  const custom = rangeBounds('custom', noon, { from: '2026-09-01', to: '2026-09-10' });
  assert.equal(filterByRange([new Date(2026, 8, 1).getTime(), new Date(2026, 8, 11).getTime()], (value) => value, custom).length, 1);
});

test('AI-assisted Play is opt-in for performance statistics', () => {
  const assisted = attempt('EE', 'EE', { aiAssisted: true });
  assert.deepEqual(performanceAttempts([assisted]), []);
  assert.deepEqual(performanceAttempts([assisted], false, true).map((item) => item.id), [assisted.id]);
});

test('7, 30, and 90 day ranges include their local boundary and environment filters stay exact', () => {
  const now = new Date(2026, 8, 10, 12).getTime();
  for (const [range, days] of [['7d', 7], ['30d', 30], ['90d', 90]] as const) {
    const bounds = rangeBounds(range, now);
    assert.equal(filterByRange([bounds.from, bounds.from - 1, bounds.to], (value) => value, bounds).length, 2, `${days}-day boundary`);
  }
  const items = [attempt('EE', 'EE', { environmentRequested: 'urban' }), attempt('EE', 'LV', { environmentRequested: 'rural' })];
  const urban = breakdown(items.filter((item) => environmentOf(item) === 'urban'), environmentOf);
  assert.deepEqual(urban.map((item) => [item.key, item.attempts]), [['urban', 1]]);
});

test('review improvement links source attempt and remains chronological', () => {
  const original = attempt('HU', 'LT', { id: 'source', score: 1200, createdAt: 1 });
  const later = attempt('HU', 'HU', { id: 'review-2', source: 'review', sourceAttemptId: 'source', score: 4300, createdAt: 3 });
  const first = attempt('HU', 'HU', { id: 'review-1', source: 'review', sourceAttemptId: 'source', score: 4200, createdAt: 2 });
  const value = reviewAnalytics([later, original, first], []);
  assert.deepEqual(value.improvements.map((item) => item.attempt.id), ['review-1', 'review-2']);
  assert.equal(value.improvements[0].score, 3000);
});

test('directional and symmetric confusions are counted independently', () => {
  const items = [...Array.from({ length: 3 }, () => attempt('EE', 'LV')), ...Array.from({ length: 2 }, () => attempt('LV', 'EE'))];
  const value = confusions(items);
  assert.equal(value.directional.find((item) => item.codes.join(':') === 'EE:LV')?.count, 3);
  assert.equal(value.directional.find((item) => item.codes.join(':') === 'LV:EE')?.count, 2);
  assert.equal(value.symmetric[0].count, 5);
});

test('large deterministic fixture covers at least twenty countries without NaN', () => {
  const codes = ['AR', 'AU', 'BR', 'CA', 'CL', 'CN', 'DE', 'EE', 'ES', 'FI', 'FR', 'GB', 'HU', 'ID', 'IN', 'IT', 'JP', 'KE', 'LV', 'MA', 'MX', 'NO', 'NZ', 'PL', 'RO', 'SE', 'TH', 'TR', 'US', 'ZA'];
  const items = Array.from({ length: 1000 }, (_, index) => attempt(codes[index % codes.length], codes[(index + (index % 3 ? 0 : 1)) % codes.length], {
    environmentRequested: index % 2 ? 'urban' : 'rural', canMove: index % 3 === 0, canPan: index % 3 !== 2, canZoom: index % 3 !== 2,
    createdAt: new Date(2026, index % 9, index % 27 + 1).getTime(),
  }));
  const value = metrics(items);
  assert.equal(new Set(items.map((item) => item.countryCode)).size >= 20, true);
  assert.equal(Number.isFinite(value.averageScore), true);
  assert.equal(Number.isNaN(value.ladder.country.rate), false);
});

test('session statistics ignore empty reload and HMR records', () => {
  const rows = sessionStatistics([
    { id: 'empty-a', startedAt: 1, endedAt: 2, activeTimeSeconds: 0 },
    { id: 'real', startedAt: 3, endedAt: 13, activeTimeSeconds: 10 },
    { id: 'empty-b', startedAt: 14, endedAt: 15, activeTimeSeconds: 0 },
  ], [], []).rows;
  assert.deepEqual(rows.map((item) => item.id), ['real']);
});
