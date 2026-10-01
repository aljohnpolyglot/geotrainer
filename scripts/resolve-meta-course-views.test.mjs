import assert from 'node:assert/strict';
import test from 'node:test';
import { viewFromGoogleMapsUrl } from './resolve-meta-course-views.mjs';

test('Google Maps clue links preserve the exact panorama and camera view', () => {
  assert.deepEqual(viewFromGoogleMapsUrl('https://www.google.com/maps/@-23.6472253,24.7278454,3a,89.7y,193.88h,77.11t/data=!3m6!1e1!3m4!1sWiSQDwoE9rS_VG_mIQKFfw!2e0'), {
    panoId: 'WiSQDwoE9rS_VG_mIQKFfw', lat: -23.6472253, lng: 24.7278454, heading: 193.88, pitch: 12.89,
  });
  assert.deepEqual(viewFromGoogleMapsUrl('https://www.google.com/maps/@?api=1&map_action=pano&pano=-dNPkjNBUxphP_46z4kmJQ&viewpoint=34.646087,-118.059372&heading=301.6030503396188&pitch=4.172471834744286&fov=17.5'), {
    panoId: '-dNPkjNBUxphP_46z4kmJQ', lat: 34.646087, lng: -118.059372, heading: 301.6030503396188, pitch: 4.172471834744286,
  });
  assert.equal(viewFromGoogleMapsUrl('https://example.com/maps/@0,0,3a,90y,0h,90t/data=!1sbad'), null);
});
