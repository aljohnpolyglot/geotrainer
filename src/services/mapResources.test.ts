import test from 'node:test';
import assert from 'node:assert/strict';
import { acquireMap } from './mapResources';

test('new map surfaces start with their requested camera and release their own canvas', (t) => {
  class Element {
    style = {};
    parent: Element | null = null;
    append(child: Element) { child.parent = this; }
    remove() { this.parent = null; }
  }
  let nextFrame = 0;
  const frames = new Map<number, FrameRequestCallback>();
  const cleared: unknown[] = [];
  const resized: unknown[] = [];
  class FakeMap {
    constructor(public canvas: Element, public options: google.maps.MapOptions) {}
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
  const first = acquireMap('result', host(), { center: { lat: -24.96663, lng: 25.31814 }, zoom: 5 });
  const firstCanvas = (first.map as unknown as FakeMap).canvas;
  first.release();
  first.release();
  assert.equal(cleared.length, 1);
  assert.equal(firstCanvas.parent, null);
  assert.equal(frames.size, 0);
  const nextHost = host();
  const next = acquireMap('result', nextHost, { fullscreenControl: false, center: { lat: 40, lng: -73 }, zoom: 5 });
  assert.notEqual(next.map, first.map);
  assert.equal((next.map as unknown as FakeMap).canvas.parent, nextHost);
  assert.equal((next.map as unknown as FakeMap).options.fullscreenControl, false);
  assert.deepEqual((next.map as unknown as FakeMap).options.center, { lat: 40, lng: -73 });
  assert.equal((next.map as unknown as FakeMap).options.zoom, 5);
  for (const callback of frames.values()) callback(0);
  assert.deepEqual(resized, [next.map]);
  next.release();
  const guess = acquireMap('guess', host(), { center: { lat: 20, lng: 0 }, zoom: 1.5 });
  assert.notEqual(guess.map, next.map);
  assert.deepEqual((guess.map as unknown as FakeMap).options.center, { lat: 20, lng: 0 });
  assert.equal((guess.map as unknown as FakeMap).options.zoom, 1.5);
  guess.release();
  const nextGuess = acquireMap('guess', host(), { center: { lat: 20, lng: 0 }, zoom: 1.5 });
  assert.notEqual(nextGuess.map, guess.map);
  assert.deepEqual((nextGuess.map as unknown as FakeMap).options.center, { lat: 20, lng: 0 });
  assert.equal((nextGuess.map as unknown as FakeMap).options.zoom, 1.5);
  nextGuess.release();
});
