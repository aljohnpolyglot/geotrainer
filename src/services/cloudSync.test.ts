import assert from 'node:assert/strict';
import test from 'node:test';
import { STORE_NAMES, type TrainerBackup } from '../data/trainerDb';
import { backupSignature, buildSyncReceipt, mergeBackups, retryCloud, savedContentCounts, savedContentDecreased, sessionNeedsRefresh, withoutEmbeddedHostedImages, withoutEmbeddedLocationImages } from './cloudSync';
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

test('saved-content invariant counts every clue and independent Notebook save', () => {
  const value = backup('local', 20);
  value.data.clues.push({ id: 'black-image', imageDataUrl: 'data:image/png;base64,AAAA' }, { id: 'second-image' });
  value.data.settings.push({ key: 'notebook.notes', value: [{ id: 'first' }, { id: 'second' }, { id: 'third' }] });
  assert.deepEqual(savedContentCounts(value), { clues: 2, notes: 3 });
  assert.equal(savedContentDecreased({ clues: 2, notes: 3 }, { clues: 1, notes: 3 }), true);
  assert.equal(savedContentDecreased({ clues: 2, notes: 3 }, { clues: 2, notes: 4 }), false);
});

test('cloud merge keeps the newest setting across screens', () => {
  const cloud = backup('cloud', 10); const local = backup('local', 20);
  cloud.data.settings.push({ key: 'workspace.active', value: { mode: 'study', location: 'Russia' }, updatedAt: 20 });
  local.data.settings.push({ key: 'workspace.active', value: { mode: 'study', location: 'Sweden' }, updatedAt: 10 });
  assert.deepEqual(mergeBackups(cloud, local).data.settings, [cloud.data.settings[0]]);
});

test('cloud merge unions Notebook and Coach histories instead of deleting one device records', () => {
  const cloud = backup('cloud', 10); const local = backup('local', 20);
  cloud.data.settings.push({ key: 'notebook.notes', value: [{ id: 'cloud-note', updatedAt: 10 }], updatedAt: 10 }, { key: 'coach.notes', value: [{ id: 'cloud-coach', generatedAt: 10 }], updatedAt: 10 });
  local.data.settings.push({ key: 'notebook.notes', value: [{ id: 'local-note', updatedAt: 20 }], updatedAt: 20 }, { key: 'coach.notes', value: [{ id: 'local-coach', generatedAt: 20 }], updatedAt: 20 });
  const settings = mergeBackups(cloud, local).data.settings as Array<{ key: string; value: Array<{ id: string }> }>;
  assert.deepEqual(settings.find(({ key }) => key === 'notebook.notes')?.value.map(({ id }) => id), ['local-note', 'cloud-note']);
  assert.deepEqual(settings.find(({ key }) => key === 'coach.notes')?.value.map(({ id }) => id), ['local-coach', 'cloud-coach']);
});

test('a newer Personal-note deletion marker is not resurrected by cloud merge', () => {
  const cloud = backup('cloud', 10); const local = backup('local', 20);
  cloud.data.settings.push({ key: 'notebook.notes', value: [{ id: 'note', text: 'old', updatedAt: 10 }], updatedAt: 10 });
  local.data.settings.push({ key: 'notebook.notes', value: [{ id: 'note', text: 'old', updatedAt: 10, deletedAt: 30 }], updatedAt: 30 });
  const note = (mergeBackups(cloud, local).data.settings[0] as { value: Array<{ deletedAt?: number }> }).value[0];
  assert.equal(note.deletedAt, 30);
});

test('cloud merge honors clue deletions and removes only obvious image duplicates', () => {
  const cloud = backup('cloud', 10); const local = backup('local', 20);
  const imageDataUrl = 'data:image/png;base64,SAME';
  cloud.data.clues.push({ id: 'deleted', imageDataUrl }, { id: 'blank', imageDataUrl, createdAt: 10, analysis: { description: '', strongClues: [] } });
  local.data.clues.push({ id: 'captioned', imageDataUrl, createdAt: 20, analysis: { description: 'Yellow center line', strongClues: [] } }, { id: 'different', imageDataUrl, createdAt: 30, analysis: { description: 'Black chevron', strongClues: [] } });
  local.data.settings.push({ key: 'clues.deleted', value: [{ id: 'deleted', deletedAt: 40 }], updatedAt: 40 });
  assert.deepEqual((mergeBackups(cloud, local).data.clues as Array<{ id: string }>).map(({ id }) => id), ['captioned', 'different']);
});

