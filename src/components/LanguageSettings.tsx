import { useEffect, useState } from 'react';
import { CheckCircle2, LoaderCircle, X } from 'lucide-react';
import { DEFAULT_SCHEDULER_PREFERENCES, effectiveReviewDueAt, nextScheduledReviewAt, normalizeSchedulerPreferences, trainerDb } from '../data/trainerDb';
import { DEFAULT_LANGUAGE_PREFERENCES, LANGUAGE_OPTIONS, normalizeLanguagePreferences, translate } from '../services/language';
import type { CompassStyle, LanguagePreferences, MapPreferences, ReviewRecord, SchedulerPreferences, SupportedLanguage } from '../types';
import { announceLanguagePreferences } from '../services/useLanguagePreferences';
import { DEFAULT_AUDIO_PREFERENCES, normalizeAudioPreferences, setAudioPreferences, type AudioPreferences } from '../services/audio';
import { reloadPage } from '../services/devDiagnostics';
import { COACH_STYLES, DEFAULT_COACH_PREFERENCES, EXPLANATION_DEPTHS, coachGuide, coachStyleLabel, normalizeCoachPreferences } from '../services/coachPreferences';
import type { CoachPreferences } from '../types';
import { clampReviewViewVariationDifficulty, reviewVariationCheckpoint } from '../data/reviewVariation';
import { announceMapPreferences, DEFAULT_MAP_PREFERENCES, normalizeMapPreferences } from '../services/mapPreferences';

