import { createBackup, importBackup, STORE_NAMES, validateBackup, type TrainerBackup } from '../data/trainerDb';
import { buildSyncReceipt, mergeBackups } from './cloudSync';
import { announceCloudImport } from './cloudSyncEvent';
import { supabase } from './supabase';

export const PORTABLE_BACKUP_EXTENSION = '.geotrainer';
export const PORTABLE_BACKUP_MIME = 'application/vnd.geotrainer+gzip';

const recordCount = (backup: TrainerBackup) => STORE_NAMES.reduce((total, name) => total + (backup.data[name]?.length || 0), 0);
export const portablePhotoCount = (backup: TrainerBackup) => ['locations', 'clues'].reduce((total, name) => total + ((backup.data[name as 'locations' | 'clues'] || []) as Array<{ imageDataUrl?: string }>).filter((item) => item.imageDataUrl?.startsWith('data:image/')).length, 0);

export interface PortableExportReceipt { fileName: string; records: number; photos: number; bytes: number }
export interface PortableImportReceipt { fileRecords: number; deviceRecords: number; mergedRecords: number; addedToDevice: number; reviewSchedulesUpdated: number; reviewEvents: number; photosInFile: number; photosAdded: number }
export interface PortableBackupFile { format: 'geotrainer-portable'; fileVersion: 1; ownerId?: string; ownerEmail?: string; createdAt: string; backup: TrainerBackup }
export interface PortableBackupOwner { id: string; email?: string }

export const parsePortableBackup = (text: string): PortableBackupFile => {
  let value: unknown;
  try { value = JSON.parse(text); } catch { throw new Error('This is not a valid GeoTrainer backup.'); }
  if (!value || typeof value !== 'object' || (value as Partial<PortableBackupFile>).format !== 'geotrainer-portable' || (value as Partial<PortableBackupFile>).fileVersion !== 1) throw new Error('Unsupported GeoTrainer backup version.');
  const file = value as PortableBackupFile;
  if (file.ownerId !== undefined && typeof file.ownerId !== 'string') throw new Error('The backup account information is invalid.');
  validateBackup(file.backup);
  return file;
};

export const portableOwnerMismatch = (file: PortableBackupFile, owner?: PortableBackupOwner) => !!file.ownerId && file.ownerId !== owner?.id;
export async function currentPortableOwner(): Promise<PortableBackupOwner | undefined> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  return session ? { id: session.user.id, email: session.user.email } : undefined;
}

export const createPortableImportPlan = (incoming: TrainerBackup, local: TrainerBackup) => {
  validateBackup(incoming);
  const merged = mergeBackups(incoming, local);
  const receipt = buildSyncReceipt(incoming, local, merged);
  return { merged, receipt: { fileRecords: receipt.downloadedRecords, deviceRecords: receipt.deviceRecords, mergedRecords: receipt.mergedRecords, addedToDevice: receipt.addedToDevice, reviewSchedulesUpdated: receipt.reviewSchedulesUpdated, reviewEvents: receipt.reviewEvents, photosInFile: portablePhotoCount(incoming), photosAdded: Math.max(0, portablePhotoCount(merged) - portablePhotoCount(local)) } satisfies PortableImportReceipt };
};

const backupFileName = (date = new Date()) => `GeoTrainer-${date.toISOString().replace(/[:.]/g, '-').replace('T', '_')}${PORTABLE_BACKUP_EXTENSION}`;

export async function encodePortableBackup(file: PortableBackupFile): Promise<Blob> {
  const json = new Blob([JSON.stringify(file)]);
  if (typeof CompressionStream === 'undefined') return json;
  const compressed = new Blob([await new Response(json.stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer()], { type: PORTABLE_BACKUP_MIME });
  return compressed.size < json.size ? compressed : json;
}

export async function downloadPortableBackup(): Promise<PortableExportReceipt> {
  const backup = await createBackup();
  const owner = await currentPortableOwner();
  const file: PortableBackupFile = { format: 'geotrainer-portable', fileVersion: 1, ownerId: owner?.id, ownerEmail: owner?.email, createdAt: new Date().toISOString(), backup };
  const blob = await encodePortableBackup(file);
  const fileName = backupFileName();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url; link.download = fileName; link.hidden = true;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return { fileName, records: recordCount(backup), photos: portablePhotoCount(backup), bytes: blob.size };
}

export async function readPortableBackup(file: File): Promise<PortableBackupFile> {
  if (!file.name.toLowerCase().endsWith(PORTABLE_BACKUP_EXTENSION)) throw new Error('Choose a .geotrainer backup file.');
  const header = new Uint8Array(await file.slice(0, 2).arrayBuffer());
  if (header[0] !== 0x1f || header[1] !== 0x8b) return parsePortableBackup(await file.text());
  if (typeof DecompressionStream === 'undefined') throw new Error('This is not a valid GeoTrainer backup.');
  try {
    const reader = file.stream().pipeThrough(new DecompressionStream('gzip')).getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 1024 * 1024 * 1024) { await reader.cancel(); throw new Error('This is not a valid GeoTrainer backup.'); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    return parsePortableBackup(new TextDecoder('utf-8', { fatal: true }).decode(bytes));
  } catch { throw new Error('This is not a valid GeoTrainer backup.'); }
}

export async function applyPortableBackup(file: PortableBackupFile): Promise<PortableImportReceipt> {
  const incoming = file.backup;
  const local = await createBackup(false);
  const { merged, receipt } = createPortableImportPlan(incoming, local);
  await importBackup(merged, 'merge');
  announceCloudImport();
  return receipt;
}
