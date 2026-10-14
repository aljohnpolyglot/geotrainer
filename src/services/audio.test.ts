import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_AUDIO_PREFERENCES, normalizeAudioPreferences, playUiSound, setAudioPreferences } from './audio';

test('audio preferences are opt-in and clamp persisted volumes', () => {
  assert.deepEqual(normalizeAudioPreferences(undefined), DEFAULT_AUDIO_PREFERENCES);
  assert.deepEqual(normalizeAudioPreferences({ sfxEnabled: true, musicEnabled: 1, sfxVolume: 4, musicVolume: -.5 }), { sfxEnabled: true, musicEnabled: false, sfxVolume: 1, musicVolume: 0 });
});

test('countdown and time-up cues use the sound-effects setting', () => {
  const frequencies: number[] = [];
  const original = globalThis.AudioContext;
  (globalThis as any).AudioContext = class {
    currentTime = 0;
    destination = {};
    resume() { return Promise.resolve(); }
    createOscillator() { return { frequency: { set value(value: number) { frequencies.push(value); } }, type: '', connect() { return this; }, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() { return this; } }; }
  };
  try {
    setAudioPreferences({ sfxEnabled: false }); playUiSound('tick'); assert.deepEqual(frequencies, []);
    setAudioPreferences({ sfxEnabled: true }); playUiSound('tick'); playUiSound('timeup');
    assert.deepEqual(frequencies, [880, 660, 440, 330]);
  } finally { setAudioPreferences(undefined); (globalThis as any).AudioContext = original; }
});
