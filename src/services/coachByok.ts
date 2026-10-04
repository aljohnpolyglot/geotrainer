export type CoachProvider = 'gemini' | 'openai' | 'anthropic';
export type CoachProviderSettings = { provider: CoachProvider; model: string; endpoint: string };
export const DEFAULT_COACH_PROVIDER_SETTINGS: CoachProviderSettings = { provider: 'gemini', model: '', endpoint: 'https://api.openai.com/v1' };
let providerSettings = DEFAULT_COACH_PROVIDER_SETTINGS;
let apiKey = '';
let providerSettingsChanged = false;

export function setCoachProviderSettings(value: CoachProviderSettings) {
  providerSettings = value;
  providerSettingsChanged = true;
  if (typeof window !== 'undefined') window.dispatchEvent(new Event('geotrainer:coach-provider'));
}
export function hydrateCoachProviderSettings(value: unknown) { if (!providerSettingsChanged) providerSettings = normalizeCoachProviderSettings(value); }
export function getCoachProviderSettings() { return providerSettings; }
export function setCoachApiKey(value: string) { apiKey = value.trim(); }
export function getCoachApiKey() { return apiKey; }
export function forgetCoachApiKey() { apiKey = ''; }
export function normalizeCoachProviderSettings(value: unknown): CoachProviderSettings {
  if (!value || typeof value !== 'object') return DEFAULT_COACH_PROVIDER_SETTINGS;
  const item = value as Record<string, unknown>;
  const provider = item.provider === 'openai' || item.provider === 'anthropic' ? item.provider : 'gemini';
  const model = typeof item.model === 'string' ? item.model.trim().slice(0, 100) : '';
  const endpoint = typeof item.endpoint === 'string' ? item.endpoint.trim().slice(0, 300) : DEFAULT_COACH_PROVIDER_SETTINGS.endpoint;
  return { provider, model, endpoint };
}
