import cities from '../data/cities.json';
import { COUNTRIES } from '../data/countries';
import type { CitySeed } from './locationGenerator';

export interface MapSearchResult {
  id: string;
  label: string;
  lat: number;
  lng: number;
  bounds?: { minLat: number; maxLat: number; minLng: number; maxLng: number };
  population: number;
  searchText: string;
}

const normalize = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
const cityData = cities as Record<string, CitySeed[]>;
const places: MapSearchResult[] = Object.values(COUNTRIES).flatMap((country) => [
  {
    id: `country:${country.code}`,
    label: country.name,
    lat: (country.bounds.minLat + country.bounds.maxLat) / 2,
    lng: (country.bounds.minLng + country.bounds.maxLng) / 2,
    bounds: country.bounds,
    population: Number.MAX_SAFE_INTEGER,
    searchText: normalize(`${country.name} ${country.code}`),
  },
  ...(cityData[country.code] || []).map((city) => ({
    id: `city:${country.code}:${city.lat}:${city.lng}`,
    label: `${city.name}, ${country.name}`,
    lat: city.lat,
    lng: city.lng,
    population: city.population,
    searchText: normalize(`${city.name} ${country.name} ${country.code}`),
  })),
]);

export function searchMapPlaces(query: string, limit = 8) {
  const needle = normalize(query);
  if (!needle) return [];
  return places.filter((place) => place.searchText.includes(needle)).sort((a, b) =>
    Number(!a.searchText.startsWith(needle)) - Number(!b.searchText.startsWith(needle)) || b.population - a.population || a.label.localeCompare(b.label)
  ).slice(0, limit);
}

export function exactMapPlace(label: string) {
  const normalized = normalize(label);
  return places.find((place) => normalize(place.label) === normalized);
}
