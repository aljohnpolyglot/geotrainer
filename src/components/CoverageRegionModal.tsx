import { useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import type { Attempt, ReviewRecord, TrainerLocation } from '../types';
import { reverseGeocodeLocation } from '../services/geocoding';
import { findRegionId, regionSvgMarkup } from '../services/regionHeatmap';
import { countryName, coverageRegionValues, useHubTranslate, type CoverageOverlay } from './trainerHubUtils';
import { CountryFlag } from './CountryFlag';
import { ZoomableSvgMap } from './ZoomableSvgMap';

type RegionMap = { svg: string; regions: Record<string, string> };

export function CoverageRegionModal({ countryCode, locations, attempts, reviews, overlay, colors, onClose }: {
  countryCode: string; locations: TrainerLocation[]; attempts: Attempt[]; reviews: ReviewRecord[];
  overlay: CoverageOverlay; colors: readonly string[]; onClose: () => void;
}) {
  const t = useHubTranslate();
  const [map, setMap] = useState<RegionMap>();
  const [state, setState] = useState<'loading' | 'ready' | 'unavailable'>('loading');
  const [regionByPano, setRegionByPano] = useState<Record<string, string>>({});
  const [cityByPano, setCityByPano] = useState<Record<string, string>>({});
  const [hoveredRegion, setHoveredRegion] = useState<string>();
  const countryLocations = useMemo(() => locations.filter((item) => item.countryCode === countryCode), [locations, countryCode]);
  const locationKey = countryLocations.map((item) => `${item.panoId}:${item.adminArea || ''}:${item.locality || ''}`).join('|');
  useEffect(() => {
    const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', close);
    return () => window.removeEventListener('keydown', close);
  }, [onClose]);
  useEffect(() => {
    let active = true;
    setMap(undefined); setRegionByPano({}); setCityByPano({}); setHoveredRegion(undefined); setState('loading');
    const load = async () => {
      const prefix = `${import.meta.env.BASE_URL}admin1-regions/${countryCode.toLowerCase()}`;
      try {
        const [svgResponse, regionsResponse] = await Promise.all([fetch(`${prefix}/${countryCode.toLowerCase()}.svg`), fetch(`${prefix}/regions.json`)]);
        if (!svgResponse.ok || !regionsResponse.ok) throw new Error('regional map unavailable');
        const [svg, regions] = await Promise.all([svgResponse.text(), regionsResponse.json() as Promise<Record<string, string>>]);
        if (!active) return;
        const known: Record<string, string> = {};
        const cities: Record<string, string> = {};
        for (const item of countryLocations) {
          const id = findRegionId(countryCode, regions, item.adminArea);
          if (id) known[item.panoId] = id;
          if (item.locality) cities[item.panoId] = item.locality;
        }
        const pending = countryLocations.filter((item) => !known[item.panoId] || !cities[item.panoId]);
        if (typeof google !== 'undefined' && google.maps?.Geocoder) {
          for (let index = 0; index < pending.length; index += 5) {
            if (!active) return;
            const batch = pending.slice(index, index + 5);
            const results = await Promise.all(batch.map((item) => reverseGeocodeLocation(item.lat, item.lng)));
            if (!active) return;
            batch.forEach((item, offset) => {
              const result = results[offset];
              const id = result?.countryCode === countryCode ? findRegionId(countryCode, regions, result.adminArea, result.adminAreaCode) : undefined;
              if (id) known[item.panoId] = id;
              if (result?.countryCode === countryCode && result.locality) cities[item.panoId] = result.locality;
            });
          }
        }
        setRegionByPano(known); setCityByPano(cities); setMap({ svg, regions }); setState('ready');
      } catch {
        if (active) setState('unavailable');
      }
    };
    void load();
    return () => { active = false; };
  }, [countryCode, locationKey]);
  const values = useMemo(() => coverageRegionValues(countryLocations, attempts, reviews, overlay, regionByPano), [countryLocations, attempts, reviews, overlay, regionByPano]);
  const emptyLabel = t(overlay === 'exposure' ? 'Not encountered' : overlay === 'due' || overlay === 'mastery' ? 'No review history' : 'No scored attempts');
  const svg = useMemo(() => map && regionSvgMarkup(map.svg, map.regions, values, colors, emptyLabel, `${countryName(countryCode)} · ${t('Regions')}`), [map, values, colors, emptyLabel, countryCode, t]);
  const cities = hoveredRegion ? [...new Set(countryLocations.filter((item) => regionByPano[item.panoId] === hoveredRegion).map((item) => cityByPano[item.panoId]).filter(Boolean))] : [];
  return createPortal(<div className="coverage-region-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="coverage-region-modal" role="dialog" aria-modal="true" aria-labelledby="coverage-region-title">
      <header><h2 id="coverage-region-title"><CountryFlag code={countryCode} />{countryName(countryCode)} · {t('Regions')}</h2><button type="button" autoFocus onClick={onClose} aria-label={t('close')} title={t('close')}><X size={20} /></button></header>
      {state === 'loading' && <div className="coverage-region-skeleton" aria-label={t('Loading regional map…')}><i /><i /><i /></div>}
      {state === 'unavailable' && <p className="coverage-region-message">{t('Regional map unavailable for this country.')}</p>}
      {svg && <div className="coverage-region-content"><div className="coverage-region-map"><ZoomableSvgMap svg={svg} onPathClick={setHoveredRegion} onPathHover={setHoveredRegion} />{hoveredRegion && map?.regions[hoveredRegion] && <div className="coverage-region-tooltip"><strong>{map.regions[hoveredRegion]}</strong>{cities.length > 0 && <span>{cities.slice(0, 3).join(' · ')}{cities.length > 3 ? ` +${cities.length - 3}` : ''}</span>}</div>}</div><p>{Object.keys(regionByPano).length}/{countryLocations.length} {t('locations matched to regions')}</p><div className="coverage-choropleth-legend" aria-label={`${t('Low')} – ${t('High')}`}><span>{t('Low')}</span><i style={{ background: `linear-gradient(90deg, ${colors.join(', ')})` }} /><span>{t('High')}</span><em /><span>{emptyLabel}</span></div><a className="coverage-map-credit" href={countryCode === 'AU' ? 'https://www.naturalearthdata.com/' : 'https://simplemaps.com/resources/svg-world'} target="_blank" rel="noreferrer">{countryCode === 'AU' ? 'Natural Earth · public domain' : 'SimpleMaps · MIT'}</a></div>}
    </section>
  </div>, document.body);
}
