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

export const panoramaCaptureHeadings = (heading: number) => [0, 90, 180, 270].map((offset) => (heading + offset + 360) % 360);

const captureView = async (view: StreetViewSnapshot) => {
  const response = await postCoach({ mode: 'capture', view });
  const value = await response.json() as { imageDataUrl?: string; error?: string };
  if (!response.ok || !value.imageDataUrl) throw new Error(value.error || 'Could not capture Street View.');
  return value.imageDataUrl;
};

export async function captureStreetViewImage(panoId: string): Promise<string | undefined> {
  const view = getStreetViewSnapshot(panoId);
  if (!view) return;
  try { return await captureView(view); } catch { return; }
}

export async function captureStreetView360(panoId: string): Promise<Blob> {
  const view = getStreetViewSnapshot(panoId);
  if (!view) throw new Error('Street View is still loading.');
  const sources = await Promise.all(panoramaCaptureHeadings(view.heading).map((heading) => captureView({ ...view, heading, pitch: 0, zoom: 1 })));
  const images = await Promise.all(sources.map(async (src) => { const image = new Image(); image.src = src; await image.decode(); return image; }));
  const canvas = document.createElement('canvas'); canvas.width = images.reduce((width, image) => width + image.naturalWidth, 0); canvas.height = Math.max(...images.map((image) => image.naturalHeight));
  const context = canvas.getContext('2d'); if (!context) throw new Error('Could not create the 360° image.');
  let x = 0; images.forEach((image) => { context.drawImage(image, x, 0); x += image.naturalWidth; });
  return new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Could not create the 360° image.')), 'image/png'));
}
import { postCoach } from './coachClient';
