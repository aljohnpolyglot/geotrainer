import countryCatalog from '../../../src/data/countryCatalog.json' with { type: 'json' };

type KeyState = { key: string; cooldownUntil: number };
type PlaceCandidate = { key: string; countryCode: string; name: string; kind: 'region' | 'city' };
const allowedOrigins = (Deno.env.get('COACH_ALLOWED_ORIGINS') || 'http://localhost:3000,https://aljohnpolyglot.github.io').split(',');
const keys: KeyState[] = [...new Set((Deno.env.get('GEMINI_API_KEYS') || Deno.env.get('GEMINI_API_KEY') || '').split(',').map((key) => key.trim()).filter(Boolean))].map((key) => ({ key, cooldownUntil: 0 }));
let cursor = keys.length ? Math.floor(Math.random() * keys.length) : 0;
const countries = Object.entries(countryCatalog).map(([code, item]) => `${code}=${item.name}`).join(', ');
const poolSchema = { type: 'OBJECT', properties: {
  countryCodes: { type: 'ARRAY', items: { type: 'STRING' } }, placeMode: { type: 'STRING', enum: ['none', 'regions', 'cities'] }, placeSelection: { type: 'STRING', enum: ['all', 'representative', 'league', 'capital'] }, environment: { type: 'STRING', enum: ['mixed', 'urban', 'suburban', 'rural'] }, urbanLevel: { type: 'STRING', enum: ['1', '2', '3'] }, samplingMode: { type: 'STRING', enum: ['natural', 'balanced'] }, priority: { type: 'STRING', enum: ['random', 'familiar', 'least-exposure'] }, panoramaSource: { type: 'STRING', enum: ['official', 'mixed', 'contributor'] }, allowInteriors: { type: 'BOOLEAN' },
}, required: ['countryCodes', 'placeMode', 'placeSelection', 'environment', 'urbanLevel', 'samplingMode', 'priority', 'panoramaSource', 'allowInteriors'] };
const placesSchema = { type: 'OBJECT', properties: { regionKeys: { type: 'ARRAY', items: { type: 'STRING' } }, cityKeys: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['regionKeys', 'cityKeys'] };

function cors(origin: string | null) {
  const allowed = origin && allowedOrigins.includes(origin) ? origin : allowedOrigins[0];
  return { 'access-control-allow-origin': allowed, 'access-control-allow-headers': 'authorization, apikey, content-type', 'access-control-allow-methods': 'POST, OPTIONS', vary: 'Origin' };
}
const json = (body: unknown, status: number, origin: string | null) => new Response(JSON.stringify(body), { status, headers: { ...cors(origin), 'content-type': 'application/json' } });
const pick = <T extends string>(value: unknown, allowed: readonly T[], fallback: T) => allowed.includes(value as T) ? value as T : fallback;
function normalizePool(value: unknown) {
  if (!value || typeof value !== 'object') throw new Error('Gemini returned malformed JSON.');
  const source = value as Record<string, unknown>;
  const countryCodes = [...new Set(Array.isArray(source.countryCodes) ? source.countryCodes.map(String).map((code) => code.toUpperCase()).filter((code) => code in countryCatalog) : [])].slice(0, 40);
  if (!countryCodes.length) throw new Error('Gemini returned no valid countries.');
  return { countryCodes, placeMode: pick(source.placeMode, ['none', 'regions', 'cities'], 'none'), placeSelection: pick(source.placeSelection, ['all', 'representative', 'league', 'capital'], 'all'), environment: pick(source.environment, ['mixed', 'urban', 'suburban', 'rural'], 'mixed'), urbanLevel: [1, 2, 3].includes(Number(source.urbanLevel)) ? Number(source.urbanLevel) : 3, samplingMode: pick(source.samplingMode, ['natural', 'balanced'], 'natural'), priority: pick(source.priority, ['random', 'familiar', 'least-exposure'], 'random'), panoramaSource: pick(source.panoramaSource, ['official', 'mixed', 'contributor'], 'official'), allowInteriors: source.allowInteriors === true };
}
async function askGemini(prompt: string, schema: unknown, maxOutputTokens: number) {
  if (!keys.length) throw new Error('Gemini keys are not configured.');
  let last = new Error('AI Map Maker is unavailable.');
  for (const model of (Deno.env.get('GEMINI_POOL_MODELS') || 'gemini-2.5-flash').split(',').map((item) => item.trim()).filter(Boolean)) for (let attempt = 0; attempt < keys.length; attempt++) {
    const state = keys[cursor++ % keys.length]; if (state.cooldownUntil > Date.now()) continue;
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, { method: 'POST', signal: AbortSignal.timeout(25_000), headers: { 'content-type': 'application/json', 'x-goog-api-key': state.key }, body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: { temperature: 0, maxOutputTokens, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: 'application/json', responseSchema: schema } }) });
      if (response.status === 429) { state.cooldownUntil = Date.now() + 60_000; last = new Error('Gemini quota exceeded.'); continue; }
      if (!response.ok) { last = new Error(response.status >= 500 ? 'Gemini service error.' : `Gemini request was rejected (${response.status}).`); continue; }
      const raw = await response.json(); const text = raw.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => part.text)?.text;
      if (!text) throw new Error('Gemini returned an empty response.');
      return JSON.parse(text);
    } catch (error) { last = error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError') ? new Error('Gemini request timed out.') : error as Error; }
  }
  throw last;
}
async function createPool(description: string) {
  const prompt = `Choose countries and editable search settings for this GeoTrainer request in any language: ${JSON.stringify(description)}. Preserve explicit inclusions and exclusions. Comparisons and shared themes include every matching country. Geography overrides shared language; do not add related places unless requested. Set placeMode=cities for cities, capitals, architecture focused on named municipalities, or sports-team home cities; regions for coasts, landscapes, farms, deserts, or subnational themes; otherwise none. Set placeSelection=league for a named sports league, capital for capitals, representative for a broad city theme, and all for explicit named places or region themes. Architecture and city streets are urban; suburbs suburban; farms, countryside, wilderness, and broad nature rural; otherwise mixed. Use urbanLevel 1 for capitals/major cities, 2 for regional cities, 3 otherwise. Balanced, priority, contributor imagery, mixed imagery, and interiors require explicit intent; default to natural, random, official, and outdoors. Allowed countries: ${countries}`;
  return normalizePool(await askGemini(prompt, poolSchema, 900));
}
async function createPlaces(description: string, selection: string, candidates: PlaceCandidate[]) {
  const clean = candidates.filter((item) => /^[rc]:[A-Za-z0-9.:-]+$/.test(item.key) && item.countryCode in countryCatalog && item.name.trim()).map((item) => ({ ...item, name: item.name.trim().slice(0, 120) }));
  const allowed = new Set(clean.map((item) => item.key));
  const rulebook = clean.map((item) => `${item.key}=${item.countryCode}:${item.name}`).join('\n');
  const value = await askGemini(`Selection mode is ${selection}. Select local rulebook entries that directly satisfy ${JSON.stringify(description)}. Return keys only and never invent one. League mode gets exactly the unique home municipalities of current teams. Capital mode gets one current capital per country. Representative mode has a hard maximum of three strongest cities per country. Region requests get every matching region with no selection ceiling.\n${rulebook}`, placesSchema, 6000) as { regionKeys?: unknown; cityKeys?: unknown };
  const selected = (input: unknown, prefix: string) => [...new Set(Array.isArray(input) ? input.map(String).filter((key) => key.startsWith(prefix) && allowed.has(key)) : [])];
  const regionKeys = selected(value.regionKeys, 'r:'); const cityKeys = selected(value.cityKeys, 'c:');
  if (selection !== 'representative') return { regionKeys, cityKeys };
  const counts = new Map<string, number>();
  return { regionKeys, cityKeys: cityKeys.filter((key) => { const code = clean.find((item) => item.key === key)?.countryCode || ''; const count = counts.get(code) || 0; counts.set(code, count + 1); return count < 3; }) };
}

