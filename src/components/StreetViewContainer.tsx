/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import { LocationResult } from '../types';
import { RefreshCw, KeyRound, ExternalLink, AlertCircle, RotateCcw } from 'lucide-react';
import { compassDirection } from '../services/gameLogic';
import { setStreetViewSnapshot } from '../services/streetViewSnapshot';
import { trainerDb } from '../data/trainerDb';
import { normalizeLanguagePreferences, translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

interface StreetViewContainerProps {
  currentLocation: LocationResult | null;
  isLoading: boolean;
  onNextLocation: () => void;
  statusMessage?: string;
  errorMessage?: string | null;
  onMapsLoaded?: () => void;
  canMove?: boolean;
  canPan?: boolean;
  canZoom?: boolean;
  onPanoramaChanged?: (location: LocationResult) => void;
  showCompass?: boolean;
  showSunTrainingHint?: boolean;
}

const mapsLoaderState = globalThis as typeof globalThis & { __geotrainerMapsLoaderConfigured?: boolean };

export const StreetViewContainer: React.FC<StreetViewContainerProps> = ({
  currentLocation,
  isLoading,
  onNextLocation,
  statusMessage,
  errorMessage,
  onMapsLoaded,
  canMove = true,
  canPan = true,
  canZoom = true,
  onPanoramaChanged,
  showCompass = true,
  showSunTrainingHint = false,
}) => {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const panoInstanceRef = useRef<google.maps.StreetViewPanorama | null>(null);
  const lockedPovRef = useRef<{ heading: number; pitch: number }>({ heading: 0, pitch: 0 });
  const isLockingPovRef = useRef<boolean>(false);
  const currentLocationRef = useRef(currentLocation);
  const onPanoramaChangedRef = useRef(onPanoramaChanged);
  const lastReportedPanoRef = useRef('');
  const pendingPanoRef = useRef('');
  const tileFailuresRef = useRef<number[]>([]);
  currentLocationRef.current = currentLocation;
  onPanoramaChangedRef.current = onPanoramaChanged;
  const [mapsLoaded, setMapsLoaded] = useState<boolean>(() => {
    return typeof google !== 'undefined' && !!google.maps && !!google.maps.StreetViewPanorama;
  });
  const [loadError, setLoadError] = useState<string | null>(null);
  const [tileRateLimited, setTileRateLimited] = useState(false);
  const [heading, setHeading] = useState(0);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

  // Listen for Google Maps Authentication failures (invalid key, unactivated API, referrer block)
  useEffect(() => {
    const prevAuthFailure = (window as unknown as { gm_authFailure?: () => void }).gm_authFailure;
    (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = () => {
      setLoadError(
        'Google Maps API key authentication failed. Please verify that your API key is valid and that Maps JavaScript API is enabled in your Google Cloud Console.'
      );
    };

    return () => {
      (window as unknown as { gm_authFailure?: () => void }).gm_authFailure = prevAuthFailure;
    };
  }, []);

  // Google does not surface Street View tile HTTP failures through its panorama API.
  // Capture repeated failed tile images so the user gets a useful fallback instead
  // of an unexplained wall of 429s in DevTools.
  useEffect(() => {
    const handleResourceError = (event: Event) => {
      const src = (event.target as HTMLImageElement | null)?.src || '';
      if (!src.includes('googleusercontent.com')) return;

      const now = Date.now();
      tileFailuresRef.current = [...tileFailuresRef.current.filter((time) => now - time < 10_000), now];
      if (tileFailuresRef.current.length >= 3) setTileRateLimited(true);
    };

    window.addEventListener('error', handleResourceError, true);
    return () => window.removeEventListener('error', handleResourceError, true);
  }, []);

  useEffect(() => {
    tileFailuresRef.current = [];
    setTileRateLimited(false);
  }, [currentLocation?.panoId]);

  // Load Google Maps JavaScript API
  useEffect(() => {
    if (typeof google !== 'undefined' && google.maps && google.maps.StreetViewPanorama) {
      setMapsLoaded(true);
      setLoadError(null);
      onMapsLoaded?.();
      return;
    }

    if (!apiKey) {
      setLoadError('missing_key');
      return;
    }

    let isMounted = true;
    const load = async () => {
      if (!mapsLoaderState.__geotrainerMapsLoaderConfigured) {
        const languages = normalizeLanguagePreferences(await trainerDb.setting('languagePreferences'));
        setOptions({ key: apiKey, v: 'weekly', language: languages.game });
        mapsLoaderState.__geotrainerMapsLoaderConfigured = true;
      }
      return Promise.all([importLibrary('maps'), importLibrary('streetView')]);
    };
    try {
      void load()
        .then(() => {
          if (isMounted) {
            setMapsLoaded(true);
            setLoadError(null);
            onMapsLoaded?.();
          }
        })
        .catch((err) => {
          console.error('Failed to load Google Maps JS API:', err);
          if (isMounted) {
            setLoadError(err.message || 'Failed to load Google Maps JavaScript API');
          }
        });
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Error configuring Google Maps';
      console.error(errorMsg);
      setLoadError(errorMsg);
    }

    return () => {
      isMounted = false;
    };
  }, [apiKey, onMapsLoaded]);

  // Initialize or update StreetViewPanorama
  useEffect(() => {
    if (!mapsLoaded || !containerRef.current) return;

    // Create panorama if not already instantiated
    if (!panoInstanceRef.current) {
      const panorama = new google.maps.StreetViewPanorama(containerRef.current, {
        // Spoiler-free training requirements:
        showRoadLabels: false,
        addressControl: false,
        linksControl: canMove,
        clickToGo: canMove,
        panControl: false,
        zoomControl: canZoom,
        scrollwheel: canZoom,
        disableDoubleClickZoom: !canZoom,
        fullscreenControl: true,
        enableCloseButton: false,
        motionTracking: false,
        motionTrackingControl: false,
        // Solution attribution per skill guidelines
        // @ts-expect-error internalUsageAttributionIds is required by GMP governance
        internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
      });

      // Handle locked camera (no panning)
      panorama.addListener('pov_changed', () => {
        const current = panoInstanceRef.current;
        if (!current) return;
        if (isLockingPovRef.current) {
          current.setPov(lockedPovRef.current);
          setHeading(lockedPovRef.current.heading);
          return;
        }
        setHeading(((current.getPov().heading % 360) + 360) % 360);
        const panoId = current.getPano();
        const pov = current.getPov();
        if (panoId) setStreetViewSnapshot({ panoId, heading: pov.heading, pitch: pov.pitch, zoom: current.getZoom() ?? 1 });
      });
      panorama.addListener('pano_changed', () => {
        const details = panorama.getLocation();
        const panoId = panorama.getPano();
        const pov = panorama.getPov();
        if (panoId) setStreetViewSnapshot({ panoId, heading: pov.heading, pitch: pov.pitch, zoom: panorama.getZoom() ?? 1 });
        const position = details?.latLng;
        const origin = currentLocationRef.current;
        if (!panoId || !position || !origin || panoId === lastReportedPanoRef.current) return;
        if (pendingPanoRef.current) {
          if (panoId !== pendingPanoRef.current) return;
          pendingPanoRef.current = '';
        }
        lastReportedPanoRef.current = panoId;
        onPanoramaChangedRef.current?.({
          panoId,
          lat: position.lat(),
          lng: position.lng(),
          countryCode: origin.countryCode,
        });
      });

      panoInstanceRef.current = panorama;
    } else {
      // Update options dynamically if mode or settings changed
      panoInstanceRef.current.setOptions({
        linksControl: canMove,
        clickToGo: canMove,
        zoomControl: canZoom,
        scrollwheel: canZoom,
        disableDoubleClickZoom: !canZoom,
      });
    }

    // Pano ID is canonical. Setting position first makes Google load a nearest pano,
    // then discard its tiles when setPano loads the requested one.
    if (currentLocation && panoInstanceRef.current) {
      const panorama = panoInstanceRef.current;
      isLockingPovRef.current = !canPan;
      if (panorama.getPano() === currentLocation.panoId) { pendingPanoRef.current = ''; return; }
      pendingPanoRef.current = currentLocation.panoId;
      panorama.setPano(currentLocation.panoId);

      const initialPov = {
        heading: Math.floor(Math.random() * 360),
        pitch: 0,
      };
      lockedPovRef.current = initialPov;
      panorama.setPov(initialPov);
      panorama.setZoom(1);
      panorama.setVisible(true);
    }
  }, [mapsLoaded, currentLocation, canMove, canPan, canZoom]);

  useEffect(() => () => {
    if (panoInstanceRef.current) {
      google.maps.event.clearInstanceListeners(panoInstanceRef.current);
      panoInstanceRef.current.setVisible(false);
      panoInstanceRef.current = null;
    }
  }, []);

  // Handle Missing Key State
  if (loadError === 'missing_key') {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center bg-stone-900 text-stone-100 p-6">
        <div className="max-w-md w-full bg-stone-800/90 border border-stone-700 rounded-xl p-6 shadow-2xl space-y-4">
          <div className="flex items-center space-x-3 text-amber-400">
            <KeyRound className="w-7 h-7 flex-shrink-0" />
            <h2 className="text-lg font-semibold tracking-tight text-white">{t('Google Maps API Key Required')}</h2>
          </div>
          <p className="text-sm text-stone-300 leading-relaxed">
            To explore official Google Street View panoramas, configure{' '}
            <code className="bg-stone-950 px-1.5 py-0.5 rounded text-amber-300 text-xs font-mono">
              VITE_GOOGLE_MAPS_API_KEY
            </code>{' '}
            in your environment or Settings.
          </p>
          <div className="bg-stone-900/80 rounded-lg p-3.5 border border-stone-700/70 text-xs text-stone-300 space-y-2">
            <p className="font-medium text-stone-200">{t('Zero-cost Prototyping Option:')}</p>
            <p className="text-stone-400">
              {t('You can generate a free')} <strong>{t('Maps Demo Key')}</strong> {t('instantly without billing or Cloud project setup.')}
            </p>
            <a
              href="https://mapsplatform.google.com/maps-demo-key?utm_campaign=gmp_mcp_codeassist_v1_aistudio"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-amber-400 hover:text-amber-300 font-medium underline mt-1"
            >
              {t('Get Free Maps Demo Key')}
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    );
  }

  // Handle General Load Error
  if (loadError) {
    return (
      <div className="flex-1 w-full h-full flex items-center justify-center bg-stone-900 text-stone-100 p-6">
        <div className="max-w-md bg-stone-800 border border-rose-800/60 rounded-xl p-6 text-center space-y-3 shadow-2xl">
          <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
          <h2 className="text-base font-semibold text-rose-200">{t('Google Maps Error')}</h2>
          <p className="text-sm text-stone-300 leading-relaxed">{loadError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex-1 w-full h-full overflow-hidden bg-black select-none">
      {/* Street View Container Element */}
      <div
        id="streetview-viewport"
        ref={containerRef}
        className="w-full h-full absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-stone-950/75 backdrop-blur-xs flex flex-col items-center justify-center z-20 pointer-events-none transition-opacity duration-200">
          <div className="flex flex-col items-center space-y-3 bg-stone-900/90 border border-stone-800 px-6 py-4 rounded-xl shadow-xl">
            <RefreshCw className="w-7 h-7 text-stone-200 animate-spin" />
            <span className="text-sm font-medium text-stone-200">
              {statusMessage || 'Loading Street View panorama...'}
            </span>
          </div>
        </div>
      )}

      {showCompass && currentLocation && !isLoading && (
        <div className="street-compass" aria-label={`${t('Compass')}, ${t('facing')} ${Math.round(heading)} ${t('degrees')} ${compassDirection(heading)}`}>
          <div className="street-compass-dial" style={{ transform: `rotate(${-heading}deg)` }}>
            <b>N</b><span className="east">E</span><span className="south">S</span><span className="west">W</span><i />
          </div>
          <small>{Math.round(heading)}°</small>
        </div>
      )}

      {showSunTrainingHint && currentLocation && !isLoading && (
        <div className="sun-training-hint"><strong>{t('Facing')}: {Math.round(heading)}° {compassDirection(heading)}</strong><span>{t('Compare sun and shadows with the compass. Hemisphere tendency varies by season and latitude.')}</span></div>
      )}

      {tileRateLimited && !isLoading && (
        <div
          role="alert"
          className="absolute top-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-2xl bg-[#f2f0e7] text-[#102734] shadow-2xl rounded-xl px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
        >
          <AlertCircle className="w-5 h-5 text-[#ed4b2f] flex-shrink-0" />
          <p className="text-xs leading-relaxed flex-1">
            Google is rate-limiting Street View image tiles. GeoTrainer cannot reroute Google’s private tile requests.
          </p>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setTileRateLimited(false);
                onNextLocation();
              }}
              className="px-3 py-2 text-xs font-semibold border border-[#8fa3aa] rounded-sm bg-white hover:border-[#0868f2] cursor-pointer"
            >
              {t('Try another')}
            </button>
            <a
              href="https://randomstreetview.com/#fullscreen"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-sm bg-[#0868f2] text-white hover:bg-[#2379f4]"
            >
              {t('Open fallback')} <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Error / Retry Overlay if lookup failed */}
      {!currentLocation && !isLoading && errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center z-20 p-6 text-center bg-stone-950/90">
          <div className="max-w-sm space-y-4 bg-stone-900 border border-stone-800 p-6 rounded-2xl shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-950/60 border border-rose-900 flex items-center justify-center mx-auto text-rose-300">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div className="space-y-1.5">
              <h2 className="text-base font-semibold text-stone-100">{t('Location Search Failed')}</h2>
              <p className="text-xs text-stone-400 leading-relaxed">{errorMessage}</p>
            </div>
            <button
              onClick={onNextLocation}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-stone-100 hover:bg-white text-stone-950 text-xs font-semibold rounded-lg shadow transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{t('Retry Next Location')}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
