export type AudioPreferences = { sfxEnabled: boolean; musicEnabled: boolean; sfxVolume: number; musicVolume: number };

export const DEFAULT_AUDIO_PREFERENCES: AudioPreferences = { sfxEnabled: false, musicEnabled: false, sfxVolume: .5, musicVolume: .25 };

const volume = (value: unknown, fallback: number) => Number.isFinite(Number(value)) ? Math.min(1, Math.max(0, Number(value))) : fallback;
export const normalizeAudioPreferences = (value: unknown): AudioPreferences => {
  const saved = value && typeof value === 'object' ? value as Partial<AudioPreferences> : {};
  return { sfxEnabled: saved.sfxEnabled === true, musicEnabled: saved.musicEnabled === true, sfxVolume: volume(saved.sfxVolume, .5), musicVolume: volume(saved.musicVolume, .25) };
};

let preferences = DEFAULT_AUDIO_PREFERENCES;
let context: AudioContext | undefined;
let music: HTMLAudioElement | undefined;
let audioMode: 'learn' | 'play' = 'learn';
let pulseTimer: number | undefined;
let pulseStep = 0;
const PLAY_PATTERN = [
  [110, 0], [110, 261.63], [110, 0], [110, 329.63],
  [98, 0], [98, 261.63], [98, 0], [98, 392],
  [87.31, 0], [87.31, 220], [87.31, 0], [87.31, 261.63],
  [98, 0], [98, 246.94], [98, 0], [98, 293.66],
];

const ensureContext = () => context ??= new AudioContext();
const stopPulse = () => { if (pulseTimer !== undefined) window.clearInterval(pulseTimer); pulseTimer = undefined; };
const playPulse = () => {
  if (!preferences.musicEnabled || document.hidden) return;
  const audio = ensureContext(); void audio.resume().catch(() => {});
  const now = audio.currentTime; const [bass, lead] = PLAY_PATTERN[pulseStep++ % PLAY_PATTERN.length];
  for (const [frequency, type, level, duration] of [[bass, 'triangle', .065, .2], [lead, 'sawtooth', .025, .14]] as const) {
    if (!frequency) continue;
    const oscillator = audio.createOscillator(); const gain = audio.createGain();
    oscillator.type = type; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(preferences.musicVolume * level, now);
    gain.gain.exponentialRampToValueAtTime(.0001, now + duration);
    oscillator.connect(gain).connect(audio.destination); oscillator.start(now); oscillator.stop(now + duration + .01);
  }
};
const startMusic = () => {
  if (!preferences.musicEnabled || document.hidden) return;
  if (audioMode === 'play') { music?.pause(); if (pulseTimer === undefined) { pulseStep = 0; playPulse(); pulseTimer = window.setInterval(playPulse, 240); } return; }
  stopPulse();
  music ??= Object.assign(new Audio(`${import.meta.env.BASE_URL}assets/audio/ambient-relaxing-loop.mp3`), { loop: true });
  music.volume = preferences.musicVolume;
  void music.play().catch(() => {});
};

export const setAudioPreferences = (value: unknown) => {
  preferences = normalizeAudioPreferences(value);
  if (music) music.volume = preferences.musicVolume;
  if (preferences.musicEnabled) startMusic(); else { music?.pause(); stopPulse(); }
};

export const setAudioMode = (mode: 'learn' | 'play') => { audioMode = mode; if (mode === 'learn') stopPulse(); else music?.pause(); startMusic(); };

export const playUiSound = (kind: 'click' | 'pin' | 'tick' | 'timeup' = 'click') => {
  if (!preferences.sfxEnabled) return;
  const audio = ensureContext();
  void audio.resume();
  const now = audio.currentTime;
  const notes = kind === 'pin' ? [[330, 0], [520, .055]] : kind === 'tick' ? [[880, 0]] : kind === 'timeup' ? [[660, 0], [440, .16], [330, .32]] : [[540, 0]];
  notes.forEach(([frequency, delay]) => {
    const oscillator = audio.createOscillator(); const gain = audio.createGain();
    oscillator.frequency.value = frequency; oscillator.type = kind === 'tick' ? 'triangle' : 'sine';
    const duration = kind === 'timeup' ? .15 : kind === 'tick' ? .09 : .07;
    gain.gain.setValueAtTime(preferences.sfxVolume * .055, now + delay);
    gain.gain.exponentialRampToValueAtTime(.0001, now + delay + duration);
    oscillator.connect(gain).connect(audio.destination); oscillator.start(now + delay); oscillator.stop(now + delay + duration + .005);
  });
};

export const installAudio = () => {
  const activate = (event: PointerEvent) => {
    if ((event.target as Element | null)?.closest('button:not(:disabled), a[href], summary, input[type="checkbox"], select')) playUiSound();
    startMusic();
  };
  const visibility = () => { if (document.hidden) { music?.pause(); stopPulse(); } else startMusic(); };
  document.addEventListener('pointerdown', activate, true); document.addEventListener('visibilitychange', visibility);
  return () => { document.removeEventListener('pointerdown', activate, true); document.removeEventListener('visibilitychange', visibility); music?.pause(); stopPulse(); context?.close(); music = undefined; context = undefined; };
};
