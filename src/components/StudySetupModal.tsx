import { useEffect, useState } from 'react';
import { BookOpen, FileJson, Lightbulb, Map, Play, SlidersHorizontal, X } from 'lucide-react';
import type { Collection, Environment, LearnSource, PanoramaSource, SamplingMode, UrbanLevel } from '../types';
import { CountryMixPicker } from './CountryMixPicker';
import { CollectionOptions } from './CollectionOptions';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { trainerDb } from '../data/trainerDb';
import { hasRemainingMetaLessons } from '../data/metaLessons';
import { ImportedMapUpload } from './ImportedMapUpload';
import { getImportedMap, type ImportedMap } from '../services/importedMap';

export type StudySetup = { source: LearnSource; collectionId: string; countryCodes?: string[]; importedMapId?: string; environment: Environment; urbanLevel: UrbanLevel; samplingMode: SamplingMode; panoramaSource: PanoramaSource; allowInteriors: boolean; showCompass: boolean };

export function StudySetupModal({ open, collections, initial, onClose, onStart }: { open: boolean; collections: Collection[]; initial: StudySetup; onClose: () => void; onStart: (settings: StudySetup) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [settings, setSettings] = useState(initial);
  const [metaAvailable, setMetaAvailable] = useState<boolean | null>(null);
  const [importedMap, setImportedMap] = useState<ImportedMap>();
  useEffect(() => { if (!open) return; let active = true; void trainerDb.setting<string>('local.currentMapId').then(async (id) => { const map = id && await getImportedMap(id); if (active) setImportedMap(map || undefined); }); return () => { active = false; }; }, [open]);
  useEffect(() => { if (!open) return; let active = true; setSettings(initial); setMetaAvailable(null); void trainerDb.attempts().then((attempts) => { if (!active) return; const available = hasRemainingMetaLessons(attempts); setMetaAvailable(available); if (!available) setSettings((value) => value.source === 'meta' ? { ...value, source: 'custom' } : value); }); return () => { active = false; }; }, [open]);
  if (!open) return null;
  const collection = collections.find((item) => item.id === settings.collectionId);
  const choices: Array<{ source: LearnSource; icon: typeof SlidersHorizontal; title: string; description: string }> = [
    { source: 'custom', icon: SlidersHorizontal, title: 'Custom', description: 'Choose countries and surroundings.' },
    { source: 'meta', icon: Lightbulb, title: 'Meta', description: 'Learn visual GeoGuessr clues.' },
    { source: 'map', icon: Map, title: 'Explore Map', description: 'Pick from worldwide Street View coverage.' },
    { source: 'uploaded', icon: FileJson, title: 'Uploaded map', description: 'Learn locations from a Map Maker JSON file.' },
  ];
  return <div className="setup-backdrop"><section className="setup-dialog" aria-labelledby="study-setup-title">
    <header><span><BookOpen size={18} /></span><div><h2 id="study-setup-title">{t('Learn')}</h2><p>{t('Choose how you want to learn.')}</p></div><button className="icon-button" onClick={onClose} aria-label={t('close')}><X size={18} /></button></header>
    <div className="setup-body">
      <div className="learn-source-picker">{choices.map(({ source, icon: Icon, title, description }) => { const disabled = source === 'meta' && metaAvailable !== true; return <button key={source} type="button" disabled={disabled} className={settings.source === source ? 'selected' : ''} aria-pressed={settings.source === source} onClick={() => setSettings({ ...settings, source })}><Icon size={18} /><span><strong>{t(title)}</strong><small>{t(source === 'meta' && metaAvailable === false ? 'All Meta lessons completed.' : description)}</small></span></button>; })}</div>
      {settings.source === 'custom' && <div className="learn-custom-settings"><label>{t('Map Collection')}<select value={settings.collectionId} onChange={(event) => setSettings({ ...settings, collectionId: event.target.value, countryCodes: undefined })}><CollectionOptions collections={collections} customLabel={t('Custom collections')} /></select></label>
        <div className="setup-field"><label>{t('Country mix')}</label><CountryMixPicker value={settings.countryCodes || []} availableCodes={collection?.countryCodes || []} onChange={(countryCodes) => setSettings({ ...settings, countryCodes: countryCodes.length ? countryCodes : undefined })} /></div>
        <div className="setup-grid"><label>{t('Environment')}<select value={settings.environment} onChange={(event) => setSettings({ ...settings, environment: event.target.value as Environment })}><option value="mixed">{t('Mixed')}</option><option value="urban">{t('Urban')}</option><option value="suburban">{t('Suburban')}</option><option value="rural">{t('Rural')}</option></select></label>{(settings.environment === 'urban' || settings.environment === 'suburban') && <label>{t('Urban Level')}<select value={settings.urbanLevel} onChange={(event) => setSettings({ ...settings, urbanLevel: Number(event.target.value) as UrbanLevel })}><option value="1">1 — {t('Major Cities')}</option><option value="2">2 — {t('Major + Regional')}</option><option value="3">3 — {t('All Available Seeds')}</option></select></label>}<label>{t('Sampling')}<select value={settings.samplingMode} onChange={(event) => setSettings({ ...settings, samplingMode: event.target.value as SamplingMode })}><option value="natural">{t('Natural')}</option><option value="balanced">{t('Balanced')}</option></select></label></div>
        <label>{t('Street View imagery')}<select value={settings.panoramaSource} onChange={(event) => setSettings({ ...settings, panoramaSource: event.target.value as PanoramaSource })}><option value="official">{t('Official only')}</option><option value="mixed">{t('Official + contributor')}</option><option value="contributor">{t('Contributor only')}</option></select></label>
        <button type="button" className={`setup-switch ${settings.allowInteriors ? 'active' : ''}`} role="switch" aria-checked={settings.allowInteriors} onClick={() => setSettings({ ...settings, allowInteriors: !settings.allowInteriors })}><span>{t('Allow interiors')}<small>{t('Include indoor Street View panoramas when available.')}</small></span><strong>{settings.allowInteriors ? t('Enabled') : t('Disabled')}</strong></button>
      </div>}
      {settings.source === 'uploaded' && <ImportedMapUpload map={importedMap} onChange={(map) => { setImportedMap(map); void trainerDb.setSetting('local.currentMapId', map.id); }} />}
    </div>
    <footer><button className="button primary" disabled={(settings.source === 'meta' && metaAvailable !== true) || (settings.source === 'uploaded' && !importedMap)} onClick={() => onStart({ ...settings, importedMapId: importedMap?.id, showCompass: true })}><Play size={16} />{t(settings.source === 'custom' ? 'Start learning' : settings.source === 'meta' ? 'Start Meta lessons' : settings.source === 'uploaded' ? 'Start learning' : 'Open world map')}</button></footer>
  </section></div>;
}
