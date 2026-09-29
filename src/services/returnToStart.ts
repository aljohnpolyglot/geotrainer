import { calculateDistanceKm } from './gameLogic';

type Point = { lat: number; lng: number };
export const startDirection = (start: Point, position: Point, heading: number) => {
  const radians = Math.PI / 180;
  const delta = (start.lng - position.lng) * radians;
  const from = position.lat * radians; const to = start.lat * radians;
  const bearing = Math.atan2(Math.sin(delta) * Math.cos(to), Math.cos(from) * Math.sin(to) - Math.sin(from) * Math.cos(to) * Math.cos(delta)) / radians;
  return { meters: Math.round(calculateDistanceKm(position.lat, position.lng, start.lat, start.lng) * 1000), angle: ((bearing - heading) % 360 + 360) % 360 };
};

export function returnToStart(panorama: Pick<google.maps.StreetViewPanorama, 'setPano'> | null, startPanoId: string | undefined, canMove: boolean) {
  if (panorama && startPanoId && canMove) panorama.setPano(startPanoId);
}
