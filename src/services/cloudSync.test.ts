import assert from 'node:assert/strict';
import test from 'node:test';
import { STORE_NAMES, type TrainerBackup } from '../data/trainerDb';
import { createQuietSyncScheduler, mergeBackups, shouldSyncAuthEvent } from './cloudSync';

const backup = (id: string, score: number): TrainerBackup => ({
  format: 'street-view-trainer',
  schemaVersion: 1,
  exportedAt: id,
  data: Object.fromEntries(STORE_NAMES.map((name) => [
    name,
    name === 'attempts' ? [{ id, score }] : [],
  ])) as TrainerBackup['data'],
});

test('cloud merge preserves unique progress and lets the current device win conflicts', () => {
  const cloud = backup('cloud', 10);
  const local = backup('local', 20);
  local.data.attempts.push({ id: 'cloud', score: 30 });

  assert.deepEqual(mergeBackups(cloud, local).data.attempts, [
    { id: 'cloud', score: 30 },
    { id: 'local', score: 20 },
  ]);
});

test('cloud merge includes saved clue images and persisted preferences', () => {
  const cloud = backup('cloud', 10);
  const local = backup('local', 20);
  cloud.data.clues.push({ id: 'clue-cloud', imageDataUrl: 'data:image/jpeg;base64,AQ==' });
  local.data.clues.push({ id: 'clue-local', imageDataUrl: 'data:image/jpeg;base64,Ag==' });
  cloud.data.settings.push({ key: 'schedulerPreferences', value: { strictness: 'beginner' } });
  local.data.settings.push({ key: 'schedulerPreferences', value: { strictness: 'pro' } });
  const merged = mergeBackups(cloud, local);
  assert.equal(merged.data.clues.length, 2);
  assert.deepEqual(merged.data.settings, [{ key: 'schedulerPreferences', value: { strictness: 'pro' } }]);
});

test('token refresh does not trigger a visible full sync', () => {
  assert.equal(shouldSyncAuthEvent('TOKEN_REFRESHED', 'user-1', 'user-1'), false);
  assert.equal(shouldSyncAuthEvent('SIGNED_IN', 'user-1', 'user-1'), false);
  assert.equal(shouldSyncAuthEvent('SIGNED_IN', undefined, 'user-1'), true);
  assert.equal(shouldSyncAuthEvent('SIGNED_OUT', 'user-1'), true);
});

test('quiet sync coalesces a burst of local saves into one upload', async () => {
  let uploads = 0;
  const schedule = createQuietSyncScheduler(() => { uploads += 1; }, 10);
  schedule(); schedule(); schedule();
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(uploads, 1);
});
