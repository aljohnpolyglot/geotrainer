import { useEffect, useMemo, useState } from 'react';
import { Maximize2, Minus, Plus } from 'lucide-react';
import worldMap from '../assets/simple-world-map.svg?raw';
import { trainerDb } from '../data/trainerDb';
import { CLOUD_IMPORT_EVENT } from '../services/cloudSyncEvent';
import type { Attempt, ReviewRecord, TrainerLocation } from '../types';
import { countryName, coverageCountryCounts, coverageCountryValues, useHubTranslate, type CoverageOverlay } from './trainerHubUtils';

const PALETTES = {
  warm: ['#fee8c8', '#fdbb84', '#e34a33', '#b30000'],
  blue: ['#e1f2f7', '#8ecad8', '#3182a4', '#08506b'],
  green: ['#e5f5e0', '#a1d99b', '#41ab5d', '#006d2c'],
  purple: ['#f0e7f7', '#c7a9dc', '#8c62aa', '#54236e'],
} as const;
type MapPalette = keyof typeof PALETTES;

const escapeXml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const colorMap = (values: Record<string, number | null>, colors: readonly string[], label: string, emptyLabel: string, details: Record<string, string>) => worldMap
  .replace(/<\?xml[^>]*>\s*/, '')
  .replace(/<svg\b/, `<svg class="coverage-choropleth-svg" role="img" aria-label="${escapeXml(label)}"`)
  .replace(/(<svg\b[^>]*>)/, `$1<title>${escapeXml(label)}</title>`)
  .replace(/<path\b([^>]*\bid="([A-Z]{2})"[^>]*)\/>/g, (_match, attributes: string, id: string) => {
    const value = values[id];
    const fill = value === null || value === undefined ? 'var(--choropleth-empty)' : colors[Math.min(3, Math.floor(value * 4))];
    const detail = value === null || value === undefined ? emptyLabel : details[id] || '';
    return `<path${attributes.replace(/\sstyle="[^"]*"/, '')} style="fill:${fill}"><title>${escapeXml(countryName(id) + (detail ? ` · ${detail}` : ''))}</title></path>`;
  });

export function CoverageChoropleth({ locations, attempts, reviews, overlay }: { locations: TrainerLocation[]; attempts: Attempt[]; reviews: ReviewRecord[]; overlay: CoverageOverlay }) {
  const t = useHubTranslate();
  const [palette, setPalette] = useState<MapPalette>('warm');
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    let active = true;
    const load = () => void trainerDb.setting<MapPalette>('coverage.mapPalette').then((saved) => { if (active && saved && saved in PALETTES) setPalette(saved); });
    load(); window.addEventListener(CLOUD_IMPORT_EVENT, load);
    return () => { active = false; window.removeEventListener(CLOUD_IMPORT_EVENT, load); };
  }, []);
  const values = useMemo(() => coverageCountryValues(locations, attempts, reviews, overlay), [locations, attempts, reviews, overlay]);
  const counts = useMemo(() => coverageCountryCounts(locations), [locations]);
  const colors = PALETTES[palette];
  const label = `${t('Country heatmap')} · ${t(overlay === 'score' ? 'averageScoreMap' : overlay === 'due' ? 'reviewsDueMap' : overlay === 'mastery' ? 'Mastery' : overlay)}`;
  const emptyLabel = t(overlay === 'exposure' ? 'Not encountered' : overlay === 'due' || overlay === 'mastery' ? 'No review history' : 'No scored attempts');
  const details = useMemo(() => overlay === 'exposure' ? Object.fromEntries(Object.keys(counts).map((code) => [code, `${counts[code].panoramas} ${t('panoramas')} · ${counts[code].encounters} ${t('encounters')}`])) : {}, [counts, overlay, t]);
  const svg = useMemo(() => colorMap(values, colors, label, emptyLabel, details), [values, colors, label, emptyLabel, details]);
  return <section className="coverage-choropleth">
    <header><h3>{t('Country heatmap')}</h3><label>{t('Map palette')}<select value={palette} onChange={(event) => { const value = event.target.value as MapPalette; setPalette(value); void trainerDb.setSetting('coverage.mapPalette', value); }}><option value="warm">{t('Warm')}</option><option value="blue">{t('Blue')}</option><option value="green">{t('Green')}</option><option value="purple">{t('Purple')}</option></select></label></header>
    <div className="coverage-choropleth-map">
      <div className="coverage-choropleth-viewport">
        <div className="coverage-choropleth-canvas" style={{ transform: `scale(${zoom})` }} dangerouslySetInnerHTML={{ __html: svg }} />
        <div className="coverage-choropleth-zoom" aria-label={t('Map zoom controls')}>
          <button type="button" onClick={() => setZoom((value) => Math.min(4, Number((value + .5).toFixed(1))))} disabled={zoom >= 4} aria-label={t('Zoom in')} title={t('Zoom in')}><Plus size={15} /></button>
          <button type="button" onClick={() => setZoom((value) => Math.max(1, Number((value - .5).toFixed(1))))} disabled={zoom <= 1} aria-label={t('Zoom out')} title={t('Zoom out')}><Minus size={15} /></button>
          <button type="button" onClick={() => setZoom(1)} disabled={zoom === 1} aria-label={t('Reset map zoom')} title={t('Reset map zoom')}><Maximize2 size={14} /></button>
        </div>
      </div>
    </div>
    <div className="coverage-choropleth-legend" aria-label={`${t('Low')} – ${t('High')}`}><span>{t('Low')}</span><i style={{ background: `linear-gradient(90deg, ${colors.join(', ')})` }} /><span>{t('High')}</span><em /><span>{emptyLabel}</span></div>
    <a className="coverage-map-credit" href="https://simplemaps.com/resources/svg-world" target="_blank" rel="noreferrer">SimpleMaps · MIT</a>
  </section>;
}
