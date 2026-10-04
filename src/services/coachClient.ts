import { getCoachApiKey, getCoachProviderSettings } from './coachByok';
import { hydrateCoachProviderSettings } from './coachByok';
import { trainerDb } from '../data/trainerDb';

let sameOriginAvailable: boolean | undefined;
let poolSameOriginAvailable: boolean | undefined;
const send = (url: string, body: string, signal?: AbortSignal, headers: Record<string, string> = {}) => fetch(url, { method: 'POST', signal, cache: 'no-store', headers: { 'content-type': 'application/json', ...headers }, body });
export const isCoachResponse = (response: Response) => response.status !== 404 && response.headers.get('content-type')?.includes('application/json') === true;

export async function postCoach(value: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
  if (value.mode !== 'capture') hydrateCoachProviderSettings(await trainerDb.setting('coachProvider'));
  const provider = getCoachProviderSettings();
  const credential = value.mode === 'capture' ? '' : getCoachApiKey();
  const body = JSON.stringify({ ...value, ...(value.mode === 'capture' ? {} : { provider: provider.provider, model: provider.model, endpoint: provider.endpoint }) });
  const headers = credential ? { 'x-coach-provider-key': credential } : {};
  const configured = import.meta.env.VITE_COACH_ENDPOINT as string | undefined;
  if (import.meta.env.DEV || configured) return send(configured || '/api/coach', body, signal, headers);
  const staticGithubPages = typeof location !== 'undefined' && location.hostname.endsWith('.github.io');
  if (!staticGithubPages && sameOriginAvailable !== false) {
    try {
      const response = await send('/api/coach', body, signal, headers);
      if (isCoachResponse(response)) { sameOriginAvailable = true; return response; }
      sameOriginAvailable = false;
    } catch (error) { if (signal?.aborted) throw error; sameOriginAvailable = false; }
  }
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (url && publishableKey) {
    return send(`${url}/functions/v1/coach`, body, signal, { apikey: publishableKey, ...headers });
  }
  return new Response(JSON.stringify({ error: 'AI Coach is unavailable.' }), { status: 503, headers: { 'content-type': 'application/json' } });
}

export async function postPool(value: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
  const body = JSON.stringify(value);
  const configured = import.meta.env.VITE_COACH_ENDPOINT as string | undefined;
  const endpoint = configured?.replace(/\/coach\/?$/, '/pool');
  if (import.meta.env.DEV) return send(endpoint || '/api/pool', body, signal);
  if (endpoint) {
    try {
      const response = await send(endpoint, body, signal);
      if (isCoachResponse(response)) return response;
    } catch (error) { if (signal?.aborted) throw error; }
  }
  if (poolSameOriginAvailable !== false) {
    try {
      const response = await send('/api/pool', body, signal);
      if (isCoachResponse(response)) { poolSameOriginAvailable = true; return response; }
      poolSameOriginAvailable = false;
    } catch (error) { if (signal?.aborted) throw error; poolSameOriginAvailable = false; }
  }
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (url && publishableKey) {
    try { return await send(`${url}/functions/v1/pool`, body, signal, { apikey: publishableKey }); }
    catch (error) { if (signal?.aborted) throw error; }
  }
  return new Response(JSON.stringify({ error: 'AI Map Maker is unavailable.' }), { status: 503, headers: { 'content-type': 'application/json' } });
}
