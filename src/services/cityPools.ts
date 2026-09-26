import type { CityPoolCity, CityPoolRegion, LocationPoolTarget, SupportedLanguage } from '../types';

const cache = new Map<string, Promise<CityPoolRegion[]>>();

export const locationTargetKey = (target: LocationPoolTarget) => target.kind === 'region'
  ? `${target.countryCode}:${target.regionId}:all`
  : `${target.countryCode}:${target.regionId}:${target.city.lat}:${target.city.lng}`;

export const localizedPoolName = (place: Pick<CityPoolCity, 'name' | 'names'>, language: SupportedLanguage) => place.names?.[language] || place.name;

export function locationPoolChoices(countryCodes: string[], pools: Record<string, CityPoolRegion[]>, selected: LocationPoolTarget[], order: 'importance' | 'alphabetical', language: SupportedLanguage = 'en') {
  const selectedKeys = new Set(selected.map(locationTargetKey));
  const collator = new Intl.Collator(language);
  return countryCodes.map((countryCode) => ({
    countryCode,
    regions: [...(pools[countryCode] || [])].sort((a, b) => collator.compare(localizedPoolName(a, language), localizedPoolName(b, language))).map((region) => {
      const cities = [...region.cities].sort(order === 'alphabetical' ? (a, b) => collator.compare(localizedPoolName(a, language), localizedPoolName(b, language)) : (a, b) => b.population - a.population || collator.compare(localizedPoolName(a, language), localizedPoolName(b, language)));
      const targets: LocationPoolTarget[] = [
        { kind: 'region', countryCode, regionId: region.id, regionName: region.name },
        ...cities.map((city): LocationPoolTarget => ({ kind: 'city', countryCode, regionId: region.id, regionName: region.name, city })),
      ];
      return { id: region.id, name: region.name, names: region.names, targets: targets.filter((target) => !selectedKeys.has(locationTargetKey(target))) };
    }).filter((region) => region.targets.length),
  })).filter((country) => country.regions.length);
}

export const samePoolRegion = (a: LocationPoolTarget, b: LocationPoolTarget) => a.countryCode === b.countryCode && a.regionId === b.regionId;

export const selectPoolRegion = (value: LocationPoolTarget[], target: LocationPoolTarget) => [
  ...value.filter((item) => !samePoolRegion(item, target)),
  target,
];

export function selectPoolCity(value: LocationPoolTarget[], target: LocationPoolTarget, remove = false): LocationPoolTarget[] {
  const remaining = value.filter((item) => !samePoolRegion(item, target) || (item.kind === 'city' && locationTargetKey(item) !== locationTargetKey(target)));
  if (!remove) return [...remaining, target];
  return remaining.some((item) => samePoolRegion(item, target)) ? remaining : [...remaining, { kind: 'region', countryCode: target.countryCode, regionId: target.regionId, regionName: target.regionName }];
}

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

export function pickLocationPoolFocus(resolved: Array<{ target: LocationPoolTarget; cities: CityPoolCity[] }>, countryCodes: string[], random = Math.random) {
  const unrestricted = countryCodes.filter((code) => !resolved.some(({ target }) => target.countryCode === code));
  const option = [...resolved, ...unrestricted][Math.floor(random() * (resolved.length + unrestricted.length))];
  if (typeof option === 'string') return { kind: 'country' as const, countryCode: option };
  const focused = option && pickLocationTargetCity([option], random);
  return focused && { kind: 'target' as const, countryCode: focused.target.countryCode, ...focused };
}
