import assert from 'node:assert/strict';
import test from 'node:test';
import type { Attempt, ReviewRecord, StudyVisit, TrainerLocation } from '../types';
import { ankiStatistics, masteryTier } from './anki';

const now = new Date(2026, 8, 11, 12).getTime();
let attemptNumber = 0;
const review = (panoId: string, intervalDays: number, history: ReviewRecord['gradingHistory'], dueAt = now): ReviewRecord => ({
  id: panoId, panoId, intervalDays, dueAt, gradingHistory: history, lapseCount: history.filter((item) => item.grade === 'again').length, reviewCount: history.length,
});
const attempt = (extra: Partial<Attempt> = {}): Attempt => ({
  id: `review-${++attemptNumber}`, gameId: 'game', roundNumber: 1, panoId: 'pano', actualLat: 0, actualLng: 0, countryCode: 'US',
  guessedLat: 0, guessedLng: 0, guessedCountryCode: 'US', distanceKm: 1, score: 4500, timeSpentSeconds: 10,
  collectionId: 'world', canMove: true, canPan: true, canZoom: true, createdAt: now, source: 'review', ...extra,
});
const location = (firstSeenAt: number): TrainerLocation => ({
  id: `location-${firstSeenAt}`, panoId: `pano-${firstSeenAt}`, lat: 0, lng: 0, countryCode: 'US', firstSeenAt, lastSeenAt: firstSeenAt, encounterCount: 1,
});
const visit = (openedAt: number): StudyVisit => ({ id: `visit-${openedAt}`, panoId: 'visit-pano', lat: 0, lng: 0, countryCode: 'US', collectionId: 'world', openedAt, activeTimeSeconds: 10, wasRevealed: false, bookmarked: false });

test('Anki statistics aggregate review history, maturity, due days, and activity without counting future answers', () => {
  const yesterday = new Date(2026, 8, 10, 12).getTime();
  const tomorrow = new Date(2026, 8, 12, 12).getTime();
  const reviews = [
    review('new', 0, [], now),
    review('learning', .5, [{ grade: 'good', at: now - 60_000 }], tomorrow),
    review('relearning', .1, [{ grade: 'good', at: yesterday }, { grade: 'again', at: now - 60_000 }], tomorrow),
    review('young', 7, [{ grade: 'good', at: yesterday }], tomorrow),
    review('mature', 30, [{ grade: 'easy', at: now + 60_000 }], tomorrow),
  ];
  const stats = ankiStatistics([attempt({ panoId: 'learning', intervalDays: 7 }), attempt({ panoId: 'mature', intervalDays: 30 })], reviews, [visit(now)], [location(now)], now);

  assert.deepEqual(stats.cards, { new: 1, learning: 1, relearning: 1, young: 1, mature: 1, total: 5 });
  assert.equal(stats.today, 2);
  assert.equal(stats.last7, 4);
  assert.equal(stats.all, 4);
  assert.equal(stats.grades.again, 1);
  assert.equal(stats.grades.good, 3);
  assert.equal(stats.grades.easy, undefined);
  assert.equal(stats.due, 1);
  assert.equal(stats.futureDue[0].count, 1);
  assert.equal(stats.futureDue[1].count, 4);
  assert.equal(stats.intervals.find((item) => item.label === '7–20d')?.count, 1);
  assert.equal(stats.intervals.find((item) => item.label === '21–90d')?.count, 1);
  assert.equal(stats.added.at(-1)?.count, 1);
  assert.equal(stats.calendar.at(-1)?.count, 2);
  assert.deepEqual(masteryTier(1000), { name: 'Atlas', current: 1000, next: 2500, progress: 0 });
});

test('Anki today counts use the daily-limited ready queue when provided', () => {
  const reviews = Array.from({ length: 5 }, (_, index) => review(`due-${index}`, 1, [], now));
  const stats = ankiStatistics([], reviews, [], [], now, 3);
  assert.equal(stats.due, 3);
  assert.equal(stats.futureDue[0].count, 3);
});
