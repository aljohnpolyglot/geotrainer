export type StreetViewSnapshot = {
  panoId: string;
  heading: number;
  pitch: number;
  zoom: number;
};

let current: StreetViewSnapshot | null = null;

export const setStreetViewSnapshot = (snapshot: StreetViewSnapshot) => { current = snapshot; };
export const getStreetViewSnapshot = (panoId: string) => current?.panoId === panoId ? current : null;

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
