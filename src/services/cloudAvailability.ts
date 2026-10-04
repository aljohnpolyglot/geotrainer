export type CloudAvailability = 'available' | 'unavailable';

export async function checkCloudAvailability(
  url: string | undefined,
  publishableKey: string | undefined,
  signal?: AbortSignal,
  request: typeof fetch = fetch,
): Promise<CloudAvailability> {
  if (!url || !publishableKey) return 'unavailable';
  try {
    const response = await request(new URL('/auth/v1/health', url), {
      headers: { apikey: publishableKey }, signal,
    });
    return response.ok ? 'available' : 'unavailable';
  } catch {
    return 'unavailable';
  }
}

export function isCloudUnavailableError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const failure = error as { status?: unknown; message?: unknown; code?: unknown };
  return failure.status === 402 || failure.code === 'exceed_egress_quota'
    || (typeof failure.message === 'string' && /exceed_egress_quota|service for this project is restricted/i.test(failure.message));
}
