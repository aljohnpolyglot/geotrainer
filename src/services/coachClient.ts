export async function postCoach(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (url && publishableKey) {
    return fetch(`${url}/functions/v1/coach`, {
      method: 'POST', signal,
      headers: { 'content-type': 'application/json', apikey: publishableKey },
      body: JSON.stringify(body),
    });
  }
  if (import.meta.env.DEV) return fetch('/api/coach', { method: 'POST', signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return new Response(JSON.stringify({ error: 'AI Coach is unavailable.' }), { status: 503, headers: { 'content-type': 'application/json' } });
}
