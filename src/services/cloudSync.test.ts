import assert from 'node:assert/strict';
import test from 'node:test';
import { STORE_NAMES, type TrainerBackup } from '../data/trainerDb';
import { createQuietSyncScheduler, mergeBackups, shouldSyncAuthEvent, withoutEmbeddedHostedImages } from './cloudSync';
import { announceCloudImport, CLOUD_IMPORT_EVENT } from './cloudSyncEvent';

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

test('cloud merge keeps the newest setting across screens', () => {
  const cloud = backup('cloud', 10); const local = backup('local', 20);
  cloud.data.settings.push({ key: 'workspace.active', value: { mode: 'study', location: 'Russia' }, updatedAt: 20 });
  local.data.settings.push({ key: 'workspace.active', value: { mode: 'study', location: 'Sweden' }, updatedAt: 10 });
  assert.deepEqual(mergeBackups(cloud, local).data.settings, [cloud.data.settings[0]]);
});

test('cloud merge includes review, language, UI, audio, game, and workspace settings', () => {
  const cloud = backup('cloud', 10); const local = backup('local', 20);
  for (const key of ['schedulerPreferences', 'languagePreferences', 'preference.darkMode', 'preference.audio', 'gamePreferences', 'workspace.paused.study']) {
    cloud.data.settings.push({ key, value: `cloud-${key}`, updatedAt: 20 }); local.data.settings.push({ key, value: `local-${key}`, updatedAt: 10 });
  }
  assert.deepEqual((mergeBackups(cloud, local).data.settings as Array<{ value: string }>).map(({ value }) => value), ['cloud-schedulerPreferences', 'cloud-languagePreferences', 'cloud-preference.darkMode', 'cloud-preference.audio', 'cloud-gamePreferences', 'cloud-workspace.paused.study']);
});

test('cloud merge keeps the most recently graded review across devices', () => {
  const cloud = backup('cloud', 10); const local = backup('local', 20);
  cloud.data.reviews.push({ id: 'pano', panoId: 'pano', dueAt: 30, lastReviewedAt: 20, gradingHistory: [{ grade: 'good', at: 20 }] });
  local.data.reviews.push({ id: 'pano', panoId: 'pano', dueAt: 15, lastReviewedAt: 10, gradingHistory: [{ grade: 'hard', at: 10 }] });
  assert.deepEqual(mergeBackups(cloud, local).data.reviews, [cloud.data.reviews[0]]);
});

test('token refresh does not trigger a visible full sync', () => {
  assert.equal(shouldSyncAuthEvent('TOKEN_REFRESHED', 'user-1', 'user-1'), false);
  assert.equal(shouldSyncAuthEvent('SIGNED_IN', 'user-1', 'user-1'), false);
  assert.equal(shouldSyncAuthEvent('SIGNED_IN', undefined, 'user-1'), true);
  assert.equal(shouldSyncAuthEvent('SIGNED_OUT', 'user-1'), true);
});

test('cloud backup keeps hosted paths without duplicating image bytes', () => {
  const clues = [{ id: 'hosted', imageDataUrl: 'data:image/jpeg;base64,AQ==', imagePath: 'user/hosted.jpg' }, { id: 'local', imageDataUrl: 'data:image/jpeg;base64,Ag==' }];
  assert.deepEqual(withoutEmbeddedHostedImages(clues as never), [{ ...clues[0], imageDataUrl: '' }, clues[1]]);
});

test('quiet sync coalesces a burst of local saves into one upload', async () => {
  let uploads = 0;
  const schedule = createQuietSyncScheduler(() => { uploads += 1; }, 10);
  schedule(); schedule(); schedule();
  await new Promise((resolve) => setTimeout(resolve, 25));
  assert.equal(uploads, 1);
});

test('cloud imports notify the live app without a page reload', () => {
  const target = new EventTarget(); let notifications = 0;
  target.addEventListener(CLOUD_IMPORT_EVENT, () => { notifications += 1; });
  announceCloudImport(target);
  assert.equal(notifications, 1);
});