test('upload-side merge keeps Personal clues and Notebook notes from both origins', () => {
  const deployed = backup('deployed', 10); const localhost = backup('localhost', 20);
  deployed.data.clues.push({ id: 'wall-image', panoId: 'wall', createdAt: 10 });
  deployed.data.settings.push({ key: 'notebook.notes', value: [{ id: 'wall-note', panoId: 'wall', text: 'stone wall', updatedAt: 10 }], updatedAt: 10 });
  localhost.data.clues.push({ id: 'roof-image', panoId: 'roof', createdAt: 20 });
  localhost.data.settings.push({ key: 'notebook.notes', value: [{ id: 'roof-note', panoId: 'roof', text: 'slate roof', updatedAt: 20 }], updatedAt: 20 });
  const merged = mergeBackups(deployed, localhost);
  assert.deepEqual((merged.data.clues as Array<{ id: string }>).map(({ id }) => id), ['wall-image', 'roof-image']);
  assert.deepEqual((merged.data.settings[0] as { value: Array<{ id: string }> }).value.map(({ id }) => id), ['roof-note', 'wall-note']);
});

test('cloud merge preserves the first and later photo notes saved on one panorama', () => {
  const cloud = backup('cloud', 10); const local = backup('local', 20);
  cloud.data.clues.push({ id: 'first-image', panoId: 'one-pano', createdAt: 10, imageDataUrl: 'data:image/png;base64,AAAA' });
  cloud.data.settings.push({ key: 'notebook.notes', value: [{ id: 'first-note', panoId: 'one-pano', clueId: 'first-image', updatedAt: 10 }], updatedAt: 10 });
  local.data.clues.push({ id: 'second-image', panoId: 'one-pano', createdAt: 20 }, { id: 'third-image', panoId: 'one-pano', createdAt: 30 });
  local.data.settings.push({ key: 'notebook.notes', value: [{ id: 'second-note', panoId: 'one-pano', clueId: 'second-image', updatedAt: 20 }, { id: 'third-note', panoId: 'one-pano', clueId: 'third-image', updatedAt: 30 }], updatedAt: 30 });
  const merged = mergeBackups(cloud, local);
  assert.deepEqual((merged.data.clues as Array<{ id: string }>).map(({ id }) => id), ['first-image', 'second-image', 'third-image']);
  assert.deepEqual(((merged.data.settings as Array<{ key: string; value: Array<{ id: string }> }>).find(({ key }) => key === 'notebook.notes')?.value || []).map(({ id }) => id), ['third-note', 'second-note', 'first-note']);
});

test('cloud merge includes review, language, UI, audio, map, game, and workspace settings', () => {
  const cloud = backup('cloud', 10); const local = backup('local', 20);
  for (const key of ['schedulerPreferences', 'languagePreferences', 'preference.darkMode', 'preference.audio', 'mapPreferences', 'gamePreferences', 'workspace.paused.study']) {
    cloud.data.settings.push({ key, value: `cloud-${key}`, updatedAt: 20 }); local.data.settings.push({ key, value: `local-${key}`, updatedAt: 10 });
  }
  assert.deepEqual((mergeBackups(cloud, local).data.settings as Array<{ value: string }>).map(({ value }) => value), ['cloud-schedulerPreferences', 'cloud-languagePreferences', 'cloud-preference.darkMode', 'cloud-preference.audio', 'cloud-mapPreferences', 'cloud-gamePreferences', 'cloud-workspace.paused.study']);
});

test('cloud merge keeps the newest schedule and every grading event across devices', () => {
  const cloud = backup('cloud', 10); const local = backup('local', 20);
  const cloudReview = { id: 'pano', panoId: 'pano', dueAt: 30, intervalDays: 3, lastReviewedAt: 20, gradingHistory: [{ grade: 'good', at: 20 }], reviewCount: 1, lapseCount: 0 };
  cloud.data.reviews.push(cloudReview);
  local.data.reviews.push({ id: 'pano', panoId: 'pano', dueAt: 15, intervalDays: 1, lastReviewedAt: 10, gradingHistory: [{ grade: 'hard', at: 10 }], reviewCount: 1, lapseCount: 0 });
  assert.deepEqual(mergeBackups(cloud, local).data.reviews, [{ ...cloudReview, gradingHistory: [{ grade: 'hard', at: 10 }, { grade: 'good', at: 20 }], reviewCount: 2 }]);
});

