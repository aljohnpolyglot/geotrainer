import { useEffect, useState } from 'react';
import { BookOpen, Download, FileJson, Lightbulb, Link, Map, Play, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import type { Collection, Environment, LearnPriority, LearnSource, LocationPoolTarget, PanoramaSource, SamplingMode, UrbanLevel } from '../types';
import { CountryMixPicker } from './CountryMixPicker';
import { CollectionOptions } from './CollectionOptions';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { trainerDb } from '../data/trainerDb';
import { hasRemainingMetaLessons } from '../data/metaLessons';
import { ImportedMapUpload } from './ImportedMapUpload';
import { downloadGeographicPool, getImportedMap, type ImportedMap } from '../services/importedMap';
import { LocationPoolPicker } from './LocationPoolPicker';
import { normalizeStudySetup } from '../services/studySetup';
import { DescribePool } from './DescribePool';

export type StudySetup = { source: LearnSource; collectionId: string; countryCodes?: string[]; locationTargets?: LocationPoolTarget[]; importedMapId?: string; importedMapVariation?: number; environment: Environment; urbanLevel: UrbanLevel; samplingMode: SamplingMode; priority: LearnPriority; panoramaSource: PanoramaSource; allowInteriors: boolean; showCompass: boolean };
type SetupPanel = LearnSource | 'url' | 'describe';

export function StudySetupModal({ open, collections, initial, onClose, onStart }: { open: boolean; collections: Collection[]; initial: StudySetup; onClose: () => void; onStart: (settings: StudySetup) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [settings, setSettings] = useState(() => normalizeStudySetup(initial, collections));
  const [panel, setPanel] = useState<SetupPanel>(initial.source);
  const [metaAvailable, setMetaAvailable] = useState<boolean | null>(null);
  const [importedMap, setImportedMap] = useState<ImportedMap>();
  const [loadedPoolName, setLoadedPoolName] = useState('');
  useEffect(() => { if (!open) return; let active = true; void trainerDb.setting<string>('local.currentMapId').then(async (id) => { const map = id && await getImportedMap(id); if (active) setImportedMap(map || undefined); }); return () => { active = false; }; }, [open]);
  useEffect(() => { if (!open) return; let active = true; setSettings(normalizeStudySetup(initial, collections)); setPanel(initial.source); setMetaAvailable(null); void trainerDb.attempts().then((attempts) => { if (!active) return; const available = hasRemainingMetaLessons(attempts); setMetaAvailable(available); if (!available) setPanel((value) => value === 'meta' ? 'custom' : value); }); return () => { active = false; }; }, [open]);
  if (!open) return null;
  const collection = collections.find((item) => item.id === settings.collectionId);
  const choices: Array<{ source: SetupPanel; icon: typeof SlidersHorizontal; title: string; description: string }> = [
    { source: 'custom', icon: SlidersHorizontal, title: 'Custom', description: 'Choose countries and surroundings.' },
    { source: 'meta', icon: Lightbulb, title: 'Meta', description: 'Learn visual GeoGuessr clues.' },
    { source: 'map', icon: Map, title: 'Explore Map', description: 'Pick from worldwide Street View coverage.' },
    { source: 'uploaded', icon: FileJson, title: 'Upload JSON', description: 'Open a Map Maker map or geographic pool file.' },
    { source: 'url', icon: Link, title: 'JSON URL', description: 'Load a map or geographic pool from a URL.' },
    { source: 'describe', icon: Sparkles, title: 'Describe a pool', description: 'Let AI choose editable countries, regions, and cities.' },
  ];
  return <div className="setup-backdrop"><section className="setup-dialog" aria-labelledby="study-setup-title">
    <header><span><BookOpen size={18} /></span><div><h2 id="study-setup-title">{t('Learn')}</h2><p>{t('Choose how you want to learn.')}</p></div><button className="icon-button" onClick={onClose} aria-label={t('close')}><X size={18} /></button></header>
    <div className="setup-body">
      <div className="learn-source-picker">{choices.map(({ source, icon: Icon, title, description }) => { const disabled = source === 'meta' && metaAvailable !== true; return <button key={source} type="button" disabled={disabled} className={panel === source ? 'selected' : ''} aria-pressed={panel === source} onClick={() => setPanel(source)}><Icon size={18} /><span><strong>{t(title)}</strong><small>{t(source === 'meta' && metaAvailable === false ? 'All Meta lessons completed.' : description)}</small></span></button>; })}</div>
      {panel === 'custom' && <div className="learn-custom-settings"><label>{t('Map Collection')}<select value={settings.collectionId} onChange={(event) => setSettings({ ...settings, collectionId: event.target.value, countryCodes: undefined, locationTargets: undefined })}><CollectionOptions collections={collections} customLabel={t('Custom collections')} /></select></label>
        <div className="setup-field"><label>{t('Country mix')}</label><CountryMixPicker value={settings.countryCodes || []} availableCodes={collection?.countryCodes || []} onChange={(countryCodes) => setSettings({ ...settings, countryCodes: countryCodes.length ? countryCodes : undefined, locationTargets: settings.locationTargets?.filter((target) => countryCodes.includes(target.countryCode)) })} /></div>
        {!!settings.countryCodes?.length && <div className="setup-field"><label>{t('Location pools')}</label>{loadedPoolName && <small className="imported-map-current"><strong>{loadedPoolName}</strong> · {t('Geographic pool')}</small>}<LocationPoolPicker countryCodes={settings.countryCodes} value={settings.locationTargets || []} onChange={(locationTargets) => setSettings({ ...settings, locationTargets: locationTargets.length ? locationTargets : undefined })} /><button type="button" className="button secondary save-location-pool" onClick={() => downloadGeographicPool(settings.countryCodes!, settings.locationTargets || [])}><Download size={15} />{t('Save geographic pool')}</button></div>}
        <div className="setup-grid"><label>{t('Environment')}<select value={settings.environment} onChange={(event) => setSettings({ ...settings, environment: event.target.value as Environment })}><option value="mixed">{t('Mixed')}</option><option value="urban">{t('Urban')}</option><option value="suburban">{t('Suburban')}</option><option value="rural">{t('Rural')}</option></select></label>{(settings.environment === 'urban' || settings.environment === 'suburban') && <label>{t('Urban Level')}<select value={settings.urbanLevel} onChange={(event) => setSettings({ ...settings, urbanLevel: Number(event.target.value) as UrbanLevel })}><option value="1">1 — {t('Major Cities')}</option><option value="2">2 — {t('Major + Regional')}</option><option value="3">3 — {t('All Available Seeds')}</option></select></label>}<label>{t('Sampling')}<select value={settings.samplingMode} onChange={(event) => setSettings({ ...settings, samplingMode: event.target.value as SamplingMode })}><option value="natural">{t('Natural')}</option><option value="balanced">{t('Balanced')}</option></select></label><label>{t('Priority')}<select value={settings.priority} onChange={(event) => setSettings({ ...settings, priority: event.target.value as LearnPriority })}><option value="random">{t('Random')}</option><option value="familiar">{t('Familiar places')}</option><option value="least-exposure">{t('Least exposure')}</option></select></label></div>
        <label>{t('Street View imagery')}<select value={settings.panoramaSource} onChange={(event) => setSettings({ ...settings, panoramaSource: event.target.value as PanoramaSource })}><option value="official">{t('Official only')}</option><option value="mixed">{t('Official + contributor')}</option><option value="contributor">{t('Contributor only')}</option></select></label>
        <label>{t('Indoor coverage')}<select value={settings.allowInteriors ? 'mixed' : 'outdoor'} onChange={(event) => setSettings({ ...settings, allowInteriors: event.target.value === 'mixed' })}><option value="outdoor">{t('Outdoors only')}</option><option value="mixed">{t('Mixed indoors and outdoors')}</option></select></label>
      </div>}
      {(panel === 'uploaded' || panel === 'url') && <><ImportedMapUpload source={panel === 'url' ? 'url' : 'upload'} map={importedMap} onChange={(map) => { if (map.kind === 'pool') { setLoadedPoolName(map.name); setPanel('custom'); setSettings({ ...settings, source: 'custom', collectionId: 'world', countryCodes: map.countryCodes, locationTargets: map.locationTargets }); return; } setImportedMap(map); void trainerDb.setSetting('local.currentMapId', map.id); }} />{importedMap?.kind !== 'pool' && <div className="setup-field imported-map-variation"><label htmlFor="imported-map-variation">{t('Location variation')} <output htmlFor="imported-map-variation">{settings.importedMapVariation ?? 0}</output></label><input id="imported-map-variation" type="range" min="0" max="100" value={settings.importedMapVariation ?? 0} onChange={(event) => setSettings({ ...settings, importedMapVariation: Number(event.target.value) })} /><small>{t('0 uses uploaded locations; 100 explores up to 1 km nearby.')}</small></div>}</>}
      {panel === 'describe' && <DescribePool onChange={(name, countryCodes, locationTargets) => { setLoadedPoolName(name); setPanel('custom'); setSettings({ ...settings, source: 'custom', collectionId: 'world', countryCodes, locationTargets }); }} />}
    </div>
    <footer><button className="button primary" disabled={(panel === 'meta' && metaAvailable !== true) || ((panel === 'uploaded' || panel === 'url') && !importedMap) || panel === 'describe'} onClick={() => onStart({ ...settings, source: panel === 'url' ? 'uploaded' : panel as LearnSource, importedMapId: importedMap?.id, showCompass: true })}><Play size={16} />{t(panel === 'meta' ? 'Start Meta lessons' : panel === 'map' ? 'Open world map' : 'Start learning')}</button></footer>
  </section></div>;
}
