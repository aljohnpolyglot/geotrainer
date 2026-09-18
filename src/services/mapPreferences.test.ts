import assert from 'node:assert/strict';
import test from 'node:test';
import { mapPresentationOptions, normalizeMapPreferences } from './mapPreferences';

test('map preferences use safe defaults and normalize persisted choices', () => {
  assert.deepEqual(normalizeMapPreferences(undefined), {
    showImageryDate: false, showRoadLabels: false, motionTracking: false, movementStyle: 'click',
    mapType: 'roadmap', mapPalette: 'auto', gestureHandling: 'auto', clickableIcons: false, showCountryBorders: true,
  });
  assert.deepEqual(normalizeMapPreferences({ showRoadLabels: true, motionTracking: true, movementStyle: 'arrows', mapType: 'terrain', gestureHandling: 'cooperative', clickableIcons: true, geotrainerMapStyle: false }), {
    showImageryDate: false, showRoadLabels: true, motionTracking: true, movementStyle: 'arrows',
    mapType: 'terrain', mapPalette: 'auto', gestureHandling: 'cooperative', clickableIcons: true, showCountryBorders: true,
  });
  const preferences = normalizeMapPreferences({ mapPalette: 'dark' });
  const light = mapPresentationOptions(normalizeMapPreferences({ mapPalette: 'light' }), true);
  assert.deepEqual(mapPresentationOptions(preferences, false).styles, mapPresentationOptions(normalizeMapPreferences({ mapPalette: 'auto' }), true).styles);
  assert.deepEqual(light.styles, mapPresentationOptions(normalizeMapPreferences({ mapPalette: 'auto' }), false).styles);
  assert.deepEqual(light.styles?.[0], { elementType: 'geometry', stylers: [{ color: '#f3f1e8' }] });
  assert.deepEqual(mapPresentationOptions(normalizeMapPreferences({ geotrainerMapStyle: false, mapPalette: 'light' }), true).styles, light.styles);
  assert.equal('mapId' in light, false);
  assert.deepEqual(light.styles?.at(-1), { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ visibility: 'on' }, { color: '#526c79' }, { weight: 1.5 }] });
  assert.deepEqual(mapPresentationOptions(normalizeMapPreferences({ showCountryBorders: false }), false).styles?.at(-1), { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] });
});
