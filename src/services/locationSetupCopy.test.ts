import assert from 'node:assert/strict';
import test from 'node:test';
import { LANGUAGE_OPTIONS, translate } from './language';
import { LOCATION_SETUP_COPY } from './locationSetupCopy';

test('pool labels and lookup failure copy are translated cleanly in every supported locale', () => {
  for (const { code } of LANGUAGE_OPTIONS) for (const [key, localized] of Object.entries(LOCATION_SETUP_COPY)) {
    assert.ok(localized[code]);
    assert.equal(translate(code, key), localized[code]);
    assert.doesNotMatch(localized[code], /\\u[0-9a-f]{4}|00[eEfF][0-9a-f]|\uFFFD|Ã|Â/);
  }
});
