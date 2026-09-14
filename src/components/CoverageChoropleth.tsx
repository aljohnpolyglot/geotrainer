import { useEffect, useMemo, useState } from 'react';
import worldMap from '../assets/simple-world-map.svg?raw';
import { trainerDb } from '../data/trainerDb';
import { CLOUD_IMPORT_EVENT } from '../services/cloudSyncEvent';
import type { Attempt, ReviewRecord, TrainerLocation } from '../types';
import { countryName, coverageCountryValues, useHubTranslate, type CoverageOverlay } from './trainerHubUtils';

const PALETTES = {
  warm: ['#fee8c8', '#fdbb84', '#e34a33', '#b30000'],
  blue: ['#e1f2f7', '#8ecad8', '#3182a4', '#08506b'],
  green: ['#e5f5e0', '#a1d99b', '#41ab5d', '#006d2c'],
  purple: ['#f0e7f7', '#c7a9dc', '#8c62aa', '#54236e'],
} as const;
type MapPalette = keyof typeof PALETTES;

const escapeXml = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
const colorMap = (values: Record<string, number | null>, colors: readonly string[], label: string) => worldMap
  .replace('<svg ', `<svg class="coverage-choropleth-svg" role="img" aria-label="${escapeXml(label)}" `)
  .replace('<title>Simple World Map</title>', `<title>${escapeXml(label)}</title>`)
  .replace(/<path id="([^"]+)"([^>]*)\/>/g, (_match, id: string, rest: string) => {
    const value = values[id.toUpperCase()];
    const fill = value === null || value === undefined ? 'var(--choropleth-empty)' : colors[Math.min(3, Math.floor(value * 4))];
    return `<path id="${id}"${rest} fill="${fill}"><title>${escapeXml(countryName(id.toUpperCase()))}</title></path>`;
  });

export function CoverageChoropleth({ locations, attempts, reviews, overlay }: { locations: TrainerLocation[]; attempts: Attempt[]; reviews: ReviewRecord[]; overlay: CoverageOverlay }) {
  const t = useHubTranslate();
  const [palette, setPalette] = useState<MapPalette>('warm');
  useEffect(() => {
    let active = true;
    const load = () => void trainerDb.setting<MapPalette>('coverage.mapPalette').then((saved) => { if (active && saved && saved in PALETTES) setPalette(saved); });
    load(); window.addEventListener(CLOUD_IMPORT_EVENT, load);
    return () => { active = false; window.removeEventListener(CLOUD_IMPORT_EVENT, load); };
  }, []);
  const values = useMemo(() => coverageCountryValues(locations, attempts, reviews, overlay), [locations, attempts, reviews, overlay]);
  const colors = PALETTES[palette];
  const label = `${t('Country heatmap')} · ${t(overlay === 'score' ? 'averageScoreMap' : overlay === 'due' ? 'reviewsDueMap' : overlay === 'mastery' ? 'Mastery' : overlay)}`;
  const svg = useMemo(() => colorMap(values, colors, label), [values, colors, label]);
  return <section className="coverage-choropleth">
    <header><h3>{t('Country heatmap')}</h3><label>{t('Map palette')}<select value={palette} onChange={(event) => { const value = event.target.value as MapPalette; setPalette(value); void trainerDb.setSetting('coverage.mapPalette', value); }}><option value="warm">{t('Warm')}</option><option value="blue">{t('Blue')}</option><option value="green">{t('Green')}</option><option value="purple">{t('Purple')}</option></select></label></header>
    <div className="coverage-choropleth-map" dangerouslySetInnerHTML={{ __html: svg }} />
    <div className="coverage-choropleth-legend" aria-label={`${t('Low')} – ${t('High')}`}><span>{t('Low')}</span><i style={{ background: `linear-gradient(90deg, ${colors.join(', ')})` }} /><span>{t('High')}</span><em /><span>{t('No data')}</span></div>
    <a className="coverage-map-credit" href="https://github.com/flekschas/simple-world-map" target="_blank" rel="noreferrer">Al MacDonald / Fritz Lekschas · CC BY-SA 3.0</a>
  </section>;
}
