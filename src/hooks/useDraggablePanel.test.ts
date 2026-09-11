import assert from 'node:assert/strict';
import test from 'node:test';
import { clampPanelOffset } from './useDraggablePanel';

test('dragging stays inside every viewport edge', () => {
  const bounds = { left: 100, top: 80, right: 400, bottom: 280 };
  assert.deepEqual(clampPanelOffset({ x: 0, y: 0 }, { x: -500, y: -500 }, bounds, { x: 800, y: 600 }), { x: -100, y: -80 });
  assert.deepEqual(clampPanelOffset({ x: 0, y: 0 }, { x: 900, y: 900 }, bounds, { x: 800, y: 600 }), { x: 400, y: 320 });
});
