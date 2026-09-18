import type { LocationResult } from '../types';
import { shuffleInPlace, trainerDb } from '../data/trainerDb';
import { reverseGeocodeLocation } from './geocoding';
import { calculateDistanceKm } from './gameLogic';

export type MapPoint = { lat: number; lng: number; panoId?: string; heading?: number };
export type ImportedMap = { id: string; name: string; points: MapPoint[] };
export type ImportedMapHistory = { locations: LocationResult[]; index: number };
export const moveImportedHistory = (history: ImportedMapHistory, direction: 'previous' | 'next', location?: LocationResult): ImportedMapHistory => {
  const index = history.index + (direction === 'next' ? 1 : -1);
  if (index < 0) return history;
  if (index < history.locations.length) return { ...history, index };
  return direction === 'next' && location ? { locations: [...history.locations, location], index } : history;
};
export const IMPORTED_MAP_PREFIX = 'local.importedMap:';

export function parseImportedMap(json: string, name: string): ImportedMap {
  const parsed: unknown = JSON.parse(json);
  const source = Array.isArray(parsed) ? parsed : parsed && typeof parsed === 'object' ? (parsed as { customCoordinates?: unknown; locations?: unknown }).customCoordinates ?? (parsed as { locations?: unknown }).locations : undefined;
  if (!Array.isArray(source)) throw new Error('Choose a Map Maker JSON list or a map with customCoordinates.');
  const points = source.flatMap((entry): MapPoint[] => {
    if (!entry || typeof entry !== 'object') return [];
    const item = entry as Record<string, unknown>;
    if (typeof item.lat !== 'number' || !Number.isFinite(item.lat) || Math.abs(item.lat) > 90 || typeof item.lng !== 'number' || !Number.isFinite(item.lng) || Math.abs(item.lng) > 180) return [];
    return [{ lat: item.lat, lng: item.lng, ...(typeof item.panoId === 'string' && item.panoId ? { panoId: item.panoId } : {}), ...(typeof item.heading === 'number' && Number.isFinite(item.heading) ? { heading: item.heading } : {}) }];
  });
  if (!points.length) throw new Error('This map has no valid latitude and longitude locations.');
  return { id: crypto.randomUUID(), name: name.replace(/\.json$/i, '').slice(0, 100), points };
}

export const saveImportedMap = (map: ImportedMap) => trainerDb.setSetting(`${IMPORTED_MAP_PREFIX}${map.id}`, map);
export const getImportedMap = (id: string) => trainerDb.setting<ImportedMap>(`${IMPORTED_MAP_PREFIX}${id}`);

export function varyImportedPoint(point: MapPoint, variation: number, random = Math.random): MapPoint {
  const metres = Number.isFinite(variation) ? Math.min(100, Math.max(0, variation)) * 10 : 0;
  if (!metres) return point;
  const distance = Math.sqrt(random()) * metres;
  const bearing = random() * Math.PI * 2;
  const lat = Math.max(-90, Math.min(90, point.lat + Math.cos(bearing) * distance / 111_320));
  const lng = ((point.lng + Math.sin(bearing) * distance / (111_320 * Math.max(.01, Math.cos(point.lat * Math.PI / 180))) + 540) % 360) - 180;
  return { lat, lng, heading: point.heading };
}

export async function pickImportedLocation(mapId: string, excluded = new Set<string>(), signal?: AbortSignal, requireNavigation = false, variation = 0): Promise<LocationResult> {
  const map = await getImportedMap(mapId);
  if (!map?.points.length) throw new Error('Upload this map again on this device to continue.');
  variation = Number.isFinite(variation) ? Math.min(100, Math.max(0, variation)) : 0;
  const service = new google.maps.StreetViewService();
  const shuffled = shuffleInPlace([...map.points]);
  for (const point of shuffled) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (point.panoId && excluded.has(point.panoId)) continue;
    const target = varyImportedPoint(point, variation);
    const data = await new Promise<google.maps.StreetViewPanoramaData | null>((resolve) => service.getPanorama(target.panoId ? { pano: target.panoId } : { location: target, radius: 100 }, (result, status) => resolve(status === google.maps.StreetViewStatus.OK ? result : null)));
    if (!data?.location?.pano || !data.location.latLng || excluded.has(data.location.pano) || (requireNavigation && !data.links?.length)) continue;
    const lat = data.location.latLng.lat(), lng = data.location.latLng.lng();
    if (calculateDistanceKm(lat, lng, point.lat, point.lng) > (variation ? Math.max(.1, variation / 100) : .25)) continue;
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const countryCode = (await reverseGeocodeLocation(lat, lng))?.countryCode;
    if (countryCode) return { lat, lng, panoId: data.location.pano, countryCode, heading: point.heading };
  }
  if (excluded.size) return pickImportedLocation(mapId, new Set(), signal, requireNavigation, variation);
  if (variation) return pickImportedLocation(mapId, new Set(), signal, requireNavigation);
  throw new Error('No available Street View locations remain in this map.');
}
