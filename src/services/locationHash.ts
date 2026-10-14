export type HashableMapPoint = { lat: number; lng: number; panoId?: string };

const digest = async (value: string) => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), (byte) => byte.toString(16).padStart(2, '0')).join('');

export const panoramaHash = (panoId: string) => digest(`panorama:v1:${panoId}`);
export const sourcePointHash = (point: HashableMapPoint) => digest(`source-point:v1:${JSON.stringify([point.lat, point.lng, point.panoId || ''])}`);
