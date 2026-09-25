import { useEffect, useRef } from 'react';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { centeredResultMapZoom, mapPresentationOptions, resultMapZoomLimit, shouldRecenterResultMap, useMapPreferences } from '../services/mapPreferences';

type Point = { lat: number; lng: number };
const positionResultMap = (map: google.maps.Map, element: HTMLElement, actual: Point, points: Point[], zoomPreference: Parameters<typeof resultMapZoomLimit>[0]) => {
  map.setCenter(actual);
  map.setZoom(Math.min(resultMapZoomLimit(zoomPreference), centeredResultMapZoom(actual, points, element.clientWidth, element.clientHeight)));
};

export function ResultMap({ actual, guess, previousGuesses = [], className = '', fullscreenControl = false, active = true, resizeKey, onSelect }: {
  actual: Point;
  guess: Point | null;
  previousGuesses?: Point[];
  className?: string;
  fullscreenControl?: boolean;
  active?: boolean;
  resizeKey?: boolean;
  onSelect?: (point: Point) => void;
}) {
  const { ui } = useLanguagePreferences();
  const mapPreferences = useMapPreferences();
  const t = (key: string) => translate(ui, key);
  const element = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const pointsRef = useRef<Point[]>([]);
  const positionedRef = useRef(false);
  const selectable = !!onSelect;
  const previousGuessKey = previousGuesses.map((point) => `${point.lat},${point.lng}`).join('|');

  useEffect(() => {
    if (!element.current || typeof google === 'undefined') return;
    const map = new google.maps.Map(element.current, {
      mapTypeControl: false, streetViewControl: false, fullscreenControl, zoomControl: true,
      ...mapPresentationOptions(mapPreferences, document.documentElement.classList.contains('dark')),
      internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
    } as google.maps.MapOptions);
    positionedRef.current = false;
    mapRef.current = map;
    return () => {
      google.maps.event.clearInstanceListeners(map);
      if (mapRef.current === map) mapRef.current = null;
      pointsRef.current = [];
    };
  }, [fullscreenControl]);

  useEffect(() => { mapRef.current?.setOptions(mapPresentationOptions(mapPreferences, document.documentElement.classList.contains('dark'))); }, [mapPreferences]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onSelect) return;
    const coverage = new google.maps.StreetViewCoverageLayer(); coverage.setMap(map);
    const listener = map.addListener('click', (event: google.maps.MapMouseEvent) => { if (event.latLng) onSelect({ lat: event.latLng.lat(), lng: event.latLng.lng() }); });
    return () => { listener.remove(); coverage.setMap(null); };
  }, [onSelect]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !element.current) return;
    const points = [actual, ...(guess ? [guess] : []), ...previousGuesses];
    pointsRef.current = points;
    const markers: google.maps.Marker[] = [];
    const lines: google.maps.Polyline[] = [];
    const addMarker = (position: Point, title: string, color: string, scale = 7) => {
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
    if (shouldRecenterResultMap(selectable, positionedRef.current)) positionResultMap(map, element.current, actual, points, mapPreferences.resultMapZoom);
    positionedRef.current = true;
    return () => {
      markers.forEach((marker) => marker.setMap(null));
      lines.forEach((line) => line.setMap(null));
      if (pointsRef.current === points) pointsRef.current = [];
    };
  }, [actual.lat, actual.lng, fullscreenControl, guess?.lat, guess?.lng, previousGuessKey, selectable, ui, mapPreferences.resultMapZoom]);

  useEffect(() => {
    if (!active || !mapRef.current || !element.current || !pointsRef.current.length) return;
    const frame = requestAnimationFrame(() => {
      google.maps.event.trigger(mapRef.current!, 'resize');
      if (shouldRecenterResultMap(selectable, positionedRef.current)) positionResultMap(mapRef.current!, element.current!, actual, pointsRef.current, mapPreferences.resultMapZoom);
    });
    return () => cancelAnimationFrame(frame);
  }, [active, actual.lat, actual.lng, resizeKey, mapPreferences.resultMapZoom, selectable]);

  useEffect(() => {
    const map = mapRef.current; const container = element.current;
    if (!map || !container || typeof ResizeObserver === 'undefined') return;
    let frame = 0;
    const observer = new ResizeObserver(() => {
      cancelAnimationFrame(frame); frame = requestAnimationFrame(() => {
        google.maps.event.trigger(map, 'resize');
        if (shouldRecenterResultMap(selectable, positionedRef.current)) positionResultMap(map, container, actual, pointsRef.current, mapPreferences.resultMapZoom);
      });
    });
    observer.observe(container);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); };
  }, [actual.lat, actual.lng, mapPreferences.resultMapZoom, selectable]);

  return <div className={`result-map-wrap ${className}`}>
    <div ref={element} className="result-map-canvas" aria-label={t('resultMapAria')} />
    <div className="result-map-legend" aria-hidden="true"><span className="actual">{t('actual')}</span>{guess && <span className="current">{t('today')}</span>}{previousGuesses.length > 0 && <span className="previous">{t('previous')}</span>}</div>
  </div>;
}