test('manual device merge imports new cards and a review completed elsewhere', () => {
  const phone = backup('phone-card', 10); const pc = backup('pc-card', 20);
  phone.data.reviews.push({ id: 'shared', panoId: 'shared', dueAt: 500, intervalDays: 5, lastReviewedAt: 400, gradingHistory: [{ grade: 'good', at: 400 }], reviewCount: 2, lapseCount: 0 });
  pc.data.reviews.push({ id: 'shared', panoId: 'shared', dueAt: 200, intervalDays: 1, lastReviewedAt: 100, gradingHistory: [{ grade: 'hard', at: 100 }], reviewCount: 1, lapseCount: 0 });
  const merged = mergeBackups(phone, pc);
  assert.deepEqual((merged.data.attempts as Array<{ id: string }>).map(({ id }) => id), ['phone-card', 'pc-card']);
  assert.deepEqual(merged.data.reviews, [{ ...(phone.data.reviews[0] as Record<string, unknown>), gradingHistory: [{ grade: 'hard', at: 100 }, { grade: 'good', at: 400 }] }]);
  assert.deepEqual(buildSyncReceipt(phone, pc, merged), { downloadedRecords: 2, deviceRecords: 2, mergedRecords: 3, addedToDevice: 1, reviewSchedulesUpdated: 1, reviewEvents: 2 });
});

test('a device that loses a concurrent write remerges the winning backup before retrying', () => {
  const original = backup('original', 1); const phone = backup('phone', 2); const pc = backup('pc', 3);
  const phoneUpload = mergeBackups(original, phone);
  const pcRetry = mergeBackups(phoneUpload, pc);
  assert.deepEqual((pcRetry.data.attempts as Array<{ id: string }>).map(({ id }) => id), ['original', 'phone', 'pc']);
});

test('cloud merge keeps the newest independent generalization state', () => {
  const cloud = backup('cloud', 10); const local = backup('local', 20);
  cloud.data.reviews.push({ id: 'pano', panoId: 'pano', dueAt: 30, intervalDays: 3, lastReviewedAt: 30, gradingHistory: [], reviewCount: 1, lapseCount: 0, generalizationLevel: 1, generalizationUpdatedAt: 10 });
  local.data.reviews.push({ id: 'pano', panoId: 'pano', dueAt: 20, intervalDays: 1, lastReviewedAt: 20, gradingHistory: [], reviewCount: 1, lapseCount: 0, generalizationLevel: 4, generalizationUpdatedAt: 40 });
  const merged = mergeBackups(cloud, local).data.reviews[0] as { dueAt: number; generalizationLevel: number };
  assert.equal(merged.dueAt, 30);
  assert.equal(merged.generalizationLevel, 4);
});

test('cloud backup keeps hosted paths without duplicating image bytes', () => {
  const clues = [{ id: 'hosted', imageDataUrl: 'data:image/jpeg;base64,AQ==', imagePath: 'user/hosted.jpg' }, { id: 'local', imageDataUrl: 'data:image/jpeg;base64,Ag==' }];
  assert.deepEqual(withoutEmbeddedHostedImages(clues as never), [{ ...clues[0], imageDataUrl: '' }, clues[1]]);
});

test('cloud backup keeps location metadata without duplicating panorama screenshots', () => {
  assert.deepEqual(withoutEmbeddedLocationImages([{ id: 'pano', imageDataUrl: 'data:image/jpeg;base64,AQ==', countryCode: 'IE' }]), [{ id: 'pano', countryCode: 'IE' }]);
});

test('cloud requests retry transient failures before surfacing them', async () => {
  let calls = 0;
  const result = await retryCloud(async () => ({ error: ++calls < 2 ? new Error('temporary') : null, data: 'ok' }), 2);
  assert.equal(calls, 2); assert.equal(result.data, 'ok');
});

test('cloud sync skips unchanged backup writes', () => {
  const original = backup('same', 10); const reexported = backup('same', 10);
  reexported.exportedAt = 'later';
  assert.equal(backupSignature(original), backupSignature(reexported));
});

test('manual sync refreshes auth only when its saved session is nearly expired', () => {
  assert.equal(sessionNeedsRefresh({ expires_at: 1_100 }, 1_000_000), false);
  assert.equal(sessionNeedsRefresh({ expires_at: 1_050 }, 1_000_000), true);
});

test('cloud imports notify the live app without a page reload', () => {
  const target = new EventTarget(); let notifications = 0;
  target.addEventListener(CLOUD_IMPORT_EVENT, () => { notifications += 1; });
  announceCloudImport(target);
  assert.equal(notifications, 1);
});
