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
import { resolveStoredClueImages, uploadClueImage } from './clueImages';
import type { ClueRecord, CoachAnalysis, NotebookNote } from '../types';
import { announceCloudImport } from './cloudSyncEvent';
import { IMPORTED_MAP_PREFIX } from './importedMap';

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
const revision = (name: StoreName, record: Record<string, unknown>) => name === 'settings' ? Number(record.updatedAt || 0) : name === 'reviews' ? Math.max(Number(record.lastReviewedAt || 0), Number(record.generalizationUpdatedAt || 0), ...(Array.isArray(record.gradingHistory) ? record.gradingHistory.map((item) => Number((item as { at?: number }).at || 0)) : [0])) : undefined;
const noteSettings = new Set(['notebook.notes', 'coach.notes']);
const mergeNotes = (left: unknown, right: unknown) => {
  const notes = new Map<string, Record<string, unknown>>();
  for (const item of [...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])] as Record<string, unknown>[]) { const key = String(item.id || `${item.panoId}:${item.updatedAt || item.generatedAt}:${item.clueId || ''}:${item.text || ''}`); const previous = notes.get(key); if (!previous || Number(item.deletedAt || item.updatedAt || item.generatedAt || 0) >= Number(previous.deletedAt || previous.updatedAt || previous.generatedAt || 0)) notes.set(key, item); }
  return [...notes.values()].sort((a, b) => Number(b.updatedAt || b.generatedAt || 0) - Number(a.updatedAt || a.generatedAt || 0));
};

