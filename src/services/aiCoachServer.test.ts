import assert from 'node:assert/strict';
import test from 'node:test';
import { callGeminiCoach, decodeCoachText, fetchStreetViewFrame, fetchStreetViewFrames, GeminiKeyCarousel, loadGeminiKeys, normalizeCoachAnalysis, sanitizeCoachContext } from '../../server/aiCoach';
import { getCountryKnowledge } from '../../server/geoguessrKnowledge';

const validAnalysis = {
  confidence: 'medium', region: 'Central Europe',
  candidates: [{ countryCode: 'HU', confidence: .4 }],
  strongClues: ['Concrete utility poles'], weakClues: ['Generic vegetation'],
  confusions: ['Serbia'], nextThingsToInspect: ['Check road edge lines'], extraCards: [],
};

const geminiResponse = (text: string, status = 200) => new Response(status === 200 ? JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) : '', {
  status, headers: { 'content-type': 'application/json' },
});

test('Coach decodes escaped Unicode before rendering localized evidence', () => {
  assert.equal(decodeCoachText('La strada \\u00e8 stretta.'), 'La strada è stretta.');
});

test('Gemini carousel cools down a 429 key and fails over without exposing it', async () => {
  const carousel = new GeminiKeyCarousel(['first-secret', 'second-secret']);
  const used: string[] = [];
  const fetcher = (async (_url: string | URL | Request, init?: RequestInit) => {
    used.push((init?.headers as Record<string, string>)['x-goog-api-key']);
    return used.length === 1 ? geminiResponse('', 429) : geminiResponse(JSON.stringify(validAnalysis));
  }) as typeof fetch;
  const result = await callGeminiCoach(carousel, { mode: 'analyze', mimeType: 'image/jpeg', imageData: 'YWJj' }, fetcher);
  assert.equal(result.analysis.region, 'Central Europe');
  assert.equal(used.length, 2);
  assert.notEqual(used[0], used[1]);
});

test('Coach accepts only server-side Gemini key names', () => {
  assert.deepEqual(loadGeminiKeys({ VITE_API_KEYS: 'browser-visible', GEMINI_KEYS_FILE: 'Z:\\missing-geotrainer-keys.json' }), []);
});

test('malformed Gemini JSON retries and Hints strips geographic answers', async () => {
  const carousel = new GeminiKeyCarousel(['one', 'two']);
  let calls = 0;
  const fetcher = (async () => ++calls === 1 ? geminiResponse('{bad') : geminiResponse(JSON.stringify(validAnalysis))) as typeof fetch;
  await callGeminiCoach(carousel, { mode: 'analyze', mimeType: 'image/png', imageData: 'YWJj' }, fetcher);
  assert.equal(calls, 2);

  const hints = normalizeCoachAnalysis({ ...validAnalysis, nextThingsToInspect: ['Italy is likely', 'Inspect the bollards'] }, 'hints');
  assert.deepEqual(hints.candidates, []);
  assert.deepEqual(hints.nextThingsToInspect, ['Inspect the bollards']);
});

test('Coach removes answer leaks and non-visual metadata claims', () => {
  const cards = normalizeCoachAnalysis({
    ...validAnalysis,
    strongClues: ['Location metadata states Italy', 'Concrete utility poles'],
    contradictions: ['Coordinates contradict the scene', 'No expected road edge line is visible'],
    coreCard: { front: ['Wet narrow road', 'Italy', 'Northern Europe', '🇮🇹 flag', '41.9028° N, 12.4964° E'], backExplanation: 'Italy fits.' },
  }, 'cards', 'Italy');
  assert.deepEqual(cards.coreCard?.front, ['Wet narrow road']);
  assert.deepEqual(cards.strongClues, ['Concrete utility poles']);
  assert.deepEqual(cards.contradictions, ['No expected road edge line is visible']);
});

test('Coach downgrades unsupported high confidence and keeps contradictions spoiler-safe', () => {
  const analysis = normalizeCoachAnalysis({
    ...validAnalysis,
    confidence: 'high',
    candidates: [{ countryCode: 'HU', confidence: .4 }],
    contradictions: ['No visible country-specific sign'],
  }, 'analyze');
  assert.equal(analysis.confidence, 'medium');
  const safe = normalizeCoachAnalysis({ ...analysis, contradictions: ['Hungary is missing'] }, 'clue-safe');
  assert.deepEqual(safe.contradictions, []);
});

test('clue analysis ranks countries while safe Review clues cannot reveal one', () => {
  const clue = normalizeCoachAnalysis({ ...validAnalysis, description: 'A road marker used in Hungary' }, 'clue');
  assert.equal(clue.candidates[0].countryCode, 'HU');
  const safeClue = normalizeCoachAnalysis({ ...validAnalysis, description: 'A road marker used in Hungary', strongClues: ['Common in Hungary', 'Black rectangular reflector'] }, 'clue-safe');
  assert.equal(safeClue.description, undefined);
  assert.deepEqual(safeClue.candidates, []);
  assert.deepEqual(safeClue.strongClues, ['Black rectangular reflector']);
});

