/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { CityPoolCity, EnvironmentSettings, LocationGenerator, LocationRequestContext, LocationResult, UrbanLevel } from '../types';
import { COUNTRIES } from '../data/countries';
import cityData from '../data/cities.json';
import { reverseGeocodeLocation } from './geocoding';
import { calculateDistanceKm } from './gameLogic';
import { chooseReviewCandidate, type ReviewCandidate, type ReviewVariationPlan } from '../data/reviewVariation';
import { pickLocationTargetCity, resolveLocationTargets } from './cityPools';

export interface CitySeed {
  name: string;
  lat: number;
  lng: number;
  population: number;
  class: 'major' | 'regional' | 'local';
  urbanRadiusKm: number;
}

const CITIES = cityData as Record<string, CitySeed[]>;
const classesForLevel = (level: UrbanLevel) => level === 1 ? ['major'] : level === 2 ? ['major', 'regional'] : ['major', 'regional', 'local'];
const mixedWeights = { urban: 35, suburban: 20, rural: 45 } as const;
export const isOfficialGooglePanorama = (data: Pick<google.maps.StreetViewPanoramaData, 'copyright'>) => /\bGoogle\b/i.test(data.copyright || '');
export const acceptsPanoramaSource = (official: boolean, source: EnvironmentSettings['panoramaSource'], allowContributors?: boolean) => { const mode = source || (allowContributors === true ? 'mixed' : 'official'); return mode === 'mixed' || (mode === 'official' ? official : !official); };

export function chooseMixedEnvironment(recent: string[], random = Math.random): Exclude<EnvironmentSettings['environment'], 'mixed'> {
  const blocked = recent.length >= 2 && recent.at(-1) === recent.at(-2) ? recent.at(-1) : '';
  const entries = Object.entries(mixedWeights).filter(([environment]) => environment !== blocked);
  let pick = random() * entries.reduce((sum, [, weight]) => sum + weight, 0);
  for (const [environment, weight] of entries) {
    pick -= weight;
    if (pick <= 0) return environment as 'urban' | 'suburban' | 'rural';
  }
  return 'rural';
}

const around = (seed: CitySeed, minKm: number, maxKm: number, random: () => number) => {
  const distance = minKm + random() * (maxKm - minKm);
  const bearing = random() * Math.PI * 2;
  return {
    lat: seed.lat + Math.cos(bearing) * distance / 111.32,
    lng: seed.lng + Math.sin(bearing) * distance / (111.32 * Math.max(.2, Math.cos(seed.lat * Math.PI / 180))),
  };
};

export const sampleCityPoolCandidate = (city: CityPoolCity, environment: Exclude<EnvironmentSettings['environment'], 'mixed'>, random = Math.random) => {
  const distances = environment === 'urban' ? [.12, .7] : environment === 'suburban' ? [.55, 1.6] : [1.5, 3];
  return { ...around(city, city.urbanRadiusKm * distances[0], city.urbanRadiusKm * distances[1], random), city };
};

export function sampleEnvironmentCandidate(countryCode: string, settings: EnvironmentSettings, random = Math.random) {
  const country = COUNTRIES[countryCode];
  if (!country) throw new Error(`Country ${countryCode} not found in database`);
  const cities = CITIES[countryCode] || [];
  if (settings.environment === 'urban' || settings.environment === 'suburban') {
    const allowed = classesForLevel(settings.urbanLevel);
    const eligible = cities.filter((city) => allowed.includes(city.class));
    if (!eligible.length) throw new Error(`No urban seeds are available for ${countryCode}`);
    const city = eligible[Math.floor(random() * eligible.length)];
    const inner = settings.environment === 'urban' ? city.urbanRadiusKm * .12 : Math.max(3, city.urbanRadiusKm * .55);
    const outer = settings.environment === 'urban' ? city.urbanRadiusKm * .7 : Math.max(inner + 3, city.urbanRadiusKm * 1.6);
    return { ...around(city, inner, outer, random), city };
  }
  if (settings.environment === 'rural') {
    let candidate = { lat: 0, lng: 0 };
    for (let i = 0; i < 30; i++) {
      candidate = {
        lat: country.bounds.minLat + random() * (country.bounds.maxLat - country.bounds.minLat),
        lng: country.bounds.minLng + random() * (country.bounds.maxLng - country.bounds.minLng),
      };
      if (cities.every((city) => calculateDistanceKm(candidate.lat, candidate.lng, city.lat, city.lng) > Math.max(10, city.urbanRadiusKm * 1.25))) break;
    }
    return candidate;
  }
  const useSeed = country.samplePoints.length && random() < .8;
  if (useSeed) {
    const seed = country.samplePoints[Math.floor(random() * country.samplePoints.length)];
    return { lat: seed.lat + (random() - .5) * .15, lng: seed.lng + (random() - .5) * .15 };
  }
  return {
    lat: country.bounds.minLat + random() * (country.bounds.maxLat - country.bounds.minLat),
    lng: country.bounds.minLng + random() * (country.bounds.maxLng - country.bounds.minLng),
  };
}

