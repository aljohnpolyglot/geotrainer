import { useEffect, useState } from 'react';
import { trainerDb } from '../data/trainerDb';
import type { LanguagePreferences } from '../types';
import { DEFAULT_LANGUAGE_PREFERENCES, normalizeLanguagePreferences } from './language';
import { CLOUD_IMPORT_EVENT } from './cloudSyncEvent';

const EVENT = 'geotrainer-language-change';
let currentPreferences = DEFAULT_LANGUAGE_PREFERENCES;
let preferencesReady = false;

export async function primeLanguagePreferences() {
  try { currentPreferences = normalizeLanguagePreferences(await trainerDb.setting<LanguagePreferences>('languagePreferences')); }
  catch { currentPreferences = DEFAULT_LANGUAGE_PREFERENCES; }
  finally { preferencesReady = true; }
  return currentPreferences;
}

export function announceLanguagePreferences(value: LanguagePreferences) {
  currentPreferences = normalizeLanguagePreferences(value); preferencesReady = true;
  window.dispatchEvent(new CustomEvent(EVENT, { detail: currentPreferences }));
}

export function useLanguagePreferences() {
  const [state, setState] = useState({ preferences: currentPreferences, ready: preferencesReady });
  useEffect(() => {
    const load = () => { setState((value) => ({ ...value, ready: false })); void primeLanguagePreferences().then((preferences) => setState({ preferences, ready: true })); };
    if (!preferencesReady) load();
    const update = (event: Event) => setState({ preferences: normalizeLanguagePreferences((event as CustomEvent).detail), ready: true });
    window.addEventListener(EVENT, update);
    window.addEventListener(CLOUD_IMPORT_EVENT, load);
    return () => { window.removeEventListener(EVENT, update); window.removeEventListener(CLOUD_IMPORT_EVENT, load); };
  }, []);
  return { ...state.preferences, ready: state.ready };
}
