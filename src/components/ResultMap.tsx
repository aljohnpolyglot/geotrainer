import { useEffect, useRef } from 'react';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { mapPresentationOptions, resultMapZoomLimit, useMapPreferences } from '../services/mapPreferences';

type Point = { lat: number; lng: number };
const fitResultBounds = (map: google.maps.Map, bounds: google.maps.LatLngBounds, zoomPreference: Parameters<typeof resultMapZoomLimit>[0]) => {
  map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
  google.maps.event.addListenerOnce(map, 'idle', () => { const limit = resultMapZoomLimit(zoomPreference); if ((map.getZoom() || 0) > limit) map.setZoom(limit); });
};

export function ResultMap({ actual, guess, previousGuesses = [], className = '', fullscreenControl = false, active = true, resizeKey }: {
  actual: Point;
  guess: Point | null;
  previousGuesses?: Point[];
  className?: string;
  fullscreenControl?: boolean;
  active?: boolean;
  resizeKey?: boolean;
}) {
  const { ui } = useLanguagePreferences();
  const mapPreferences = useMapPreferences();
  const t = (key: string) => translate(ui, key);
  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);
  const previousGuessKey = previousGuesses.map((point) => `${point.lat},${point.lng}`).join('|');

  useEffect(() => {
    if (!element.current || typeof google === 'undefined') return;
    const map = new google.maps.Map(element.current, {
      mapTypeControl: false, streetViewControl: false, fullscreenControl, zoomControl: true,
      ...mapPresentationOptions(mapPreferences, document.documentElement.classList.contains('dark')),
      internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
    } as google.maps.MapOptions);
    mapRef.current = map;
    return () => {
      google.maps.event.clearInstanceListeners(map);
      if (mapRef.current === map) mapRef.current = null;
      boundsRef.current = null;
    };
  }, [fullscreenControl]);

  useEffect(() => { mapRef.current?.setOptions(mapPresentationOptions(mapPreferences, document.documentElement.classList.contains('dark'))); }, [mapPreferences]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const bounds = new google.maps.LatLngBounds();
    boundsRef.current = bounds;
    const markers: google.maps.Marker[] = [];
    const lines: google.maps.Polyline[] = [];
    const addMarker = (position: Point, title: string, color: string, scale = 7) => {
      bounds.extend(position);
      markers.push(new google.maps.Marker({
        position, map, title,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale, fillColor: color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
      }));
    };
    addMarker(actual, t('originalLocation'), '#22c55e', 8);
    if (guess) {
      addMarker(guess, t('currentGuess'), '#ef4444');
      lines.push(new google.maps.Polyline({ path: [guess, actual], geodesic: true, strokeColor: '#f59e0b', strokeOpacity: .9, strokeWeight: 3, map }));
    }
    previousGuesses.forEach((point) => addMarker(point, t('previousGuess'), '#2563eb', 6));
    fitResultBounds(map, bounds, mapPreferences.resultMapZoom);
    return () => {
      markers.forEach((marker) => marker.setMap(null));
      lines.forEach((line) => line.setMap(null));
      if (boundsRef.current === bounds) boundsRef.current = null;
    };
  }, [actual.lat, actual.lng, fullscreenControl, guess?.lat, guess?.lng, previousGuessKey, ui, mapPreferences.resultMapZoom]);

  useEffect(() => {
    if (!active || !mapRef.current || !boundsRef.current) return;
    const frame = requestAnimationFrame(() => {
      google.maps.event.trigger(mapRef.current!, 'resize');
      fitResultBounds(mapRef.current!, boundsRef.current!, mapPreferences.resultMapZoom);
    });
    return () => cancelAnimationFrame(frame);
  }, [active, resizeKey, mapPreferences.resultMapZoom]);

  return <div className={`result-map-wrap ${className}`}>
    <div ref={element} className="result-map-canvas" aria-label={t('resultMapAria')} />
    <div className="result-map-legend" aria-hidden="true"><span className="actual">{t('actual')}</span>{guess && <span className="current">{t('today')}</span>}{previousGuesses.length > 0 && <span className="previous">{t('previous')}</span>}</div>
  </div>;
}
