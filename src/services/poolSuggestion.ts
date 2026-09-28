import type { Environment, LearnPriority, LocationPoolTarget, PanoramaSource, SamplingMode, SupportedLanguage, UrbanLevel } from '../types';
import { COUNTRIES } from '../data/countries';
import { loadCityPools } from './cityPools';
import { postPool } from './coachClient';

export type PoolSuggestionStage = 'countries' | 'regions' | 'cities';

export async function suggestLocationPool(description: string, language: SupportedLanguage, onProgress?: (stage: PoolSuggestionStage) => void, signal?: AbortSignal) {
  onProgress?.('countries');
  const response = await postPool({ mode: 'pool', description, language }, signal);
  const body = await response.json().catch(() => ({})) as { error?: string; pool?: { countryCodes?: unknown; placeMode?: unknown; placeSelection?: unknown; environment?: unknown; urbanLevel?: unknown; samplingMode?: unknown; priority?: unknown; panoramaSource?: unknown; allowInteriors?: unknown } };
  if (!response.ok || !body.pool) throw new Error(body.error || 'Could not create a geographic pool.');
  const countryCodes = [...new Set(Array.isArray(body.pool.countryCodes) ? body.pool.countryCodes.filter((code): code is string => typeof code === 'string' && code in COUNTRIES) : [])];
  if (!countryCodes.length) throw new Error('Gemini returned no valid countries.');
  const placeMode = body.pool.placeSelection === 'league' ? 'cities' : body.pool.placeMode === 'regions' || body.pool.placeMode === 'cities' ? body.pool.placeMode : 'none';
  const pick = <T extends string>(value: unknown, allowed: readonly T[]) => allowed.includes(value as T) ? value as T : undefined;
  const settings = {
    environment: pick<Environment>(body.pool.environment, ['mixed', 'urban', 'suburban', 'rural']),
    urbanLevel: [1, 2, 3].includes(Number(body.pool.urbanLevel)) ? Number(body.pool.urbanLevel) as UrbanLevel : undefined,
    samplingMode: pick<SamplingMode>(body.pool.samplingMode, ['natural', 'balanced']),
    priority: pick<LearnPriority>(body.pool.priority, ['random', 'familiar', 'least-exposure']),
    panoramaSource: pick<PanoramaSource>(body.pool.panoramaSource, ['official', 'mixed', 'contributor']),
    allowInteriors: typeof body.pool.allowInteriors === 'boolean' ? body.pool.allowInteriors : undefined,
  };
  if (placeMode === 'none') return { countryCodes, locationTargets: [], settings };
  onProgress?.('regions');
  const pools = Object.fromEntries(await Promise.all(countryCodes.map(async (countryCode) => [countryCode, await loadCityPools(countryCode)] as const)));
  const targets: LocationPoolTarget[] = placeMode === 'regions'
    ? countryCodes.flatMap((countryCode) => pools[countryCode].map((region) => ({ kind: 'region' as const, countryCode, regionId: region.id, regionName: region.name })))
    : countryCodes.flatMap((countryCode) => pools[countryCode].flatMap((region) => region.cities.map((city) => ({ kind: 'city' as const, countryCode, regionId: region.id, regionName: region.name, city }))).sort((a, b) => b.city.population - a.city.population).slice(0, Math.max(20, Math.floor(600 / countryCodes.length))));
  if (!targets.length) throw new Error('Could not create a geographic pool.');
  if (placeMode === 'cities') onProgress?.('cities');
  const candidates = targets.map((target, index) => ({ key: `${target.kind === 'region' ? 'r' : 'c'}:${index}`, countryCode: target.countryCode, name: target.kind === 'region' ? target.regionName : target.city.name, kind: target.kind }));
  const refinedResponse = await postPool({ mode: 'pool-places', description, language, selection: body.pool.placeSelection, candidates }, signal);
  const refined = await refinedResponse.json().catch(() => ({})) as { error?: string; places?: { regionKeys?: unknown; cityKeys?: unknown } };
  if (!refinedResponse.ok || !refined.places) throw new Error(refined.error || 'Could not create a geographic pool.');
  const selectedKeys = new Set([...(Array.isArray(refined.places.regionKeys) ? refined.places.regionKeys.map(String) : []), ...(Array.isArray(refined.places.cityKeys) ? refined.places.cityKeys.map(String) : [])]);
  const locationTargets = targets.filter((_, index) => selectedKeys.has(`${placeMode === 'regions' ? 'r' : 'c'}:${index}`));
  if (!locationTargets.length) throw new Error('Could not create a geographic pool.');
  return { countryCodes, locationTargets, settings };
}
