import type { Attempt, ReviewRecord, StudyVisit, TrainerLocation } from '../types';

export type ReviewEvent = { at: number; grade: string; panoId: string };
export type AnkiStats = {
  today: number;
  last7: number;
  all: number;
  due: number;
  cards: { new: number; learning: number; relearning: number; young: number; mature: number; total: number };
  mastery: { name: string; current: number; next?: number; progress: number };
  grades: Record<string, number>;
  futureDue: Array<{ day: number; count: number }>;
  calendar: Array<{ day: number; count: number }>;
  intervals: Array<{ label: string; count: number }>;
  added: Array<{ day: number; count: number }>;
};

const startOfDay = (stamp: number) => {
  const date = new Date(stamp);
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
};
const localDay = (stamp: number, offset: number) => {
  const date = new Date(stamp);
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() + offset);
  return date.getTime();
};

export function ankiStatistics(attempts: Attempt[], reviews: ReviewRecord[], visits: StudyVisit[], locations: TrainerLocation[], now = Date.now(), readyDueCount?: number): AnkiStats {
  const today = startOfDay(now);
  const events: ReviewEvent[] = reviews.flatMap((review) => review.gradingHistory.map((item) => ({ at: item.at, grade: item.grade, panoId: review.panoId })));
  const completedEvents = events.filter((event) => event.at <= now);
  const cards = { new: 0, learning: 0, relearning: 0, young: 0, mature: 0, total: reviews.length };
  reviews.forEach((review) => {
    if (review.reviewCount === 0) cards.new++;
    else if (review.gradingHistory.filter((item) => item.at <= now).at(-1)?.grade === 'again') cards.relearning++;
    else if (review.intervalDays <= 1) cards.learning++;
    else if (review.intervalDays >= 21) cards.mature++;
    else cards.young++;
  });
  const grades: Record<string, number> = {};
  completedEvents.forEach((event) => { grades[event.grade] = (grades[event.grade] || 0) + 1; });
  const futureDue = Array.from({ length: 31 }, (_, offset) => {
    const day = localDay(now, offset);
    return { day, count: offset === 0 && readyDueCount !== undefined ? readyDueCount : reviews.filter((review) => startOfDay(review.dueAt) === day).length };
  });
  const calendar = Array.from({ length: 84 }, (_, offset) => {
    const day = localDay(now, offset - 83);
    return { day, count: completedEvents.filter((event) => startOfDay(event.at) === day).length };
  });
  const intervalBuckets = [['<1d', 0], ['1–6d', 0], ['7–20d', 0], ['21–90d', 0], ['90d+', 0]] as [string, number][];
  attempts.filter((attempt) => attempt.source === 'review' && attempt.intervalDays !== undefined).forEach((attempt) => {
    const interval = attempt.intervalDays || 0;
    const index = interval < 1 ? 0 : interval < 7 ? 1 : interval < 21 ? 2 : interval <= 90 ? 3 : 4;
    intervalBuckets[index][1]++;
  });
  const added = Array.from({ length: 30 }, (_, offset) => {
    const day = localDay(now, offset - 29);
    const seen = locations.filter((location) => startOfDay(location.firstSeenAt) === day).length;
    const visitsOnDay = visits.filter((visit) => startOfDay(visit.openedAt) === day).length;
    return { day, count: seen || visitsOnDay };
  });
  return {
    today: completedEvents.filter((event) => event.at >= today).length,
    last7: completedEvents.filter((event) => event.at >= localDay(now, -6)).length,
    all: completedEvents.length,
    due: readyDueCount ?? reviews.filter((review) => review.dueAt <= now).length,
    cards,
    mastery: masteryTier(cards.mature),
    grades,
    futureDue,
    calendar,
    intervals: intervalBuckets.map(([label, count]) => ({ label, count })),
    added,
  };
}

const MASTERY_TIERS = [
  ['Newcomer', 0], ['Scout', 10], ['Explorer', 25], ['Pathfinder', 50], ['Navigator', 100],
  ['Cartographer', 250], ['Geographer', 500], ['Atlas', 1000], ['World Master', 2500], ['Grandmaster', 5000],
] as const;
export const masteryTier = (mature: number) => {
  let index = 0;
  MASTERY_TIERS.forEach(([, minimum], candidate) => { if (mature >= minimum) index = candidate; });
  const [name, current] = MASTERY_TIERS[index];
  const next = MASTERY_TIERS[index + 1]?.[1];
  return { name, current, next, progress: next ? (mature - current) / (next - current) : 1 };
};

export const dayLabel = (stamp: number) => new Date(stamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
export const calendarLevel = (count: number, max: number) => count === 0 ? 0 : Math.min(4, Math.ceil((count / Math.max(1, max)) * 4));
