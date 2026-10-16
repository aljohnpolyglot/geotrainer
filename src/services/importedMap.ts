import type { EnvironmentSettings, LocationPoolTarget, LocationResult } from '../types';
import { normalizeLocationTargets, shuffleInPlace, trainerDb } from '../data/trainerDb';
import { COUNTRIES } from '../data/countries';
import { reverseGeocodeLocation } from './geocoding';
import { calculateDistanceKm } from './gameLogic';
import { defaultLocationGenerator } from './locationGenerator';
import { nearbyReviewPoint } from '../data/reviewIdentity';
import { isLocation } from './workspaceLocation';
import { sourcePointHash } from './locationHash';

export type MapPoint = { lat: number; lng: number; panoId?: string; heading?: number };
export type ImportedMap = ({ id: string; name: string; kind?: 'points'; points: MapPoint[]; completedPointIndexes?: number[]; pointOrder?: number[]; lastLocation?: LocationResult } | { id: string; name: string; kind: 'pool'; countryCodes: string[]; locationTargets: LocationPoolTarget[] }) & { sourceType?: 'upload' | 'url'; sourceLabel?: string; lastOpenedAt?: number };
export type ImportedMapHistory = { locations: LocationResult[]; index: number };
export const MAX_IMPORTED_MAP_BYTES = 20_000_000;
export const importedMapSizeAllowed = (bytes: number) => Number.isFinite(bytes) && bytes <= MAX_IMPORTED_MAP_BYTES;
export const moveImportedHistory = (history: ImportedMapHistory, direction: 'previous' | 'next' | number, location?: LocationResult): ImportedMapHistory => {
  const index = typeof direction === 'number' ? direction : history.index + (direction === 'next' ? 1 : -1);
  if (!Number.isInteger(index) || index < 0) return history;
  if (index < history.locations.length) return { ...history, index };
  return direction === 'next' && location ? { locations: [...history.locations, location], index } : history;
};
export const restoreImportedHistory = (value: unknown, current: LocationResult): ImportedMapHistory => {
  if (value && typeof value === 'object') {
    const history = value as Partial<ImportedMapHistory>;
    if (Array.isArray(history.locations) && history.locations.every(isLocation) && Number.isInteger(history.index) && history.index! >= 0 && history.index! < history.locations.length && history.locations[history.index!].panoId === current.panoId) return history as ImportedMapHistory;
  }
  return { locations: [current], index: 0 };
};
export const recoverImportedHistory = (history: ImportedMapHistory, map: ImportedMap | undefined, known: LocationResult[]): ImportedMapHistory => {
  if (!map || map.kind === 'pool' || !map.completedPointIndexes?.length) return history;
  const first = history.locations[0];
  const firstPosition = map.completedPointIndexes.indexOf(first.importedMapPointIndex ?? -1);
  if (firstPosition <= 0) return history;
  const byPoint = new Map(known.filter((location) => location.importedMapPointIndex !== undefined).map((location) => [location.importedMapPointIndex, location]));
  const earlier = map.completedPointIndexes.slice(0, firstPosition).flatMap((index, position) => {
    const point = map.points[index];
    const location = byPoint.get(index);
    const match = point && location && calculateDistanceKm(location.lat, location.lng, point.lat, point.lng) <= .25 && (!point.panoId || point.panoId === location.panoId) ? location : undefined;
    return match ? [{ ...match, importedMapProgress: position + 1 }] : [];
  });
  return earlier.length ? { locations: [...earlier, ...history.locations], index: earlier.length + history.index } : history;
};
export const IMPORTED_MAP_PREFIX = 'local.importedMap:';
export const IMPORTED_MAP_HISTORY_LIMIT = 30;
export const importedMapPointCount = (map: ImportedMap) => map.kind === 'pool' ? undefined : map.points.length;
export const importedMapIdForSource = async (source: string) => `source:${Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(source)))).map((byte) => byte.toString(16).padStart(2, '0')).join('')}`;
const pointKey = (point: MapPoint) => JSON.stringify([point.lat, point.lng, point.panoId || '']);
export function resumeImportedMap(previous: ImportedMap, next: ImportedMap): ImportedMap {
  if (previous.kind === 'pool' || next.kind === 'pool') return next;
  const priorCompleted = previous.completedPointIndexes || previous.lastLocation?.importedMapCompletedPointIndexes || [];
  const completedSet = new Set(priorCompleted);
  const matched = new Map<string, number[]>();
  next.points.forEach((point, index) => { const key = pointKey(point); const indexes = matched.get(key) || []; indexes.push(index); matched.set(key, indexes); });
  const previousOrder = previous.pointOrder?.length === previous.points.length ? previous.pointOrder : [...priorCompleted, ...shuffleInPlace(previous.points.map((_, index) => index).filter((index) => !completedSet.has(index)))];
  const remapped = new Map<number, number>();
  const remappedOrder = previousOrder.flatMap((index) => { const point = previous.points[index]; const nextIndex = point && matched.get(pointKey(point))?.shift(); if (nextIndex === undefined) return []; remapped.set(index, nextIndex); return [nextIndex]; });
  const used = new Set(remappedOrder);
  const pointOrder = [...remappedOrder, ...shuffleInPlace(next.points.map((_, index) => index).filter((index) => !used.has(index)))];
  const completedPointIndexes = priorCompleted.flatMap((index) => remapped.has(index) ? [remapped.get(index)!] : []);
  const lastIndex = remapped.get(previous.lastLocation?.importedMapPointIndex ?? -1) ?? -1;
  return { ...next, name: previous.name, pointOrder, completedPointIndexes, ...(lastIndex >= 0 && previous.lastLocation ? { lastLocation: { ...previous.lastLocation, importedMapPointIndex: lastIndex, importedMapProgress: completedPointIndexes.length, importedMapCompletedPointIndexes: completedPointIndexes } } : {}) };
}

