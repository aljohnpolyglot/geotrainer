import { supabase } from './supabase';

export async function postCoach(body: Record<string, unknown>, signal?: AbortSignal): Promise<Response> {
  const session = supabase ? (await supabase.auth.getSession()).data.session : null;
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  if (session && url && publishableKey) {
    return fetch(`${url}/functions/v1/coach`, {
      method: 'POST', signal,
      headers: { 'content-type': 'application/json', apikey: publishableKey, authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify(body),
    });
  }
  if (import.meta.env.DEV) return fetch('/api/coach', { method: 'POST', signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify(body) });
  return new Response(JSON.stringify({ error: 'Sign in to use AI Coach on the deployed app.' }), { status: 401, headers: { 'content-type': 'application/json' } });
}
