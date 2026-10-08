import { acquireMap } from '../services/mapResources';
import { useEffect, useRef } from 'react';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { centeredResultMapZoom, mapPresentationOptions, resultMapZoomLimit, shouldRecenterResultMap, useMapPreferences } from '../services/mapPreferences';
import { getStreetViewSnapshot, subscribeStreetViewSnapshot } from '../services/streetViewSnapshot';

type Point = { lat: number; lng: number };
const positionResultMap = (map: google.maps.Map, element: HTMLElement, actual: Point, points: Point[], zoomPreference: Parameters<typeof resultMapZoomLimit>[0]) => {
  map.setCenter(actual);
  map.setZoom(Math.min(resultMapZoomLimit(zoomPreference), centeredResultMapZoom(actual, points, element.clientWidth, element.clientHeight)));
};

export function ResultMap({ actual, guess, previousGuesses = [], panoId, heading, className = '', fullscreenControl = false, active = true, resizeKey, onSelect }: {
  actual: Point;
  guess: Point | null;
  previousGuesses?: Point[];
  panoId?: string;
  heading?: number;
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
    const resource = acquireMap('result', element.current, {
      center: actual, zoom: resultMapZoomLimit(mapPreferences.resultMapZoom),
      mapTypeControl: false, streetViewControl: false, fullscreenControl, zoomControl: true,
      ...mapPresentationOptions(mapPreferences, document.documentElement.classList.contains('dark')),
      internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
    } as google.maps.MapOptions);
    const map = resource.map;
    positionedRef.current = false;
    mapRef.current = map;
    return () => {
      resource.release();
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
    let direction: google.maps.Marker | undefined;
    const updateDirection = (bearing?: number) => {
      if (!Number.isFinite(bearing)) { direction?.setMap(null); direction = undefined; return; }
      const icon: google.maps.Symbol = { path: 'M 0 0 L -9 -25 A 27 27 0 0 1 9 -25 Z', rotation: bearing, scale: 1, fillColor: '#22c55e', fillOpacity: .42, strokeColor: '#fff', strokeOpacity: .85, strokeWeight: 1 };
      if (direction) direction.setIcon(icon);
      else { direction = new google.maps.Marker({ position: actual, map, icon, clickable: false, zIndex: 1 }); markers.push(direction); }
    };
    updateDirection((panoId && getStreetViewSnapshot(panoId)?.heading) ?? heading);
    const unsubscribe = panoId ? subscribeStreetViewSnapshot((snapshot) => { if (snapshot.locationPanoId === panoId || snapshot.panoId === panoId) updateDirection(snapshot.heading); }) : undefined;
    addMarker(actual, t('originalLocation'), '#22c55e', 8);
    if (guess) {
      addMarker(guess, t('currentGuess'), '#ef4444');
      lines.push(new google.maps.Polyline({ path: [guess, actual], geodesic: true, strokeColor: '#f59e0b', strokeOpacity: .9, strokeWeight: 3, map }));
    }
    previousGuesses.forEach((point) => addMarker(point, t('previousGuess'), '#2563eb', 6));
    if (shouldRecenterResultMap(selectable, positionedRef.current)) positionResultMap(map, element.current, actual, points, mapPreferences.resultMapZoom);
    positionedRef.current = true;
    return () => {
      unsubscribe?.();
      markers.forEach((marker) => marker.setMap(null));
      lines.forEach((line) => line.setMap(null));
      if (pointsRef.current === points) pointsRef.current = [];
    };
  }, [actual.lat, actual.lng, fullscreenControl, guess?.lat, guess?.lng, previousGuessKey, panoId, heading, selectable, ui, mapPreferences.resultMapZoom]);

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
