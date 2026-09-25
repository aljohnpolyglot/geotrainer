import { Play, RefreshCw, X } from 'lucide-react';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export function ResumeSessionDialog({ mode, onResume, onNew, onBack }: { mode?: 'study' | 'play' | null; onResume: () => void; onNew: () => void; onBack: () => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  if (!mode) return null;
  return <div className="setup-backdrop"><section className="resume-session" role="dialog" aria-modal="true" aria-labelledby="resume-session-title"><button type="button" className="icon-button resume-session-close" onClick={onBack} aria-label={t('Back')} title={t('Back')}><X size={16} /></button><h2 id="resume-session-title">{t('Continue saved session?')}</h2><p>{t('Resume where you stopped or start a new session.')}</p><div><button className="button primary" onClick={onResume}><Play size={16} />{t('Resume')}</button><button className="button secondary" onClick={onNew}><RefreshCw size={16} />{t('Start new')}</button></div></section></div>;
}