Deno.serve(async (request) => {
  const origin = request.headers.get('origin');
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405, origin);
  try {
    const value = await request.json() as Record<string, unknown>; if (JSON.stringify(value).length > 2_000_000) throw new Error('Pool request is too large.');
    const description = typeof value.description === 'string' ? value.description.trim().slice(0, 500) : ''; if (description.length < 3) throw new Error('Describe what you want to learn.');
    if (value.mode === 'pool') return json({ pool: await createPool(description) }, 200, origin);
    if (value.mode === 'pool-places') {
      const selection = ['all', 'representative', 'league', 'capital'].includes(String(value.selection)) ? String(value.selection) : 'all';
      const candidates: PlaceCandidate[] = Array.isArray(value.candidates) ? value.candidates.flatMap((candidate) => { const item = candidate && typeof candidate === 'object' ? candidate as Record<string, unknown> : {}; const kind = item.kind === 'region' || item.kind === 'city' ? item.kind : undefined; const key = String(item.key || ''); const countryCode = String(item.countryCode || '').toUpperCase(); const name = String(item.name || ''); return kind && key && name && countryCode in countryCatalog ? [{ key, countryCode, name, kind }] : []; }) : [];
      return json({ places: await createPlaces(description, selection, candidates) }, 200, origin);
    }
    throw new Error('Invalid pool request.');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'AI Map Maker is unavailable.';
    return json({ error: message }, /timed out/i.test(message) ? 504 : /quota|cooling/i.test(message) ? 429 : 503, origin);
  }
});