/**
 * Standard location generator using Google Maps StreetViewService
 * and curated country bounding/sampling seeds.
 * Implements the LocationGenerator interface so it can be swapped or enhanced.
 */
export class StreetViewLocationGenerator implements LocationGenerator {
  private svService: google.maps.StreetViewService | null = null;
  private balancedCounts = new Map<string, number>();
  private mixedHistory: string[] = [];

  constructor() {
    // Service initialized lazily when google.maps is ready
  }

  private getService(): google.maps.StreetViewService {
    if (!this.svService) {
      if (typeof google === 'undefined' || !google.maps || !google.maps.StreetViewService) {
        throw new Error('Google Maps API is not loaded yet');
      }
      this.svService = new google.maps.StreetViewService();
    }
    return this.svService;
  }

  /**
   * Generates a random coordinate candidate for a given country code.
   * On earlier attempts, uses tight jitter around known coverage seeds to ensure rapid hits.
   * On later attempts, expands sampling across country bounds.
   */
  private generateCandidate(countryCode: string, attempt: number, settings: EnvironmentSettings): { lat: number; lng: number; city?: CitySeed } {
    const country = COUNTRIES[countryCode];
    if (!country) {
      throw new Error(`Country ${countryCode} not found in database`);
    }

    if (settings.environment !== 'mixed') return sampleEnvironmentCandidate(countryCode, settings);
    const hasSeeds = country.samplePoints && country.samplePoints.length > 0;

    // Use seed points on early attempts or with high probability to guarantee quick resolution
    if (hasSeeds && (attempt <= 4 || Math.random() < 0.8)) {
      const seed = country.samplePoints[Math.floor(Math.random() * country.samplePoints.length)];
      // Tight jitter between ~500m and 5km on first attempts, up to 15km on later attempts
      const jitterFactor = attempt === 1 ? 0.02 : attempt <= 3 ? 0.06 : 0.15;
      const latOffset = (Math.random() - 0.5) * jitterFactor;
      const lngOffset = (Math.random() - 0.5) * jitterFactor;
      return {
        lat: seed.lat + latOffset,
        lng: seed.lng + lngOffset,
      };
    }

    // Uniform sample within bounding box
    const b = country.bounds;
    return {
      lat: b.minLat + Math.random() * (b.maxLat - b.minLat),
      lng: b.minLng + Math.random() * (b.maxLng - b.minLng),
    };
  }

