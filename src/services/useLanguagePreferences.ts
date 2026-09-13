import { useEffect, useState } from 'react';
import { trainerDb } from '../data/trainerDb';
import type { LanguagePreferences } from '../types';
import { DEFAULT_LANGUAGE_PREFERENCES, normalizeLanguagePreferences } from './language';
import { CLOUD_IMPORT_EVENT } from './cloudSyncEvent';

const EVENT = 'geotrainer-language-change';

export function announceLanguagePreferences(value: LanguagePreferences) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
}

export function useLanguagePreferences() {
  const [preferences, setPreferences] = useState(DEFAULT_LANGUAGE_PREFERENCES);
  useEffect(() => {
    const load = () => void trainerDb.setting<LanguagePreferences>('languagePreferences').then((value) => setPreferences(normalizeLanguagePreferences(value)));
    load();
    const update = (event: Event) => setPreferences(normalizeLanguagePreferences((event as CustomEvent).detail));
    window.addEventListener(EVENT, update);
    window.addEventListener(CLOUD_IMPORT_EVENT, load);
    return () => { window.removeEventListener(EVENT, update); window.removeEventListener(CLOUD_IMPORT_EVENT, load); };
  }, []);
  return preferences;
}
