import { useEffect, useRef, useState } from 'react';
import { LoaderCircle, MapPinned, Search, X } from 'lucide-react';
import type { LocationResult } from '../types';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { mapPresentationOptions, useMapPreferences } from '../services/mapPreferences';

export function StreetViewExplorer({ open, mapsReady, onClose, onSelect }: {
  open: boolean;
  mapsReady: boolean;
  onClose: () => void;
  onSelect: (location: Omit<LocationResult, 'countryCode'>) => void;
}) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const mapPreferences = useMapPreferences();
  const element = useRef<HTMLDivElement>(null);
  const search = useRef<HTMLInputElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const uiRef = useRef(ui);
  const [initialized, setInitialized] = useState(open);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  onSelectRef.current = onSelect;
  uiRef.current = ui;

  useEffect(() => { if (open) setInitialized(true); }, [open]);

  useEffect(() => {
    if (!initialized || !mapsReady || !element.current || typeof google === 'undefined') return;
    map.current = new google.maps.Map(element.current, { center: { lat: 18, lng: 5 }, zoom: 2, minZoom: 1, maxZoom: 18, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, ...mapPresentationOptions(mapPreferences, document.documentElement.classList.contains('dark')) });
    const coverage = new google.maps.StreetViewCoverageLayer(); coverage.setMap(map.current);
    const service = new google.maps.StreetViewService();
    let autocomplete: google.maps.places.Autocomplete | undefined;
    let autocompleteListener: google.maps.MapsEventListener | undefined;
    void google.maps.importLibrary('places').then(() => {
      if (!map.current || !search.current) return;
      autocomplete = new google.maps.places.Autocomplete(search.current, { fields: ['geometry', 'name', 'formatted_address'], types: ['geocode'] });
      autocomplete.bindTo('bounds', map.current);
      autocompleteListener = autocomplete.addListener('place_changed', () => {
        const place = autocomplete?.getPlace();
        if (place?.geometry?.viewport) map.current?.fitBounds(place.geometry.viewport);
        else if (place?.geometry?.location) { map.current?.panTo(place.geometry.location); map.current?.setZoom(10); }
      });
    }).catch(() => {});
    const listener = map.current.addListener('click', async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      setLoading(true); setError('');
      try {
        const request = { location: event.latLng, radius: 250, preference: google.maps.StreetViewPreference.NEAREST };
        const { data } = await service.getPanorama({ ...request, source: google.maps.StreetViewSource.OUTDOOR }).catch(() => service.getPanorama(request));
        const position = data.location?.latLng; const panoId = data.location?.pano;
        if (!position || !panoId) throw new Error();
        onSelectRef.current({ panoId, lat: position.lat(), lng: position.lng() });
      } catch { setError(translate(uiRef.current, 'No Street View found near that point. Click another blue road.')); }
      finally { setLoading(false); }
    });
    return () => { listener.remove(); autocompleteListener?.remove(); autocomplete?.unbindAll(); coverage.setMap(null); if (map.current) google.maps.event.clearInstanceListeners(map.current); map.current = null; };
  }, [initialized, mapsReady]);

  useEffect(() => { map.current?.setOptions(mapPresentationOptions(mapPreferences, document.documentElement.classList.contains('dark'))); }, [mapPreferences]);

  useEffect(() => {
    if (open && map.current) requestAnimationFrame(() => google.maps.event.trigger(map.current!, 'resize'));
  }, [open]);

  const findPlace = async () => {
    const query = search.current?.value.trim();
    if (!query || !map.current) return;
    setLoading(true); setError('');
    try {
      const { results } = await new google.maps.Geocoder().geocode({ address: query });
      const result = results[0];
      if (!result) throw new Error();
      if (result.geometry.viewport) map.current.fitBounds(result.geometry.viewport);
      else { map.current.panTo(result.geometry.location); map.current.setZoom(10); }
    } catch { setError(t('Place not found. Try a city, region, or country.')); }
    finally { setLoading(false); }
  };

  if (!initialized) return null;
  return <section hidden={!open} className="street-view-explorer" aria-labelledby="street-view-explorer-title">
    <header><div><MapPinned size={20} /><span><h2 id="street-view-explorer-title">{t('Explore Street View')}</h2><p>{t('Click blue coverage to open a panorama.')}</p></span></div><form className="street-view-explorer-search" role="search" onSubmit={(event) => { event.preventDefault(); void findPlace(); }}><Search size={16} /><input ref={search} type="search" placeholder={t('Search city, region, or country')} aria-label={t('Search city, region, or country')} /><button type="submit">{t('Search')}</button></form><button className="icon-button" onClick={onClose} aria-label={t('close')}><X size={18} /></button></header>
    <div ref={element} className="street-view-explorer-map" aria-label={t('Street View coverage map')} />
    {(loading || error) && <div className={`street-view-explorer-status${error ? ' error' : ''}`} role="status">{loading && <LoaderCircle size={16} className="animate-spin" />}{loading ? t('Opening Street View…') : error}</div>}
  </section>;
}
