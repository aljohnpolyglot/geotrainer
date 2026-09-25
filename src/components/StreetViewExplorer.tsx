import { useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { LoaderCircle, MapPinned, Search, SlidersHorizontal, X } from 'lucide-react';
import type { LocationResult, PanoramaSource } from '../types';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { mapPresentationOptions, useMapPreferences } from '../services/mapPreferences';
import { exactMapPlace, searchMapPlaces, type MapSearchResult } from '../services/mapSearch';
import { findExplorePanorama } from '../services/exploreMap';

export function StreetViewExplorer({ open, mapsReady, panoramaSource, allowInteriors, onSettingsChange, onClose, onSelect }: {
  open: boolean;
  mapsReady: boolean;
  panoramaSource: PanoramaSource;
  allowInteriors: boolean;
  onSettingsChange: (panoramaSource: PanoramaSource, allowInteriors: boolean) => void;
  onClose: () => void;
  onSelect: (location: Omit<LocationResult, 'countryCode'>) => void;
}) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const mapPreferences = useMapPreferences();
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<google.maps.Map | null>(null);
  const onSelectRef = useRef(onSelect);
  const uiRef = useRef(ui);
  const settingsRef = useRef({ panoramaSource, allowInteriors });
  const [initialized, setInitialized] = useState(open);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const [suggestionsOpen, setSuggestionsOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(-1);
  const suggestions = useMemo(() => searchMapPlaces(query), [query]);
  onSelectRef.current = onSelect;
  uiRef.current = ui;
  settingsRef.current = { panoramaSource, allowInteriors };

  useEffect(() => { if (open) setInitialized(true); }, [open]);

  useEffect(() => {
    if (!initialized || !mapsReady || !element.current || typeof google === 'undefined') return;
    map.current = new google.maps.Map(element.current, { center: { lat: 18, lng: 5 }, zoom: 2, minZoom: 1, maxZoom: 18, mapTypeControl: false, streetViewControl: false, fullscreenControl: false, ...mapPresentationOptions(mapPreferences, document.documentElement.classList.contains('dark')) });
    const coverage = new google.maps.StreetViewCoverageLayer(); coverage.setMap(map.current);
    const listener = map.current.addListener('click', async (event: google.maps.MapMouseEvent) => {
      if (!event.latLng) return;
      setLoading(true); setError('');
      const settings = settingsRef.current;
      try {
        onSelectRef.current(await findExplorePanorama(event.latLng, settings));
      } catch { setError(translate(uiRef.current, settings.panoramaSource === 'official' ? 'No official Street View found nearby. Choose Official + contributor below or click another blue road.' : 'No Street View found near that point. Click another blue road.')); }
      finally { setLoading(false); }
    });
    return () => { listener.remove(); coverage.setMap(null); if (map.current) google.maps.event.clearInstanceListeners(map.current); map.current = null; };
  }, [initialized, mapsReady]);

  useEffect(() => { map.current?.setOptions(mapPresentationOptions(mapPreferences, document.documentElement.classList.contains('dark'))); }, [mapPreferences]);

  useEffect(() => {
    if (open && map.current) requestAnimationFrame(() => google.maps.event.trigger(map.current!, 'resize'));
  }, [open]);

  const openPlace = (place: MapSearchResult) => {
    if (!map.current) return;
    setQuery(place.label); setError(''); setSuggestionsOpen(false); setActiveSuggestion(-1);
    if (place.bounds) map.current.fitBounds({ south: place.bounds.minLat, west: place.bounds.minLng, north: place.bounds.maxLat, east: place.bounds.maxLng });
    else { map.current.panTo({ lat: place.lat, lng: place.lng }); map.current.setZoom(10); }
  };

  const findPlace = () => {
    const place = exactMapPlace(query) || suggestions[activeSuggestion] || suggestions[0];
    if (place) openPlace(place);
    else if (query.trim()) setError(t('Place not found. Try a city, region, or country.'));
  };

  const handleSearchKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && suggestions.length) { event.preventDefault(); setSuggestionsOpen(true); setActiveSuggestion((index) => Math.min(index + 1, suggestions.length - 1)); }
    if (event.key === 'ArrowUp' && suggestions.length) { event.preventDefault(); setSuggestionsOpen(true); setActiveSuggestion((index) => Math.max(index - 1, 0)); }
    if (event.key === 'Escape') { setSuggestionsOpen(false); setActiveSuggestion(-1); }
  };

  if (!initialized) return null;
  return <section hidden={!open} className="street-view-explorer" aria-labelledby="street-view-explorer-title">
    <header><div><MapPinned size={20} /><span><h2 id="street-view-explorer-title">{t('Explore Street View')}</h2><p>{t('Click blue coverage to open a panorama.')}</p></span></div><form className="street-view-explorer-search" role="search" onSubmit={(event) => { event.preventDefault(); findPlace(); }}><Search size={16} /><input type="search" value={query} onChange={(event) => { const value = event.target.value; setQuery(value); setSuggestionsOpen(true); setActiveSuggestion(-1); const place = exactMapPlace(value); if (place) openPlace(place); }} onFocus={() => setSuggestionsOpen(true)} onKeyDown={handleSearchKeyDown} onBlur={() => window.setTimeout(() => setSuggestionsOpen(false), 120)} placeholder={t('Search city, region, or country')} aria-label={t('Search city, region, or country')} aria-controls="street-view-place-suggestions" aria-expanded={suggestionsOpen && suggestions.length > 0} aria-activedescendant={activeSuggestion >= 0 ? `street-view-place-${suggestions[activeSuggestion].id}` : undefined} autoComplete="off" role="combobox" />{suggestionsOpen && query.trim() && suggestions.length > 0 && <div id="street-view-place-suggestions" className="street-view-place-suggestions" role="listbox">{suggestions.map((place, index) => <button type="button" role="option" aria-selected={index === activeSuggestion} id={`street-view-place-${place.id}`} key={place.id} onMouseDown={(event) => event.preventDefault()} onClick={() => openPlace(place)}><span>{place.label}</span><small>{t(place.kind === 'city' ? 'City' : place.kind === 'region' ? 'Region' : 'Country')}</small></button>)}</div>}<button type="submit">{t('Search')}</button></form><button className="icon-button" onClick={onClose} aria-label={t('close')}><X size={18} /></button></header>
    <div ref={element} className="street-view-explorer-map" aria-label={t('Street View coverage map')} />
    <div className="street-view-explorer-settings"><span><SlidersHorizontal size={15} />{t('Location filters')}</span><label>{t('Street View imagery')}<select value={panoramaSource} onChange={(event) => onSettingsChange(event.target.value as PanoramaSource, allowInteriors)}><option value="official">{t('Official only')}</option><option value="mixed">{t('Official + contributor')}</option><option value="contributor">{t('Contributor only')}</option></select></label><label>{t('Indoor coverage')}<select value={allowInteriors ? 'mixed' : 'outdoor'} onChange={(event) => onSettingsChange(panoramaSource, event.target.value === 'mixed')}><option value="outdoor">{t('Outdoors only')}</option><option value="mixed">{t('Mixed indoors and outdoors')}</option></select></label></div>
    {(loading || error) && <div className={`street-view-explorer-status${error ? ' error' : ''}`} role="status">{loading && <LoaderCircle size={16} className="animate-spin" />}{loading ? t('Opening Street View…') : error}</div>}
  </section>;
}
