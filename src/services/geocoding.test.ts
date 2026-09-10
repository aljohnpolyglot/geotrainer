import assert from 'node:assert/strict';
import test from 'node:test';
import { getFlagCdnUrl } from './geocoding';

test('flag URLs use the resolved ISO country code', () => {
  assert.equal(getFlagCdnUrl('AL', 40), 'https://flagcdn.com/w40/al.png');
  assert.equal(getFlagCdnUrl('MA', 80), 'https://flagcdn.com/w80/ma.png');
  assert.equal(getFlagCdnUrl('AX', 40), 'https://flagcdn.com/w40/ax.png');
});
