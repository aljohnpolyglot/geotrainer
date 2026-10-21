import assert from 'node:assert/strict';
import test from 'node:test';
import type { ActiveWorkspace } from '../types';
import { workspacePlayElapsed } from './workspaceLocation';

test('small Play clock checkpoints restore only the matching round without losing newer elapsed time', () => {
  const workspace = { mode: 'play', gameId: 'game', currentRoundIndex: 2, roundElapsedSeconds: 10, timeRemaining: null, settings: { timeLimitSeconds: 0 } } as Extract<ActiveWorkspace, { mode: 'play' }>;
  const clock = { gameId: 'game', roundIndex: 2, elapsedSeconds: 90 };
  assert.equal(workspacePlayElapsed(workspace, clock), 90);
  assert.equal(workspacePlayElapsed(workspace, { ...clock, gameId: 'old' }), 10);
  assert.equal(workspacePlayElapsed(workspace, { ...clock, roundIndex: 1 }), 10);
  for (const elapsedSeconds of [5, -1, NaN, Infinity]) assert.equal(workspacePlayElapsed(workspace, { ...clock, elapsedSeconds }), 10);
  assert.equal(workspacePlayElapsed(workspace), 10);
  assert.equal(workspacePlayElapsed({ ...workspace, roundElapsedSeconds: undefined, timeRemaining: 40, settings: { ...workspace.settings, timeLimitSeconds: 60 } }, { ...clock, elapsedSeconds: 25 }), 25);
});
