import { COUNTRIES } from '../data/countries';
import type { Attempt, Collection, ReviewRecord, StudyVisit, TrainerLocation, TrainingSession } from '../types';
import { geographyFor } from './geography';
import { breakdown, filterByRange, metrics, performanceAttempts, recognition, rollingBest, type Accuracy } from './statistics';

const accuracy = (correct: number, eligible: number): Accuracy => ({ correct, eligible, unknown: 0, rate: eligible ? correct / eligible : null });
const groupBy = <T>(items: T[], key: (item: T) => string | undefined) => {
  const groups = new Map<string, T[]>();
  items.forEach((item) => { const value = key(item); if (value) groups.set(value, [...(groups.get(value) || []), item]); });
  return groups;
};
const localDayKey = (stamp: number) => new Date(stamp).toLocaleDateString('en-CA');

export function regionConfusions(attempts: Attempt[]) {
  const counts = new Map<string, number>();
  attempts.forEach((item) => {
    const actual = geographyFor(item.countryCode)?.region;
    const guessed = geographyFor(item.guessedCountryCode)?.region;
    if (!actual || !guessed || actual === guessed) return;
    const key = `${actual} → ${guessed}`;
    counts.set(key, (counts.get(key) || 0) + 1);
  });
  return [...counts].map(([pair, count]) => ({ pair, count })).sort((a, b) => b.count - a.count);
}

export function retentionAndLapses(attempts: Attempt[]) {
  const grouped = groupBy(attempts.filter((item) => item.source === 'review'), (item) => item.panoId);
  const thresholds = [1, 7, 30];
  const totals = new Map(thresholds.map((days) => [days, { correct: 0, eligible: 0 }]));
  const lapseCountries = new Map<string, number>();
  const lapseLocations = new Map<string, number>();
  grouped.forEach((items, panoId) => {
    const ordered = items.sort((a, b) => a.createdAt - b.createdAt);
    for (let i = 1; i < ordered.length; i++) {
      const previous = ordered[i - 1]; const current = ordered[i];
      const previousCorrect = previous.guessedCountryCode === previous.countryCode;
      const currentCorrect = current.guessedCountryCode === current.countryCode;
      if (previousCorrect && !currentCorrect) {
        lapseCountries.set(current.countryCode, (lapseCountries.get(current.countryCode) || 0) + 1);
        lapseLocations.set(panoId, (lapseLocations.get(panoId) || 0) + 1);
      }
      if (!previousCorrect) continue;
      const gapDays = (current.createdAt - previous.createdAt) / 86400000;
      thresholds.forEach((days) => {
        if (gapDays < days) return;
        const total = totals.get(days)!; total.eligible++; if (currentCorrect) total.correct++;
      });
    }
  });
  const sorted = (map: Map<string, number>) => [...map].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count);
  return { retention: thresholds.map((days) => ({ days, ...accuracy(totals.get(days)!.correct, totals.get(days)!.eligible) })), lapseCountries: sorted(lapseCountries), lapseLocations: sorted(lapseLocations) };
}

export function exposurePerformance(visits: StudyVisit[], attempts: Attempt[], includeAssisted = false) {
  const visitGroups = groupBy(visits, (item) => item.countryCode);
  const attemptGroups = groupBy(performanceAttempts(attempts, false, includeAssisted), (item) => item.countryCode);
  const codes = new Set([...visitGroups.keys(), ...attemptGroups.keys()]);
  return [...codes].map((code) => {
    const exposure = visitGroups.get(code) || []; const played = attemptGroups.get(code) || [];
    return { code, exposures: exposure.length, studySeconds: exposure.reduce((sum, item) => sum + item.activeTimeSeconds, 0), revealed: exposure.filter((item) => item.wasRevealed).length, played: played.length, accuracy: recognition(played).country };
  }).sort((a, b) => b.exposures - a.exposures);
}

export function coverageByContinent(locations: TrainerLocation[]) {
  const supported = groupBy(Object.keys(COUNTRIES), (code) => geographyFor(code)?.continent);
  const seen = groupBy([...new Set(locations.map((item) => item.countryCode))], (code) => geographyFor(code)?.continent);
  return [...supported].map(([continent, codes]) => ({ continent, supported: codes.length, seen: seen.get(continent)?.length || 0 })).sort((a, b) => a.continent.localeCompare(b.continent));
}

export function collectionStatistics(attempts: Attempt[], reviews: ReviewRecord[], collections: Collection[], includeAssisted = false) {
  const names = new Map(collections.map((item) => [item.id, item.name]));
  return breakdown(performanceAttempts(attempts, false, includeAssisted), (item) => item.collectionId).map((item) => ({ ...item, name: names.get(item.key) || item.key, reviewed: attempts.filter((attempt) => attempt.source === 'review' && attempt.collectionId === item.key).length, due: reviews.filter((review) => review.dueAt <= Date.now() && attempts.some((attempt) => attempt.collectionId === item.key && attempt.panoId === review.panoId)).length }));
}

