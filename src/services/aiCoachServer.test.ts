import assert from 'node:assert/strict';
import test from 'node:test';
import { buildCoachPrompt, callGeminiCoach, coachLanguageMatches, coachRationalesAreSpecific, decodeCoachText, fetchStreetViewFrame, fetchStreetViewFrames, GeminiKeyCarousel, loadGeminiKeys, normalizeCoachAnalysis, sanitizeCoachContext } from '../../server/aiCoach';
import { getCountryKnowledge, getCountryMetaKnowledge } from '../../server/geoguessrKnowledge';

const validAnalysis = {
  confidence: 'medium', region: 'Central Europe',
  candidates: [{ countryCode: 'HU', confidence: .4, rationale: 'Concrete utility poles use a narrow profile that differs from the neighboring candidates.' }],
  strongClues: ['Concrete utility poles'], weakClues: ['Generic vegetation'],
  confusions: ['Serbia'], nextThingsToInspect: ['Check road edge lines'], extraCards: [],
};

const geminiResponse = (text: string, status = 200) => new Response(status === 200 ? JSON.stringify({ candidates: [{ content: { parts: [{ text }] } }] }) : '', {
  status, headers: { 'content-type': 'application/json' },
});

test('Coach decodes escaped Unicode before rendering localized evidence', () => {
  const cases = [
    ['Good road quality.', 'Good road quality.'],
    ['Carretera de Espa\\u00f1a.', 'Carretera de España.'],
    ['Estrada de boa qualidade.', 'Estrada de boa qualidade.'],
    ['Route de bonne qualit\\u00e9.', 'Route de bonne qualité.'],
    ['Eine enge Stra\\u00dfe.', 'Eine enge Straße.'],
    ['Strada di buona qualit00e0 e prosperit00e0.', 'Strada di buona qualità e prosperità.'],
    ['\\u0414\\u043e\\u0440\\u043e\\u0433\\u0430 \\u0443\\u0437\\u043a\\u0430\\u044f.', 'Дорога узкая.'],
    ['En smal v\\u00e4g.', 'En smal väg.'],
  ];
  cases.forEach(([input, expected]) => assert.equal(decodeCoachText(input), expected));
  assert.equal(decodeCoachText('Reference 00e0 remains unchanged.'), 'Reference 00e0 remains unchanged.');
});

