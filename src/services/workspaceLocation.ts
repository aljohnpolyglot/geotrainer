import type { LocationResult } from '../types';

export const isLocation = (value: unknown): value is LocationResult => {
  if (!value || typeof value !== 'object') return false;
  const location = value as Partial<LocationResult>;
  return typeof location.panoId === 'string' && typeof location.countryCode === 'string' && Number.isFinite(location.lat) && Number.isFinite(location.lng);
};

export const locationForWorkspace = (location: LocationResult): LocationResult => ({
  countryCode: location.countryCode, lat: location.lat, lng: location.lng, panoId: location.panoId,
  ...(location.exactAddress ? { exactAddress: location.exactAddress } : {}),
  ...(location.locality ? { locality: location.locality } : {}),
  ...(location.adminArea ? { adminArea: location.adminArea } : {}),
  ...(location.environment ? { environment: location.environment } : {}),
  ...(location.environmentRequested ? { environmentRequested: location.environmentRequested } : {}),
  ...(location.urbanLevel ? { urbanLevel: location.urbanLevel } : {}),
  ...(location.isFallback ? { isFallback: true } : {}),
  ...(location.originalPanoId ? { originalPanoId: location.originalPanoId } : {}),
  ...(location.heading !== undefined ? { heading: location.heading } : {}),
  ...(location.pitch !== undefined ? { pitch: location.pitch } : {}),
  ...(location.importedMapPointIndex !== undefined ? { importedMapPointIndex: location.importedMapPointIndex } : {}),
  ...(location.importedMapProgress !== undefined ? { importedMapProgress: location.importedMapProgress } : {}),
  ...(location.importedMapCompletedPointIndexes?.length ? { importedMapCompletedPointIndexes: location.importedMapCompletedPointIndexes } : {}),
});