const COMMON_TIME_ZONES = ['UTC', 'America/Los_Angeles', 'America/New_York', 'America/Sao_Paulo', 'Europe/London', 'Europe/Paris', 'Europe/Berlin', 'Africa/Cairo', 'Asia/Dubai', 'Asia/Kolkata', 'Asia/Singapore', 'Asia/Tokyo', 'Australia/Sydney'];
const NATIVE_TIME_ZONES = (Intl as typeof Intl & { supportedValuesOf?: (key: 'timeZone') => string[] }).supportedValuesOf?.('timeZone') || COMMON_TIME_ZONES;
const timeValue = (minutes = 0) => `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
const relativeDuration = (milliseconds: number, locale: string) => { const minutes = Math.max(0, Math.round(milliseconds / 60000)); const hours = Math.floor(minutes / 60); const remainder = minutes % 60; const format = (value: number, unit: 'hour' | 'minute') => new Intl.NumberFormat(locale, { style: 'unit', unit, unitDisplay: 'short' }).format(value); return [hours && format(hours, 'hour'), remainder && format(remainder, 'minute')].filter(Boolean).join(' '); };
type SettingsTab = 'language' | 'coach' | 'review' | 'display';
const NOTE_LANGUAGE_COPY: Record<SupportedLanguage, string> = {
  en: 'Saved Personal and AI-assisted notes keep the language in which they were created; changing languages does not translate them.',
  es: 'Las notas personales y asistidas por IA conservan el idioma en que se crearon; cambiar el idioma no las traduce.',
  pt: 'As notas pessoais e assistidas por IA mantêm o idioma em que foram criadas; mudar o idioma não as traduz.',
  fr: 'Les notes personnelles et assistées par IA conservent leur langue de création ; changer de langue ne les traduit pas.',
  de: 'Gespeicherte persönliche und KI-gestützte Notizen behalten ihre ursprüngliche Sprache; ein Sprachwechsel übersetzt sie nicht.',
  it: 'Le note personali e assistite dall’IA mantengono la lingua in cui sono state create; cambiare lingua non le traduce.',
  ru: 'Сохранённые личные заметки и заметки с помощью ИИ остаются на языке создания; смена языка их не переводит.',
  sv: 'Sparade personliga och AI-assisterade anteckningar behåller språket de skapades på; ett språkbyte översätter dem inte.',
};

export function LanguageSettings({ open, onClose, onChange }: { open: boolean; onClose: () => void; onChange?: (value: LanguagePreferences, compassStyle: CompassStyle, darkMode: boolean) => void }) {
  const [languages, setLanguages] = useState<LanguagePreferences>(DEFAULT_LANGUAGE_PREFERENCES);
  const [scheduler, setScheduler] = useState<SchedulerPreferences>(DEFAULT_SCHEDULER_PREFERENCES);
  const [reviews, setReviews] = useState<ReviewRecord[]>([]);
  const [loadedGameLanguage, setLoadedGameLanguage] = useState<SupportedLanguage>('en');
  const [compassStyle, setCompassStyle] = useState<CompassStyle>('bar');
  const [darkMode, setDarkMode] = useState(false);
  const [audio, setAudio] = useState<AudioPreferences>(DEFAULT_AUDIO_PREFERENCES);
  const [tab, setTab] = useState<SettingsTab>('language');
  const [coach, setCoach] = useState<CoachPreferences>(DEFAULT_COACH_PREFERENCES);
  const [mapPreferences, setMapPreferences] = useState<MapPreferences>(DEFAULT_MAP_PREFERENCES);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  useEffect(() => {
    if (saveState !== 'saved') return;
    const timer = window.setTimeout(() => setSaveState('idle'), 2200);
    return () => window.clearTimeout(timer);
  }, [saveState]);

  useEffect(() => {
    if (!open) return;
    void Promise.all([trainerDb.setting<LanguagePreferences>('languagePreferences'), trainerDb.setting<SchedulerPreferences>('schedulerPreferences'), trainerDb.setting<CompassStyle>('preference.compassStyle'), trainerDb.setting<SettingsTab>('preferences.tab'), trainerDb.setting<boolean>('preference.darkMode'), trainerDb.setting<AudioPreferences>('preference.audio'), trainerDb.reviews(), trainerDb.setting<CoachPreferences>('coachPreferences'), trainerDb.setting<MapPreferences>('mapPreferences')]).then(([languageValue, schedulerValue, savedCompassStyle, savedTab, savedDarkMode, savedAudio, savedReviews, savedCoach, savedMapPreferences]) => {
      setLanguages(normalizeLanguagePreferences(languageValue));
      setLoadedGameLanguage(normalizeLanguagePreferences(languageValue).game);
      setScheduler(normalizeSchedulerPreferences(schedulerValue));
      setCompassStyle(savedCompassStyle === 'dial' ? 'dial' : 'bar');
      setDarkMode(savedDarkMode === true);
      setAudio(normalizeAudioPreferences(savedAudio));
      setReviews(savedReviews);
      setCoach(normalizeCoachPreferences(savedCoach));
      setMapPreferences(normalizeMapPreferences(savedMapPreferences));
      if (savedTab === 'language' || savedTab === 'coach' || savedTab === 'review' || savedTab === 'display') setTab(savedTab);
    });
  }, [open]);

  const language = (key: keyof LanguagePreferences, value: SupportedLanguage) => setLanguages((current) => ({ ...current, [key]: value }));
  const number = (key: keyof SchedulerPreferences, value: string) => setScheduler((current) => ({ ...current, [key]: value === '' ? NaN : Number(value) }));
  const resetTime = (value: string) => { const [hours, minutes] = value.split(':').map(Number); setScheduler((current) => ({ ...current, reviewDayResetMinutes: (hours || 0) * 60 + (minutes || 0) })); };
  const save = async () => {
    if (saveState === 'saving') return;
    setSaveState('saving');
    const nextLanguages = normalizeLanguagePreferences(languages);
    const nextScheduler = normalizeSchedulerPreferences(scheduler);
    const nextAudio = normalizeAudioPreferences(audio); setAudioPreferences(nextAudio);
    try {
      const nextMapPreferences = normalizeMapPreferences(mapPreferences);
      await Promise.all([Promise.all([trainerDb.setSetting('languagePreferences', nextLanguages), trainerDb.setSetting('schedulerPreferences', nextScheduler), trainerDb.setSetting('preference.compassStyle', compassStyle), trainerDb.setSetting('preference.darkMode', darkMode), trainerDb.setSetting('preference.audio', nextAudio), trainerDb.setSetting('coachPreferences', normalizeCoachPreferences(coach)), trainerDb.setSetting('mapPreferences', nextMapPreferences)]), new Promise((resolve) => window.setTimeout(resolve, 450))]);
      window.dispatchEvent(new CustomEvent('geotrainer:coach-preferences'));
      document.documentElement.classList.toggle('dark', darkMode); announceMapPreferences(nextMapPreferences);
      announceLanguagePreferences(nextLanguages);
      onChange?.(nextLanguages, compassStyle, darkMode);
      setSaveState('saved');
      if (nextLanguages.game !== loadedGameLanguage) reloadPage('game-language-change');
      else onClose();
    } catch { setSaveState('error'); }
  };
  if (!open) return saveState === 'saved' ? <div className="settings-saved-toast" role="status" aria-live="polite"><CheckCircle2 size={19} />{translate(languages.ui, 'Settings saved')}</div> : null;
  const previewScheduler = normalizeSchedulerPreferences(scheduler); const previewNow = Date.now(); const previewAt = nextScheduledReviewAt(reviews, previewNow, previewScheduler); const hasDueReviews = reviews.some((review) => effectiveReviewDueAt(review, previewScheduler) <= previewNow); const timeZones = [...new Set([previewScheduler.reviewTimeZone, ...NATIVE_TIME_ZONES])]; const guide = coachGuide(languages.ui); const variationCheckpoint = reviewVariationCheckpoint(scheduler.reviewViewVariationDifficulty);

  return <div className="language-settings-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <section className="language-settings preferences-modal" role="dialog" aria-modal="true" aria-labelledby="preferences-title">
      <header><h2 id="preferences-title">{translate(languages.ui, 'preferences')}</h2><button type="button" onClick={onClose} aria-label={translate(languages.ui, 'close')}><X size={17} /></button></header>
      <nav className="settings-tabs" aria-label={translate(languages.ui, 'preferences')}>{(['language', 'coach', 'review', 'display'] as const).map((item) => <button type="button" key={item} className={tab === item ? 'active' : ''} onClick={() => { setTab(item); void trainerDb.setSetting('preferences.tab', item); }}>{translate(languages.ui, item === 'coach' ? 'AI Coach' : item === 'language' ? 'Language' : item === 'review' ? 'Review' : 'Display')}</button>)}</nav>
      {tab === 'language' && <fieldset><legend>{translate(languages.ui, 'settings')}</legend><p>{translate(languages.ui, 'description')}</p>
        {(['ui', 'game', 'ai'] as const).map((key) => <label key={key}>{translate(languages.ui, key)}
          <span className="language-choice"><img src={`https://flagcdn.com/w40/${LANGUAGE_OPTIONS.find((option) => option.code === languages[key])!.flagCode}.png`} alt="" width="24" height="18" referrerPolicy="no-referrer" /><select value={languages[key]} onChange={(event) => language(key, event.target.value as SupportedLanguage)}>
            {LANGUAGE_OPTIONS.map((option) => <option key={option.code} value={option.code}>{option.nativeLabel} · {option.label}</option>)}
          </select></span>
        </label>)}
        <p>{NOTE_LANGUAGE_COPY[languages.ui]}</p>
      </fieldset>}
      {tab === 'coach' && <fieldset className="coach-settings"><legend>{translate(languages.ui, 'AI Coach')}</legend><p>{guide.intro}</p>
        <label>{translate(languages.ui, 'AI Coach Style')}<select value={coach.askEveryTime ? 'ask' : coach.style} onChange={(event) => { const value = event.target.value; setCoach(value === 'ask' ? { ...coach, askEveryTime: true } : { ...coach, style: value as CoachPreferences['style'], askEveryTime: false }); }}><option value="ask">{translate(languages.ui, 'Always ask before analysis')}</option>{COACH_STYLES.map((style) => <option key={style} value={style}>{coachStyleLabel(style)}</option>)}</select></label><p className="coach-setting-summary">{coach.askEveryTime ? translate(languages.ui, 'Choose a Coach style for every analysis.') : guide.styles[coach.style].purpose}</p>
        <label>{translate(languages.ui, 'Explanation Depth')}<select value={coach.depth} onChange={(event) => setCoach({ ...coach, depth: event.target.value as CoachPreferences['depth'] })}>{EXPLANATION_DEPTHS.map((depth) => <option key={depth} value={depth}>{translate(languages.ui, depth[0].toUpperCase() + depth.slice(1))}</option>)}</select></label><p>{guide.depth}</p>
      </fieldset>}
      {tab === 'display' && <><fieldset><legend>{translate(languages.ui, 'Appearance')}</legend>
        <label>{translate(languages.ui, 'Color palette')}<select value={darkMode ? 'dark' : 'light'} onChange={(event) => setDarkMode(event.target.value === 'dark')}><option value="light">{translate(languages.ui, 'Light')}</option><option value="dark">{translate(languages.ui, 'Dark')}</option></select></label>
        <label>{translate(languages.ui, 'Compass style')}<select value={compassStyle} onChange={(event) => setCompassStyle(event.target.value as CompassStyle)}><option value="bar">{translate(languages.ui, 'Heading bar')}</option><option value="dial">{translate(languages.ui, 'Compass dial')}</option></select></label>
      </fieldset><fieldset className="audio-settings"><legend>{translate(languages.ui, 'Audio')}</legend>
        <label className="settings-checkbox"><input type="checkbox" checked={audio.sfxEnabled} onChange={(event) => setAudio({ ...audio, sfxEnabled: event.target.checked })} />{translate(languages.ui, 'Sound effects')}</label>
        <label>{translate(languages.ui, 'SFX volume')} · {Math.round(audio.sfxVolume * 100)}%<input type="range" min="0" max="1" step="0.05" disabled={!audio.sfxEnabled} value={audio.sfxVolume} onChange={(event) => setAudio({ ...audio, sfxVolume: Number(event.target.value) })} /></label>
        <label className="settings-checkbox"><input type="checkbox" checked={audio.musicEnabled} onChange={(event) => setAudio({ ...audio, musicEnabled: event.target.checked })} />{translate(languages.ui, 'Ambient music')}</label>
        <label>{translate(languages.ui, 'Music volume')} · {Math.round(audio.musicVolume * 100)}%<input type="range" min="0" max="1" step="0.05" disabled={!audio.musicEnabled} value={audio.musicVolume} onChange={(event) => setAudio({ ...audio, musicVolume: Number(event.target.value) })} /></label>
      </fieldset><fieldset className="map-settings"><legend>{translate(languages.ui, 'Panorama')}</legend><div className="settings-option-grid">
        <label className="settings-checkbox settings-detail"><input type="checkbox" checked={mapPreferences.showRoadLabels} onChange={(event) => setMapPreferences({ ...mapPreferences, showRoadLabels: event.target.checked })} /><span><strong>{translate(languages.ui, 'Road labels')}</strong><small>{translate(languages.ui, 'Show street names inside Street View. Off is usually better for recognition practice.')}</small></span></label>
        <label className="settings-checkbox settings-detail"><input type="checkbox" checked={mapPreferences.showImageryDate} onChange={(event) => setMapPreferences({ ...mapPreferences, showImageryDate: event.target.checked })} /><span><strong>{translate(languages.ui, 'Imagery date')}</strong><small>{translate(languages.ui, 'Show Google’s capture-date control on panoramas.')}</small></span></label>
        <label className="settings-checkbox settings-detail"><input type="checkbox" checked={mapPreferences.motionTracking} onChange={(event) => setMapPreferences({ ...mapPreferences, motionTracking: event.target.checked })} /><span><strong>{translate(languages.ui, 'Motion viewing')}</strong><small>{translate(languages.ui, 'On supported phones, look around by moving the device.')}</small></span></label>
        <label>{translate(languages.ui, 'Movement controls')}<select value={mapPreferences.movementStyle} onChange={(event) => setMapPreferences({ ...mapPreferences, movementStyle: event.target.value as MapPreferences['movementStyle'] })}><option value="click">{translate(languages.ui, 'Click and arrows')}</option><option value="arrows">{translate(languages.ui, 'Arrows only')}</option></select></label>
      </div></fieldset><fieldset className="map-settings"><legend>{translate(languages.ui, 'Maps')}</legend><div className="settings-option-grid">
        <label>{translate(languages.ui, 'Map type')}<select value={mapPreferences.mapType} onChange={(event) => setMapPreferences({ ...mapPreferences, mapType: event.target.value as MapPreferences['mapType'] })}><option value="roadmap">{translate(languages.ui, 'Road map')}</option><option value="satellite">{translate(languages.ui, 'Satellite')}</option><option value="hybrid">{translate(languages.ui, 'Hybrid')}</option><option value="terrain">{translate(languages.ui, 'Terrain')}</option></select></label>
        <label>{translate(languages.ui, 'Map color palette')}<select value={mapPreferences.mapPalette ?? 'auto'} onChange={(event) => setMapPreferences({ ...mapPreferences, mapPalette: event.target.value as MapPreferences['mapPalette'], geotrainerMapStyle: event.target.value === 'auto' ? mapPreferences.geotrainerMapStyle : true })}><option value="auto">{translate(languages.ui, 'Automatic')}</option><option value="light">{translate(languages.ui, 'Light')}</option><option value="dark">{translate(languages.ui, 'Dark')}</option></select></label>
        <label>{translate(languages.ui, 'Touch gestures')}<select value={mapPreferences.gestureHandling} onChange={(event) => setMapPreferences({ ...mapPreferences, gestureHandling: event.target.value as MapPreferences['gestureHandling'] })}><option value="auto">{translate(languages.ui, 'Automatic')}</option><option value="cooperative">{translate(languages.ui, 'Two fingers')}</option><option value="greedy">{translate(languages.ui, 'One finger')}</option></select></label>
        <label className="settings-checkbox settings-detail"><input type="checkbox" checked={mapPreferences.clickableIcons} onChange={(event) => setMapPreferences({ ...mapPreferences, clickableIcons: event.target.checked })} /><span><strong>{translate(languages.ui, 'Clickable map places')}</strong><small>{translate(languages.ui, 'Allow place icons to open Google information. Keep off to avoid accidental clues.')}</small></span></label>
        <label className="settings-checkbox settings-detail"><input type="checkbox" checked={mapPreferences.showCountryBorders !== false} onChange={(event) => setMapPreferences({ ...mapPreferences, showCountryBorders: event.target.checked })} /><span><strong>{translate(languages.ui, 'Country borders')}</strong></span></label>
        <label className="settings-checkbox settings-detail"><input type="checkbox" checked={mapPreferences.geotrainerMapStyle} onChange={(event) => setMapPreferences({ ...mapPreferences, geotrainerMapStyle: event.target.checked, mapPalette: event.target.checked ? mapPreferences.mapPalette : 'auto' })} /><span><strong>{translate(languages.ui, 'GeoTrainer map style')}</strong><small>{translate(languages.ui, 'Match map colors to GeoTrainer’s light or dark appearance.')}</small></span></label>
      </div></fieldset></>}
      {tab === 'review' && <><fieldset><legend>{translate(languages.ui, 'dailyLimits')}</legend>
        <label>{translate(languages.ui, 'newCardsDay')}<input type="number" min="1" max="500" value={Number.isNaN(scheduler.newCardsPerDay) ? '' : scheduler.newCardsPerDay} onChange={(event) => number('newCardsPerDay', event.target.value)} /></label>
        <label>{translate(languages.ui, 'maximumReviewsDay')}<input type="number" min="1" max="2000" value={Number.isNaN(scheduler.maximumReviewsPerDay) ? '' : scheduler.maximumReviewsPerDay} onChange={(event) => number('maximumReviewsPerDay', event.target.value)} /></label>
      </fieldset>
      <fieldset className="review-view-settings"><legend>{translate(languages.ui, 'Review view')}</legend>
        <label className="settings-checkbox"><input type="checkbox" checked={scheduler.reviewViewVariationEnabled === true} onChange={(event) => setScheduler((current) => ({ ...current, reviewViewVariationEnabled: event.target.checked }))} /><span><strong>{translate(languages.ui, 'Vary review view')}</strong><small>{translate(languages.ui, 'Test memory from other views in the same nearby area as a location becomes better learned.')}</small></span></label>
        {scheduler.reviewViewVariationEnabled && <div className="review-variation-slider"><label htmlFor="review-variation-difficulty"><span>{translate(languages.ui, 'Variation difficulty')}</span><strong>{clampReviewViewVariationDifficulty(scheduler.reviewViewVariationDifficulty)}</strong></label><p>{translate(languages.ui, 'Controls how aggressively GeoTrainer varies well-learned cards. New and weak cards stay near the original.')}</p><input id="review-variation-difficulty" type="range" min="0" max="100" step="1" list="review-variation-checkpoints" value={clampReviewViewVariationDifficulty(scheduler.reviewViewVariationDifficulty)} onChange={(event) => setScheduler((current) => ({ ...current, reviewViewVariationDifficulty: Number(event.target.value) }))} /><datalist id="review-variation-checkpoints">{[0, 25, 50, 75, 100].map((value) => <option key={value} value={value} />)}</datalist><div className="range-endpoints"><span>0</span><span>100</span></div><p className="review-variation-explanation"><strong>{translate(languages.ui, `Variation ${variationCheckpoint} label`)}</strong>{translate(languages.ui, `Variation ${variationCheckpoint} description`)}</p></div>}
      </fieldset>
      <fieldset className="scheduling-settings"><legend>{translate(languages.ui, 'scheduling')}</legend>
        <label>{translate(languages.ui, 'strictness')}<select value={scheduler.strictness} onChange={(event) => setScheduler((current) => ({ ...current, strictness: event.target.value as SchedulerPreferences['strictness'] }))}><option value="beginner">{translate(languages.ui, 'beginner')}</option><option value="balanced">{translate(languages.ui, 'balanced')}</option><option value="pro">{translate(languages.ui, 'pro')}</option></select></label>
        <label>{translate(languages.ui, 'firstReview')}<input type="number" min="1" max="30" value={scheduler.firstReviewDays} onChange={(event) => number('firstReviewDays', event.target.value)} /></label>
        <label>{translate(languages.ui, 'relearning')}<input type="number" min="1" max="1440" value={scheduler.relearningMinutes} onChange={(event) => number('relearningMinutes', event.target.value)} /></label>
        <label>{translate(languages.ui, 'excellentInterval')}<input type="number" min="2" max="365" value={scheduler.easyFirstIntervalDays} onChange={(event) => number('easyFirstIntervalDays', event.target.value)} /></label>
        <label>{translate(languages.ui, 'maximumInterval')}<input type="number" min="30" max="36500" value={scheduler.maximumIntervalDays} onChange={(event) => number('maximumIntervalDays', event.target.value)} /></label>
        <label>{translate(languages.ui, 'maximumAnswer')}<input type="number" min="10" max="600" value={scheduler.maximumAnswerSeconds} onChange={(event) => number('maximumAnswerSeconds', event.target.value)} /></label>
        <label>{translate(languages.ui, 'dueOrder')}<select value={scheduler.reviewOrder} onChange={(event) => setScheduler((current) => ({ ...current, reviewOrder: event.target.value as SchedulerPreferences['reviewOrder'] }))}><option value="due">{translate(languages.ui, 'oldestDue')}</option><option value="random">{translate(languages.ui, 'random')}</option></select></label>
        <label>{translate(languages.ui, 'reviewResetTime')}<input type="time" value={timeValue(scheduler.reviewDayResetMinutes)} onChange={(event) => resetTime(event.target.value)} /></label>
        <label>{translate(languages.ui, 'reviewTimeZone')}<select value={previewScheduler.reviewTimeZone} disabled={scheduler.reviewTimeZoneAuto !== false} onChange={(event) => setScheduler((current) => ({ ...current, reviewTimeZone: event.target.value, reviewTimeZoneAuto: false }))}>{timeZones.map((zone) => <option key={zone} value={zone}>{zone}</option>)}</select></label>
        <label className="settings-checkbox"><input type="checkbox" checked={scheduler.reviewTimeZoneAuto !== false} onChange={(event) => setScheduler((current) => ({ ...current, reviewTimeZoneAuto: event.target.checked }))} />{translate(languages.ui, 'autoDetectTimeZone')}</label>
        <p>{translate(languages.ui, 'reviewResetDescription')}</p><p className="review-time-preview"><strong>{translate(languages.ui, 'nextReviewAt')}:</strong> {hasDueReviews ? translate(languages.ui, 'Due now') : previewAt ? `${new Date(previewAt).toLocaleString(languages.ui, { dateStyle: 'medium', timeStyle: 'short', timeZone: previewScheduler.reviewTimeZone })} · ${relativeDuration(previewAt - previewNow, languages.ui)}` : translate(languages.ui, 'noReviewsScheduled')}</p>
      </fieldset></>}
      <footer>{saveState === 'error' && <p className="settings-save-error" role="alert">{translate(languages.ui, 'Could not save settings. Try again.')}</p>}<button type="button" className="button secondary" disabled={saveState === 'saving'} onClick={onClose}>{translate(languages.ui, 'close')}</button><button type="button" className="button primary" disabled={saveState === 'saving'} onClick={() => void save()}>{saveState === 'saving' && <LoaderCircle className="button-spinner" size={16} />}{translate(languages.ui, saveState === 'saving' ? 'Saving...' : 'save')}</button></footer>
    </section>
  </div>;
}
