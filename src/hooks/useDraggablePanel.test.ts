import assert from 'node:assert/strict';
import test from 'node:test';
import { clampPanelOffset, movePanelRect, resizePanelRect } from './useDraggablePanel';

test('dragging stays inside every viewport edge', () => {
  const bounds = { left: 100, top: 80, right: 400, bottom: 280 };
  assert.deepEqual(clampPanelOffset({ x: 0, y: 0 }, { x: -500, y: -500 }, bounds, { x: 800, y: 600 }), { x: -100, y: -80 });
  assert.deepEqual(clampPanelOffset({ x: 0, y: 0 }, { x: 900, y: 900 }, bounds, { x: 800, y: 600 }), { x: 400, y: 320 });
});

test('resizing anchors the opposite edge and stays inside the viewport', () => {
  const panel = { left: 100, top: 80, width: 300, height: 360 }; const limits = { left: 12, top: 64, right: 988, bottom: 688 }; const minimum = { width: 280, height: 320 };
  assert.deepEqual(resizePanelRect(panel, { x: 70, y: 0 }, 'w', limits, minimum), { left: 120, top: 80, width: 280, height: 360 });
  assert.deepEqual(resizePanelRect(panel, { x: 0, y: 70 }, 'n', limits, minimum), { left: 100, top: 120, width: 300, height: 320 });
  assert.deepEqual(resizePanelRect(panel, { x: 900, y: 900 }, 'se', limits, minimum), { left: 100, top: 80, width: 888, height: 608 });
  assert.deepEqual(movePanelRect(panel, { x: -500, y: -500 }, limits), { left: 12, top: 64, width: 300, height: 360 });
});
