import type { Session } from '@supabase/supabase-js';
import {
  createBackup,
  importBackup,
  initTrainerDb,
  trainerDb,
  STORE_NAMES,
  validateBackup,
  type StoreName,
  type TrainerBackup,
} from '../data/trainerDb';
import { supabase } from './supabase';
import { cacheClueImages, hostedCluePaths, resolveStoredClueImages, uploadClueImage } from './clueImages';
import type { ClueRecord, CoachAnalysis, NotebookNote, ReviewRecord } from '../types';
import { announceCloudImport } from './cloudSyncEvent';
import { IMPORTED_MAP_PREFIX } from './importedMap';
import { splitDuplicateClues } from '../data/clueDedup';

type SyncPhase = 'disabled' | 'signed-out' | 'ready' | 'syncing' | 'synced' | 'error';
type RemoteBackup = { backup?: unknown; updatedAt?: string };

export interface CloudSyncState {
  configured: boolean;
  email?: string;
  phase: SyncPhase;
  message: string;
  lastSyncedAt?: string;
  receipt?: SyncReceipt;
}

export interface SyncReceipt {
  downloadedRecords: number;
  deviceRecords: number;
  mergedRecords: number;
  addedToDevice: number;
  reviewSchedulesUpdated: number;
  reviewEvents: number;
  cachedImages: number;
  uploadedRecords: number;
  uploadChanged: boolean;
  completedAt: string;
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
const revision = (name: StoreName, record: Record<string, unknown>) => name === 'settings' ? Number(record.updatedAt || 0) : undefined;
const noteSettings = new Set(['notebook.notes', 'coach.notes', 'clues.deleted']);
const mergeNotes = (left: unknown, right: unknown) => {
  const notes = new Map<string, Record<string, unknown>>();
  for (const item of [...(Array.isArray(left) ? left : []), ...(Array.isArray(right) ? right : [])] as Record<string, unknown>[]) { const key = String(item.id || `${item.panoId}:${item.updatedAt || item.generatedAt}:${item.clueId || ''}:${item.text || ''}`); const previous = notes.get(key); if (!previous || Number(item.deletedAt || item.updatedAt || item.generatedAt || 0) >= Number(previous.deletedAt || previous.updatedAt || previous.generatedAt || 0)) notes.set(key, item); }
  return [...notes.values()].sort((a, b) => Number(b.updatedAt || b.generatedAt || 0) - Number(a.updatedAt || a.generatedAt || 0));
};
const reviewedAt = (record: ReviewRecord) => Math.max(record.lastReviewedAt || 0, ...(record.gradingHistory || []).map((item) => item.at));
const mergeReviews = (left: ReviewRecord, right: ReviewRecord): ReviewRecord => {
  const latest = reviewedAt(right) >= reviewedAt(left) ? right : left;
  const generalization = (right.generalizationUpdatedAt || (right.generalizationLevel !== undefined ? reviewedAt(right) : 0)) >= (left.generalizationUpdatedAt || (left.generalizationLevel !== undefined ? reviewedAt(left) : 0)) ? right : left;
  const gradingHistory = [...(left.gradingHistory || []), ...(right.gradingHistory || [])]
    .filter((item, index, values) => values.findIndex((other) => other.at === item.at && other.grade === item.grade) === index)
    .sort((a, b) => a.at - b.at);
  return {
    ...latest,
    gradingHistory,
    reviewCount: Math.max(left.reviewCount || 0, right.reviewCount || 0, gradingHistory.length),
    lapseCount: Math.max(left.lapseCount || 0, right.lapseCount || 0, gradingHistory.filter((item) => item.grade === 'again').length),
    ...(generalization.generalizationLevel !== undefined ? { generalizationLevel: generalization.generalizationLevel } : {}),
    ...(generalization.generalizationUpdatedAt !== undefined ? { generalizationUpdatedAt: generalization.generalizationUpdatedAt } : {}),
  };
};

const recordCount = (backup: TrainerBackup) => STORE_NAMES.reduce((total, name) => total + (backup.data[name]?.length || 0), 0);
const uploadedRecordCount = (backup: TrainerBackup) => recordCount({ ...backup, data: { ...backup.data, settings: withoutImportedMaps(backup.data.settings as Array<{ key: string }>) } });
export const buildSyncReceipt = (remote: TrainerBackup | undefined, local: TrainerBackup, merged: TrainerBackup): Omit<SyncReceipt, 'uploadedRecords' | 'uploadChanged' | 'cachedImages' | 'completedAt'> => {
  const localReviews = new Map((local.data.reviews as ReviewRecord[]).map((review) => [review.id, review]));
  const mergedReviews = merged.data.reviews as ReviewRecord[];
  return {
    downloadedRecords: remote ? recordCount(remote) : 0,
    deviceRecords: recordCount(local),
    mergedRecords: recordCount(merged),
    addedToDevice: STORE_NAMES.reduce((total, name) => total + Math.max(0, (merged.data[name]?.length || 0) - (local.data[name]?.length || 0)), 0),
    reviewSchedulesUpdated: mergedReviews.filter((review) => !localReviews.has(review.id) || reviewedAt(review) > reviewedAt(localReviews.get(review.id)!)).length,
    reviewEvents: mergedReviews.reduce((total, review) => total + (review.gradingHistory?.length || 0), 0),
  };
};

export function mergeBackups(cloud: TrainerBackup, local: TrainerBackup): TrainerBackup {
  const data = Object.fromEntries(STORE_NAMES.map((name) => {
    const key = keys[name];
    // ponytail: current-device records win same-key conflicts; add per-record timestamps if concurrent editing becomes common.
    const records = new Map<string, unknown>();
    for (const item of [...(cloud.data[name] || []), ...(local.data[name] || [])]) {
      const record = item as Record<string, unknown>; const recordKey = String(record[key]); const previous = records.get(recordKey) as Record<string, unknown> | undefined;
      if (previous && name === 'reviews') records.set(recordKey, mergeReviews(previous as unknown as ReviewRecord, record as unknown as ReviewRecord));
      else if (previous && name === 'settings' && noteSettings.has(recordKey)) records.set(recordKey, { ...(revision(name, record)! >= revision(name, previous)! ? record : previous), value: mergeNotes(previous.value, record.value), updatedAt: Math.max(revision(name, record)!, revision(name, previous)!) });
      else if (!previous || revision(name, record) === undefined || revision(name, record)! >= revision(name, previous)!) records.set(recordKey, item);
    }
    return [name, [...records.values()]];
  })) as TrainerBackup['data'];

  const settings = data.settings as Array<{ key: string; value?: unknown }>;
  const notes = (settings.find((item) => item.key === 'notebook.notes')?.value || []) as NotebookNote[];
  const deleted = new Set(((settings.find((item) => item.key === 'clues.deleted')?.value || []) as Array<{ id: string }>).map((item) => item.id));
  data.clues = splitDuplicateClues((data.clues as ClueRecord[]).filter((clue) => !deleted.has(clue.id)), notes).unique;

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
let uploadPromise: Promise<boolean> | undefined;
let uploadPending = false;
let applyingCloud = false;
let started = false;
let syncedUserId: string | undefined;
let syncedBackup = '';

export async function retryCloud<T extends { error: unknown }>(task: () => PromiseLike<T>, attempts = 4): Promise<T> {
  let result = await task();
  for (let attempt = 1; result.error && attempt < attempts; attempt += 1) { await new Promise((resolve) => setTimeout(resolve, attempt * 500)); result = await task(); }
  return result;
}

const update = (next: Partial<CloudSyncState>) => {
  state = { ...state, ...next };
  listeners.forEach((listener) => listener());
};

export const withoutEmbeddedHostedImages = (clues: ClueRecord[]) => clues.map((clue) => clue.imagePath ? { ...clue, imageDataUrl: '' } : clue);
export const withoutEmbeddedLocationImages = (locations: Record<string, unknown>[]) => locations.map(({ imageDataUrl: _image, ...location }) => location);
export const withoutImportedMaps = (settings: Array<{ key: string }>) => settings.filter((item) => !item.key.startsWith(IMPORTED_MAP_PREFIX) && item.key !== 'local.currentMapId');
export const backupSignature = (backup: TrainerBackup) => JSON.stringify(backup.data);
export const savedContentCounts = (backup: TrainerBackup) => ({
  clues: backup.data.clues.length,
  notes: ((backup.data.settings as Array<{ key?: string; value?: unknown }>).find((item) => item.key === 'notebook.notes')?.value as unknown[] | undefined)?.length || 0,
});
export const savedContentDecreased = (previous: ReturnType<typeof savedContentCounts>, current: ReturnType<typeof savedContentCounts>) => current.clues < previous.clues || current.notes < previous.notes;
export const sessionNeedsRefresh = (session: Pick<Session, 'expires_at'>, now = Date.now()) => !session.expires_at || session.expires_at * 1000 <= now + 60_000;
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

async function upload(userId = activeUserId, announce = false, knownRemote?: RemoteBackup): Promise<boolean> {
  if (!supabase || !userId || applyingCloud) return false;
  if (uploadPromise) {
    uploadPending = true;
    return uploadPromise;
  }
  if (announce) update({ phase: 'syncing', message: 'Uploading merged progress…' });
  uploadPromise = (async () => {
    await repairMissingNotebookClues(userId);
    const localClues = await trainerDb.clues();
    for (const [index, clue] of (await cacheClueImages(localClues)).entries()) if (clue.imageDataUrl && !localClues[index].imageDataUrl) await trainerDb.saveClue(clue);
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
      return false;
    }
    let remoteRecord = knownRemote;
    if (remoteRecord === undefined) {
      const { data, error } = await retryCloud(() => supabase.from('user_backups').select('backup,updated_at').eq('user_id', userId).maybeSingle());
      if (error) throw error;
      remoteRecord = data ? { backup: data.backup, updatedAt: data.updated_at } : {};
    }
    const remote = remoteRecord.backup;
    if (remote) {
      validateBackup(remote);
      const latestLocal = await createBackup(false);
      const merged = mergeBackups(remote as TrainerBackup, latestLocal);
      if (JSON.stringify(merged.data) !== JSON.stringify(latestLocal.data)) {
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
      return false;
    }
    const syncedAt = new Date().toISOString();
    if (remoteRecord.updatedAt) {
      const { data, error } = await retryCloud(() => supabase.from('user_backups').update({ backup, updated_at: syncedAt }).eq('user_id', userId).eq('updated_at', remoteRecord.updatedAt!).select('updated_at').maybeSingle());
      if (error) throw error;
      if (!data) { uploadPending = true; return false; }
    } else {
      const { error } = await retryCloud(() => supabase.from('user_backups').insert({ user_id: userId, backup, updated_at: syncedAt }));
      if (error) {
        if ((error as { code?: string }).code === '23505') { uploadPending = true; return false; }
        throw error;
      }
    }
    syncedUserId = userId;
    syncedBackup = signature;
    update({ phase: 'synced', message: 'Progress backed up.', lastSyncedAt: syncedAt });
    if (importedCloud) announceCloudImport();
    return true;
  })();
  let uploaded: boolean;
  try {
    uploaded = await uploadPromise;
  } finally {
    uploadPromise = undefined;
  }
  if (uploadPending) {
    uploadPending = false;
    uploaded = await upload(userId) || uploaded;
  }
  return uploaded;
}

async function syncSession(session: Session | null, announce = false): Promise<void> {
  activeUserId = session?.user.id;
  if (!session) {
    syncedUserId = undefined; syncedBackup = '';
    update({ email: undefined, phase: 'signed-out', message: 'Sign in to back up progress.', lastSyncedAt: undefined });
    return;
  }

  update(announce ? { email: session.user.email, phase: 'syncing', message: 'Downloading cloud progress…', receipt: undefined } : { email: session.user.email });
  try {
    let importedCloud = false;
    await initTrainerDb();
    const { data, error } = await retryCloud(() => supabase!.from('user_backups').select('backup,updated_at').eq('user_id', session.user.id).maybeSingle());
    if (error) throw error;
    if (announce) update({ message: 'Merging cloud and device progress…' });
    const local = await createBackup(false);
    syncedUserId = session.user.id;
    syncedBackup = '';
    let merged = local;
    if (data?.backup) {
      validateBackup(data.backup);
      syncedBackup = backupSignature(data.backup);
      merged = mergeBackups(data.backup, local);
      if (JSON.stringify(merged.data) !== JSON.stringify(local.data)) {
        applyingCloud = true;
        try { await importBackup(merged, 'merge'); await reportUnexpectedDecrease(local, 'session cloud merge'); } finally { applyingCloud = false; }
        importedCloud = true;
      }
    }
    const receipt = buildSyncReceipt(data?.backup as TrainerBackup | undefined, local, merged);
    const missingImages = hostedCluePaths(await trainerDb.clues()).length;
    const uploadChanged = await upload(session.user.id, announce, data ? { backup: data.backup, updatedAt: data.updated_at } : {});
    const finalBackup = await createBackup(false);
    const completedAt = new Date().toISOString();
    const cachedImages = missingImages - hostedCluePaths(finalBackup.data.clues as ClueRecord[]).length;
    update({ phase: 'synced', message: uploadChanged ? 'Sync complete. Merged progress uploaded.' : 'Sync complete. Cloud was already current.', lastSyncedAt: completedAt, receipt: { ...receipt, uploadedRecords: uploadedRecordCount(finalBackup), uploadChanged, cachedImages, completedAt } });
    if (importedCloud) announceCloudImport();
  } catch (error) {
    applyingCloud = false;
    if (announce) update({ phase: 'error', message: error instanceof Error ? error.message : 'Cloud sync failed.' });
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
      const { data } = await supabase.auth.getSession();
      activeUserId = data.session?.user.id;
      if (data.session) update({ email: data.session.user.email, phase: 'ready', message: 'Press Sync now to merge this device with your cloud progress.' });
      supabase.auth.onAuthStateChange((_event, session) => {
        if (!session) {
          activeUserId = undefined; syncedUserId = undefined; syncedBackup = '';
          update({ email: undefined, phase: 'signed-out', message: 'Sign in to back up progress.', lastSyncedAt: undefined });
        } else if (session.user.id !== activeUserId) {
          activeUserId = session.user.id; syncedUserId = undefined; syncedBackup = '';
          update({ email: session.user.email, phase: 'ready', message: 'Press Sync now to merge this device with your cloud progress.', lastSyncedAt: undefined });
        }
      });
    } catch (error) {
      update({ phase: 'error', message: error instanceof Error ? error.message : 'Cloud sync could not start.' });
    }
  },
  async syncNow() {
    if (!supabase) return;
    const current = await supabase.auth.getSession();
    if (!current.data.session) return syncSession(null, true);
    if (!sessionNeedsRefresh(current.data.session)) return syncSession(current.data.session, true);
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) return update({ phase: 'error', message: refreshed.error.message });
    await syncSession(refreshed.data.session, true);
  },
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
