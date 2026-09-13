import type { SchedulerPreferences } from '../types';

export const detectedTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const zonedParts = (value: number, timeZone: string) => Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(value)).filter(({ type }) => type !== 'literal').map(({ type, value: part }) => [type, Number(part)])) as Record<string, number>;
const utcForZonedDateTime = (parts: Record<string, number>, timeZone: string) => {
  let candidate = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const local = zonedParts(candidate, timeZone);
    candidate += Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute) - Date.UTC(local.year, local.month - 1, local.day, local.hour, local.minute);
  }
  return candidate;
};
export const reviewDayStart = (value: number, preferences: SchedulerPreferences) => {
  const timeZone = preferences.reviewTimeZone || detectedTimeZone();
  const reset = preferences.reviewDayResetMinutes ?? 0;
  const current = zonedParts(value, timeZone);
  const beforeReset = current.hour * 60 + current.minute < reset;
  const date = new Date(Date.UTC(current.year, current.month - 1, current.day - (beforeReset ? 1 : 0)));
  return utcForZonedDateTime({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour: Math.floor(reset / 60), minute: reset % 60 }, timeZone);
};
export const nextReviewDayBoundary = (value: number, preferences: SchedulerPreferences) => nextReviewAt(value, 1, preferences);
export const nextReviewAt = (value: number, intervalDays: number, preferences: SchedulerPreferences) => {
  if (intervalDays < 1) return value + intervalDays * 864e5;
  const start = reviewDayStart(value, preferences);
  const timeZone = preferences.reviewTimeZone || detectedTimeZone();
  const parts = zonedParts(start, timeZone);
  const target = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + Math.ceil(intervalDays)));
  return utcForZonedDateTime({ year: target.getUTCFullYear(), month: target.getUTCMonth() + 1, day: target.getUTCDate(), hour: parts.hour, minute: parts.minute }, timeZone);
};
