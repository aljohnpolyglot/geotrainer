import assert from 'node:assert/strict';
import test from 'node:test';
import { coachIsRevealed, learningAnalysisAvailable } from './AppOverlays';

test('disabled Play analysis stays hidden until the round has a result', () => {
  assert.equal(learningAnalysisAvailable('play', false, false), false);
  assert.equal(learningAnalysisAvailable('play', false, true), true);
  assert.equal(learningAnalysisAvailable('play', true, false), true);
  assert.equal(learningAnalysisAvailable('review', false, false), true);
});

test('Coach explains finished Play rounds opened from game history', () => {
  assert.equal(coachIsRevealed('review', false, false, true), true);
  assert.equal(coachIsRevealed('review', false, false, false), false);
});
