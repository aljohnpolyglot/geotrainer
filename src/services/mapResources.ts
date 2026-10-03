type MapSurface = 'guess' | 'result' | 'explore' | 'coverage' | 'summary' | 'preview';

// Start each surface with its own camera. Google's browser tile cache remains
// available without carrying a previous round's live viewport into this one.
export function acquireMap(_surface: MapSurface, host: HTMLElement, options: google.maps.MapOptions) {
  const canvas = document.createElement('div');
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  host.append(canvas);
  const map = new google.maps.Map(canvas, options);
  const frame = requestAnimationFrame(() => google.maps.event.trigger(map, 'resize'));
  let released = false;
  return {
    map,
    // Callers detach their own markers, lines, and coverage layers first.
    release() {
      if (released) return;
      released = true;
      cancelAnimationFrame(frame);
      google.maps.event.clearInstanceListeners(map);
      canvas.remove();
    },
  };
}
