import { useEffect, useState } from 'react';
import type { CountryBorderColor, CountryBorderWidth, MapPreferences, ResultMapZoomPreference } from '../types';
import { trainerDb } from '../data/trainerDb';

export const DEFAULT_MAP_PREFERENCES: MapPreferences = {
  showImageryDate: false,
  showRoadLabels: false,
  motionTracking: false,
  movementStyle: 'click',
  mapType: 'roadmap',
  mapPalette: 'auto',
  resultMapZoom: 'country',
  gestureHandling: 'auto',
  clickableIcons: false,
  showCountryBorders: true,
  showRegionBorders: false,
  countryBorderWidth: 'thin',
  countryBorderColor: 'auto',
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
    resultMapZoom: source.resultMapZoom === 'closest' || source.resultMapZoom === 'region' || source.resultMapZoom === 'world' ? source.resultMapZoom : 'country',
    gestureHandling: source.gestureHandling === 'cooperative' || source.gestureHandling === 'greedy' ? source.gestureHandling : 'auto',
    clickableIcons: source.clickableIcons === true,
    showCountryBorders: source.showCountryBorders !== false,
    showRegionBorders: source.showRegionBorders === true,
    countryBorderWidth: source.countryBorderWidth === 'standard' || source.countryBorderWidth === 'bold' ? source.countryBorderWidth : 'thin',
    countryBorderColor: source.countryBorderColor === 'light' || source.countryBorderColor === 'dark' || source.countryBorderColor === 'accent' ? source.countryBorderColor : 'auto',
  };
};

export const resultMapZoomLimit = (zoom: ResultMapZoomPreference = 'country') => zoom === 'closest' ? 14 : zoom === 'region' ? 7 : zoom === 'world' ? 2 : 5;
export const countryBorderWeight = (width: CountryBorderWidth = 'thin') => width === 'bold' ? 1.75 : width === 'standard' ? 1.15 : .75;
export const countryBorderColor = (color: CountryBorderColor = 'auto', dark = false) => color === 'light' ? '#e7f7ff' : color === 'dark' ? '#152f3d' : color === 'accent' ? '#4d9cff' : dark ? '#b6d8e3' : '#385563';

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
  const borderStyle: google.maps.MapTypeStyle = { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: preferences.showCountryBorders === false ? [{ visibility: 'off' }] : [{ visibility: 'on' }, { color: countryBorderColor(preferences.countryBorderColor, useDark) }, { weight: countryBorderWeight(preferences.countryBorderWidth) }] };
  const regionStyle: google.maps.MapTypeStyle = { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: preferences.showRegionBorders === true ? [{ visibility: 'on' }, { color: countryBorderColor(preferences.countryBorderColor, useDark) }, { weight: Math.max(.2, countryBorderWeight(preferences.countryBorderWidth) * .6) }] : [{ visibility: 'off' }] };
  return {
    mapTypeId: preferences.mapType,
    gestureHandling: preferences.gestureHandling,
    clickableIcons: preferences.clickableIcons,
    styles: [...(useDark ? DARK_STYLE : LIGHT_STYLE), regionStyle, borderStyle],
  };
}
