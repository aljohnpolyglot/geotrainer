import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewGuessHistory, reviewLocationDetails } from './ReviewResultPanel';
import { reviewSourceDisplayName } from '../services/language';

test('Review location details preserve available address parts and handle failed geocoding', () => {
  assert.deepEqual(reviewLocationDetails({ locality: 'Ibagué', adminArea: 'Tolima', route: 'Calle 10', formattedAddress: 'Calle 10, Ibagué, Tolima, Colombia' }, 'Unavailable'), {
    primaryArea: 'Ibagué, Tolima', route: 'Calle 10', address: 'Calle 10, Ibagué, Tolima, Colombia',
  });
  assert.deepEqual(reviewLocationDetails(null, 'Unavailable'), { primaryArea: '', route: '', address: 'Unavailable' });
});

test('Review map keeps every prior guess with coordinates', () => {
  const attempt = (id: string, lat: number | null, lng: number | null) => ({ id, guessedLat: lat, guessedLng: lng } as never);
  assert.deepEqual(reviewGuessHistory([attempt('a', 1, 2), attempt('b', null, null), attempt('c', 3, 4)]), [{ lat: 1, lng: 2 }, { lat: 3, lng: 4 }]);
});

test('Review source labels localize saved English sessions', () => {
  assert.equal(reviewSourceDisplayName('sv', 'Due Today'), 'Förfaller idag');
});
