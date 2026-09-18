import assert from 'node:assert/strict';
import test from 'node:test';
import { mapPresentationOptions, normalizeMapPreferences } from './mapPreferences';

test('map preferences use safe defaults and normalize persisted choices', () => {
  assert.deepEqual(normalizeMapPreferences(undefined), {
    showImageryDate: false, showRoadLabels: false, motionTracking: false, movementStyle: 'click',
    mapType: 'roadmap', mapPalette: 'auto', gestureHandling: 'auto', clickableIcons: false, geotrainerMapStyle: true,
  });
  assert.deepEqual(normalizeMapPreferences({ showRoadLabels: true, motionTracking: true, movementStyle: 'arrows', mapType: 'terrain', gestureHandling: 'cooperative', clickableIcons: true, geotrainerMapStyle: false }), {
    showImageryDate: false, showRoadLabels: true, motionTracking: true, movementStyle: 'arrows',
    mapType: 'terrain', mapPalette: 'auto', gestureHandling: 'cooperative', clickableIcons: true, geotrainerMapStyle: false,
  });
  const preferences = normalizeMapPreferences({ mapPalette: 'dark' });
  assert.deepEqual(mapPresentationOptions(preferences, false).styles, mapPresentationOptions(normalizeMapPreferences({ mapPalette: 'auto' }), true).styles);
  assert.notDeepEqual(mapPresentationOptions(normalizeMapPreferences({ mapPalette: 'light' }), true).styles, mapPresentationOptions(preferences, true).styles);
});
