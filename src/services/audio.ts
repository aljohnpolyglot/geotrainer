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

const ensureContext = () => context ??= new AudioContext();
const startMusic = () => {
  if (!preferences.musicEnabled || document.hidden) return;
  music ??= Object.assign(new Audio(`${import.meta.env.BASE_URL}assets/audio/ambient-relaxing-loop.mp3`), { loop: true });
  music.volume = preferences.musicVolume;
  void music.play().catch(() => {});
};

export const setAudioPreferences = (value: unknown) => {
  preferences = normalizeAudioPreferences(value);
  if (music) music.volume = preferences.musicVolume;
  if (preferences.musicEnabled) startMusic(); else music?.pause();
};

export const playUiSound = (kind: 'click' | 'pin' = 'click') => {
  if (!preferences.sfxEnabled) return;
  const audio = ensureContext();
  void audio.resume();
  const now = audio.currentTime;
  (kind === 'pin' ? [[330, 0], [520, .055]] : [[540, 0]]).forEach(([frequency, delay]) => {
    const oscillator = audio.createOscillator(); const gain = audio.createGain();
    oscillator.frequency.value = frequency; oscillator.type = 'sine';
    gain.gain.setValueAtTime(preferences.sfxVolume * .055, now + delay);
    gain.gain.exponentialRampToValueAtTime(.0001, now + delay + .07);
    oscillator.connect(gain).connect(audio.destination); oscillator.start(now + delay); oscillator.stop(now + delay + .075);
  });
};

export const installAudio = () => {
  const activate = (event: PointerEvent) => {
    if ((event.target as Element | null)?.closest('button:not(:disabled), a[href], summary, input[type="checkbox"], select')) playUiSound();
    startMusic();
  };
  const visibility = () => document.hidden ? music?.pause() : startMusic();
  document.addEventListener('pointerdown', activate, true); document.addEventListener('visibilitychange', visibility);
  return () => { document.removeEventListener('pointerdown', activate, true); document.removeEventListener('visibilitychange', visibility); music?.pause(); context?.close(); music = undefined; context = undefined; };
};
