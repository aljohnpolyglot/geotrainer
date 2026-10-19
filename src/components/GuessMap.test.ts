import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { LANGUAGE_OPTIONS, translate } from '../services/language';
import { expandedGuessMapRect } from './GuessMap';

test('enlarged guess map stays floating on desktop and inside a mobile viewport', () => {
  assert.deepEqual(expandedGuessMapRect({ left: 0, top: 0, right: 1920, bottom: 900 }, false, 'enlarge'),
    { left: 1236, top: 328, width: 672, height: 560 });
  assert.deepEqual(expandedGuessMapRect({ left: 0, top: 20, right: 390, bottom: 820 }, true, 'enlarge'),
    { left: 12, top: 448, width: 366, height: 360 });
  assert.deepEqual(expandedGuessMapRect({ left: 0, top: 20, right: 390, bottom: 820 }, true, 'fullscreen'),
    { left: 0, top: 20, width: 390, height: 800 });
});

test('hover enlargement covers a dragged compact map and stays inside the viewport', () => {
  const bounds = { left: 0, top: 0, right: 1920, bottom: 900 };
  for (const anchor of [{ left: 30, top: 20, width: 352, height: 256 }, { left: 900, top: 480, width: 352, height: 256 }, { left: 1548, top: 624, width: 352, height: 256 }]) {
    const expanded = expandedGuessMapRect(bounds, false, 'enlarge', anchor);
    assert.ok(expanded.left <= anchor.left && expanded.top <= anchor.top);
    assert.ok(expanded.left + expanded.width >= anchor.left + anchor.width);
    assert.ok(expanded.top + expanded.height >= anchor.top + anchor.height);
    assert.ok(expanded.left >= bounds.left && expanded.top >= bounds.top);
    assert.ok(expanded.left + expanded.width <= bounds.right && expanded.top + expanded.height <= bounds.bottom);
  }
});

test('hover map setting and instructions are localized in every supported guide', () => {
  const label = 'Enlarge guess map on hover';
  const description = 'Move the mouse over the guess map to enlarge it in Play and Review. Move away to shrink it.';
  for (const { code } of LANGUAGE_OPTIONS) {
    assert.ok(readFileSync(new URL(`../content/home/${code}.md`, import.meta.url), 'utf8').includes(translate(code, label)));
    if (code !== 'en') {
      assert.notEqual(translate(code, label), label);
      assert.notEqual(translate(code, description), description);
    }
  }
});
