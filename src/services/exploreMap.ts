import type { EnvironmentSettings, LocationResult } from '../types';
import { acceptsPanoramaSource, isOfficialGooglePanorama, streetViewSearchSources } from './locationGenerator';

type ExploreSettings = Pick<EnvironmentSettings, 'panoramaSource' | 'allowInteriors'>;

export const exploreStreetViewSources = streetViewSearchSources;

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
