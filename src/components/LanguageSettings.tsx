import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { DEFAULT_SCHEDULER_PREFERENCES, normalizeSchedulerPreferences, trainerDb } from '../data/trainerDb';
import { DEFAULT_LANGUAGE_PREFERENCES, LANGUAGE_OPTIONS, normalizeLanguagePreferences, translate } from '../services/language';
import type { LanguagePreferences, SchedulerPreferences, SupportedLanguage } from '../types';
import { announceLanguagePreferences } from '../services/useLanguagePreferences';

const COMMON_TIME_ZONES = ['UTC', 'America/Los_Angeles', 'America/New_York', 'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Africa/Cairo', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney'];
const timeValue = (minutes = 0) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;

export function LanguageSettings({ open, onClose, onChange }: { open: boolean; onClose: () => void; onChange?: (value: LanguagePreferences) => void }) {
  const [languages, setLanguages] = useState<LanguagePreferences>(DEFAULT_LANGUAGE_PREFERENCES);
  const [scheduler, setScheduler] = useState<SchedulerPreferences>(DEFAULT_SCHEDULER_PREFERENCES);
  const [loadedGameLanguage, setLoadedGameLanguage] = useState<SupportedLanguage>('en');

  useEffect(() => {
    if (!open) return;
    void Promise.all([trainerDb.setting<LanguagePreferences>('languagePreferences'), trainerDb.setting<SchedulerPreferences>('schedulerPreferences')]).then(([languageValue, schedulerValue]) => {
      setLanguages(normalizeLanguagePreferences(languageValue));
      setLoadedGameLanguage(normalizeLanguagePreferences(languageValue).game);
      setScheduler(normalizeSchedulerPreferences(schedulerValue));
    });
  }, [open]);

  const language = (key: keyof LanguagePreferences, value: SupportedLanguage) => setLanguages((current) => ({ ...current, [key]: value }));
  const number = (key: keyof SchedulerPreferences, value: string) => setScheduler((current) => ({ ...current, [key]: Number(value) }));
  const resetTime = (value: string) => { const [hours, minutes] = value.split(':').map(Number); setScheduler((current) => ({ ...current, reviewDayResetMinutes: (hours || 0) * 60 + (minutes || 0) })); };
  const save = async () => {
    const nextLanguages = normalizeLanguagePreferences(languages);
    const nextScheduler = normalizeSchedulerPreferences(scheduler);
    await Promise.all([trainerDb.setSetting('languagePreferences', nextLanguages), trainerDb.setSetting('schedulerPreferences', nextScheduler)]);
    announceLanguagePreferences(nextLanguages);
    onChange?.(nextLanguages);
    if (nextLanguages.game !== loadedGameLanguage) window.location.reload();
    else onClose();
  };
  if (!open) return null;

  return <div className="language-settings-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="language-settings preferences-modal" role="dialog" aria-modal="true" aria-labelledby="preferences-title">
      <header><h2 id="preferences-title">{translate(languages.ui, 'preferences')}</h2><button type="button" onClick={onClose} aria-label={translate(languages.ui, 'close')}><X size={17} /></button></header>
      <fieldset><legend>{translate(languages.ui, 'settings')}</legend><p>{translate(languages.ui, 'description')}</p>
        {(['ui', 'game', 'ai'] as const).map((key) => <label key={key}>{translate(languages.ui, key)}
          <span className="language-choice"><img src={`https://flagcdn.com/w40/${LANGUAGE_OPTIONS.find((option) => option.code === languages[key])!.flagCode}.png`} alt="" width="24" height="18" referrerPolicy="no-referrer" /><select value={languages[key]} onChange={(event) => language(key, event.target.value as SupportedLanguage)}>
            {LANGUAGE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.nativeLabel} · {option.label}</option>)}
          </select></span>
        </label>)}
      </fieldset>
      <fieldset><legend>{translate(languages.ui, 'dailyLimits')}</legend>
        <label>{translate(languages.ui, 'newCardsDay')}<input type="number" min="1" max="500" value={scheduler.newCardsPerDay} onChange={(event) => number('newCardsPerDay', event.target.value)} /></label>
        <label>{translate(languages.ui, 'maximumReviewsDay')}<input type="number" min="1" max="2000" value={scheduler.maximumReviewsPerDay} onChange={(event) => number('maximumReviewsPerDay', event.target.value)} /></label>
      </fieldset>
      <fieldset><legend>{translate(languages.ui, 'scheduling')}</legend>
        <label>{translate(languages.ui, 'strictness')}<select value={scheduler.strictness} onChange={(event) => setScheduler((current) => ({ ...current, strictness: event.target.value as SchedulerPreferences['strictness'] }))}><option value="beginner">{translate(languages.ui, 'beginner')}</option><option value="balanced">{translate(languages.ui, 'balanced')}</option><option value="pro">{translate(languages.ui, 'pro')}</option></select></label>
        <label>{translate(languages.ui, 'firstReview')}<input type="number" min="1" max="30" value={scheduler.firstReviewDays} onChange={(event) => number('firstReviewDays', event.target.value)} /></label>
        <label>{translate(languages.ui, 'relearning')}<input type="number" min="1" max="1440" value={scheduler.relearningMinutes} onChange={(event) => number('relearningMinutes', event.target.value)} /></label>
        <label>{translate(languages.ui, 'excellentInterval')}<input type="number" min="2" max="365" value={scheduler.easyFirstIntervalDays} onChange={(event) => number('easyFirstIntervalDays', event.target.value)} /></label>
        <label>{translate(languages.ui, 'maximumInterval')}<input type="number" min="30" max="36500" value={scheduler.maximumIntervalDays} onChange={(event) => number('maximumIntervalDays', event.target.value)} /></label>
        <label>{translate(languages.ui, 'maximumAnswer')}<input type="number" min="10" max="600" value={scheduler.maximumAnswerSeconds} onChange={(event) => number('maximumAnswerSeconds', event.target.value)} /></label>
        <label>{translate(languages.ui, 'dueOrder')}<select value={scheduler.reviewOrder} onChange={(event) => setScheduler((current) => ({ ...current, reviewOrder: event.target.value as SchedulerPreferences['reviewOrder'] }))}><option value="due">{translate(languages.ui, 'oldestDue')}</option><option value="random">{translate(languages.ui, 'random')}</option></select></label>
        <label>{translate(languages.ui, 'reviewResetTime')}<input type="time" value={timeValue(scheduler.reviewDayResetMinutes)} onChange={(event) => resetTime(event.target.value)} /></label>
        <label>{translate(languages.ui, 'reviewTimeZone')}<input list="review-time-zones" value={scheduler.reviewTimeZone || ''} disabled={scheduler.reviewTimeZoneAuto !== false} onChange={(event) => setScheduler((current) => ({ ...current, reviewTimeZone: event.target.value, reviewTimeZoneAuto: false }))} /><datalist id="review-time-zones">{COMMON_TIME_ZONES.map((zone) => <option key={zone} value={zone} />)}</datalist></label>
        <label className="settings-checkbox"><input type="checkbox" checked={scheduler.reviewTimeZoneAuto !== false} onChange={(event) => setScheduler((current) => ({ ...current, reviewTimeZoneAuto: event.target.checked }))} />{translate(languages.ui, 'autoDetectTimeZone')}</label>
        <p>{translate(languages.ui, 'reviewResetDescription')}</p>
      </fieldset>
      <footer><button type="button" className="button secondary" onClick={onClose}>{translate(languages.ui, 'close')}</button><button type="button" className="button primary" onClick={() => void save()}>{translate(languages.ui, 'save')}</button></footer>
    </section>
  </div>;
}
