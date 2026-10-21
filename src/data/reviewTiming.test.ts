import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewDayStart } from './reviewTiming';
import { DEFAULT_SCHEDULER_PREFERENCES } from './reviewPreferences';

test('cached day boundaries distinguish time zones, reset minutes, and daylight saving days', () => {
  const prefs = { ...DEFAULT_SCHEDULER_PREFERENCES, reviewTimeZone: 'America/New_York', reviewDayResetMinutes: 240 };
  const before = Date.parse('2026-03-08T07:59:59.999Z');
  const after = before + 1;
  assert.equal(reviewDayStart(before, prefs), Date.parse('2026-03-07T09:00:00Z'));
  assert.equal(reviewDayStart(after, prefs), Date.parse('2026-03-08T08:00:00Z'));
  assert.equal(reviewDayStart(after + 59999, prefs), reviewDayStart(after, prefs));
  assert.equal(reviewDayStart(after, { ...prefs, reviewTimeZone: 'UTC' }), Date.parse('2026-03-08T04:00:00Z'));
  assert.equal(reviewDayStart(after, { ...prefs, reviewDayResetMinutes: 300 }), Date.parse('2026-03-07T10:00:00Z'));
  for (let day = 0; day < 600; day++) reviewDayStart(after + day * 86400000, prefs);
  assert.equal(reviewDayStart(before, prefs), Date.parse('2026-03-07T09:00:00Z'));
});

test('repeated date checks reuse their time-zone formatter', () => {
  const original = Intl.DateTimeFormat;
  let constructed = 0;
  Intl.DateTimeFormat = new Proxy(original, { construct(target, args) { constructed++; return Reflect.construct(target, args); } });
  try {
    const prefs = { ...DEFAULT_SCHEDULER_PREFERENCES, reviewTimeZone: 'Pacific/Honolulu' };
    for (let i = 0; i < 1000; i++) reviewDayStart(Date.UTC(2026, 9, 21, 0, i), prefs);
    assert.equal(constructed, 1);
  } finally { Intl.DateTimeFormat = original; }
});
