import cities from '../data/cities.json';
import regions from '../data/mapRegions.json';
import { COUNTRIES } from '../data/countries';
import type { CitySeed } from './locationGenerator';

export type MapSearchKind = 'city' | 'country' | 'region';

export interface MapSearchResult {
  id: string;
  kind: MapSearchKind;
  label: string;
  lat: number;
  lng: number;
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  population: number;
  searchText: string;
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const cityData = cities as Record<string, CitySeed[]>;
const regionData = regions as Array<{ id: string; countryCode: string; name: string; aliases: string[]; lat: number; lng: number; bounds: NonNullable<MapSearchResult['bounds']>; population: number }>;
const basePlaces: MapSearchResult[] = Object.values(COUNTRIES).flatMap((country) => [
  {
    id: `country:${country.code}`,
    kind: 'country' as const,
    label: country.name,
    lat: (country.bounds.minLat + country.bounds.maxLat) / 2,
    lng: (country.bounds.minLng + country.bounds.maxLng) / 2,
    bounds: country.bounds,
    population: Number.MAX_SAFE_INTEGER,
    searchText: normalize(`${country.name} ${country.code}`),
  },
  ...(cityData[country.code] || []).map((city) => ({
    id: `city:${country.code}:${city.lat}:${city.lng}`,
    kind: 'city' as const,
    label: `${city.name}, ${country.name}`,
    lat: city.lat,
    lng: city.lng,
    population: city.population,
    searchText: normalize(`${city.name} ${country.name} ${country.code}`),
  })),
]);
const regionPlaces: MapSearchResult[] = regionData.flatMap((region): MapSearchResult[] => {
  const country = COUNTRIES[region.countryCode];
  if (!country) return [];
  const name = region.aliases[0] || region.name;
  return [{ id: `region:${region.countryCode}:${region.id}`, kind: 'region' as const, label: `${name}, ${country.name}`, lat: region.lat, lng: region.lng, bounds: region.bounds, population: region.population, searchText: normalize(`${name} ${region.name} ${region.aliases.join(' ')} ${country.name} ${region.countryCode}`) }];
});
const places = [...basePlaces, ...regionPlaces];

const kindRank: Record<MapSearchKind, number> = { region: 0, city: 1, country: 2 };

export function searchMapPlaces(query: string, limit = 8) {
  const needle = normalize(query);
  if (!needle) return [];
  return places.filter((place) => place.searchText.includes(needle)).sort((a, b) =>
    Number(!a.searchText.startsWith(needle)) - Number(!b.searchText.startsWith(needle)) || kindRank[a.kind] - kindRank[b.kind] || b.population - a.population || a.label.localeCompare(b.label)
  ).slice(0, limit);
}

export function exactMapPlace(label: string) {
  const normalized = normalize(label);
  return places.find((place) => normalize(place.label) === normalized);
}
