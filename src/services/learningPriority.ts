import { COUNTRIES } from '../data/countries';
import type { CityPoolRegion, LearnPriority, LocationRequestContext, TrainerLocation } from '../types';
import { calculateDistanceKm } from './gameLogic';
import { normalizeRegionName } from './regionHeatmap';

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

const regionalBlindSpot = (countryCode: string, known: TrainerLocation[], regions: CityPoolRegion[], random: () => number): PreferredCandidate | undefined => {
  const available = regions.filter((region) => region.cities.length);
  if (!available.length) return undefined;
  const exposure = new Map(available.map((region) => [region.id, 0]));
  for (const location of known) {
    const named = location.adminArea && available.find((region) => normalizeRegionName(region.name) === normalizeRegionName(location.adminArea!));
    const nearest = named || available.reduce((best, region) => {
      const distance = Math.min(...region.cities.map((city) => calculateDistanceKm(location.lat, location.lng, city.lat, city.lng)));
      return distance < best.distance ? { region, distance } : best;
    }, { region: available[0], distance: Infinity }).region;
    exposure.set(nearest.id, (exposure.get(nearest.id) || 0) + location.encounterCount);
  }
  const minimum = Math.min(...exposure.values());
  const candidates = available.filter((region) => exposure.get(region.id) === minimum).flatMap((region) => region.cities);
  const city = known.length
    ? candidates.reduce((best, candidate) => {
      const distance = Math.min(...known.map((item) => calculateDistanceKm(candidate.lat, candidate.lng, item.lat, item.lng)));
      return distance > best.distance ? { candidate, distance } : best;
    }, { candidate: candidates[0], distance: -1 }).candidate
    : randomItem(candidates, random);
  return { lat: city.lat, lng: city.lng, countryCode, radiusKm: Math.max(8, city.urbanRadiusKm) };
};

export function learningPriorityTarget(priority: LearnPriority, countryCodes: string[], locations: TrainerLocation[], random = Math.random, regions: CityPoolRegion[] = []): { countryCodes: string[]; preferredCandidate?: PreferredCandidate } {
  if (priority === 'random') return { countryCodes };
  const known = locations.filter((item) => countryCodes.includes(item.countryCode));
  if (priority === 'familiar') {
    if (!known.length) return { countryCodes };
    const anchor = randomItem(known, random);
    return { countryCodes: [anchor.countryCode], preferredCandidate: { lat: anchor.lat, lng: anchor.lng, countryCode: anchor.countryCode, minRadiusKm: 1, radiusKm: 12 } };
  }
  if (countryCodes.length === 1 && regions.length) {
    const candidate = regionalBlindSpot(countryCodes[0], known, regions, random);
    if (candidate) return { countryCodes, preferredCandidate: candidate };
  }
  if (!known.length) return { countryCodes };
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
