import assert from 'node:assert/strict';
import test from 'node:test';
import { orderOpenGuessrDuels } from './order-openguessr-duels.mjs';

test('orders personal standard scores while retaining multiplied points and opponent status', () => {
  const ordered = orderOpenGuessrDuels({ name: 'My OpenGuessr duels', games: [
    { matchNumber: 1, rounds: [
      { round: 1, lat: 1, lng: 2, myScore: 3000, opponentScore: 1000, status: 'won' },
      { round: 4, lat: 3, lng: 4, panoId: 'nearby-pano', panoIdSource: 'coordinate lookup', myScore: 3000, opponentScore: 6000, status: 'lost' },
    ] },
  ], locations: [] });
  assert.deepEqual(ordered.locations.map(point => [point.round, point.myScore, point.myBaseScore, point.status]), [
    [4, 3000, 2000, 'lost'], [1, 3000, 3000, 'won'],
  ]);
  assert.equal(ordered.locations[0].multiplier, 1.5);
  assert.equal(ordered.locations[0].panoId, 'nearby-pano');
  assert.equal(ordered.reviewOrder.length, 2);
  assert.throws(() => orderOpenGuessrDuels({ name: 'wrong', games: [] }), /Duel exporter/);
});
