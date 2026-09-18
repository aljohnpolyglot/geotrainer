import assert from 'node:assert/strict';
import test from 'node:test';
import { reviewLocationDetails } from './ReviewResultPanel';

test('Review location details preserve available address parts and handle failed geocoding', () => {
  assert.deepEqual(reviewLocationDetails({ locality: 'Ibagué', adminArea: 'Tolima', route: 'Calle 10', formattedAddress: 'Calle 10, Ibagué, Tolima, Colombia' }, 'Unavailable'), {
    primaryArea: 'Ibagué, Tolima', route: 'Calle 10', address: 'Calle 10, Ibagué, Tolima, Colombia',
  });
  assert.deepEqual(reviewLocationDetails(null, 'Unavailable'), { primaryArea: '', route: '', address: 'Unavailable' });
});
