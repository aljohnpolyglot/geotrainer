let sameOriginAvailable: boolean | undefined;
const send = (url: string, body: string, signal?: AbortSignal, headers: Record<string, string> = {}) => fetch(url, { method: 'POST', signal, headers: { 'content-type': 'application/json', ...headers }, body });
export const isCoachResponse = (response: Response) => response.status !== 404 && response.headers.get('content-type')?.includes('application/json') === true;

export async function postCoach(value: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
  const body = JSON.stringify(value);
  const configured = import.meta.env.VITE_COACH_ENDPOINT as string | undefined;
  if (import.meta.env.DEV || configured) return send(configured || '/api/coach', body, signal);
  if (sameOriginAvailable !== false) {
    try {
      const response = await send('/api/coach', body, signal);
      if (isCoachResponse(response)) { sameOriginAvailable = true; return response; }
      sameOriginAvailable = false;
    } catch (error) { if (signal?.aborted) throw error; sameOriginAvailable = false; }
  }
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (url && publishableKey) {
    return send(`${url}/functions/v1/coach`, body, signal, { apikey: publishableKey });
  }
  return new Response(JSON.stringify({ error: 'AI Coach is unavailable.' }), { status: 503, headers: { 'content-type': 'application/json' } });
}
