import assert from 'node:assert/strict';
import test from 'node:test';
import { callGeminiCoach, fetchStreetViewFrame, fetchStreetViewFrames, GeminiKeyCarousel, normalizeCoachAnalysis } from '../../server/aiCoach';

const validAnalysis = {
  confidence: 'medium', region: 'Central Europe',
  candidates: [{ countryCode: 'HU', confidence: .4 }],
  strongClues: ['Concrete utility poles'], weakClues: ['Generic vegetation'],
  confusions: ['Serbia'], nextThingsToInspect: ['Check road edge lines'], extraCards: [],
};

const geminiResponse = (text: string, status = 200) => new Response(status === 200 ? JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) : '', {
  status, headers: { 'content-type': 'application/json' },
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

test('card fronts remove countries, flags, and explicit broad regions', () => {
  const cards = normalizeCoachAnalysis({
    ...validAnalysis,
    coreCard: { front: ['Wet narrow road', 'Italy', 'Northern Europe', '🇮🇹 flag'], backExplanation: 'Italy fits.' },
  }, 'cards', 'Italy');
  assert.deepEqual(cards.coreCard?.front, ['Wet narrow road']);
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
