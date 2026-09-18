import { useEffect, useState } from 'react';
import type { MapPreferences } from '../types';
import { trainerDb } from '../data/trainerDb';

export const DEFAULT_MAP_PREFERENCES: MapPreferences = {
  showImageryDate: false,
  showRoadLabels: false,
  motionTracking: false,
  movementStyle: 'click',
  mapType: 'roadmap',
  mapPalette: 'auto',
  gestureHandling: 'auto',
  clickableIcons: false,
  showCountryBorders: true,
  geotrainerMapStyle: true,
};

export const normalizeMapPreferences = (value: unknown): MapPreferences => {
  const source = value && typeof value === 'object' ? value as Partial<MapPreferences> : {};
  return {
    showImageryDate: source.showImageryDate === true,
    showRoadLabels: source.showRoadLabels === true,
    motionTracking: source.motionTracking === true,
    movementStyle: source.movementStyle === 'arrows' ? 'arrows' : 'click',
    mapType: source.mapType === 'satellite' || source.mapType === 'hybrid' || source.mapType === 'terrain' ? source.mapType : 'roadmap',
    mapPalette: source.mapPalette === 'light' || source.mapPalette === 'dark' ? source.mapPalette : 'auto',
    gestureHandling: source.gestureHandling === 'cooperative' || source.gestureHandling === 'greedy' ? source.gestureHandling : 'auto',
    clickableIcons: source.clickableIcons === true,
    showCountryBorders: source.showCountryBorders !== false,
    geotrainerMapStyle: source.geotrainerMapStyle !== false,
  };
};

const MAP_PREFERENCES_EVENT = 'geotrainer:map-preferences';
export const announceMapPreferences = (preferences: MapPreferences) => window.dispatchEvent(new CustomEvent(MAP_PREFERENCES_EVENT, { detail: normalizeMapPreferences(preferences) }));

export function useMapPreferences() {
  const [preferences, setPreferences] = useState(DEFAULT_MAP_PREFERENCES);
  useEffect(() => {
    let active = true;
    void trainerDb.setting<MapPreferences>('mapPreferences').then((value) => { if (active) setPreferences(normalizeMapPreferences(value)); });
    const update = (event: Event) => setPreferences(normalizeMapPreferences((event as CustomEvent).detail));
    window.addEventListener(MAP_PREFERENCES_EVENT, update);
    return () => { active = false; window.removeEventListener(MAP_PREFERENCES_EVENT, update); };
  }, []);
  return preferences;
}

const LIGHT_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#f3f1e8' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#253b46' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#ffffff' }] },
  { featureType: 'landscape', stylers: [{ color: '#f3f1e8' }] },
  { featureType: 'water', stylers: [{ color: '#a9d7e5' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#dde5d5' }] },
];
const DARK_STYLE: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#0a2635' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#b8d4dc' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#061720' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#00131d' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#244554' }] },
  { featureType: 'poi', elementType: 'geometry', stylers: [{ color: '#163543' }] },
];

export function mapPresentationOptions(preferences: MapPreferences, dark: boolean): google.maps.MapOptions {
  const useDark = preferences.mapPalette === 'dark' || (preferences.mapPalette !== 'light' && dark);
  const borderStyle: google.maps.MapTypeStyle = { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: preferences.showCountryBorders === false ? [{ visibility: 'off' }] : [{ visibility: 'on' }, { color: useDark ? '#8fb5c4' : '#526c79' }, { weight: 1.5 }] };
  return {
    mapTypeId: preferences.mapType,
    gestureHandling: preferences.gestureHandling,
    clickableIcons: preferences.clickableIcons,
    styles: [...(preferences.geotrainerMapStyle ? (useDark ? DARK_STYLE : LIGHT_STYLE) : []), borderStyle],
  };
}