  /**
   * Finds a valid Google Street View panorama inside the selected country collection.
   */
  async findRandomLocation(
    countryCodes: string[],
    signal?: AbortSignal,
    onStatusUpdate?: (status: string) => void,
    options: EnvironmentSettings = { environment: 'mixed', urbanLevel: 3 },
    context: LocationRequestContext = {}
  ): Promise<LocationResult> {
    if (!countryCodes || countryCodes.length === 0) {
      throw new Error('No countries available in this collection');
    }

    const sv = this.getService();
    const batchAttempts = options.environment === 'rural' ? 30 : 20;
    const maxAttempts = context.maxAttempts ?? Infinity;
    const resolvedTargets = context.locationTargets?.length ? await resolveLocationTargets(context.locationTargets) : [];
    if (context.locationTargets?.length && !resolvedTargets.length) throw new Error('The selected region or city pool is unavailable.');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      if (signal?.aborted) {
        throw new DOMException('Aborted', 'AbortError');
      }

      // Pick a random country from the collection
      const eligibleCountries = options.samplingMode === 'balanced'
        ? countryCodes.filter((code) => (this.balancedCounts.get(code) || 0) === Math.min(...countryCodes.map((item) => this.balancedCounts.get(item) || 0)))
        : countryCodes;
      const focused = resolvedTargets.length ? pickLocationTargetCity(resolvedTargets) : undefined;
      const randomCountryCode = focused?.target.countryCode || eligibleCountries[Math.floor(Math.random() * eligibleCountries.length)];
      const strategyAttempt = (attempt - 1) % batchAttempts + 1;
      const environment = options.environment === 'mixed' ? focused ? (Math.random() < .65 ? 'urban' : 'suburban') : strategyAttempt > 10 ? 'mixed' : chooseMixedEnvironment(this.mixedHistory) : options.environment;
      this.mixedHistory = [...this.mixedHistory, environment].slice(-2);
      const preferred = context.preferredCandidate?.countryCode === randomCountryCode ? context.preferredCandidate : undefined;
      const candidate: { lat: number; lng: number; city?: CitySeed } = focused ? sampleCityPoolCandidate(focused.city, environment === 'mixed' ? 'urban' : environment)
        : preferred ? around({ name: '', population: 0, class: 'local', urbanRadiusKm: 1, lat: preferred.lat, lng: preferred.lng }, preferred.minRadiusKm || 0, preferred.minRadiusKm ? preferred.radiusKm || 15 : Math.min(preferred.radiusKm ?? 15, strategyAttempt === 1 ? 0 : 2 ** (strategyAttempt - 2)), Math.random)
        : this.generateCandidate(randomCountryCode, environment === 'mixed' ? strategyAttempt - 10 : strategyAttempt, { ...options, environment });

      onStatusUpdate?.(
        attempt > 1 ? `Searching coverage (attempt ${attempt})...` : 'Finding random location...'
      );

      try {
        // Query nearest official outdoor street view panorama within search radius
        const baseRadius = environment === 'urban' ? 8000 : environment === 'suburban' ? 12000 : 15000;
        const radius = preferred ? Math.min(40000, Math.max(baseRadius, 8000 * 2 ** Math.max(0, strategyAttempt - 1))) : baseRadius;

        const data = await new Promise<google.maps.StreetViewPanoramaData | null>((resolve) => {
          sv.getPanorama(
            {
              location: new google.maps.LatLng(candidate.lat, candidate.lng),
              radius,
              preference: google.maps.StreetViewPreference.NEAREST,
              ...(options.allowInteriors ? {} : { source: google.maps.StreetViewSource.OUTDOOR }),
            },
            (panoData, status) => {
              if (status === google.maps.StreetViewStatus.OK && panoData) {
                resolve(panoData);
              } else {
                resolve(null);
              }
            }
          );
        });

        if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');

        if (data && data.location && data.location.latLng && data.location.pano) {
          if (!acceptsPanoramaSource(isOfficialGooglePanorama(data), options.panoramaSource, options.allowContributors)) continue;
          if (context.requireNavigation && !data.links?.length) continue;
          const lat = data.location.latLng.lat();
          const lng = data.location.latLng.lng();
          if (context.excludedPanoIds?.has(data.location.pano)) {
            if (context.requestId !== undefined) console.debug('[location-generation]', { requestId: context.requestId, requestedCountryCode: randomCountryCode, candidateLat: candidate.lat, candidateLng: candidate.lng, returnedPanoId: data.location.pano, returnedPanoLat: lat, returnedPanoLng: lng, resolvedCountryCode: 'excluded', collectionId: context.collectionId });
            continue;
          }
          const resolvedCountry = (await reverseGeocodeLocation(lat, lng))?.countryCode;
          if (context.requestId !== undefined) console.debug('[location-generation]', { requestId: context.requestId, requestedCountryCode: randomCountryCode, candidateLat: candidate.lat, candidateLng: candidate.lng, returnedPanoId: data.location.pano, returnedPanoLat: lat, returnedPanoLng: lng, resolvedCountryCode: resolvedCountry, collectionId: context.collectionId });
          if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
          if (!resolvedCountry || resolvedCountry !== randomCountryCode || !countryCodes.includes(resolvedCountry)) {
            console.warn(`Rejected panorama country mismatch: requested ${randomCountryCode}, resolved ${resolvedCountry || 'unknown'}`);
            continue;
          }
          const cityDistance = candidate.city ? calculateDistanceKm(lat, lng, candidate.city.lat, candidate.city.lng) : null;
          if (environment === 'urban' && cityDistance !== null && cityDistance > candidate.city!.urbanRadiusKm * 1.25) continue;
          if (environment === 'suburban' && cityDistance !== null && (cityDistance < candidate.city!.urbanRadiusKm * .3 || cityDistance > candidate.city!.urbanRadiusKm * 2)) continue;
          if (environment === 'rural' && (CITIES[resolvedCountry] || []).some((city) => calculateDistanceKm(lat, lng, city.lat, city.lng) <= Math.max(10, city.urbanRadiusKm * 1.25))) continue;
          this.balancedCounts.set(resolvedCountry, (this.balancedCounts.get(resolvedCountry) || 0) + 1);
          return {
            countryCode: resolvedCountry,
            lat,
            lng,
            panoId: data.location.pano,
            environment,
            environmentRequested: options.environment,
            urbanLevel: options.urbanLevel,
          };
        }
      } catch (err) {
        if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) throw err;
        console.warn(`Attempt ${attempt} lookup error:`, err);
      }

