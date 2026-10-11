import type { EnvironmentSettings, LocationResult } from '../types';
import { calculateDistanceKm } from './gameLogic';
import { acceptsPanoramaSource, isOfficialGooglePanorama, streetViewSearchSources } from './locationGenerator';

type ExploreSettings = Pick<EnvironmentSettings, 'panoramaSource' | 'allowInteriors'>;

export const exploreStreetViewSources = streetViewSearchSources;

export function googleStreetViewLink(value: string) {
  let url: URL;
  try { url = new URL(value.trim()); } catch { return null; }
  if (!['google.com', 'www.google.com', 'maps.google.com'].includes(url.hostname) || !url.pathname.startsWith('/maps/')) return null;
  const coordinates = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
  const pano = url.pathname.match(/!1s([\w-]+)/)?.[1];
  if (!coordinates || !pano) return null;
  const lat = Number(coordinates[1]); const lng = Number(coordinates[2]);
  if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
  const heading = url.pathname.match(/,(-?\d+(?:\.\d+)?)h(?:,|\/|$)/);
  return { pano, lat, lng, ...(heading ? { heading: Number(heading[1]) } : {}) };
}

export async function findExplorePanoramaFromLink(link: NonNullable<ReturnType<typeof googleStreetViewLink>>, settings: ExploreSettings): Promise<Omit<LocationResult, 'countryCode'>> {
  const service = new google.maps.StreetViewService();
  const { data } = await service.getPanorama({ pano: link.pano });
  const position = data.location?.latLng; const panoId = data.location?.pano;
  if (!position || !panoId || calculateDistanceKm(link.lat, link.lng, position.lat(), position.lng()) > 10 || !acceptsPanoramaSource(isOfficialGooglePanorama(data), settings.panoramaSource)) throw new Error('Linked panorama is unavailable or does not match the current imagery filter.');
  if (!settings.allowInteriors) {
    const { data: outdoor } = await service.getPanorama({ location: position, radius: 2, sources: exploreStreetViewSources(settings) });
    if (outdoor.location?.pano !== panoId) throw new Error('Linked panorama does not match the outdoor coverage filter.');
  }
  return { panoId, lat: position.lat(), lng: position.lng(), ...(link.heading !== undefined ? { heading: link.heading } : {}) };
}

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
