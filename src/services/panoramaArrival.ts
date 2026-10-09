import { calculateDistanceKm } from './gameLogic';

type Target = { panoId: string; lat: number; lng: number };

export const hasVisiblePixels = (pixels: Uint8ClampedArray) => {
  let visible = 0;
  for (let index = 0; index < pixels.length; index += 4) if (pixels[index + 3] && Math.max(pixels[index], pixels[index + 1], pixels[index + 2]) > 8) visible++;
  return visible >= Math.max(4, pixels.length / 120);
};

export function panoramaImageVisible(container: HTMLElement) {
  const scene = container.querySelector('canvas');
  if (!scene) return [...container.querySelectorAll<HTMLImageElement>('img[src*="googleusercontent.com"]')].some((image) => image.complete && image.naturalWidth >= 256 && image.naturalHeight >= 128);
  const probe = document.createElement('canvas'); probe.width = 24; probe.height = 14;
  const context = probe.getContext('2d');
  if (!context) return false;
  try { context.drawImage(scene, 0, 0, probe.width, probe.height); return hasVisiblePixels(context.getImageData(0, 0, probe.width, probe.height).data); }
  catch { return false; }
}

// A successful lookup is not proof that the visible Street View has arrived.
export function observePanoramaArrival(panorama: google.maps.StreetViewPanorama, target: Target, onReady: () => void, imageVisible = () => true) {
  let finished = false;
  const listeners: google.maps.MapsEventListener[] = [];
  let interval: ReturnType<typeof setInterval>;
  const stop = () => { finished = true; clearInterval(interval); listeners.forEach((listener) => listener.remove()); };
  const check = () => {
    if (finished || panorama.getStatus() !== 'OK' || panorama.getPano() !== target.panoId) return;
    const point = panorama.getPosition();
    if (!point || !(calculateDistanceKm(target.lat, target.lng, point.lat(), point.lng()) <= 10)) return;
    if (!imageVisible()) return;
    stop();
    onReady();
  };
  for (const event of ['status_changed', 'pano_changed', 'position_changed']) listeners.push(panorama.addListener(event, check));
  interval = setInterval(check, 250);
  check();
  return stop;
}
