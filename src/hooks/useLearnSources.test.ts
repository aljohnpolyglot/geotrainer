import assert from 'node:assert/strict';
import test from 'node:test';
import { coverageReturnOrigin } from './useLearnSources';

test('coverage navigation returns to the exact uploaded source point without moving its history', () => {
  const first = { panoId: 'source-1', countryCode: 'BR', lat: -7, lng: -48, importedMapPointIndex: 0 };
  const second = { panoId: 'source-2', countryCode: 'BR', lat: -8, lng: -49, importedMapPointIndex: 105 };
  const history = { locations: [first, second], index: 1 };
  assert.equal(coverageReturnOrigin('uploaded', first, history), second);
  assert.equal(history.index, 1);
  assert.equal(coverageReturnOrigin('meta', first, history), first);
  assert.equal(coverageReturnOrigin('custom', first, history), first);
  assert.equal(coverageReturnOrigin('map', first, history), undefined);
  assert.equal(coverageReturnOrigin('uploaded', first, { locations: [], index: -1 }), undefined);
});