test('candidate confidence is deduplicated, ranked, and never exceeds a total of one', () => {
  const analysis = normalizeCoachAnalysis({
    ...validAnalysis,
    candidates: [{ countryCode: 'de', confidence: .7 }, { countryCode: 'HU', confidence: .9 }, { countryCode: 'hu', confidence: .4 }],
  }, 'analyze');
  assert.deepEqual(analysis.candidates.map(({ countryCode }) => countryCode), ['HU', 'DE']);
  assert.ok(Math.abs(analysis.candidates.reduce((sum, candidate) => sum + candidate.confidence, 0) - 1) < Number.EPSILON);
});

test('candidate normalization drops codes outside the supported country catalog', () => {
  const analysis = normalizeCoachAnalysis({ ...validAnalysis, candidates: [{ countryCode: 'HU', confidence: .8 }, { countryCode: 'ZZ', confidence: .99 }] }, 'analyze');
  assert.deepEqual(analysis.candidates.map(({ countryCode }) => countryCode), ['HU']);
});

test('automatic Coach capture requests the exact pano and current orientation without storing imagery', async () => {
  let requested = '';
  const fetcher = (async (url: string | URL | Request) => {
    requested = String(url);
    return new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { 'content-type': 'image/jpeg' } });
  }) as typeof fetch;
  const frame = await fetchStreetViewFrame({ panoId: 'pano-exact', heading: 212, pitch: -4, zoom: 1 }, 'maps-key', fetcher);
  assert.match(requested, /pano=pano-exact/);
  assert.match(requested, /heading=212/);
  assert.equal(frame.imageData, 'AQID');
});

test('automatic Coach capture fails promptly when Street View does not respond', async () => {
  const fetcher = ((_url: string | URL | Request, init?: RequestInit) => new Promise<Response>((_resolve, reject) => {
    init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
  })) as typeof fetch;
  await assert.rejects(() => fetchStreetViewFrame({ panoId: 'pano-timeout', heading: 0, pitch: 0, zoom: 1 }, 'maps-key', fetcher, 1), /capture timed out/i);
});

test('360 Coach capture requests four quarter-turn views of the same panorama', async () => {
  const requested: string[] = [];
  const fetcher = (async (url: string | URL | Request) => { requested.push(String(url)); return new Response(new Uint8Array([1]), { headers: { 'content-type': 'image/jpeg' } }); }) as typeof fetch;
  await fetchStreetViewFrames({ panoId: 'pano-360', heading: 15, pitch: 0, zoom: 3 }, 'maps-key', fetcher);
  assert.deepEqual(requested.map((url) => new URL(url).searchParams.get('heading')), ['15', '105', '195', '285']);
  assert.ok(requested.every((url) => url.includes('pano=pano-360') && url.includes('fov=90')));
});

test('360 Coach sends all views in one low-latency Gemini request', async () => {
  let body: Record<string, any> = {};
  const fetcher = (async (_url: string | URL | Request, init?: RequestInit) => { body = JSON.parse(String(init?.body)); return geminiResponse(JSON.stringify(validAnalysis)); }) as typeof fetch;
  const frames = [1, 2, 3, 4].map((value) => ({ mimeType: 'image/jpeg', imageData: String(value) }));
  await callGeminiCoach(new GeminiKeyCarousel(['one']), { mode: 'analyze360', ...frames[0], frames }, fetcher);
  assert.equal(body.contents[0].parts.filter((part: Record<string, unknown>) => part.inlineData).length, 4);
  assert.equal(body.generationConfig.thinkingConfig.thinkingBudget, 0);
});

test('revealed Coach retrieves a bounded country knowledge pack without leaking it before reveal', async () => {
  assert.ok(getCountryKnowledge('Albania', 6).some((hint) => hint.type === 'bollards'));
  assert.equal(getCountryKnowledge('The Netherlands', 20).length, 12);

  const prompts: string[] = [];
  const fetcher = (async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    prompts.push(body.contents[0].parts[0].text);
    return geminiResponse(JSON.stringify(validAnalysis));
  }) as typeof fetch;
  await callGeminiCoach(new GeminiKeyCarousel(['one']), { mode: 'explain', mimeType: 'image/jpeg', imageData: 'YWJj', context: { actualCountry: 'Albania' } }, fetcher);
  await callGeminiCoach(new GeminiKeyCarousel(['one']), { mode: 'analyze', mimeType: 'image/jpeg', imageData: 'YWJj', context: { actualCountry: 'Albania' } }, fetcher);
  assert.match(prompts[0], /Retrieved GeoGuessr reference facts/);
  assert.doesNotMatch(prompts[1], /Retrieved GeoGuessr reference facts|Albania/);
});

test('Coach bounds user context before inserting it into a prompt', () => {
  const context = sanitizeCoachContext({ actualCountry: 'A'.repeat(500), ignored: 'secret', previousAttempts: Array.from({ length: 20 }, (_, score) => ({ guessedCountry: 'B'.repeat(500), score })) });
  assert.equal(String(context?.actualCountry).length, 120);
  assert.equal((context?.previousAttempts as unknown[]).length, 5);
  assert.equal('ignored' in context!, false);
});
