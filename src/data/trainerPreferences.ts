import type { GameSettings, LocationPoolTarget } from '../types';
import { COUNTRIES } from './countries';

const validLocationTarget = (value: unknown): value is LocationPoolTarget => {
  if (!value || typeof value !== 'object') return false;
  const target = value as Partial<LocationPoolTarget> & { city?: Record<string, unknown> };
  if ((target.kind !== 'region' && target.kind !== 'city') || typeof target.countryCode !== 'string' || !(target.countryCode in COUNTRIES) || typeof target.regionId !== 'string' || typeof target.regionName !== 'string') return false;
  return target.kind === 'region' || !!target.city && typeof target.city.name === 'string' && Number.isFinite(target.city.lat) && Number.isFinite(target.city.lng) && Number.isFinite(target.city.population) && Number.isFinite(target.city.urbanRadiusKm) && ['major', 'regional', 'local'].includes(String(target.city.class));
};
export const normalizeLocationTargets = (value: unknown) => Array.isArray(value) ? value.filter(validLocationTarget) : [];
export const normalizeGamePreferences = (value: unknown, showCompass = true): GameSettings => {
  const source = value && typeof value === 'object' ? value as Partial<GameSettings> : {};
  const rounds = Number(source.roundCount);
  const timeLimitSeconds = Number(source.timeLimitSeconds);
  const countryCodes = Array.isArray(source.countryCodes) ? [...new Set(source.countryCodes.filter((code): code is string => typeof code === 'string' && code in COUNTRIES))] : [];
  const locationTargets = normalizeLocationTargets(source.locationTargets);
  const panoramaSource = source.panoramaSource === 'mixed' || source.panoramaSource === 'contributor' ? source.panoramaSource : source.allowContributors === true ? 'mixed' : 'official';
  return {
    roundCount: Number.isInteger(rounds) && rounds >= 1 && rounds <= 100 ? rounds : 5,
    collectionId: typeof source.collectionId === 'string' ? source.collectionId : 'world',
    ...(typeof source.importedMapId === 'string' ? { importedMapId: source.importedMapId } : {}),
    ...(typeof source.importedMapName === 'string' ? { importedMapName: source.importedMapName } : {}),
    importedMapOrder: source.importedMapOrder === 'source' ? 'source' : 'shuffle',
    skipSeenImported: source.skipSeenImported !== false,
    ...(typeof source.countryCode === 'string' && source.countryCode in COUNTRIES ? { countryCode: source.countryCode } : {}),
    ...(countryCodes.length ? { countryCodes } : {}),
    ...(locationTargets.length ? { locationTargets } : {}),
    canMove: typeof source.canMove === 'boolean' ? source.canMove : true,
    canPan: typeof source.canPan === 'boolean' ? source.canPan : true,
    canZoom: typeof source.canZoom === 'boolean' ? source.canZoom : true,
    showCompass: typeof source.showCompass === 'boolean' ? source.showCompass : showCompass,
    aiCoachEnabled: typeof source.aiCoachEnabled === 'boolean' ? source.aiCoachEnabled : true,
    environment: source.environment === 'urban' || source.environment === 'suburban' || source.environment === 'rural' ? source.environment : 'mixed',
    urbanLevel: source.urbanLevel === 1 || source.urbanLevel === 2 ? source.urbanLevel : 3,
    samplingMode: source.samplingMode === 'balanced' || source.samplingMode === 'shuffle' ? source.samplingMode : 'natural',
    priority: source.priority === 'familiar' || source.priority === 'least-exposure' || source.priority === 'weak-spots' ? source.priority : 'random',
    panoramaSource,
    allowContributors: panoramaSource !== 'official',
    allowInteriors: source.allowInteriors === true,
    includeWater: source.includeWater !== false,
    timeLimitSeconds: Number.isInteger(timeLimitSeconds) && timeLimitSeconds >= 0 && timeLimitSeconds <= 3600 ? timeLimitSeconds : 0,
  };
};
