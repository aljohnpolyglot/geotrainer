/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ReverseGeocodeResult {
  formattedAddress: string;
  locality?: string;
  adminArea?: string;
  adminAreaCode?: string;
  route?: string;
  countryName?: string;
  countryCode?: string;
}

const geocodeCache = new Map<string, ReverseGeocodeResult>();
let geocoderInstance: google.maps.Geocoder | null = null;

function getGeocoder(): google.maps.Geocoder {
  if (!geocoderInstance) {
    if (typeof google === 'undefined' || !google.maps || !google.maps.Geocoder) {
      throw new Error('Google Maps Geocoder is not loaded yet');
    }
    geocoderInstance = new google.maps.Geocoder();
  }
  return geocoderInstance;
}

/**
 * Returns high-resolution country flag image URL from FlagCDN
 * @param countryCode ISO 3166-1 alpha-2 (e.g. "IT", "FR", "JP")
 * @param width Image width (20, 40, 80, 160)
 */
export function getFlagCdnUrl(countryCode: string, width: 20 | 40 | 80 | 160 = 40): string {
  const code = (countryCode || '').trim().toLowerCase();
  if (!code || code.length !== 2) {
    return '';
  }
  return `https://flagcdn.com/w${width}/${code}.png`;
}

/**
 * Reverse geocodes latitude and longitude to extract exact street, city, and administrative area
 */
export async function reverseGeocodeLocation(lat: number, lng: number): Promise<ReverseGeocodeResult | null> {
  const cacheKey = `${lat.toFixed(5)},${lng.toFixed(5)}`;
  if (geocodeCache.has(cacheKey)) {
    return geocodeCache.get(cacheKey)!;
  }

  try {
    const geocoder = getGeocoder();
    const response = await geocoder.geocode({
      location: { lat, lng },
    });

    if (!response.results || response.results.length === 0) {
      return null;
    }

    const first = response.results[0];
    let locality: string | undefined;
    let adminArea: string | undefined;
    let adminAreaCode: string | undefined;
    let fallbackAdminArea: string | undefined;
    let route: string | undefined;
    let countryName: string | undefined;
    let countryCode: string | undefined;

    // Search for address components across the most specific results
    for (const result of response.results) {
      for (const comp of result.address_components) {
        if (!locality && (comp.types.includes('locality') || comp.types.includes('postal_town') || comp.types.includes('sublocality_level_1'))) {
          locality = comp.long_name;
        }
        if (!adminArea && comp.types.includes('administrative_area_level_1')) {
          adminArea = comp.long_name;
          adminAreaCode = comp.short_name;
        }
        if (!fallbackAdminArea && comp.types.includes('administrative_area_level_2')) fallbackAdminArea = comp.long_name;
        if (!route && comp.types.includes('route')) {
          route = comp.long_name;
        }
        if (!countryName && comp.types.includes('country')) {
          countryName = comp.long_name;
          countryCode = comp.short_name.toUpperCase();
        }
      }
      if (locality && adminArea) break;
    }

    adminArea ||= fallbackAdminArea;
    const parsed: ReverseGeocodeResult = {
      formattedAddress: first.formatted_address,
      locality,
      adminArea,
      adminAreaCode,
      route,
      countryName,
      countryCode,
    };

    geocodeCache.set(cacheKey, parsed);
    return parsed;
  } catch (err) {
    console.warn('Reverse geocoding error:', err);
    return null;
  }
}
