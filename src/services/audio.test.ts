import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_AUDIO_PREFERENCES, normalizeAudioPreferences } from './audio';

test('audio preferences are opt-in and clamp persisted volumes', () => {
  assert.deepEqual(normalizeAudioPreferences(undefined), DEFAULT_AUDIO_PREFERENCES);
  assert.deepEqual(normalizeAudioPreferences({ sfxEnabled: true, musicEnabled: 1, sfxVolume: 4, musicVolume: -.5 }), { sfxEnabled: true, musicEnabled: false, sfxVolume: 1, musicVolume: 0 });
});
