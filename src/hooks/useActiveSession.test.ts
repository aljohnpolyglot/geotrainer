import assert from 'node:assert/strict';
import test from 'node:test';
import type { TrainingSession } from '../types';
import { addActiveElapsed } from './useActiveSession';

test('active session timing counts visible work without counting pauses or a backward clock', () => {
  const session: TrainingSession = { id: 'session', startedAt: 1_000, activeTimeSeconds: 4 };
  assert.equal(addActiveElapsed(session, 2_000, 7_000), 5);
  assert.equal(addActiveElapsed(session, null, 12_000), 0);
  assert.equal(addActiveElapsed(session, 15_000, 14_000), 0);
  assert.equal(session.activeTimeSeconds, 9);
});
