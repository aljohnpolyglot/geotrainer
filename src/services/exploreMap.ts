import type { EnvironmentSettings, LocationResult } from '../types';
import { acceptsPanoramaSource, isOfficialGooglePanorama } from './locationGenerator';

type ExploreSettings = Pick<EnvironmentSettings, 'panoramaSource' | 'allowInteriors'>;

export const exploreStreetViewSources = ({ panoramaSource = 'official', allowInteriors = false }: ExploreSettings) => {
  const sources: google.maps.StreetViewSource[] = [];
  if (panoramaSource === 'official') sources.push(google.maps.StreetViewSource.GOOGLE);
  if (!allowInteriors) sources.push(google.maps.StreetViewSource.OUTDOOR);
  return sources.length ? sources : [google.maps.StreetViewSource.DEFAULT];
};

export async function findExplorePanorama(point: { lat: number; lng: number } | google.maps.LatLng, settings: ExploreSettings): Promise<Omit<LocationResult, 'countryCode'>> {
  const { data } = await new google.maps.StreetViewService().getPanorama({
    location: point,
    radius: 250,
    preference: google.maps.StreetViewPreference.NEAREST,
    sources: exploreStreetViewSources(settings),
  });
  const position = data.location?.latLng; const panoId = data.location?.pano;
  if (!position || !panoId || !acceptsPanoramaSource(isOfficialGooglePanorama(data), settings.panoramaSource)) throw new Error('No matching Street View found near that point.');
  return { panoId, lat: position.lat(), lng: position.lng() };
}