test('Gemini carousel exhausts shuffled keys after quota failures without exposing them', async () => {
  const carousel = new GeminiKeyCarousel(['first-secret', 'second-secret', 'third-secret', 'fourth-secret']);
  const used: string[] = [];
  const fetcher = (async (_url: string | URL | Request, init?: RequestInit) => {
    used.push((init?.headers as Record<string, string>)['x-goog-api-key']);
    return used.length < 4 ? geminiResponse('', 429) : geminiResponse(JSON.stringify(validAnalysis));
  }) as typeof fetch;
  const result = await callGeminiCoach(carousel, { mode: 'analyze', mimeType: 'image/jpeg', imageData: 'YWJj' }, fetcher);
  assert.equal(result.analysis.region, 'Central Europe');
  assert.equal(used.length, 4);
  assert.equal(new Set(used).size, 4);
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

test('pasted clue prompts prioritize an obvious foreground subject without discarding context', async () => {
  const prompts: string[] = [];
  const fetcher = (async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    prompts.push(`${body.systemInstruction.parts[0].text} ${body.contents[0].parts[0].text}`);
    return geminiResponse(JSON.stringify(validAnalysis));
  }) as typeof fetch;
  await callGeminiCoach(new GeminiKeyCarousel(['one']), { mode: 'clue', mimeType: 'image/jpeg', imageData: 'YWJj' }, fetcher);
  await callGeminiCoach(new GeminiKeyCarousel(['one']), { mode: 'analyze', mimeType: 'image/jpeg', imageData: 'YWJj' }, fetcher);
  assert.match(prompts[0], /foreground object.*intended subject|intended subject.*foreground object/);
  assert.match(prompts[0], /Ignore all app and browser interface elements/);
  assert.match(prompts[0], /surrounding scene.*supporting or contradictory context/);
  assert.match(prompts[0], /plant family or species/);
  assert.match(prompts[0], /colors, shape, reflector, stripe, border, and mounting pattern/);
  assert.match(prompts[0], /explain the visible symbol, letter, number, color, and restriction or instruction/);
  assert.match(prompts[0], /readable brand or organization.*where it originates or primarily operates.*cross borders/);
  assert.match(prompts[0], /where that specific variant is commonly found/);
  assert.match(prompts[0], /resolution is insufficient.*never invent specificity/);
  assert.doesNotMatch(prompts[1], /user-selected clue crop/);
  assert.match(prompts[1], /overall analysis is high confidence.*district or quarter.*Most likely in/);
});

test('specific location estimates require strong visual evidence and no answer metadata', () => {
  const input = { ...validAnalysis, confidence: 'high', candidates: [{ countryCode: 'LR', confidence: .8 }], locationEstimate: { level: 'city', label: 'Central Monrovia', confidence: 'high', basis: ['Readable Sekou Toure Avenue sign', 'Distinctive coastal street grid'] } };
  assert.equal(normalizeCoachAnalysis(input, 'analyze').locationEstimate?.label, 'Central Monrovia');
  assert.equal(normalizeCoachAnalysis(input, 'analyze', 'Liberia').locationEstimate, undefined);
  assert.equal(normalizeCoachAnalysis({ ...input, locationEstimate: { ...input.locationEstimate, basis: ['Tropical vegetation'] } }, 'analyze').locationEstimate, undefined);
  assert.equal(normalizeCoachAnalysis({ ...input, confidence: 'medium' }, 'analyze').locationEstimate, undefined);
  const explained = normalizeCoachAnalysis(input, 'explain', 'Liberia');
  assert.deepEqual(explained.candidates, []);
  assert.equal(explained.region, '');
});

test('ordinary analysis drops country-only location estimates and unsolicited cards', () => {
  const analysis = normalizeCoachAnalysis({
    ...validAnalysis,
    locationEstimate: { level: 'region', label: 'Ungheria', confidence: 'high', basis: ['Readable Hungarian text', 'Distinctive accent marks'] },
    coreCard: { front: ['What language is visible?'], backExplanation: 'Hungarian.' },
    extraCards: [{ category: 'Architecture', front: ['Describe the building.'], back: 'Two floors.', clueStrength: 2 }],
  }, 'analyze');
  assert.equal(analysis.locationEstimate, undefined);
  assert.equal(analysis.coreCard, undefined);
  assert.deepEqual(analysis.extraCards, []);
});

test('regional confidence never exceeds the overall geographic confidence', () => {
  const analysis = normalizeCoachAnalysis({
    ...validAnalysis,
    confidence: 'low',
    regionalRead: { label: 'Iberian Peninsula', confidence: 'high', reason: 'Coastal scrub and road form provide a soft regional lean.' },
  }, 'analyze');
  assert.equal(analysis.regionalRead?.confidence, 'low');
});

test('candidate confidence is deduplicated, ranked, and never exceeds a total of one', () => {
  const analysis = normalizeCoachAnalysis({
    ...validAnalysis,
    candidates: [{ countryCode: 'de', confidence: .7, rationale: 'German bollards' }, { countryCode: 'HU', confidence: .9, rationale: 'Hungarian poles' }, { countryCode: 'hu', confidence: .4, rationale: 'Weaker duplicate' }],
  }, 'analyze');
  assert.deepEqual(analysis.candidates.map(({ countryCode }) => countryCode), ['HU', 'DE']);
  assert.equal(analysis.candidates[0].rationale, 'Hungarian poles');
  assert.ok(Math.abs(analysis.candidates.reduce((sum, candidate) => sum + candidate.confidence, 0) - 1) < Number.EPSILON);
});

test('Coach rejects substantial English leakage for a non-English response', () => {
  const mixed = normalizeCoachAnalysis({ ...validAnalysis, strongClues: ['The road sign and the green bin are common in this country', 'Look at the buildings and check the nearby vehicles'], weakClues: ['The overall lighting suggests daytime'] }, 'analyze');
  assert.equal(coachLanguageMatches(mixed, 'it'), false);
  assert.equal(coachLanguageMatches(normalizeCoachAnalysis({ ...validAnalysis, region: 'Europa centrale', strongClues: ['I pali in cemento e la segnaletica sono indizi visibili'], weakClues: ['La vegetazione è generica'] }, 'analyze'), 'it'), true);
});

test('candidate normalization drops codes outside the supported country catalog', () => {
  const analysis = normalizeCoachAnalysis({ ...validAnalysis, candidates: [{ countryCode: 'HU', confidence: .8 }, { countryCode: 'ZZ', confidence: .99 }] }, 'analyze');
  assert.deepEqual(analysis.candidates.map(({ countryCode }) => countryCode), ['HU']);
});

test('Coach rejects candidate rationales that claim fit without explaining a distinguishing feature', () => {
  const vague = normalizeCoachAnalysis({ ...validAnalysis, candidates: [{ countryCode: 'NL', confidence: .7, rationale: 'La segnaletica è coerente con gli standard olandesi.' }] }, 'analyze');
  const specific = normalizeCoachAnalysis({ ...validAnalysis, candidates: [{ countryCode: 'NL', confidence: .7, rationale: 'I semafori hanno pannelli di contrasto bianchi e una disposizione sospesa diversa dai candidati vicini.' }] }, 'analyze');
  assert.equal(coachRationalesAreSpecific(vague), false);
  assert.equal(coachRationalesAreSpecific(specific), true);
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
  assert.ok(getCountryMetaKnowledge('Albania', 8).length > 0);
  assert.ok(getCountryMetaKnowledge('Albania', 20).length <= 12);

  const prompts: string[] = [];
  const fetcher = (async (_url: string | URL | Request, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body));
    prompts.push(body.contents[0].parts[0].text);
    return geminiResponse(JSON.stringify(validAnalysis));
  }) as typeof fetch;
  await callGeminiCoach(new GeminiKeyCarousel(['one']), { mode: 'explain', mimeType: 'image/jpeg', imageData: 'YWJj', context: { actualCountry: 'Albania' } }, fetcher);
  await callGeminiCoach(new GeminiKeyCarousel(['one']), { mode: 'analyze', mimeType: 'image/jpeg', imageData: 'YWJj', context: { actualCountry: 'Albania' } }, fetcher);
  await callGeminiCoach(new GeminiKeyCarousel(['one']), { mode: 'cards', mimeType: 'image/jpeg', imageData: 'YWJj', context: { actualCountry: 'Albania' } }, fetcher);
  assert.match(prompts[0], /Retrieved GeoGuessr reference facts/);
  assert.match(prompts[0], /GeoMetas facts for only the known country/);
  assert.doesNotMatch(prompts[1], /Retrieved GeoGuessr reference facts|GeoMetas facts|Albania/);
  assert.doesNotMatch(prompts[2], /GeoMetas facts/);
});

