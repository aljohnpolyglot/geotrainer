import { validateBackup, type TrainerBackup } from '../data/trainerDb';

type GzipBackup = { format: 'street-view-trainer-gzip'; schemaVersion: 1; payload: string };
const INVALID_BACKUP = 'Cloud backup is invalid or cannot be opened.';
const LARGE_BACKUP = 'Cloud backup is too large to sync.';
const MAX_BACKUP_BYTES = 256 * 1024 * 1024;

export const isCompressedCloudBackup = (value: unknown): value is GzipBackup =>
  !!value && typeof value === 'object' && (value as GzipBackup).format === 'street-view-trainer-gzip';

export async function encodeCloudBackup(backup: TrainerBackup): Promise<TrainerBackup | GzipBackup> {
  validateBackup(backup);
  if (typeof CompressionStream === 'undefined') return backup;
  const json = new Blob([JSON.stringify(backup)]);
  if (json.size > MAX_BACKUP_BYTES) throw new Error(LARGE_BACKUP);
  const bytes = new Uint8Array(await new Response(json.stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
  const parts: string[] = [];
  for (let index = 0; index < bytes.length; index += 32768) parts.push(String.fromCharCode(...bytes.subarray(index, index + 32768)));
  const payload = btoa(parts.join(''));
  return payload.length < json.size ? { format: 'street-view-trainer-gzip', schemaVersion: 1, payload } : backup;
}

export async function decodeCloudBackup(value: unknown): Promise<TrainerBackup> {
  if (!isCompressedCloudBackup(value)) { validateBackup(value); return value; }
  if (value.schemaVersion !== 1 || typeof value.payload !== 'string' || value.payload.length % 4 !== 0 || !/^[A-Za-z0-9+/]*={0,2}$/.test(value.payload) || typeof DecompressionStream === 'undefined') throw new Error(INVALID_BACKUP);
  try {
    const binary = atob(value.payload);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const reader = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip')).getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { value: chunk, done } = await reader.read();
      if (done) break;
      size += chunk.byteLength;
      if (size > MAX_BACKUP_BYTES) { await reader.cancel(); throw new Error(LARGE_BACKUP); }
      chunks.push(chunk);
    }
    const restored = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { restored.set(chunk, offset); offset += chunk.byteLength; }
    const backup: unknown = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(restored));
    validateBackup(backup);
    return backup;
  } catch (error) {
    if (error instanceof Error && error.message === LARGE_BACKUP) throw error;
    throw new Error(INVALID_BACKUP);
  }
}
