import { useEffect, useState } from 'react';
import type { CoachPreferences } from '../types';
import { trainerDb } from '../data/trainerDb';
import { CLOUD_IMPORT_EVENT } from './cloudSyncEvent';
import { DEFAULT_COACH_PREFERENCES, normalizeCoachPreferences } from './coachPreferences';

export function useCoachPreferences() {
  const [preferences, setPreferences] = useState<CoachPreferences>(DEFAULT_COACH_PREFERENCES);
  useEffect(() => {
    let active = true; const load = () => void trainerDb.setting<CoachPreferences>('coachPreferences').then((value) => active && setPreferences(normalizeCoachPreferences(value)));
    load(); window.addEventListener('geotrainer:coach-preferences', load); window.addEventListener(CLOUD_IMPORT_EVENT, load);
    return () => { active = false; window.removeEventListener('geotrainer:coach-preferences', load); window.removeEventListener(CLOUD_IMPORT_EVENT, load); };
  }, []);
  return preferences;
}
