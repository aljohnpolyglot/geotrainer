import assert from 'node:assert/strict';
import test from 'node:test';
import { forgetCoachApiKey, getCoachApiKey, getCoachProviderSettings, hydrateCoachProviderSettings, normalizeCoachProviderSettings, setCoachApiKey } from './coachByok';
import { EXTRA_UI } from './extraUi';

const locales = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'sv'] as const;
const byokCopy = ['AI provider', 'Provider', 'OpenAI compatible', 'Model name', 'OpenAI-compatible API base URL', 'Your API key', 'Forget key', 'The key is sent through the Coach endpoint for each analysis and is not saved by GeoTrainer. It stays in memory until you forget it or reload the page.', 'Leave the key blank to use the app Gemini provider.', 'Paste a key for this provider to use it.', 'Add a valid provider API key in Settings.', 'Enter a valid OpenAI-compatible API URL.', 'This OpenAI-compatible API URL is not supported.', 'Select a supported AI provider.', 'Provider quota exceeded. Check your provider account.', 'AI provider service error.', 'Provider rejected the request. Check the key, model, and provider settings.', 'Coach request timed out.', 'Could not reach the selected AI provider.', 'The AI provider returned an empty response.', 'The AI provider returned mixed-language output. Try again.', 'The AI provider returned incomplete country reasoning. Try again.', 'The AI provider could not complete this analysis.', 'The AI provider returned an invalid Coach response. Try again.', 'The AI provider returned an unreadable response. Try again.'] as const;

test('provider preferences hydrate across reloads while API keys remain only in memory', () => {
  forgetCoachApiKey();
  const stored = normalizeCoachProviderSettings({ provider: 'anthropic', model: 'claude-sonnet', apiKey: 'must-not-load' });
  assert.deepEqual(stored, { provider: 'anthropic', model: 'claude-sonnet', endpoint: 'https://api.openai.com/v1' });
  hydrateCoachProviderSettings({ provider: 'anthropic', model: 'claude-sonnet' });
  assert.deepEqual(getCoachProviderSettings(), stored);
  assert.equal(getCoachApiKey(), '');
  setCoachApiKey('temporary-secret');
  assert.equal(getCoachApiKey(), 'temporary-secret');
  assert.deepEqual(getCoachProviderSettings(), stored);
  forgetCoachApiKey();
  assert.equal(getCoachApiKey(), '');
});

test('BYOK settings and provider errors have copy in every supported language', () => {
  for (const key of byokCopy) for (const locale of locales) assert.ok(EXTRA_UI[key]?.[locale], `${key} is missing ${locale}`);
});
