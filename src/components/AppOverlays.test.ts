import assert from 'node:assert/strict';
import test from 'node:test';
import { learningAnalysisAvailable } from './AppOverlays';

test('disabled Play analysis stays hidden until the round has a result', () => {
  assert.equal(learningAnalysisAvailable('play', false, false), false);
  assert.equal(learningAnalysisAvailable('play', false, true), true);
  assert.equal(learningAnalysisAvailable('play', true, false), true);
  assert.equal(learningAnalysisAvailable('review', false, false), true);
});
