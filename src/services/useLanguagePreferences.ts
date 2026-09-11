import { useEffect, useState } from 'react';
import { trainerDb } from '../data/trainerDb';
import type { LanguagePreferences } from '../types';
import { DEFAULT_LANGUAGE_PREFERENCES, normalizeLanguagePreferences } from './language';

const EVENT = 'geotrainer-language-change';

export function announceLanguagePreferences(value: LanguagePreferences) {
  window.dispatchEvent(new CustomEvent(EVENT, { detail: value }));
}

export function useLanguagePreferences() {
  const [preferences, setPreferences] = useState(DEFAULT_LANGUAGE_PREFERENCES);
  useEffect(() => {
    void trainerDb.setting<LanguagePreferences>('languagePreferences').then((value) => setPreferences(normalizeLanguagePreferences(value)));
    const update = (event: Event) => setPreferences(normalizeLanguagePreferences((event as CustomEvent).detail));
    window.addEventListener(EVENT, update);
    return () => window.removeEventListener(EVENT, update);
  }, []);
  return preferences;
}
