import type { EnvironmentSettings, LocationPoolTarget, LocationResult } from '../types';
import { normalizeLocationTargets, shuffleInPlace, trainerDb } from '../data/trainerDb';
import { COUNTRIES } from '../data/countries';
import { reverseGeocodeLocation } from './geocoding';
import { calculateDistanceKm } from './gameLogic';
import { defaultLocationGenerator } from './locationGenerator';

export type MapPoint = { lat: number; lng: number; panoId?: string; heading?: number };
export type ImportedMap = { id: string; name: string; kind?: 'points'; points: MapPoint[] } | { id: string; name: string; kind: 'pool'; countryCodes: string[]; locationTargets: LocationPoolTarget[] };
export type ImportedMapHistory = { locations: LocationResult[]; index: number };
export const MAX_IMPORTED_MAP_BYTES = 20_000_000;
export const importedMapSizeAllowed = (bytes: number) => Number.isFinite(bytes) && bytes <= MAX_IMPORTED_MAP_BYTES;
export const moveImportedHistory = (history: ImportedMapHistory, direction: 'previous' | 'next', location?: LocationResult): ImportedMapHistory => {
  const index = history.index + (direction === 'next' ? 1 : -1);
  if (index < 0) return history;
  if (index < history.locations.length) return { ...history, index };
  return direction === 'next' && location ? { locations: [...history.locations, location], index } : history;
};
export const IMPORTED_MAP_PREFIX = 'local.importedMap:';
export const importedMapPointCount = (map: ImportedMap) => map.kind === 'pool' ? undefined : map.points.length;

const mapName = (name: string) => name.replace(/\.json$/i, '').slice(0, 100) || 'Imported map';

export function parseImportedMap(json: string, name: string): ImportedMap {
  const parsed: unknown = JSON.parse(json);
  if (parsed && typeof parsed === 'object' && (parsed as { format?: unknown }).format === 'geotrainer-geographic-pool') {
    const source = parsed as { countryCodes?: unknown; locationTargets?: unknown };
    const countryCodes = Array.isArray(source.countryCodes) ? [...new Set(source.countryCodes.filter((code): code is string => typeof code === 'string' && code in COUNTRIES))] : [];
    const locationTargets = normalizeLocationTargets(source.locationTargets).filter((target) => countryCodes.includes(target.countryCode));
    if (!countryCodes.length) throw new Error('This geographic pool has no valid countries.');
    return { id: crypto.randomUUID(), name: mapName(name), kind: 'pool', countryCodes, locationTargets };
  }
  const source = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? (parsed as { customCoordinates?: unknown; locations?: unknown }).customCoordinates ?? (parsed as { locations?: unknown }).locations : undefined;
  if (!Array.isArray(source)) throw new Error('Choose a Map Maker JSON list or a map with customCoordinates.');
  const points = source.flatMap((entry): MapPoint[] => {
    if (!entry || typeof entry !== 'object') return [];
    const item = entry as Record<string, unknown>;
    if (typeof item.lat !== 'number' || !Number.isFinite(item.lat) || Math.abs(item.lat) > 90 || typeof item.lng !== 'number' || !Number.isFinite(item.lng) || Math.abs(item.lng) > 180) return [];
    return [{ lat: item.lat, lng: item.lng, ...(typeof item.panoId === 'string' && item.panoId ? { panoId: item.panoId } : {}), ...(typeof item.heading === 'number' && Number.isFinite(item.heading) ? { heading: item.heading } : {}) }];
  });
  if (!points.length) throw new Error('This map has no valid latitude and longitude locations.');
  return { id: crypto.randomUUID(), name: mapName(name), points };
}

export const geographicPoolJson = (countryCodes: string[], locationTargets: LocationPoolTarget[]) => JSON.stringify({ format: 'geotrainer-geographic-pool', version: 1, countryCodes, locationTargets }, null, 2);
export function downloadGeographicPool(countryCodes: string[], locationTargets: LocationPoolTarget[]) {
  const href = URL.createObjectURL(new Blob([geographicPoolJson(countryCodes, locationTargets)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = href; link.download = 'geotrainer-pool.json'; link.click(); URL.revokeObjectURL(href);
}

export const saveImportedMap = (map: ImportedMap) => trainerDb.setSetting(`${IMPORTED_MAP_PREFIX}${map.id}`, map);
export const getImportedMap = (id: string) => trainerDb.setting<ImportedMap>(`${IMPORTED_MAP_PREFIX}${id}`);
export const remainingImportedPoints = (points: MapPoint[], completed: Set<number>) => points.map((point, index) => ({ point, index })).filter(({ index }) => !completed.has(index));

export function varyImportedPoint(point: MapPoint, variation: number, random = Math.random): MapPoint {
  const metres = Number.isFinite(variation) ? Math.min(100, Math.max(0, variation)) * 10 : 0;
  if (!metres) return point;
  const distance = Math.sqrt(random()) * metres;
  const bearing = random() * Math.PI * 2;
  const lat = Math.max(-90, Math.min(90, point.lat + Math.cos(bearing) * distance / 111_320));
  const lng = ((point.lng + Math.sin(bearing) * distance / (111_320 * Math.max(.01, Math.cos(point.lat * Math.PI / 180))) + 540) % 360) - 180;
  return { lat, lng, heading: point.heading };
}

export async function pickImportedLocation(mapId: string, excluded = new Set<string>(), signal?: AbortSignal, requireNavigation = false, variation = 0, completed = new Set<number>(), settings: EnvironmentSettings = { environment: 'mixed', urbanLevel: 3 }): Promise<LocationResult> {
  const map = await getImportedMap(mapId);
  if (!map) throw new Error('Upload this map again on this device to continue.');
  if (map.kind === 'pool') return defaultLocationGenerator.findRandomLocation(map.countryCodes, signal, undefined, settings, { excludedPanoIds: excluded, requireNavigation, locationTargets: map.locationTargets });
  if (!map.points.length) throw new Error('Upload this map again on this device to continue.');
  variation = Number.isFinite(variation) ? Math.min(100, Math.max(0, variation)) : 0;
  const service = new google.maps.StreetViewService();
  const shuffled = shuffleInPlace(remainingImportedPoints(map.points, completed));
  for (const { point, index } of shuffled) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!variation) completed.add(index);
    if (point.panoId && excluded.has(point.panoId)) continue;
    const target = varyImportedPoint(point, variation);
    const data = await new Promise<google.maps.StreetViewPanoramaData | null>((resolve) => service.getPanorama(target.panoId ? { pano: target.panoId } : { location: target, radius: 100 }, (result, status) => resolve(status === google.maps.StreetViewStatus.OK ? result : null)));
    if (!data?.location?.pano || !data.location.latLng || excluded.has(data.location.pano) || (requireNavigation && !data.links?.length)) continue;
    const lat = data.location.latLng.lat(), lng = data.location.latLng.lng();
    if (calculateDistanceKm(lat, lng, point.lat, point.lng) > (variation ? Math.max(.1, variation / 100) : .25)) continue;
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const countryCode = (await reverseGeocodeLocation(lat, lng))?.countryCode;
    if (countryCode) { completed.add(index); return { lat, lng, panoId: data.location.pano, countryCode, heading: point.heading, importedMapPointIndex: index, importedMapProgress: completed.size, importedMapCompletedPointIndexes: [...completed] }; }
  }
  if (variation) return pickImportedLocation(mapId, excluded, signal, requireNavigation, 0, completed);
  throw new Error('No available Street View locations remain in this map.');
}
