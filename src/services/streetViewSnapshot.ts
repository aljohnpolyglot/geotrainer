export type StreetViewSnapshot = {
  locationPanoId?: string;
  panoId: string;
  heading: number;
  pitch: number;
  zoom: number;
};

const snapshots = new Map<string, StreetViewSnapshot>();

export const setStreetViewSnapshot = (snapshot: StreetViewSnapshot) => {
  snapshots.set(snapshot.panoId, snapshot);
  if (snapshot.locationPanoId) snapshots.set(snapshot.locationPanoId, snapshot);
};
export const getStreetViewSnapshot = (panoId: string) => snapshots.get(panoId) || null;

export async function captureStreetViewImage(panoId: string): Promise<string | undefined> {
  const view = getStreetViewSnapshot(panoId);
  if (!view) return;
  try {
    const response = await postCoach({ mode: 'capture', view });
    const value = await response.json() as { imageDataUrl?: string };
    return response.ok ? value.imageDataUrl : undefined;
  } catch { return; }
}
import { postCoach } from './coachClient';