      // Brief delay between retries
      await new Promise((r) => setTimeout(r, attempt % batchAttempts ? 150 : 1500));
    }

    throw new Error('Could not find a valid Street View panorama. Please click "Next Location" to try again.');
  }

  async reopenLocation(location: LocationResult): Promise<LocationResult> {
    const sv = this.getService();
    const lookup = (request: google.maps.StreetViewLocationRequest | google.maps.StreetViewPanoRequest) =>
      new Promise<google.maps.StreetViewPanoramaData | null>((resolve) => {
        sv.getPanorama(request, (data, status) => resolve(
          status === google.maps.StreetViewStatus.OK && data?.location?.pano && data.location.latLng ? data : null
        ));
      });
    const original = await lookup({ pano: location.panoId });
    if (original?.location?.pano && original.location.latLng) {
      return {
        ...location,
        panoId: original.location.pano,
        lat: original.location.latLng.lat(),
        lng: original.location.latLng.lng(),
      };
    }
    const fallback = await lookup({
      location: { lat: location.lat, lng: location.lng }, radius: 50000,
      preference: google.maps.StreetViewPreference.NEAREST,
      source: google.maps.StreetViewSource.OUTDOOR,
    });
    if (!fallback?.location?.pano || !fallback.location.latLng) throw new Error('This panorama and nearby Street View coverage are unavailable.');
    return {
      ...location,
      panoId: fallback.location.pano,
      lat: fallback.location.latLng.lat(),
      lng: fallback.location.latLng.lng(),
      isFallback: true,
      isFallbackPanorama: true,
      originalPanoId: location.panoId,
    };
  }

  async resolveReviewLocation(location: LocationResult, plan: ReviewVariationPlan, recentlyShown = new Set<string>()): Promise<LocationResult> {
    const anchor = await this.reopenLocation(location);
    if (anchor.isFallback || plan.kind !== 'spatial' || !plan.maxDistanceM) return { ...anchor, heading: plan.kind === 'spatial' ? anchor.heading : plan.heading ?? anchor.heading };
    const sv = this.getService(); const radians = Math.PI / 180; const latitudeScale = 1 / 111_320;
    const targets = [.9, .7, .5, .3].map((scale, index) => {
      const angle = ((plan.seed % 360) + index * 137.508) * radians; const distance = plan.maxDistanceM * scale;
      return { lat: anchor.lat + Math.cos(angle) * distance * latitudeScale, lng: anchor.lng + Math.sin(angle) * distance * latitudeScale / Math.max(.2, Math.cos(anchor.lat * radians)) };
    });
    const radius = Math.max(40, Math.min(300, plan.maxDistanceM * .2));
    const lookups = Promise.all(targets.map((target) => new Promise<google.maps.StreetViewPanoramaData | null>((resolve) => sv.getPanorama({ location: target, radius, preference: google.maps.StreetViewPreference.NEAREST, source: google.maps.StreetViewSource.OUTDOOR }, (data, status) => resolve(status === google.maps.StreetViewStatus.OK && data?.location?.pano && data.location.latLng ? data : null)))));
    const found = await Promise.race([lookups, new Promise<Array<google.maps.StreetViewPanoramaData | null>>((resolve) => setTimeout(() => resolve([]), 3000))]);
    const resolving = Promise.all(found.filter((item): item is google.maps.StreetViewPanoramaData => !!item).map(async (item) => {
      const lat = item.location!.latLng!.lat(); const lng = item.location!.latLng!.lng(); const countryCode = (await reverseGeocodeLocation(lat, lng))?.countryCode;
      return countryCode ? { panoId: item.location!.pano!, lat, lng, countryCode, heading: plan.heading } satisfies ReviewCandidate : null;
    }));
    const candidates = (await Promise.race([resolving, new Promise<Array<ReviewCandidate | null>>((resolve) => setTimeout(() => resolve([]), 3000))])).filter(Boolean) as ReviewCandidate[];
    return chooseReviewCandidate(anchor, candidates, plan, recentlyShown);
  }
}

export const defaultLocationGenerator = new StreetViewLocationGenerator();
