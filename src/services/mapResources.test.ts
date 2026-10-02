import test from 'node:test';
import assert from 'node:assert/strict';
import { acquireMap } from './mapResources';

test('maps reuse their canvas across modes, isolate active panels, and cancel stale resize work', (t) => {
  class Element {
    style = {};
    parent: Element | null = null;
    append(child: Element) { child.parent = this; }
    remove() { this.parent = null; }
  }
  let created = 0;
  let nextFrame = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const cleared: unknown[] = [];
  const resized: unknown[] = [];
  class FakeMap {
    constructor(public canvas: Element, public options: google.maps.MapOptions) { created++; }
    getDiv() { return this.canvas; }
    setOptions(options: google.maps.MapOptions) { this.options = options; }
  }
  const globals = ['requestAnimationFrame', 'cancelAnimationFrame', 'document', 'google'];
  const descriptors = globals.map((key) => Object.getOwnPropertyDescriptor(globalThis, key));
  t.after(() => globals.forEach((key, index) => {
    const descriptor = descriptors[index];
    if (descriptor) Object.defineProperty(globalThis, key, descriptor);
    else Reflect.deleteProperty(globalThis, key);
  }));
  Object.defineProperty(globalThis, 'requestAnimationFrame', { configurable: true, value: (callback: FrameRequestCallback) => { frames.set(++nextFrame, callback); return nextFrame; } });
  Object.defineProperty(globalThis, 'cancelAnimationFrame', { configurable: true, value: (id: number) => { frames.delete(id); } });
  Object.defineProperty(globalThis, 'document', { configurable: true, value: { createElement: () => new Element() } });
  Object.defineProperty(globalThis, 'google', { configurable: true, value: { maps: { Map: FakeMap, event: {
    clearInstanceListeners: (map: unknown) => cleared.push(map),
    trigger: (map: unknown) => resized.push(map),
  } } } });
  const host = () => new Element() as unknown as HTMLElement;
  const first = acquireMap('result', host(), { fullscreenControl: true });
  const simultaneous = acquireMap('result', host(), {});
  assert.notEqual(first.map, simultaneous.map);
  first.release();
  first.release();
  assert.equal(cleared.length, 1);
  assert.equal(frames.size, 1);
  const nextHost = host();
  const next = acquireMap('result', nextHost, { fullscreenControl: false });
  assert.equal(next.map, first.map);
  assert.equal(created, 2);
  assert.equal((next.map as unknown as FakeMap).canvas.parent, nextHost);
  assert.equal((next.map as unknown as FakeMap).options.fullscreenControl, false);
  for (const callback of frames.values()) callback(0);
  assert.deepEqual(resized, [simultaneous.map, next.map]);
  simultaneous.release();
  next.release();
  const guess = acquireMap('guess', host(), { center: { lat: 20, lng: 0 }, zoom: 1.5 });
  assert.notEqual(guess.map, next.map);
  guess.release();
});
