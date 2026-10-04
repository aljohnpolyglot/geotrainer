import { useEffect, useState } from 'react';
import { trainerDb } from '../data/trainerDb';
import { translate } from '../services/language';
import { DEFAULT_COACH_PROVIDER_SETTINGS, forgetCoachApiKey, getCoachApiKey, hydrateCoachProviderSettings, normalizeCoachProviderSettings, setCoachApiKey, setCoachProviderSettings, type CoachProviderSettings } from '../services/coachByok';
import type { SupportedLanguage } from '../types';

export function CoachProviderSettingsPanel({ language }: { language: SupportedLanguage }) {
  const [settings, setSettings] = useState<CoachProviderSettings>(DEFAULT_COACH_PROVIDER_SETTINGS);
  const [key, setKey] = useState(getCoachApiKey);
  useEffect(() => { void trainerDb.setting<CoachProviderSettings>('coachProvider').then((value) => { const next = normalizeCoachProviderSettings(value); setSettings(next); hydrateCoachProviderSettings(value); }); }, []);
  const update = (next: CoachProviderSettings) => { if (next.provider !== settings.provider) { setKey(''); forgetCoachApiKey(); } setSettings(next); setCoachProviderSettings(next); void trainerDb.setSetting('coachProvider', next); };
  const t = (text: string) => translate(language, text);
  return <fieldset className="coach-provider-settings">
    <legend>{t('AI provider')}</legend>
    <label>{t('Provider')}<select value={settings.provider} onChange={(event) => update({ ...settings, provider: event.target.value as CoachProviderSettings['provider'] })}>
      <option value="gemini">Gemini</option><option value="openai">{t('OpenAI compatible')}</option><option value="anthropic">Anthropic</option>
    </select></label>
    <label>{t('Model name')}<input type="text" value={settings.model} maxLength={100} placeholder={settings.provider === 'gemini' ? 'gemini-2.5-flash' : settings.provider === 'anthropic' ? 'claude-sonnet-4-5' : 'gpt-4.1-mini'} onChange={(event) => update({ ...settings, model: event.target.value })} /></label>
    {settings.provider === 'openai' && <label>{t('OpenAI-compatible API base URL')}<input type="url" value={settings.endpoint} maxLength={300} placeholder="https://api.openai.com/v1" onChange={(event) => update({ ...settings, endpoint: event.target.value })} /></label>}
    <label>{t('Your API key')}<input type="password" autoComplete="off" spellCheck={false} value={key} onChange={(event) => { setKey(event.target.value); setCoachApiKey(event.target.value); }} /></label>
    <div className="coach-provider-actions"><button type="button" onClick={() => { setKey(''); forgetCoachApiKey(); }}>{t('Forget key')}</button></div>
    <p>{t('The key is sent through the Coach endpoint for each analysis and is not saved by GeoTrainer. It stays in memory until you forget it or reload the page.')}</p>
    {settings.provider === 'gemini' && <p>{t('Leave the key blank to use the app Gemini provider.')}</p>}
    {settings.provider !== 'gemini' && !key && <p>{t('Paste a key for this provider to use it.')}</p>}
  </fieldset>;
}
