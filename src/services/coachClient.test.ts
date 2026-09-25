import assert from 'node:assert/strict';
import test from 'node:test';
import { isCoachResponse } from './coachClient';

test('production Coach accepts a same-origin JSON API and rejects a static-host fallback page', () => {
  assert.equal(isCoachResponse(new Response('{}', { headers: { 'content-type': 'application/json' } })), true);
  assert.equal(isCoachResponse(new Response('<html>', { headers: { 'content-type': 'text/html' } })), false);
  assert.equal(isCoachResponse(new Response('{}', { status: 404, headers: { 'content-type': 'application/json' } })), false);
});
