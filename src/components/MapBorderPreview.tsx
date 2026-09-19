import { useEffect, useRef } from 'react';
import type { MapPreferences } from '../types';
import { mapPresentationOptions } from '../services/mapPreferences';

export function MapBorderPreview({ preferences, dark, label }: { preferences: MapPreferences; dark: boolean; label: string }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  useEffect(() => {
    if (!element.current || typeof google === 'undefined') return;
    map.current ||= new google.maps.Map(element.current, { center: { lat: 60.5, lng: 15 }, zoom: 4, disableDefaultUI: true, draggable: false, keyboardShortcuts: false, scrollwheel: false });
    map.current.setOptions(mapPresentationOptions(preferences, dark));
  }, [dark, preferences]);
  return <div className="map-border-preview"><span>{label}</span><div ref={element} className="map-border-preview-canvas" role="img" aria-label={label} /></div>;
}
