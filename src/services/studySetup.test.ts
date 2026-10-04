import assert from 'node:assert/strict';
import test from 'node:test';
import { BUILT_IN_COLLECTIONS } from '../data/collections';
import { canStartMetaLesson, normalizeStudySetup } from './studySetup';

test('Meta Start is enabled only after choosing an unfinished lesson in an available course', () => {
  assert.equal(canStartMetaLesson(true, 8, 10, 'SE-lesson-9'), true);
  assert.equal(canStartMetaLesson(true, 8, 10), false);
  assert.equal(canStartMetaLesson(true, 10, 10, 'SE-lesson-9'), false);
  assert.equal(canStartMetaLesson(null, 8, 10, 'SE-lesson-9'), false);
  assert.equal(canStartMetaLesson(true, 0, 0, 'SE-lesson-9'), false);
});

test('reopening setup never presents a temporary Germany pool as World', () => {
  const collections = [...BUILT_IN_COLLECTIONS, { id: 'focus:DE', name: 'Germany', countryCodes: ['DE'] }];
  const setup = normalizeStudySetup({ collectionId: 'focus:DE', countryCodes: ['DE'], locationTargets: [] }, collections);
  assert.equal(setup.collectionId, 'world');
  assert.equal(setup.countryCodes, undefined);
  assert.equal(setup.locationTargets, undefined);
  assert.ok(collections.find((item) => item.id === setup.collectionId)!.countryCodes.length > 200);
  const custom = { id: 'my-pool', name: 'My pool', countryCodes: ['DE', 'FR'], isCustom: true };
  const valid = { collectionId: custom.id, countryCodes: ['FR'] };
  assert.equal(normalizeStudySetup(valid, [...collections, custom]), valid);
});
