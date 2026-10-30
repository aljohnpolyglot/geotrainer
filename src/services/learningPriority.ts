import { COUNTRIES } from '../data/countries';
import type { Attempt, CityPoolRegion, Environment, LearnPriority, LocationRequestContext, TrainerLocation } from '../types';
import { calculateDistanceKm } from './gameLogic';
import { normalizeRegionName } from './regionHeatmap';
import coverageTraining from '../data/streetViewCoverageTraining.json';

type PreferredCandidate = NonNullable<LocationRequestContext['preferredCandidate']>;

const randomItem = <T,>(items: T[], random: () => number) => items[Math.floor(random() * items.length)];
const countryExposure = (countryCode: string, locations: TrainerLocation[]) => locations.filter((item) => item.countryCode === countryCode).reduce((sum, item) => sum + item.encounterCount, 0);
const trainedCoverage = new Set<string>(coverageTraining.reliableCountryCodes);
export const trainedWorldCountries = (countryCodes: string[]) => countryCodes.filter((code) => trainedCoverage.has(code));

export const leastExposureCountryOrder = (countryCodes: string[], locations: TrainerLocation[], firstCountryCode?: string, random = Math.random) => {
  const remaining = countryCodes.filter((code) => code !== firstCountryCode)
    .map((code) => { const exposure = countryExposure(code, locations); return { code, exposure, proven: exposure > 0, tie: random() }; })
    .sort((a, b) => Number(b.proven) - Number(a.proven) || a.exposure - b.exposure || a.tie - b.tie)
    .map((item) => item.code);
  return firstCountryCode && countryCodes.includes(firstCountryCode) ? [firstCountryCode, ...remaining] : remaining;
};

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
  const counts = new Map(countryCodes.map((code) => [code, countryExposure(code, known)]));
  const minimum = Math.min(...counts.values());
  const leastSeen = countryCodes.filter((code) => counts.get(code) === minimum);
  const unseen = leastSeen.filter((code) => !known.some((item) => item.countryCode === code));
  if (unseen.length) return { countryCodes: [randomItem(unseen, random)] };
  const gaps = leastSeen.flatMap((countryCode) => { const gap = blindSpot(countryCode, known.filter((item) => item.countryCode === countryCode)); return gap ? [{ countryCode, ...gap }] : []; });
  const largest = Math.max(...gaps.map((item) => item.score));
  const target = randomItem(gaps.filter((item) => item.score === largest), random);
  return target ? { countryCodes: [target.countryCode], preferredCandidate: target.candidate } : { countryCodes: [randomItem(leastSeen, random)] };
}

const attemptDifficulty = (attempt: Attempt) => {
  if (attempt.guessedCountryCode !== attempt.countryCode) return 1;
  const bounds = COUNTRIES[attempt.countryCode]?.bounds;
  if (!bounds || attempt.distanceKm === null) return 0.5;
  const diameter = calculateDistanceKm(bounds.minLat, bounds.minLng, bounds.maxLat, bounds.maxLng);
  return Math.min(1, attempt.distanceKm / Math.max(25, diameter * 0.15));
};

const weakness = (attempts: Attempt[]) => (2 + attempts.reduce((sum, attempt) => sum + attemptDifficulty(attempt), 0)) / (4 + attempts.length);

export function weakSpotsTarget(countryCodes: string[], locations: TrainerLocation[], attempts: Attempt[], environment: Environment, random = Math.random, regions: CityPoolRegion[] = []): { countryCodes: string[]; preferredCandidate?: PreferredCandidate; environment?: Environment } {
  const eligible = attempts.filter((attempt) => countryCodes.includes(attempt.countryCode) && (attempt.source === 'play' || attempt.source === 'review' && !!attempt.grade) && attempt.guessedLat !== null && !!attempt.guessedCountryCode && !attempt.aiAssisted && !attempt.coachUsed && (environment === 'mixed' || attempt.environment === environment || attempt.environmentRequested === environment));
  if (!eligible.length || random() < Math.max(0.25, 8 / (8 + eligible.length))) return learningPriorityTarget('least-exposure', countryCodes, locations, random, regions);
  const byCountry = new Map<string, Attempt[]>();
  for (const attempt of eligible) {
    const bucket = byCountry.get(attempt.countryCode) || [];
    if (bucket.length < 20) bucket.push(attempt);
    byCountry.set(attempt.countryCode, bucket);
  }
  const recentCountry = locations.reduce((latest, location) => location.lastSeenAt > latest.at && countryCodes.includes(location.countryCode) ? { code: location.countryCode, at: location.lastSeenAt } : latest, { code: '', at: 0 }).code;
  const candidates = [...byCountry.keys()].filter((code) => code !== recentCountry || byCountry.size === 1);
  const weights = candidates.map((code) => 0.3 + 2 * weakness(byCountry.get(code)!));
  let draw = random() * weights.reduce((sum, weight) => sum + weight, 0);
  const countryCode = candidates.find((_, index) => (draw -= weights[index]) < 0) || candidates.at(-1)!;
  const countryAttempts = byCountry.get(countryCode)!;
  const locationByPano = new Map(locations.filter((location) => location.countryCode === countryCode).map((location) => [location.panoId, location]));
  const regionCandidates = regions.flatMap((region) => {
    const names = [region.name, ...Object.values(region.names || {})].map(normalizeRegionName);
    const matching = countryAttempts.filter((attempt) => {
      const area = locationByPano.get(attempt.panoId)?.adminArea;
      return area && names.includes(normalizeRegionName(area));
    });
    return matching.length && region.cities.length ? [{ region, matching }] : [];
  });
  const weakestRegion = regionCandidates.length && countryAttempts.length >= 3 ? regionCandidates.sort((a, b) => weakness(b.matching) - weakness(a.matching))[0].region : undefined;
  const city = weakestRegion && randomItem(weakestRegion.cities, random);
  const environmentCandidates = environment === 'mixed' ? (['urban', 'suburban', 'rural'] as const).map((kind) => ({ kind, matching: countryAttempts.filter((attempt) => attempt.environment === kind) })).filter((item) => item.matching.length >= 4) : [];
  const targetEnvironment = environmentCandidates.length >= 2 ? environmentCandidates.sort((a, b) => weakness(b.matching) - weakness(a.matching))[0].kind : undefined;
  return { countryCodes: [countryCode], ...(city ? { preferredCandidate: { lat: city.lat, lng: city.lng, countryCode, radiusKm: Math.max(8, city.urbanRadiusKm) } } : {}), ...(targetEnvironment ? { environment: targetEnvironment } : {}) };
}
