import assert from 'node:assert/strict';
import test from 'node:test';
import { STORE_NAMES, type TrainerBackup } from '../data/trainerDb';
import { mergeBackups, shouldSyncAuthEvent } from './cloudSync';

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

test('token refresh does not trigger a visible full sync', () => {
  assert.equal(shouldSyncAuthEvent('TOKEN_REFRESHED', 'user-1', 'user-1'), false);
  assert.equal(shouldSyncAuthEvent('SIGNED_IN', 'user-1', 'user-1'), false);
  assert.equal(shouldSyncAuthEvent('SIGNED_IN', undefined, 'user-1'), true);
  assert.equal(shouldSyncAuthEvent('SIGNED_OUT', 'user-1'), true);
});
