import assert from 'node:assert/strict';
import test from 'node:test';
import { BUILT_IN_COLLECTIONS } from '../data/collections';
import { normalizeStudySetup } from './studySetup';

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