export function mergeBackups(cloud: TrainerBackup, local: TrainerBackup): TrainerBackup {
  const data = Object.fromEntries(STORE_NAMES.map((name) => {
    const key = keys[name];
    // ponytail: current-device records win same-key conflicts; add per-record timestamps if concurrent editing becomes common.
    const records = new Map<string, unknown>();
    for (const item of [...(cloud.data[name] || []), ...(local.data[name] || [])]) {
      const record = item as Record<string, unknown>; const recordKey = String(record[key]); const previous = records.get(recordKey) as Record<string, unknown> | undefined;
      if (previous && name === 'settings' && noteSettings.has(recordKey)) records.set(recordKey, { ...(revision(name, record)! >= revision(name, previous)! ? record : previous), value: mergeNotes(previous.value, record.value), updatedAt: Math.max(revision(name, record)!, revision(name, previous)!) });
      else if (!previous || revision(name, record) === undefined || revision(name, record)! >= revision(name, previous)!) records.set(recordKey, item);
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
let syncedUserId: string | undefined;
let syncedBackup = '';
let lastPullAt = 0;

export function createQuietSyncScheduler(task: () => void, delayMs = 1200) {
  let timer: ReturnType<typeof setTimeout> | undefined;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(task, delayMs);
  };
}

export async function retryCloud<T extends { error: unknown }>(task: () => PromiseLike<T>, attempts = 4): Promise<T> {
  let result = await task();
  for (let attempt = 1; result.error && attempt < attempts; attempt += 1) { await new Promise((resolve) => setTimeout(resolve, attempt * 500)); result = await task(); }
  return result;
}

const update = (next: Partial<CloudSyncState>) => {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
};

export const shouldSyncAuthEvent = (event: AuthChangeEvent, previousUserId?: string, nextUserId?: string) =>
  event === 'SIGNED_OUT' ? !!previousUserId : event === 'SIGNED_IN' && !!nextUserId && nextUserId !== previousUserId;

export const withoutEmbeddedHostedImages = (clues: ClueRecord[]) => clues.map((clue) => clue.imagePath ? { ...clue, imageDataUrl: '' } : clue);
export const withoutEmbeddedLocationImages = (locations: Record<string, unknown>[]) => locations.map(({ imageDataUrl: _image, ...location }) => location);
export const withoutImportedMaps = (settings: Array<{ key: string }>) => settings.filter((item) => !item.key.startsWith(IMPORTED_MAP_PREFIX) && item.key !== 'local.currentMapId');
export const backupSignature = (backup: TrainerBackup) => JSON.stringify(backup.data);
export const shouldPullCloud = (now: number, previous: number, interval = 60_000) => !previous || now - previous >= interval;
export const savedContentCounts = (backup: TrainerBackup) => ({
  clues: backup.data.clues.length,
  notes: ((backup.data.settings as Array<{ key?: string; value?: unknown }>).find((item) => item.key === 'notebook.notes')?.value as unknown[] | undefined)?.length || 0,
});
export const savedContentDecreased = (previous: ReturnType<typeof savedContentCounts>, current: ReturnType<typeof savedContentCounts>) => current.clues < previous.clues || current.notes < previous.notes;
const diagnosticId = () => typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);
const syncSessionId = diagnosticId();
const syncDeviceId = (() => {
  try {
    if (typeof localStorage === 'undefined') return diagnosticId();
    const key = 'geotrainer.diagnosticDeviceId'; const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = diagnosticId(); localStorage.setItem(key, created); return created;
  } catch { return diagnosticId(); }
})();
const logUnexpectedDecrease = (previous: ReturnType<typeof savedContentCounts>, current: ReturnType<typeof savedContentCounts>, operation: string) => {
  if (savedContentDecreased(previous, current)) console.error('[GeoTrainer] Unexpected saved-content decrease', { previous, current, operation, host: typeof location === 'undefined' ? 'unknown' : location.host, sessionId: syncSessionId, deviceId: syncDeviceId });
};
const reportUnexpectedDecrease = async (before: TrainerBackup, operation: string) => {
  if (!import.meta.env.DEV) return;
  const previous = savedContentCounts(before); const current = savedContentCounts(await createBackup(false));
  logUnexpectedDecrease(previous, current, operation);
};

const emptyAnalysis = (): CoachAnalysis => ({ confidence: 'low', region: '', candidates: [], strongClues: [], weakClues: [], confusions: [], nextThingsToInspect: [], extraCards: [] });
async function repairMissingNotebookClues(userId: string) {
  const [notes, clues] = await Promise.all([trainerDb.setting<NotebookNote[]>('notebook.notes'), trainerDb.clues()]);
  const existing = new Set(clues.map((clue) => clue.id));
  const missing = (notes || []).filter((note): note is NotebookNote & { clueId: string } => !note.deletedAt && !!note.clueId && !existing.has(note.clueId));
  if (!missing.length) return 0;
  const stored = await resolveStoredClueImages(userId, missing.map((note) => note.clueId));
  let repaired = 0;
  for (const note of missing) {
    const draft = await trainerDb.setting<{ clueId?: string; imageDataUrl?: string; analysis?: CoachAnalysis }>(`workspace.clueDraft:${encodeURIComponent(note.panoId)}`);
    const image = draft?.clueId === note.clueId && draft.imageDataUrl?.startsWith('data:image/') ? { imageDataUrl: draft.imageDataUrl } : stored.get(note.clueId);
    if (!image) continue;
    await trainerDb.saveClue({ id: note.clueId, panoId: note.panoId, countryCode: note.countryCode, createdAt: note.updatedAt, model: 'recovered', origin: 'personal', analysis: draft?.analysis || emptyAnalysis(), ...image });
    repaired += 1;
  }
  return repaired;
}

async function upload(userId = activeUserId, announce = false, knownRemote?: unknown): Promise<void> {
  if (!supabase || !userId || applyingCloud) return;
  if (uploadPromise) {
    uploadPending = true;
    return uploadPromise;
  }
  if (announce) update({ phase: 'syncing', message: 'Saving progress…' });
  uploadPromise = (async () => {
    await repairMissingNotebookClues(userId);
    let backup = await createBackup(false);
    let importedCloud = false;
    let hostedImage = false;
    for (const clue of backup.data.clues as ClueRecord[]) {
      const hosted = await uploadClueImage(userId, clue);
      if (hosted !== clue) { await trainerDb.saveClue(hosted); hostedImage = true; }
    }
    if (hostedImage) backup = await createBackup(false);
    const localSignature = backupSignature({ ...backup, data: { ...backup.data,
      clues: withoutEmbeddedHostedImages(backup.data.clues as ClueRecord[]),
      locations: withoutEmbeddedLocationImages(backup.data.locations as Record<string, unknown>[]),
      settings: withoutImportedMaps(backup.data.settings as Array<{ key: string }>),
    } });
    if (syncedUserId === userId && syncedBackup === localSignature) {
      if (announce) update({ phase: 'synced', message: 'Progress backed up.' });
      return;
    }
    let remote = knownRemote;
    if (remote === undefined) {
      const { data, error } = await retryCloud(() => supabase.from('user_backups').select('backup').eq('user_id', userId).maybeSingle());
      if (error) throw error;
      remote = data?.backup;
    }
    if (remote) {
      validateBackup(remote);
      const merged = mergeBackups(remote as TrainerBackup, backup);
      if (JSON.stringify(merged.data) !== JSON.stringify(backup.data)) {
        applyingCloud = true;
        try { await importBackup(merged, 'merge'); await reportUnexpectedDecrease(backup, 'upload cloud merge'); } finally { applyingCloud = false; }
        backup = merged;
        importedCloud = true;
      }
    }
    backup.data.clues = withoutEmbeddedHostedImages(backup.data.clues as ClueRecord[]);
    backup.data.locations = withoutEmbeddedLocationImages(backup.data.locations as Record<string, unknown>[]);
    backup.data.settings = withoutImportedMaps(backup.data.settings as Array<{ key: string }>);
    const signature = backupSignature(backup);
    if (syncedUserId === userId && syncedBackup === signature) {
      if (announce) update({ phase: 'synced', message: 'Progress backed up.' });
      if (importedCloud) announceCloudImport();
      return;
    }
    const syncedAt = new Date().toISOString();
    const { error } = await retryCloud(() => supabase.from('user_backups').upsert({
      user_id: userId,
      backup,
      updated_at: syncedAt,
    }));
    if (error) throw error;
    syncedUserId = userId;
    syncedBackup = signature;
    update({ phase: 'synced', message: 'Progress backed up.', lastSyncedAt: syncedAt });
    if (importedCloud) announceCloudImport();
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
    syncedUserId = undefined; syncedBackup = ''; lastPullAt = 0;
    update({ email: undefined, phase: 'signed-out', message: 'Sign in to back up progress.', lastSyncedAt: undefined });
    return;
  }

  update({ email: session.user.email, phase: 'syncing', message: 'Merging cloud and local progress…' });
  try {
    let importedCloud = false;
    await initTrainerDb();
    const local = await createBackup(false);
    const { data, error } = await retryCloud(() => supabase!.from('user_backups').select('backup').eq('user_id', session.user.id).maybeSingle());
    if (error) throw error;
    syncedUserId = session.user.id;
    syncedBackup = '';
    if (data?.backup) {
      validateBackup(data.backup);
      syncedBackup = backupSignature(data.backup);
      const merged = mergeBackups(data.backup, local);
      if (JSON.stringify(merged.data) !== JSON.stringify(local.data)) {
        applyingCloud = true;
        try { await importBackup(merged, 'merge'); await reportUnexpectedDecrease(local, 'session cloud merge'); } finally { applyingCloud = false; }
        importedCloud = true;
      }
    }
    await upload(session.user.id, true, data?.backup);
    lastPullAt = Date.now();
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
      }, 5000);
      let previousCounts = savedContentCounts(await createBackup(false)); let audit = Promise.resolve();
      onTrainerDbChange((change) => {
        scheduleUpload();
        if (!import.meta.env.DEV) return;
        audit = audit.then(async () => { const current = savedContentCounts(await createBackup(false)); if (!change.allowsSavedContentDecrease) logUnexpectedDecrease(previousCounts, current, change.operation); previousCounts = current; });
      });
      const { data } = await supabase.auth.getSession();
      await syncSession(data.session);
      supabase.auth.onAuthStateChange((event, session) => {
        const previousUserId = activeUserId;
        activeUserId = session?.user.id;
        if (shouldSyncAuthEvent(event, previousUserId, activeUserId)) setTimeout(() => void syncSession(session), 0);
      });
      window.addEventListener('online', () => void upload().catch(() => {}));
      const refresh = createQuietSyncScheduler(() => {
        if (!shouldPullCloud(Date.now(), lastPullAt)) return;
        void supabase.auth.getSession().then(({ data }) => data.session && syncSession(data.session)).catch(() => {});
      }, 250);
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