test('Coach bounds user context before inserting it into a prompt', () => {
  const context = sanitizeCoachContext({ actualCountry: 'A'.repeat(500), ignored: 'secret', previousAttempts: Array.from({ length: 20 }, (_, score) => ({ guessedCountry: 'B'.repeat(500), score })), previousCoachCandidates: ['GH', 'NG', 'CI', 'CM', 'SN'] });
  assert.equal(String(context?.actualCountry).length, 120);
  assert.equal((context?.previousAttempts as unknown[]).length, 5);
  assert.deepEqual(context?.previousCoachCandidates, ['GH', 'NG', 'CI', 'CM']);
  assert.equal('ignored' in context!, false);
});

test('the same image gets genuinely different coaching instructions while sharing evidence rules', () => {
  const quick = buildCoachPrompt('analyze', undefined, [], [], 'en', 'quick', 'normal');
  const meta = buildCoachPrompt('analyze', undefined, [], [], 'en', 'meta', 'deep');
  const geography = buildCoachPrompt('analyze', undefined, [], [], 'en', 'deep-geography', 'short');
  assert.match(quick, /QUICK GUESS.*short conclusion.*ranked countries/i);
  assert.match(meta, /META COACH.*S\/A\/B\/C\/D.*REGIONIFIER/i);
  assert.match(geography, /DEEP GEOGRAPHY.*FUNCTION.*CAUSE.*HUMAN RESPONSE/i);
  for (const prompt of [quick, meta, geography]) assert.match(prompt, /major candidate.*main confuser.*highest-information decider/i);
  for (const prompt of [quick, meta, geography]) assert.match(prompt, /positive evidence.*negative or missing evidence.*main confuser.*highest-information decider/i);
  assert.match(geography, /WHAT.*FUNCTION.*CAUSE.*HUMAN RESPONSE.*VISIBLE RESULT.*GEOGUESSR VALUE/i);
  assert.doesNotMatch(`${quick}${meta}${geography}`, /ADAPTIVE/i);
});
