import type { LocationPoolTarget, SupportedLanguage } from '../types';
import { COUNTRIES } from '../data/countries';
import { loadCityPools, locationTargetKey } from './cityPools';
import { postCoach } from './coachClient';

const normalize = (value: string) => value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim();
export const placeNameMatches = (place: { name: string; names?: Partial<Record<SupportedLanguage, string>> }, name: string) => [place.name, ...Object.values(place.names || {})].some((candidate) => normalize(candidate) === normalize(name));

export async function suggestLocationPool(description: string, language: SupportedLanguage, signal?: AbortSignal) {
  const response = await postCoach({ mode: 'pool', description, language }, signal);
  const body = await response.json().catch(() => ({})) as { error?: string; pool?: { countryCodes?: unknown; regions?: unknown; cities?: unknown } };
  if (!response.ok || !body.pool) throw new Error(body.error || 'Could not create a geographic pool.');
  const countryCodes = [...new Set(Array.isArray(body.pool.countryCodes) ? body.pool.countryCodes.filter((code): code is string => typeof code === 'string' && code in COUNTRIES) : [])];
  if (!countryCodes.length) throw new Error('Gemini returned no valid countries.');
  const requestedRegions = Array.isArray(body.pool.regions) ? body.pool.regions : [];
  const requestedCities = Array.isArray(body.pool.cities) ? body.pool.cities : [];
  const targets: LocationPoolTarget[] = [];
  await Promise.all(countryCodes.map(async (countryCode) => {
    const regions = await loadCityPools(countryCode);
    for (const value of requestedRegions) {
      const item = value && typeof value === 'object' ? value as Record<string, unknown> : {}; if (item.countryCode !== countryCode || typeof item.name !== 'string') continue;
      const region = regions.find((candidate) => placeNameMatches(candidate, item.name as string)); if (region) targets.push({ kind: 'region', countryCode, regionId: region.id, regionName: region.name });
    }
    for (const value of requestedCities) {
      const item = value && typeof value === 'object' ? value as Record<string, unknown> : {}; if (item.countryCode !== countryCode || typeof item.name !== 'string') continue;
      const found = regions.flatMap((region) => region.cities.map((city) => ({ region, city }))).find(({ city }) => placeNameMatches(city, item.name as string));
      if (found) targets.push({ kind: 'city', countryCode, regionId: found.region.id, regionName: found.region.name, city: found.city });
    }
  }));
  const cityRegions = new Set(targets.filter((target) => target.kind === 'city').map((target) => `${target.countryCode}:${target.regionId}`));
  const locationTargets = [...new Map(targets.filter((target) => target.kind === 'city' || !cityRegions.has(`${target.countryCode}:${target.regionId}`)).map((target) => [locationTargetKey(target), target])).values()];
  return { countryCodes, locationTargets };
}
