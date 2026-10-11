import assert from 'node:assert/strict';
import test from 'node:test';
import { STORE_NAMES, type TrainerBackup } from '../data/trainerDb';
import { decodeCloudBackup, encodeCloudBackup } from './cloudBackupCodec';

const backup: TrainerBackup = {
  format: 'street-view-trainer', schemaVersion: 1, exportedAt: '2026-10-11T00:00:00Z',
  data: Object.fromEntries(STORE_NAMES.map((name) => [name, []])) as TrainerBackup['data'],
};
backup.data.attempts = Array.from({ length: 100 }, (_, index) => ({ id: `attempt-${index}`, countryCode: 'SE', note: 'École — Москва' }));

test('compressed cloud backup restores every record and still reads legacy backups', async () => {
  const encoded = await encodeCloudBackup(backup);
  assert.equal(encoded.format, 'street-view-trainer-gzip');
  assert.ok(JSON.stringify(encoded).length < JSON.stringify(backup).length);
  assert.deepEqual(await decodeCloudBackup(encoded), backup);
  assert.deepEqual(await decodeCloudBackup(backup), backup);
});

test('corrupt compressed cloud backup fails before any merge', async () => {
  await assert.rejects(() => decodeCloudBackup({ format: 'street-view-trainer-gzip', schemaVersion: 1, payload: 'AAAA' }), /Cloud backup is invalid/);
  await assert.rejects(() => decodeCloudBackup({ format: 'street-view-trainer-gzip', schemaVersion: 1, payload: 'A'.repeat(1_000_000) }), /Cloud backup is invalid/);
});
