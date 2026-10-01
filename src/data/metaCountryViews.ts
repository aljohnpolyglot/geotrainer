export interface MetaMapView {
  panoId: string;
  lat: number;
  lng: number;
  heading: number;
  pitch: number;
}

export const needsMetaMapFallback = (lessonPanoId: string | undefined, displayedPanoId: string) => !lessonPanoId || lessonPanoId !== displayedPanoId;

const number = '(-?\\d+(?:\\.\\d+)?)';
const atPattern = new RegExp(`/maps/@${number},${number},[^/]*`);
const googleHost = /(^|\.)google\.(?:com|[a-z]{2}|(?:com|co)\.[a-z]{2})$/;

export function viewFromGoogleMapsUrl(value: string): MetaMapView | null {
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (!googleHost.test(url.hostname.toLowerCase())) return null;

  let panoId = url.searchParams.get('pano');
  let lat: number;
  let lng: number;
  let heading: number;
  let pitch: number;
  if (panoId && url.searchParams.has('viewpoint')) {
    const viewpoint = (url.searchParams.get('viewpoint') || '').split(',').map(Number);
    [lat, lng] = viewpoint;
    heading = Number(url.searchParams.get('heading') || 0);
    pitch = Number(url.searchParams.get('pitch') || 0);
  } else {
    const matched = url.pathname.match(atPattern);
    const pano = url.pathname.match(/!1s([^!/?]+)/);
    if (!matched || !pano) return null;
    try { panoId = decodeURIComponent(pano[1]); } catch { return null; }
    lat = Number(matched[1]);
    lng = Number(matched[2]);
    const headingMatch = matched[0].match(/(-?\d+(?:\.\d+)?)h(?:,|$)/);
    const tiltMatch = matched[0].match(/(-?\d+(?:\.\d+)?)t(?:,|$)/);
    heading = headingMatch ? Number(headingMatch[1]) : 0;
    pitch = tiltMatch ? 90 - Number(tiltMatch[1]) : 0;
  }
  if (!panoId || !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180
    || !Number.isFinite(heading) || !Number.isFinite(pitch)) return null;
  return { panoId, lat, lng, heading: ((heading % 360) + 360) % 360, pitch: Math.max(-90, Math.min(90, pitch)) };
}

const loads = new Map<string, Promise<Map<string, MetaMapView>>>();

function normalizeSidecar(code: string, value: unknown): Map<string, MetaMapView> {
  const output = new Map<string, MetaMapView>();
  if (!value || typeof value !== 'object' || (value as { code?: unknown }).code !== code
    || !Array.isArray((value as { views?: unknown }).views)) return output;
  for (const item of (value as { views: unknown[] }).views) {
    if (!item || typeof item !== 'object') continue;
    const row = item as { id?: unknown } & Partial<MetaMapView>;
    if (typeof row.id !== 'string' || !row.id.startsWith(`${code}-`) || output.has(row.id)
      || typeof row.panoId !== 'string' || !row.panoId
      || typeof row.lat !== 'number' || !Number.isFinite(row.lat) || Math.abs(row.lat) > 90
      || typeof row.lng !== 'number' || !Number.isFinite(row.lng) || Math.abs(row.lng) > 180
      || typeof row.heading !== 'number' || !Number.isFinite(row.heading)
      || typeof row.pitch !== 'number' || !Number.isFinite(row.pitch)) continue;
    output.set(row.id, { panoId: row.panoId, lat: row.lat, lng: row.lng,
      heading: ((row.heading % 360) + 360) % 360, pitch: Math.max(-90, Math.min(90, row.pitch)) });
  }
  return output;
}

export function loadMetaCountryViews(code: string): Promise<Map<string, MetaMapView>> {
  if (!/^[A-Z]{2}$/.test(code)) return Promise.resolve(new Map());
  let loaded = loads.get(code);
  if (!loaded) {
    const base = import.meta.env?.BASE_URL || '/';
    loaded = fetch(`${base}meta-courses/views/manifest.json`)
      .then((response) => response.ok ? response.json() : null)
      .then((value: unknown) => {
        const countries = value && typeof value === 'object' ? (value as { countries?: unknown }).countries : null;
        if (!Array.isArray(countries)) return null;
        return countries.find((item) => item && typeof item === 'object' && (item as { code?: unknown }).code === code) as { file?: unknown } | undefined;
      })
      .then((entry) => {
        if (!entry || typeof entry.file !== 'string' || !/^[A-Z]{2}\.json$/.test(entry.file)) return new Map();
        return fetch(`${base}meta-courses/views/${entry.file}`)
          .then((response) => response.ok ? response.json() : null)
          .then((value) => normalizeSidecar(code, value));
      })
      .catch(() => new Map());
    loads.set(code, loaded);
  }
  return loaded;
}
