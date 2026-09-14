import { useCallback, useEffect, useRef } from 'react';
import type { TrainingSession } from '../types';
import { trainerDb } from '../data/trainerDb';

export function addActiveElapsed(session: TrainingSession, startedAt: number | null, now = Date.now()) {
  if (startedAt === null) return 0;
  const elapsed = Math.max(0, (now - startedAt) / 1000);
  session.activeTimeSeconds += elapsed;
  return elapsed;
}

export function useActiveSession(active: boolean, sessionRef: { current: TrainingSession }, onSaved: () => void) {
  const startedAtRef = useRef<number | null>(null);
  const flush = useCallback((resume: boolean) => {
    const elapsed = addActiveElapsed(sessionRef.current, startedAtRef.current);
    if (elapsed && sessionRef.current.activeTimeSeconds >= 5) {
      void trainerDb.saveSession({ ...sessionRef.current }).then(onSaved).catch(() => {});
    }
    startedAtRef.current = resume && document.visibilityState === 'visible' ? Date.now() : null;
  }, [onSaved, sessionRef]);

  useEffect(() => {
    const onVisibility = () => flush(active && document.visibilityState === 'visible');
    const onBlur = () => flush(false);
    const onFocus = () => flush(active);
    flush(active);
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('blur', onBlur);
    window.addEventListener('focus', onFocus);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('blur', onBlur);
      window.removeEventListener('focus', onFocus);
      flush(false);
    };
  }, [active, flush]);
}
