import assert from 'node:assert/strict';
import test from 'node:test';
import { countryBorderColor, countryBorderWeight, mapPresentationOptions, normalizeMapPreferences, resultMapZoomLimit } from './mapPreferences';

test('map preferences use safe defaults and normalize persisted choices', () => {
  assert.deepEqual(normalizeMapPreferences(undefined), {
    showImageryDate: false, showRoadLabels: false, motionTracking: false, movementStyle: 'click',
    mapType: 'roadmap', mapPalette: 'auto', resultMapZoom: 'country', gestureHandling: 'auto', clickableIcons: false, showCountryBorders: true, showRegionBorders: false, countryBorderWidth: 'thin', countryBorderColor: 'auto',
  });
  assert.deepEqual(normalizeMapPreferences({ showRoadLabels: true, motionTracking: true, movementStyle: 'arrows', mapType: 'terrain', gestureHandling: 'cooperative', clickableIcons: true, geotrainerMapStyle: false }), {
    showImageryDate: false, showRoadLabels: true, motionTracking: true, movementStyle: 'arrows',
    mapType: 'terrain', mapPalette: 'auto', resultMapZoom: 'country', gestureHandling: 'cooperative', clickableIcons: true, showCountryBorders: true, showRegionBorders: false, countryBorderWidth: 'thin', countryBorderColor: 'auto',
  });
  const preferences = normalizeMapPreferences({ mapPalette: 'dark' });
  const light = mapPresentationOptions(normalizeMapPreferences({ mapPalette: 'light' }), true);
  assert.deepEqual(mapPresentationOptions(preferences, false).styles, mapPresentationOptions(normalizeMapPreferences({ mapPalette: 'auto' }), true).styles);
  assert.deepEqual(light.styles, mapPresentationOptions(normalizeMapPreferences({ mapPalette: 'auto' }), false).styles);
  assert.deepEqual(light.styles?.[0], { elementType: 'geometry', stylers: [{ color: '#f3f1e8' }] });
  assert.deepEqual(mapPresentationOptions(normalizeMapPreferences({ geotrainerMapStyle: false, mapPalette: 'light' }), true).styles, light.styles);
  assert.equal('mapId' in light, false);
  assert.deepEqual(light.styles?.at(-2), { featureType: 'administrative.province', elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] });
  assert.deepEqual(light.styles?.at(-1), { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ visibility: 'on' }, { color: '#526c79' }, { weight: 0.35 }] });
  assert.deepEqual(mapPresentationOptions(normalizeMapPreferences({ showCountryBorders: false }), false).styles?.at(-1), { featureType: 'administrative.country', elementType: 'geometry.stroke', stylers: [{ visibility: 'off' }] });
});

test('result map zoom presets cap the revealed result view', () => {
  assert.equal(resultMapZoomLimit('closest'), 14);
  assert.equal(resultMapZoomLimit('country'), 5);
  assert.equal(resultMapZoomLimit('region'), 7);
  assert.equal(resultMapZoomLimit('world'), 2);
  assert.equal(normalizeMapPreferences({ resultMapZoom: 'region' }).resultMapZoom, 'region');
  assert.equal(countryBorderWeight('thin'), .35);
  assert.equal(countryBorderWeight('standard'), .75);
  assert.equal(countryBorderWeight('bold'), 1.25);
  assert.equal(countryBorderColor('accent'), '#4d9cff');
  assert.equal(countryBorderColor('auto', true), '#8fb5c4');
});
