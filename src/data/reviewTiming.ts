import type { ReviewRecord, SchedulerPreferences } from '../types';

export const detectedTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
const formatters = new Map<string, Intl.DateTimeFormat>();
const dayStarts = new Map<string, number>();
const zonedParts = (value: number, timeZone: string) => {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
    formatters.set(timeZone, formatter);
    if (formatters.size > 8) formatters.delete(formatters.keys().next().value!);
  }
  return Object.fromEntries(formatter.formatToParts(new Date(value)).filter(({ type }) => type !== 'literal').map(({ type, value: part }) => [type, Number(part)])) as Record<string, number>;
};
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
  const key = `${timeZone}:${reset}:${Math.floor(value / 60000)}`;
  const cached = dayStarts.get(key);
  if (cached !== undefined) return cached;
  const current = zonedParts(value, timeZone);
  const beforeReset = current.hour * 60 + current.minute < reset;
  const date = new Date(Date.UTC(current.year, current.month - 1, current.day - (beforeReset ? 1 : 0)));
  const start = utcForZonedDateTime({ year: date.getUTCFullYear(), month: date.getUTCMonth() + 1, day: date.getUTCDate(), hour: Math.floor(reset / 60), minute: reset % 60 }, timeZone);
  dayStarts.set(key, start);
  if (dayStarts.size > 512) dayStarts.delete(dayStarts.keys().next().value!);
  return start;
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
export const effectiveReviewDueAt = (review: Pick<ReviewRecord, 'dueAt' | 'intervalDays'>, preferences: SchedulerPreferences) => review.intervalDays < 1 ? review.dueAt : reviewDayStart(review.dueAt, preferences);
export const nextScheduledReviewAt = (reviews: Array<Pick<ReviewRecord, 'dueAt' | 'intervalDays'>>, now: number, preferences: SchedulerPreferences) => reviews.reduce<number | undefined>((next, review) => {
  const candidate = effectiveReviewDueAt(review, preferences);
  return candidate > now && (next === undefined || candidate < next) ? candidate : next;
}, undefined);
