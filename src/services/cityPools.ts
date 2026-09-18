import type { CityPoolCity, CityPoolRegion, LocationPoolTarget } from '../types';

const cache = new Map<string, Promise<CityPoolRegion[]>>();

export const locationTargetKey = (target: LocationPoolTarget) => target.kind === 'region'
  ? `${target.countryCode}:${target.regionId}:all`
  : `${target.countryCode}:${target.regionId}:${target.city.lat}:${target.city.lng}`;

export function loadCityPools(countryCode: string) {
  const code = countryCode.toUpperCase();
  if (!cache.has(code)) cache.set(code, fetch(`${import.meta.env.BASE_URL}city-pools/${code.toLowerCase()}.json`)
    .then((response) => response.ok ? response.json() as Promise<CityPoolRegion[]> : []).catch(() => []));
  return cache.get(code)!;
}

export async function resolveLocationTargets(targets: LocationPoolTarget[]) {
  const countries = new Map<string, CityPoolRegion[]>();
  await Promise.all([...new Set(targets.filter((target) => target.kind === 'region').map((target) => target.countryCode))]
    .map(async (code) => countries.set(code, await loadCityPools(code))));
  const resolved: Array<{ target: LocationPoolTarget; cities: CityPoolCity[] }> = [];
  for (const target of targets) {
    const cities = target.kind === 'city' ? [target.city] : countries.get(target.countryCode)?.find((region) => region.id === target.regionId)?.cities || [];
    if (cities.length) resolved.push({ target, cities });
  }
  return resolved;
}

export function pickLocationTargetCity(resolved: Array<{ target: LocationPoolTarget; cities: CityPoolCity[] }>, random = Math.random) {
  const pool = resolved[Math.floor(random() * resolved.length)];
  return pool && { target: pool.target, city: pool.cities[Math.floor(random() * pool.cities.length)] };
}
