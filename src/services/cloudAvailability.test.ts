import assert from 'node:assert/strict';
import test from 'node:test';
import { checkCloudAvailability, isCloudUnavailableError } from './cloudAvailability';
import { translate } from './language';
import type { SupportedLanguage } from '../types';

test('cloud availability hides auth when the project is restricted or unreachable', async () => {
  const restricted = async () => new Response('{"message":"Service for this project is restricted due to exceed_egress_quota"}', { status: 402 });
  assert.equal(await checkCloudAvailability('https://example.supabase.co', 'public-key', undefined, restricted as typeof fetch), 'unavailable');
  assert.equal(await checkCloudAvailability('https://example.supabase.co', 'public-key', undefined, (async () => { throw new TypeError('offline'); }) as typeof fetch), 'unavailable');
  assert.equal(await checkCloudAvailability(undefined, undefined), 'unavailable');
  assert.equal(await checkCloudAvailability('https://example.supabase.co', 'public-key', undefined, (async () => new Response('{}', { status: 200 })) as typeof fetch), 'available');
  assert.equal(isCloudUnavailableError({ status: 402 }), true);
  assert.equal(isCloudUnavailableError({ message: 'Service for this project is restricted due to exceed_egress_quota' }), true);
  assert.equal(isCloudUnavailableError({ status: 400, message: 'Invalid login credentials' }), false);
});

test('account outage and formerly missing sign-in copy are localized in every interface language', () => {
  const keys = ['Checking cloud sign-in…', 'Cloud sign-in is unavailable.', 'Your progress stays on this device. You can export or import a backup here.', 'Sign in to continue the same training history on every device.', 'Sign in to GeoTrainer', 'Sign in to back up progress.', 'Create one private account for your attempts, clues, reviews, and collections.', 'Create GeoTrainer account', 'Authentication failed. Please try again.', 'The account action failed.', 'Invalid login credentials', 'Email not confirmed', 'User already registered'];
  for (const language of ['es', 'pt', 'fr', 'de', 'it', 'ru', 'sv'] as SupportedLanguage[]) {
    for (const key of keys) assert.notEqual(translate(language, key), key, `${language}: ${key}`);
  }
});
