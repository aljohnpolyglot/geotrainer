import assert from 'node:assert/strict';
import test from 'node:test';
import { STORE_NAMES, type TrainerBackup } from '../data/trainerDb';
import { createPortableImportPlan, parsePortableBackup, portableOwnerMismatch, type PortableBackupFile } from './portableBackup';

const backup = (data: Partial<TrainerBackup['data']>): TrainerBackup => ({ format: 'street-view-trainer', schemaVersion: 1, exportedAt: new Date(0).toISOString(), data: Object.fromEntries(STORE_NAMES.map((name) => [name, data[name] || []])) as TrainerBackup['data'] });

test('portable backup import merges differences and restores a missing local photo', () => {
  const incoming = backup({ locations: [{ id: 'shared', panoId: 'shared', imageDataUrl: 'data:image/jpeg;base64,photo' }, { id: 'file-only', panoId: 'file-only' }], attempts: [{ id: 'file-attempt' }] });
  const local = backup({ locations: [{ id: 'shared', panoId: 'shared', countryCode: 'SE' }, { id: 'device-only', panoId: 'device-only' }], attempts: [{ id: 'device-attempt' }] });
  const file: PortableBackupFile = { format: 'geotrainer-portable', fileVersion: 1, ownerId: 'owner-a', createdAt: new Date(0).toISOString(), backup: incoming };
  const parsed = parsePortableBackup(JSON.stringify(file));
  const { merged, receipt } = createPortableImportPlan(parsed.backup, local);
  assert.deepEqual((merged.data.locations as Array<{ id: string }>).map(({ id }) => id), ['shared', 'file-only', 'device-only']);
  assert.equal((merged.data.locations[0] as { imageDataUrl?: string; countryCode?: string }).imageDataUrl, 'data:image/jpeg;base64,photo');
  assert.equal((merged.data.locations[0] as { countryCode?: string }).countryCode, 'SE');
  assert.equal(receipt.addedToDevice, 2);
  assert.equal(receipt.photosAdded, 1);
});

test('portable backup parser rejects unrelated JSON', () => {
  assert.throws(() => parsePortableBackup('{"hello":"world"}'), /Unsupported GeoTrainer backup version/);
});

test('portable backup detects a different or signed-out account before import', () => {
  const file = { format: 'geotrainer-portable', fileVersion: 1, ownerId: 'owner-a', createdAt: new Date(0).toISOString(), backup: backup({}) } satisfies PortableBackupFile;
  assert.equal(portableOwnerMismatch(file, { id: 'owner-a' }), false);
  assert.equal(portableOwnerMismatch(file, { id: 'owner-b' }), true);
  assert.equal(portableOwnerMismatch(file), true);
});
