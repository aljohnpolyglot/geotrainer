import { useEffect, useState } from 'react';
import { BookOpen, Play, X } from 'lucide-react';
import type { Collection, Environment, SamplingMode, UrbanLevel } from '../types';
import { CountryMixPicker } from './CountryMixPicker';
import { CollectionOptions } from './CollectionOptions';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export type StudySetup = { collectionId: string; countryCodes?: string[]; environment: Environment; urbanLevel: UrbanLevel; samplingMode: SamplingMode; showCompass: boolean };

export function StudySetupModal({ open, collections, initial, onClose, onStart }: { open: boolean; collections: Collection[]; initial: StudySetup; onClose: () => void; onStart: (settings: StudySetup) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [settings, setSettings] = useState(initial);
  useEffect(() => { if (open) setSettings(initial); }, [open]);
  if (!open) return null;
  const collection = collections.find((item) => item.id === settings.collectionId);
  return <div className="setup-backdrop"><section className="setup-dialog" aria-labelledby="study-setup-title">
    <header><span><BookOpen size={18} /></span><div><h2 id="study-setup-title">{t('Study setup')}</h2><p>{t('Choose what you want to explore. You can change it anytime.')}</p></div><button className="icon-button" onClick={onClose} aria-label={t('close')}><X size={18} /></button></header>
    <div className="setup-body">
      <label>{t('Map Collection')}<select value={settings.collectionId} onChange={(event) => setSettings({ ...settings, collectionId: event.target.value, countryCodes: undefined })}><CollectionOptions collections={collections} customLabel={t('Custom collections')} /></select></label>
      <div className="setup-field"><label>{t('Country mix')}</label><CountryMixPicker value={settings.countryCodes || []} availableCodes={collection?.countryCodes || []} onChange={(countryCodes) => setSettings({ ...settings, countryCodes: countryCodes.length ? countryCodes : undefined })} /></div>
      <div className="setup-grid"><label>{t('Environment')}<select value={settings.environment} onChange={(event) => setSettings({ ...settings, environment: event.target.value as Environment })}><option value="mixed">{t('Mixed')}</option><option value="urban">{t('Urban')}</option><option value="suburban">{t('Suburban')}</option><option value="rural">{t('Rural')}</option></select></label>{(settings.environment === 'urban' || settings.environment === 'suburban') && <label>{t('Urban Level')}<select value={settings.urbanLevel} onChange={(event) => setSettings({ ...settings, urbanLevel: Number(event.target.value) as UrbanLevel })}><option value="1">1 — {t('Major Cities')}</option><option value="2">2 — {t('Major + Regional')}</option><option value="3">3 — {t('All Available Seeds')}</option></select></label>}<label>{t('Sampling')}<select value={settings.samplingMode} onChange={(event) => setSettings({ ...settings, samplingMode: event.target.value as SamplingMode })}><option value="natural">{t('Natural')}</option><option value="balanced">{t('Balanced')}</option></select></label></div>
    </div>
    <footer><button className="button primary" onClick={() => onStart({ ...settings, showCompass: true })}><Play size={16} />{t('Start studying')}</button></footer>
  </section></div>;
}
