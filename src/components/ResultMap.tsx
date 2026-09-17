import { useEffect, useRef } from 'react';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { mapPresentationOptions, useMapPreferences } from '../services/mapPreferences';

type Point = { lat: number; lng: number };

export function ResultMap({ actual, guess, previousGuess, className = '', fullscreenControl = false, active = true }: {
  actual: Point;
  guess: Point | null;
  previousGuess?: Point | null;
  className?: string;
  fullscreenControl?: boolean;
  active?: boolean;
}) {
  const { ui } = useLanguagePreferences();
  const mapPreferences = useMapPreferences();
  const t = (key: string) => translate(ui, key);
  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const boundsRef = useRef<google.maps.LatLngBounds | null>(null);

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
    if (previousGuess) addMarker(previousGuess, t('previousGuess'), '#2563eb', 6);
    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
    const idle = map.addListener('idle', () => {
      if ((map.getZoom() || 0) > 15) map.setZoom(14);
      google.maps.event.removeListener(idle);
    });
    return () => {
      markers.forEach((marker) => marker.setMap(null));
      lines.forEach((line) => line.setMap(null));
      if (boundsRef.current === bounds) boundsRef.current = null;
    };
  }, [actual.lat, actual.lng, fullscreenControl, guess?.lat, guess?.lng, previousGuess?.lat, previousGuess?.lng, ui]);

  useEffect(() => {
    if (!active || !mapRef.current || !boundsRef.current) return;
    const frame = requestAnimationFrame(() => {
      google.maps.event.trigger(mapRef.current!, 'resize');
      mapRef.current?.fitBounds(boundsRef.current!, { top: 48, right: 48, bottom: 48, left: 48 });
    });
    return () => cancelAnimationFrame(frame);
  }, [active]);

  return <div className={`result-map-wrap ${className}`}>
    <div ref={element} className="result-map-canvas" aria-label={t('resultMapAria')} />
    <div className="result-map-legend" aria-hidden="true"><span className="actual">{t('actual')}</span>{guess && <span className="current">{t('today')}</span>}{previousGuess && <span className="previous">{t('previous')}</span>}</div>
  </div>;
}
