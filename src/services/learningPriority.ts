import { COUNTRIES } from '../data/countries';
import type { LearnPriority, LocationRequestContext, TrainerLocation } from '../types';
import { calculateDistanceKm } from './gameLogic';

type PreferredCandidate = NonNullable<LocationRequestContext['preferredCandidate']>;

const randomItem = <T,>(items: T[], random: () => number) => items[Math.floor(random() * items.length)];

const blindSpot = (countryCode: string, known: TrainerLocation[]): { candidate: PreferredCandidate; score: number } | undefined => {
  const country = COUNTRIES[countryCode];
  if (!country || !known.length || !country.samplePoints.length) return undefined;
  const { minLat, maxLat, minLng, maxLng } = country.bounds;
  const candidates = country.samplePoints;
  const target = candidates.reduce((best, candidate) => {
    const distance = Math.min(...known.map((item) => calculateDistanceKm(candidate.lat, candidate.lng, item.lat, item.lng)));
    return distance > best.distance ? { candidate, distance } : best;
  }, { candidate: candidates[0], distance: -1 });
  const diagonal = calculateDistanceKm(minLat, minLng, maxLat, maxLng);
  return { candidate: { ...target.candidate, countryCode, radiusKm: Math.min(40, Math.max(8, target.distance / 4)) }, score: target.distance / Math.max(1, diagonal) };
};

export function learningPriorityTarget(priority: LearnPriority, countryCodes: string[], locations: TrainerLocation[], random = Math.random): { countryCodes: string[]; preferredCandidate?: PreferredCandidate } {
  if (priority === 'random') return { countryCodes };
  const known = locations.filter((item) => countryCodes.includes(item.countryCode));
  if (!known.length) return { countryCodes };
  if (priority === 'familiar') {
    const anchor = randomItem(known, random);
    return { countryCodes: [anchor.countryCode], preferredCandidate: { lat: anchor.lat, lng: anchor.lng, countryCode: anchor.countryCode, minRadiusKm: 1, radiusKm: 12 } };
  }
  const counts = new Map(countryCodes.map((code) => [code, known.filter((item) => item.countryCode === code).reduce((sum, item) => sum + item.encounterCount, 0)]));
  const minimum = Math.min(...counts.values());
  const leastSeen = countryCodes.filter((code) => counts.get(code) === minimum);
  const unseen = leastSeen.filter((code) => !known.some((item) => item.countryCode === code));
  if (unseen.length) return { countryCodes: [randomItem(unseen, random)] };
  const gaps = leastSeen.flatMap((countryCode) => { const gap = blindSpot(countryCode, known.filter((item) => item.countryCode === countryCode)); return gap ? [{ countryCode, ...gap }] : []; });
  const largest = Math.max(...gaps.map((item) => item.score));
  const target = randomItem(gaps.filter((item) => item.score === largest), random);
  return target ? { countryCodes: [target.countryCode], preferredCandidate: target.candidate } : { countryCodes: [randomItem(leastSeen, random)] };
}