export function importedMapUrl(value: string): URL {
  const url = new URL(value.trim());
  const [, owner, repo, kind, ...file] = url.pathname.split('/');
  if (['github.com', 'www.github.com'].includes(url.hostname) && owner && repo && kind === 'blob' && file.length >= 2 && file.every(Boolean) && ['http:', 'https:'].includes(url.protocol)) {
    url.protocol = 'https:'; url.host = 'raw.githubusercontent.com';
    url.pathname = '/' + [owner, repo, ...file].join('/'); url.search = ''; url.hash = '';
  }
  return url;
}

export const readableImportedMapName = (name: string) => name.replace(/\\/g, '/').split('/').at(-1)!.replace(/\.json$/i, '').replace(/\s*\(\d+\)$/u, '').replace(/^geotrainer[-_ ]+/i, '').replace(/[-_]+(?=\p{L}|\d{4}-\d{2}-\d{2})/gu, ' ').replace(/\bopenguessr\b/gi, 'OpenGuessr').replace(/(^|\s)\p{Ll}/gu, (match) => match.toLocaleUpperCase()).trim().slice(0, 100) || 'Imported map';
const mapName = (name: string) => readableImportedMapName(name);

export function parseImportedMap(json: string, name: string): ImportedMap {
  const parsed: unknown = JSON.parse(json);
  const displayName = parsed && typeof parsed === 'object' && !Array.isArray(parsed) && typeof (parsed as { name?: unknown }).name === 'string' && (parsed as { name: string }).name.trim() ? (parsed as { name: string }).name.trim().slice(0, 100) : mapName(name);
  if (parsed && typeof parsed === 'object' && (parsed as { format?: unknown }).format === 'geotrainer-geographic-pool') {
    const source = parsed as { countryCodes?: unknown; locationTargets?: unknown };
    const countryCodes = Array.isArray(source.countryCodes) ? [...new Set(source.countryCodes.filter((code): code is string => typeof code === 'string' && code in COUNTRIES))] : [];
    const locationTargets = normalizeLocationTargets(source.locationTargets).filter((target) => countryCodes.includes(target.countryCode));
    if (!countryCodes.length) throw new Error('This geographic pool has no valid countries.');
    return { id: crypto.randomUUID(), name: displayName, kind: 'pool', countryCodes, locationTargets };
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
  return { id: crypto.randomUUID(), name: displayName, points };
}

export const geographicPoolJson = (countryCodes: string[], locationTargets: LocationPoolTarget[]) => JSON.stringify({ format: 'geotrainer-geographic-pool', version: 1, countryCodes, locationTargets }, null, 2);
export const geographicPoolFilename = (name = '') => {
  const slug = name.trim().normalize('NFKD').replace(/\p{M}/gu, '').toLocaleLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-+|-+$/g, '').slice(0, 80).replace(/-+$/g, '');
  return `geotrainer-${slug || 'pool'}.json`;
};
export function downloadGeographicPool(countryCodes: string[], locationTargets: LocationPoolTarget[], name?: string) {
  const href = URL.createObjectURL(new Blob([geographicPoolJson(countryCodes, locationTargets)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = href; link.download = geographicPoolFilename(name); link.click(); URL.revokeObjectURL(href);
}

export const saveImportedMap = (map: ImportedMap) => trainerDb.setSetting(`${IMPORTED_MAP_PREFIX}${map.id}`, map);
const readableSavedMap = (map: ImportedMap): ImportedMap => map.sourceType || map.sourceLabel ? map : { ...map, name: readableImportedMapName(map.name) };
export const getImportedMap = async (id: string) => { const map = await trainerDb.setting<ImportedMap>(`${IMPORTED_MAP_PREFIX}${id}`); return map && readableSavedMap(map); };
export type SavedImportedMap = { map: ImportedMap; updatedAt: number };
export async function savedImportedMaps(): Promise<SavedImportedMap[]> {
  const records = await trainerDb.settingsByPrefix(IMPORTED_MAP_PREFIX);
  return records.flatMap((record): SavedImportedMap[] => {
    const map = record.value as Partial<ImportedMap> | undefined;
    return map && typeof map.id === 'string' && record.key === `${IMPORTED_MAP_PREFIX}${map.id}` && typeof map.name === 'string' && Array.isArray((map as { points?: unknown }).points) && (map as { points: unknown[] }).points.length > 0
      ? [{ map: readableSavedMap(map as ImportedMap), updatedAt: record.updatedAt || 0 }] : [];
  }).sort((a, b) => b.updatedAt - a.updatedAt);
}
export const importedMapsToPrune = (saved: SavedImportedMap[], protectedIds: ReadonlySet<string>, limit = IMPORTED_MAP_HISTORY_LIMIT) => {
  const protectedCount = saved.filter(({ map }) => protectedIds.has(map.id)).length;
  return saved.filter(({ map }) => !protectedIds.has(map.id)).slice(Math.max(0, limit - protectedCount)).map(({ map }) => map.id);
};
export async function pruneImportedMaps(): Promise<void> {
  const [saved, currentId, active, pausedStudy, pausedPlay, gamePreferences] = await Promise.all([
    savedImportedMaps(), trainerDb.setting<string>('local.currentMapId'), trainerDb.setting<{ importedMapId?: string; settings?: { importedMapId?: string } }>('workspace.active'), trainerDb.setting<{ importedMapId?: string }>('workspace.paused.study'), trainerDb.setting<{ settings?: { importedMapId?: string } }>('workspace.paused.play'), trainerDb.setting<{ importedMapId?: string }>('gamePreferences'),
  ]);
  const protectedIds = new Set([currentId, active?.importedMapId, active?.settings?.importedMapId, pausedStudy?.importedMapId, pausedPlay?.settings?.importedMapId, gamePreferences?.importedMapId].filter((id): id is string => !!id));
  await Promise.all(importedMapsToPrune(saved, protectedIds).map((id) => trainerDb.deleteSetting(`${IMPORTED_MAP_PREFIX}${id}`)));
}
export async function withImportedSourceHash(location: LocationResult, map: ImportedMap | undefined): Promise<LocationResult> {
  if (!map || map.kind === 'pool' || location.sourcePointHash) return location;
  const point = map.points[location.importedMapPointIndex ?? -1];
  if (!point || point.panoId && point.panoId !== location.panoId || calculateDistanceKm(location.lat, location.lng, point.lat, point.lng) > 1.01) return location;
  return { ...location, sourcePointHash: await sourcePointHash(point) };
}
export async function matchSavedImportedPoints(map: ImportedMap): Promise<void> {
  if (map.kind === 'pool') return;
  const known = await trainerDb.locations();
  await Promise.all(known.flatMap((location) => {
    const point = map.points[location.importedMapPointIndex ?? -1];
    if (!point || point.panoId && point.panoId !== location.panoId || calculateDistanceKm(location.lat, location.lng, point.lat, point.lng) > 1.01 || location.sourcePointHash) return [];
    return [sourcePointHash(point).then((hash) => trainerDb.stampSourcePointHash(location.panoId, hash))];
  }));
}
export async function saveImportedMapProgress(id: string, completed: Set<number>, lastLocation?: LocationResult) {
  const map = await getImportedMap(id);
  if (map && map.kind !== 'pool') await saveImportedMap({ ...map, completedPointIndexes: [...completed], ...(lastLocation ? { lastLocation } : {}) });
}
export const remainingImportedPoints = (points: MapPoint[], completed: Set<number>) => points.map((point, index) => ({ point, index })).filter(({ index }) => !completed.has(index));
export const importedPointCandidates = (points: MapPoint[], completed: Set<number>, order: 'shuffle' | 'source', pointOrder?: number[], targetPointIndex?: number) => targetPointIndex !== undefined ? [{ point: points[targetPointIndex], index: targetPointIndex }] : order === 'source' ? remainingImportedPoints(points, completed) : pointOrder ? pointOrder.filter((index) => !completed.has(index)).map((index) => ({ point: points[index], index })) : shuffleInPlace(remainingImportedPoints(points, completed));
export const isKnownImportedLocation = (location: Pick<LocationResult, 'panoId' | 'lat' | 'lng' | 'countryCode'>, known: ReadonlyArray<Pick<LocationResult, 'panoId' | 'lat' | 'lng' | 'countryCode'>>) => known.some((item) => item.panoId === location.panoId || nearbyReviewPoint(item, location));

export function varyImportedPoint(point: MapPoint, variation: number, random = Math.random): MapPoint {
  const metres = Number.isFinite(variation) ? Math.min(100, Math.max(0, variation)) * 10 : 0;
  if (!metres) return point;
  const distance = Math.sqrt(random()) * metres;
  const bearing = random() * Math.PI * 2;
  const lat = Math.max(-90, Math.min(90, point.lat + Math.cos(bearing) * distance / 111_320));
  const lng = ((point.lng + Math.sin(bearing) * distance / (111_320 * Math.max(.01, Math.cos(point.lat * Math.PI / 180))) + 540) % 360) - 180;
  return { lat, lng, heading: point.heading };
}

export async function pickImportedLocation(mapId: string, excluded = new Set<string>(), signal?: AbortSignal, requireNavigation = false, variation = 0, completed = new Set<number>(), settings: EnvironmentSettings = { environment: 'mixed', urbanLevel: 3 }, order: 'shuffle' | 'source' = 'shuffle', known: ReadonlyArray<Pick<LocationResult, 'panoId' | 'lat' | 'lng' | 'countryCode'>> = [], targetPointIndex?: number): Promise<LocationResult> {
  let map = await getImportedMap(mapId);
  if (!map) throw new Error('Upload this map again on this device to continue.');
  if (map.kind === 'pool') return defaultLocationGenerator.findRandomLocation(map.countryCodes, signal, undefined, settings, { excludedPanoIds: excluded, requireNavigation, locationTargets: map.locationTargets });
  if (!map.points.length) throw new Error('Upload this map again on this device to continue.');
  const points = map.points;
  if (targetPointIndex !== undefined && (!Number.isInteger(targetPointIndex) || targetPointIndex < 0 || targetPointIndex >= points.length)) throw new Error('This panorama is not in the uploaded map.');
  if (order === 'shuffle' && (map.pointOrder?.length !== points.length || new Set(map.pointOrder).size !== points.length || map.pointOrder.some((index) => !Number.isInteger(index) || index < 0 || index >= points.length))) {
    map = { ...map, pointOrder: shuffleInPlace(points.map((_, index) => index)) };
    await saveImportedMap(map);
  }
  variation = Number.isFinite(variation) ? Math.min(100, Math.max(0, variation)) : 0;
  const service = new google.maps.StreetViewService();
  const knownPanos = new Set(known.map((item) => item.panoId));
  const candidates = importedPointCandidates(points, completed, order, map.pointOrder, targetPointIndex);
  for (const { point, index } of candidates) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    if (!variation && targetPointIndex === undefined) completed.add(index);
    if (point.panoId && knownPanos.has(point.panoId)) { completed.add(index); continue; }
    if (point.panoId && excluded.has(point.panoId)) continue;
    const target = varyImportedPoint(point, variation);
    const data = await new Promise<google.maps.StreetViewPanoramaData | null>((resolve) => service.getPanorama(target.panoId ? { pano: target.panoId } : { location: target, radius: 100 }, (result, status) => resolve(status === google.maps.StreetViewStatus.OK ? result : null)));
    if (!data?.location?.pano || !data.location.latLng || excluded.has(data.location.pano) || (requireNavigation && !data.links?.length)) continue;
    const lat = data.location.latLng.lat(), lng = data.location.latLng.lng();
    if (calculateDistanceKm(lat, lng, point.lat, point.lng) > (variation ? Math.max(.1, variation / 100) : .25)) continue;
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const countryCode = (await reverseGeocodeLocation(lat, lng))?.countryCode;
    if (countryCode) { completed.add(index); if (isKnownImportedLocation({ lat, lng, panoId: data.location.pano, countryCode }, known)) continue; return { lat, lng, panoId: data.location.pano, countryCode, heading: point.heading, sourcePointHash: await sourcePointHash(point), importedMapPointIndex: index, importedMapProgress: completed.size, importedMapCompletedPointIndexes: [...completed] }; }
  }
  if (variation) return pickImportedLocation(mapId, excluded, signal, requireNavigation, 0, completed, settings, order, known, targetPointIndex);
  throw new Error('No available Street View locations remain in this map.');
}
