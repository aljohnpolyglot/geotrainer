import assert from 'node:assert/strict';
import test from 'node:test';
import { DEFAULT_AUDIO_PREFERENCES, normalizeAudioPreferences, playUiSound, setAudioMode, setAudioPreferences } from './audio';

test('audio preferences are opt-in and clamp persisted volumes', () => {
  assert.deepEqual(normalizeAudioPreferences(undefined), DEFAULT_AUDIO_PREFERENCES);
  assert.deepEqual(normalizeAudioPreferences({ sfxEnabled: true, musicEnabled: 1, sfxVolume: 4, musicVolume: -.5 }), { sfxEnabled: true, musicEnabled: false, sfxVolume: 1, musicVolume: 0 });
});

test('countdown cues follow sound effects while the faster Play loop follows music', () => {
  const frequencies: number[] = [];
  const gains: number[] = [];
  const original = globalThis.AudioContext;
  const originalWindow = globalThis.window;
  const originalDocument = globalThis.document;
  let pulse: (() => void) | undefined;
  (globalThis as any).AudioContext = class {
    currentTime = 0;
    destination = {};
    resume() { return Promise.resolve(); }
    createOscillator() { return { frequency: { set value(value: number) { frequencies.push(value); } }, type: '', connect() { return this; }, start() {}, stop() {} }; }
    createGain() { return { gain: { setValueAtTime(value: number) { gains.push(value); }, exponentialRampToValueAtTime() {} }, connect() { return this; } }; }
  };
  try {
    setAudioPreferences({ sfxEnabled: false }); playUiSound('tick'); assert.deepEqual(frequencies, []);
    setAudioPreferences({ sfxEnabled: true }); playUiSound('tick'); playUiSound('timeup');
    assert.deepEqual(frequencies, [880, 660, 440, 330]);
    (globalThis as any).window = { setInterval(callback: () => void, delay: number) { assert.equal(delay, 240); pulse = callback; return 1; }, clearInterval() { pulse = undefined; } };
    (globalThis as any).document = { hidden: false };
    setAudioMode('play'); setAudioPreferences({ musicEnabled: true, musicVolume: 1 });
    assert.deepEqual(frequencies.slice(4), [110]);
    pulse?.();
    assert.deepEqual(frequencies.slice(4), [110, 110, 261.63]);
    assert.ok(gains.includes(.065) && gains.includes(.025));
  } finally {
    setAudioPreferences(undefined); setAudioMode('learn');
    (globalThis as any).AudioContext = original;
    (globalThis as any).window = originalWindow;
    (globalThis as any).document = originalDocument;
  }
});
