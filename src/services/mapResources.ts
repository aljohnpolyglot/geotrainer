type MapSurface = 'guess' | 'result' | 'explore' | 'coverage' | 'summary' | 'preview';
const idleMaps = new Map<MapSurface, google.maps.Map>();

// Retain at most one idle map per surface, shared by every mode. Tiles stay
// under Google's browser cache; this only retains the live map and its DOM.
export function acquireMap(surface: MapSurface, host: HTMLElement, options: google.maps.MapOptions) {
  let map = idleMaps.get(surface);
  idleMaps.delete(surface);
  if (map) {
    host.append(map.getDiv());
    map.setOptions(options);
  } else {
    const canvas = document.createElement('div');
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    host.append(canvas);
    map = new google.maps.Map(canvas, options);
  }
  const current = map;
  const frame = requestAnimationFrame(() => google.maps.event.trigger(current, 'resize'));
  let released = false;
  return {
    map: current,
    // Callers detach their own markers, lines, and coverage layers first.
    release() {
      if (released) return;
      released = true;
      cancelAnimationFrame(frame);
      google.maps.event.clearInstanceListeners(current);
      current.getDiv().remove();
      idleMaps.set(surface, current);
    },
  };
}
