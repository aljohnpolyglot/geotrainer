import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeMapPreferences } from './mapPreferences';

test('map preferences use safe defaults and normalize persisted choices', () => {
  assert.deepEqual(normalizeMapPreferences(undefined), {
    showImageryDate: false, showRoadLabels: false, motionTracking: false, movementStyle: 'click',
    mapType: 'roadmap', gestureHandling: 'auto', clickableIcons: false, geotrainerMapStyle: true,
  });
  assert.deepEqual(normalizeMapPreferences({ showRoadLabels: true, motionTracking: true, movementStyle: 'arrows', mapType: 'terrain', gestureHandling: 'cooperative', clickableIcons: true, geotrainerMapStyle: false }), {
    showImageryDate: false, showRoadLabels: true, motionTracking: true, movementStyle: 'arrows',
    mapType: 'terrain', gestureHandling: 'cooperative', clickableIcons: true, geotrainerMapStyle: false,
  });
});