export function sessionStatistics(sessions: TrainingSession[], attempts: Attempt[], visits: StudyVisit[], includeAssisted = false) {
  const ordered = sessions.filter((item) => item.activeTimeSeconds >= 5).sort((a, b) => a.startedAt - b.startedAt);
  const rows = ordered.map((session, index) => {
    const to = session.endedAt || ordered[index + 1]?.startedAt || Date.now();
    const within = (stamp: number) => stamp >= session.startedAt && stamp <= to;
    const play = performanceAttempts(attempts, false, includeAssisted).filter((item) => within(item.createdAt));
    const review = attempts.filter((item) => item.source === 'review' && within(item.createdAt));
    const study = visits.filter((item) => within(item.openedAt));
    return { ...session, endedAt: to, play: play.length, reviews: review.length, study: study.length, countries: new Set([...play, ...review].map((item) => item.countryCode)).size, accuracy: recognition(play).country, averageScore: metrics(play).averageScore };
  });
  const eligible = rows.filter((item) => item.accuracy.eligible >= 10 && (item.accuracy.rate || 0) >= .7);
  return { rows: rows.reverse(), bestAccuracy: [...rows].sort((a, b) => (b.accuracy.rate || 0) - (a.accuracy.rate || 0))[0], fastestAccurate: [...eligible].sort((a, b) => a.activeTimeSeconds - b.activeTimeSeconds)[0], mostReviews: [...rows].sort((a, b) => b.reviews - a.reviews)[0] };
}

export function activitySeries(sessions: TrainingSession[], attempts: Attempt[], visits: StudyVisit[]) {
  const keys = new Set([...sessions.map((item) => localDayKey(item.startedAt)), ...attempts.map((item) => localDayKey(item.createdAt)), ...visits.map((item) => localDayKey(item.openedAt))]);
  return [...keys].sort().map((day) => ({ day, minutes: Math.round(sessions.filter((item) => localDayKey(item.startedAt) === day).reduce((sum, item) => sum + item.activeTimeSeconds, 0) / 60), interactions: attempts.filter((item) => localDayKey(item.createdAt) === day).length + visits.filter((item) => localDayKey(item.openedAt) === day).length }));
}

export function personalBests(attempts: Attempt[], sessions: TrainingSession[], visits: StudyVisit[], includeAssisted = false) {
  const play = performanceAttempts(attempts, false, includeAssisted);
  const inverseDistance = rollingBest(play, 20, (items) => { const value = metrics(items).medianDistance; return value === null ? null : -value; });
  return { best20: rollingBest(play, 20, (items) => recognition(items).country.rate), best50: rollingBest(play, 50, (items) => recognition(items).country.rate), lowestMedian20: inverseDistance === null ? null : -inverseDistance, fastestAccurateSession: sessionStatistics(sessions, attempts, visits, includeAssisted).fastestAccurate };
}

export function learningVelocity(attempts: Attempt[], locations: TrainerLocation[], now = Date.now(), includeAssisted = false) {
  const date = new Date(now);
  const weekStart = new Date(date.getFullYear(), date.getMonth(), date.getDate() - (date.getDay() + 6) % 7).getTime();
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1).getTime();
  const previousMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1).getTime();
  const play = performanceAttempts(attempts, false, includeAssisted).sort((a, b) => a.createdAt - b.createdAt);
  const current = metrics(play.filter((item) => item.createdAt >= monthStart));
  const previous = metrics(play.filter((item) => item.createdAt >= previousMonth && item.createdAt < monthStart));
  const mastered = [...groupBy(play, (item) => item.countryCode)].filter(([, items]) => {
    if (items.length < 10) return false;
    for (let index = 9; index < items.length; index++) {
      const window = items.slice(index - 9, index + 1);
      if ((recognition(window).country.rate || 0) >= .7) return items[index].createdAt >= monthStart;
    }
    return false;
  }).length;
  return {
    newCountriesThisWeek: new Set(locations.filter((item) => item.firstSeenAt >= weekStart).map((item) => item.countryCode)).size,
    newlyMasteredThisMonth: mastered,
    accuracyGain: current.ladder.country.rate === null || previous.ladder.country.rate === null ? null : current.ladder.country.rate - previous.ladder.country.rate,
    scoreGain: current.averageScore === null || previous.averageScore === null ? null : current.averageScore - previous.averageScore,
  };
}

export function targetedTrainingComparisons(attempts: Attempt[], visits: StudyVisit[], collections: Collection[], includeAssisted = false) {
  const play = performanceAttempts(attempts, false, includeAssisted);
  const collectionById = new Map(collections.map((item) => [item.id, item]));
  const firstTargets = new Map<string, StudyVisit>();
  visits.forEach((visit) => {
    const environment = visit.environmentRequested || visit.environment;
    if (!environment || environment === 'mixed') return;
    const key = `${visit.collectionId}:${environment}`;
    if (!firstTargets.has(key) || firstTargets.get(key)!.openedAt > visit.openedAt) firstTargets.set(key, visit);
  });
  return [...firstTargets].map(([key, target]) => {
    const [collectionId, environment] = key.split(':');
    const collection = collectionById.get(collectionId);
    const relevant = play.filter((item) => collection?.countryCodes.includes(item.countryCode));
    const before = metrics(relevant.filter((item) => item.createdAt < target.openedAt));
    const after = metrics(relevant.filter((item) => item.createdAt >= target.openedAt));
    return { key, name: `${collection?.name || collectionId} + ${environment}`, startedAt: target.openedAt, before, after };
  }).filter((item) => item.before.attempts && item.after.attempts).sort((a, b) => b.startedAt - a.startedAt);
}

export function filteredCanonical<T>(items: T[], time: (item: T) => number, bounds: { from: number; to: number }) {
  return filterByRange(items, time, bounds);
}
