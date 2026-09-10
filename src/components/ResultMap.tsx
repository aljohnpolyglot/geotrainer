import { useEffect, useRef } from 'react';

type Point = { lat: number; lng: number };

export function ResultMap({ actual, guess, previousGuess, className = '' }: {
  actual: Point;
  guess: Point | null;
  previousGuess?: Point | null;
  className?: string;
}) {
  const element = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!element.current || typeof google === 'undefined') return;
    const map = new google.maps.Map(element.current, {
      mapTypeControl: false, streetViewControl: false, fullscreenControl: false, zoomControl: true,
      styles: [{ featureType: 'poi', stylers: [{ visibility: 'off' }] }, { featureType: 'transit', stylers: [{ visibility: 'off' }] }],
      internalUsageAttributionIds: ['gmp_mcp_codeassist_v1_aistudio'],
    } as google.maps.MapOptions);
    const bounds = new google.maps.LatLngBounds();
    const markers: google.maps.Marker[] = [];
    const lines: google.maps.Polyline[] = [];
    const addMarker = (position: Point, title: string, color: string, scale = 7) => {
      bounds.extend(position);
      markers.push(new google.maps.Marker({
        position, map, title,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale, fillColor: color, fillOpacity: 1, strokeColor: '#fff', strokeWeight: 3 },
      }));
    };
    addMarker(actual, 'Original location', '#22c55e', 8);
    if (guess) {
      addMarker(guess, 'Current review guess', '#ef4444');
      lines.push(new google.maps.Polyline({ path: [guess, actual], geodesic: true, strokeColor: '#f59e0b', strokeOpacity: .9, strokeWeight: 3, map }));
    }
    if (previousGuess) addMarker(previousGuess, 'Previous guess', '#2563eb', 6);
    map.fitBounds(bounds, { top: 48, right: 48, bottom: 48, left: 48 });
    const idle = map.addListener('idle', () => {
      if ((map.getZoom() || 0) > 15) map.setZoom(14);
      google.maps.event.removeListener(idle);
    });
    return () => {
      markers.forEach((marker) => marker.setMap(null));
      lines.forEach((line) => line.setMap(null));
      google.maps.event.clearInstanceListeners(map);
    };
  }, [actual.lat, actual.lng, guess?.lat, guess?.lng, previousGuess?.lat, previousGuess?.lng]);

  return <div className={`result-map-wrap ${className}`}>
    <div ref={element} className="result-map-canvas" aria-label="Result map: original location, current guess, and previous guess" />
    <div className="result-map-legend" aria-hidden="true"><span className="actual">Actual</span>{guess && <span className="current">Today</span>}{previousGuess && <span className="previous">Previous</span>}</div>
  </div>;
}
