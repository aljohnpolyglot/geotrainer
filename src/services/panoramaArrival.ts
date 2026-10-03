import { calculateDistanceKm } from './gameLogic';

type Target = { panoId: string; lat: number; lng: number };

// A successful lookup is not proof that the visible Street View has arrived.
export function observePanoramaArrival(panorama: google.maps.StreetViewPanorama, target: Target, onReady: () => void) {
  let finished = false;
  const listeners: google.maps.MapsEventListener[] = [];
  const stop = () => { finished = true; listeners.forEach((listener) => listener.remove()); };
  const check = () => {
    if (finished || panorama.getStatus() !== 'OK' || panorama.getPano() !== target.panoId) return;
    const point = panorama.getPosition();
    if (!point || !(calculateDistanceKm(target.lat, target.lng, point.lat(), point.lng()) <= 10)) return;
    stop();
    onReady();
  };
  for (const event of ['status_changed', 'pano_changed', 'position_changed']) listeners.push(panorama.addListener(event, check));
  check();
  return stop;
}
