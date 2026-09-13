import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import {
  createBackup,
  importBackup,
  initTrainerDb,
  onTrainerDbChange,
  trainerDb,
  STORE_NAMES,
  validateBackup,
  type StoreName,
  type TrainerBackup,
} from '../data/trainerDb';
import { supabase } from './supabase';
import { uploadClueImage } from './clueImages';
import type { ClueRecord } from '../types';
import { announceCloudImport } from './cloudSyncEvent';

type SyncPhase = 'disabled' | 'signed-out' | 'syncing' | 'synced' | 'error';

export interface CloudSyncState {
  configured: boolean;
  email?: string;
  phase: SyncPhase;
  message: string;
  lastSyncedAt?: string;
}

const keys: Record<StoreName, string> = {
  locations: 'id',
  attempts: 'id',
  games: 'id',
  studyVisits: 'id',
  reviews: 'id',
  bookmarks: 'panoId',
  collections: 'id',
  settings: 'key',
  sessions: 'id',
  clues: 'id',
};
const revision = (name: StoreName, record: Record<string, unknown>) => name === 'settings' ? Number(record.updatedAt || 0) : name === 'reviews' ? Math.max(Number(record.lastReviewedAt || 0), ...(Array.isArray(record.gradingHistory) ? record.gradingHistory.map((item) => Number((item as { at?: number }).at || 0)) : [0])) : undefined;

export function mergeBackups(cloud: TrainerBackup, local: TrainerBackup): TrainerBackup {
  const data = Object.fromEntries(STORE_NAMES.map((name) => {
    const key = keys[name];
    // ponytail: current-device records win same-key conflicts; add per-record timestamps if concurrent editing becomes common.
    const records = new Map<string, unknown>();
    for (const item of [...(cloud.data[name] || []), ...(local.data[name] || [])]) {
      const record = item as Record<string, unknown>; const recordKey = String(record[key]); const previous = records.get(recordKey) as Record<string, unknown> | undefined;
      if (!previous || revision(name, record) === undefined || revision(name, record)! >= revision(name, previous)!) records.set(recordKey, item);
    }
    return [name, [...records.values()]];
  })) as TrainerBackup['data'];

  return {
    format: 'street-view-trainer',
    schemaVersion: 1,
    exportedAt: local.exportedAt,
    data,
  };
}

let state: CloudSyncState = supabase
  ? { configured: true, phase: 'signed-out', message: 'Sign in to back up progress.' }
  : { configured: false, phase: 'disabled', message: 'Connect a Supabase project to enable cloud backup.' };
const listeners = new Set<() => void>();
let activeUserId: string | undefined;
let uploadPromise: Promise<void> | undefined;
let uploadPending = false;
let applyingCloud = false;
let started = false;

export function createQuietSyncScheduler(task: () => void, delayMs = 1200) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(task, delayMs);
  };
}

const update = (next: Partial<CloudSyncState>) => {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
};

export const shouldSyncAuthEvent = (event: AuthChangeEvent, previousUserId?: string, nextUserId?: string) =>
  event === 'SIGNED_OUT' ? !!previousUserId : event === 'SIGNED_IN' && !!nextUserId && nextUserId !== previousUserId;

export const withoutEmbeddedHostedImages = (clues: ClueRecord[]) => clues.map((clue) => clue.imagePath ? { ...clue, imageDataUrl: '' } : clue);

async function upload(userId = activeUserId, announce = false): Promise<void> {
  if (!supabase || !userId || applyingCloud) return;
  if (uploadPromise) {
    uploadPending = true;
    return uploadPromise;
  }
  if (announce) update({ phase: 'syncing', message: 'Saving progress…' });
  uploadPromise = (async () => {
    let backup = await createBackup(false);
    for (const clue of backup.data.clues as ClueRecord[]) {
      const hosted = await uploadClueImage(userId, clue);
      if (hosted !== clue) await trainerDb.saveClue(hosted);
    }
    backup = await createBackup(false);
    backup.data.clues = withoutEmbeddedHostedImages(backup.data.clues as ClueRecord[]);
    const syncedAt = new Date().toISOString();
    const { error } = await supabase.from('user_backups').upsert({
      user_id: userId,
      backup,
      updated_at: syncedAt,
    });
    if (error) throw error;
    update({ phase: 'synced', message: 'Progress backed up.', lastSyncedAt: syncedAt });
  })();
  try {
    await uploadPromise;
  } finally {
    uploadPromise = undefined;
  }
  if (uploadPending) {
    uploadPending = false;
    await upload(userId);
  }
}

async function syncSession(session: Session | null): Promise<void> {
  activeUserId = session?.user.id;
  if (!session) {
    update({ email: undefined, phase: 'signed-out', message: 'Sign in to back up progress.', lastSyncedAt: undefined });
    return;
  }

  update({ email: session.user.email, phase: 'syncing', message: 'Merging cloud and local progress…' });
  try {
    let importedCloud = false;
    await initTrainerDb();
    const local = await createBackup(false);
    const { data, error } = await supabase!.from('user_backups').select('backup').eq('user_id', session.user.id).maybeSingle();
    if (error) throw error;
    if (data?.backup) {
      validateBackup(data.backup);
      const merged = mergeBackups(data.backup, local);
      if (JSON.stringify(merged.data) !== JSON.stringify(local.data)) {
        applyingCloud = true;
        await importBackup(merged, 'replace');
        applyingCloud = false;
        importedCloud = true;
      }
    }
    await upload(session.user.id, true);
    if (importedCloud) announceCloudImport();
  } catch (error) {
    applyingCloud = false;
    update({ phase: 'error', message: error instanceof Error ? error.message : 'Cloud sync failed.' });
  }
}

export const cloudSync = {
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  getSnapshot: () => state,
  async start() {
    if (started || !supabase) return;
    started = true;
    try {
      await initTrainerDb();
      const scheduleUpload = createQuietSyncScheduler(() => {
        if (!activeUserId || applyingCloud) return;
        void upload().catch((error) => update({ phase: 'error', message: error.message }));
      });
      onTrainerDbChange(scheduleUpload);
      const { data } = await supabase.auth.getSession();
      await syncSession(data.session);
      supabase.auth.onAuthStateChange((event, session) => {
        const previousUserId = activeUserId;
        activeUserId = session?.user.id;
        if (shouldSyncAuthEvent(event, previousUserId, activeUserId)) setTimeout(() => void syncSession(session), 0);
      });
      window.addEventListener('online', () => void upload().catch(() => {}));
      const refresh = createQuietSyncScheduler(() => void supabase.auth.getSession().then(({ data }) => data.session && syncSession(data.session)).catch(() => {}), 250);
      window.addEventListener('focus', refresh);
      document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') refresh(); });
    } catch (error) {
      update({ phase: 'error', message: error instanceof Error ? error.message : 'Cloud sync could not start.' });
    }
  },
  syncNow: () => upload(activeUserId, true),
  async signInWithGoogle() {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: new URL(import.meta.env.BASE_URL, window.location.origin).href },
    });
    if (error) throw error;
  },
  async signIn(email: string, password: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  },
  async signUp(email: string, password: string) {
    if (!supabase) throw new Error('Supabase is not configured.');
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: window.location.origin },
    });
    if (error) throw error;
    return !data.session;
  },
  async signOut() {
    if (!supabase) return;
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) throw error;
  },
};
