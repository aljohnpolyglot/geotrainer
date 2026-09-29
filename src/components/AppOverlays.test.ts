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
  assert.equal(coachIsRevealed('play', true, false, false, false, false), false);
  assert.equal(coachIsRevealed('play', true, false, false, false, true), true);
  assert.equal(coachIsRevealed('play', false, false, true, false, true), false);
  assert.equal(coachIsRevealed('review', false, false, true, false), true);
  assert.equal(coachIsRevealed('review', false, false, false, false), false);
  assert.equal(coachIsRevealed('review', false, false, true, true), false);
  assert.equal(coachIsRevealed('review', false, true, true, true), true);
});

test('Review Coach analyzes minimized answers and explains restored results', () => {
  assert.equal(coachIsRevealed('review', false, false, true, true, true, false), false);
  assert.equal(coachIsRevealed('review', false, true, true, true, true, false), false);
  assert.equal(coachIsRevealed('review', false, true, true, true, true, true), true);
});
