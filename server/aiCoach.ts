import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import countryCatalog from '../src/data/countryCatalog.json';
import type { CoachAnalysis, CoachMode } from '../src/types';

export type { CoachAnalysis, CoachMode } from '../src/types';

type KeyState = { key: string; cooldownUntil: number };
const allowedCardCategories = new Set(['RoadLines', 'Bollards', 'Poles', 'Plates', 'Signs', 'Architecture', 'Plants', 'Vehicles', 'Roads', 'CoverageMeta']);
const countryNames = Object.values(countryCatalog).map((item) => item.name.toLowerCase());
const frontGiveaway = /\p{Regional_Indicator}{2}|\b(?:northern|southern|central|eastern|western)\s+(?:europe|asia|africa|america|oceania)\b/iu;

export class GeminiKeyCarousel {
  private cursor = 0;
  private readonly keys: KeyState[];

  constructor(keys: string[], private readonly cooldownMs = 60_000) {
    this.keys = [...new Set(keys.map((key) => key.trim()).filter(Boolean))].map((key) => ({ key, cooldownUntil: 0 }));
  }

  get size() { return this.keys.length; }

  next(now = Date.now()): KeyState | undefined {
    for (let checked = 0; checked < this.keys.length; checked++) {
      const state = this.keys[this.cursor++ % this.keys.length];
      if (state.cooldownUntil <= now) return state;
    }
  }

  cooldown(state: KeyState, now = Date.now()) { state.cooldownUntil = now + this.cooldownMs; }
}

export function loadGeminiKeys(env: Record<string, string | undefined> = process.env): string[] {
  const direct = [env.GEMINI_API_KEYS, env.GEMINI_API_KEY, env.VITE_API_KEYS].filter(Boolean).join(',');
  if (direct) return direct.split(',').map((key) => key.trim()).filter(Boolean);

  const configured = env.GEMINI_KEYS_FILE;
  const sharedStore = path.join(env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Adobe', 'CEP', 'extensions', '.aljohn-secrets', 'gemini-keys.json');
  const file = configured || sharedStore;
  if (!fs.existsSync(file)) return [];
  try {
    const parsed = JSON.parse(fs.readFileSync(file, 'utf8')) as { keys?: unknown };
    return Array.isArray(parsed.keys) ? parsed.keys.filter((key): key is string => typeof key === 'string' && !!key.trim()) : [];
  } catch {
    return [];
  }
}

const responseSchema = {
  type: 'OBJECT',
  properties: {
    confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] },
    region: { type: 'STRING' },
    description: { type: 'STRING' },
    candidates: { type: 'ARRAY', items: { type: 'OBJECT', properties: { countryCode: { type: 'STRING' }, confidence: { type: 'NUMBER' } }, required: ['countryCode', 'confidence'] } },
    strongClues: { type: 'ARRAY', items: { type: 'STRING' } },
    weakClues: { type: 'ARRAY', items: { type: 'STRING' } },
    confusions: { type: 'ARRAY', items: { type: 'STRING' } },
    nextThingsToInspect: { type: 'ARRAY', items: { type: 'STRING' } },
    coreCard: { type: 'OBJECT', properties: { front: { type: 'ARRAY', items: { type: 'STRING' } }, backExplanation: { type: 'STRING' } }, required: ['front', 'backExplanation'] },
    extraCards: { type: 'ARRAY', items: { type: 'OBJECT', properties: { category: { type: 'STRING' }, front: { type: 'ARRAY', items: { type: 'STRING' } }, back: { type: 'STRING' }, clueStrength: { type: 'INTEGER' } }, required: ['category', 'front', 'back', 'clueStrength'] } },
  },
  required: ['confidence', 'region', 'candidates', 'strongClues', 'weakClues', 'confusions', 'nextThingsToInspect', 'extraCards'],
};

const rules = `You are a concise GeoGuessr teacher. Analyze only visible evidence.
Never manufacture certainty. Prefer a broad region and ranked candidates when uncertain.
Known result context is an answer key, never evidence. Never cite location metadata, coordinates, panorama IDs, geocoding, or API data as clues, and never invent an exact locality from them.
Systematically check road lines and surface, driving side, bollards, poles and wires, signs and language, plates and vehicles, Google car or camera meta, architecture, terrain, vegetation, climate, and sun.
Weigh distinctive clues against contradictions before ranking candidates. Do not use Street View coverage prevalence as geographic evidence or default to commonly covered countries.
Separate strong evidence from generic or weak clues. Generic vegetation is never country-specific.
After reveal, always give realistic confusion countries.
Normal card fronts contain only visible non-spoiler clues: no country, flag, coordinates, city, explicit region, or readable language that reveals the answer.
Create at most two extra cards, and only when a clue has real geographic value. Keep every list short.`;

function prompt(mode: CoachMode, context?: Record<string, unknown>) {
  if (mode === 'hints') return `${rules}\nGive only spoiler-free things to inspect. Do not name any country, city, region, coordinate, or likely answer. Put hints in nextThingsToInspect; leave region, candidates, confusions and cards empty.`;
  if (mode === 'analyze360') return `${rules}\nSynthesize evidence across four views taken 90 degrees apart from the same panorama. Give a short region/vibe, up to four ranked candidate countries with honest confidence, strong clues, weak clues, and what to inspect next. Do not treat repeated features across views as independent evidence.`;
  if (mode === 'clue-safe') return `${rules}\nIdentify and describe the central visible clue. Put a detailed visual description in description, useful observable traits in strongClues, limitations in weakClues, and comparison features in nextThingsToInspect. Do not name or infer a country, city, region, coordinate, or likely answer. Leave region, candidates, confusions and cards empty.`;
  if (mode === 'clue') return `${rules}\nIdentify and describe the central visible clue in detail. Explain its geographic value, give a broad region, up to four ranked candidate countries with honest numeric confidence, realistic confusions, limitations, and the exact features to compare next. Leave cards empty.`;
  if (mode === 'analyze') return `${rules}\nGive a short region/vibe, up to four ranked candidate countries with honest confidence, strong clues, weak clues, and what to inspect next.`;
  const facts = JSON.stringify(context || {});
  if (mode === 'cards') return `${rules}\nKnown result context (answer key only): ${facts}\nGenerate one core card plus only genuinely useful specialized cards from visible clues. Explain why the known country fits and realistic confusions without claiming the answer key was visible.`;
  return `${rules}\nKnown result context (answer key only): ${facts}\nExplain briefly which visible clues support the known country, which clues were generic, and realistic confusions. Do not claim the answer key or location metadata was visible.`;
}

function strings(value: unknown, max = 6): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => item.trim()).filter(Boolean).slice(0, max) : [];
}

export function normalizeCoachAnalysis(value: unknown, mode: CoachMode, actualCountry = ''): CoachAnalysis {
  if (!value || typeof value !== 'object') throw new Error('Coach returned malformed JSON.');
  const item = value as Record<string, unknown>;
  const confidence = ['low', 'medium', 'high'].includes(String(item.confidence)) ? item.confidence as CoachAnalysis['confidence'] : 'low';
  const candidateMap = new Map<string, number>();
  if (Array.isArray(item.candidates)) item.candidates.forEach((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const entry = candidate as Record<string, unknown>;
    const countryCode = typeof entry.countryCode === 'string' ? entry.countryCode.trim().toUpperCase() : '';
    if (/^[A-Z]{2}$/.test(countryCode) && Number.isFinite(entry.confidence)) candidateMap.set(countryCode, Math.max(candidateMap.get(countryCode) || 0, Math.max(0, Math.min(1, Number(entry.confidence)))));
  });
  const candidates = [...candidateMap].map(([countryCode, candidateConfidence]) => ({ countryCode, confidence: candidateConfidence })).sort((a, b) => b.confidence - a.confidence).slice(0, 4);
  const candidateTotal = candidates.reduce((sum, candidate) => sum + candidate.confidence, 0);
  if (candidateTotal > 1) candidates.forEach((candidate) => { candidate.confidence /= candidateTotal; });
  const core = item.coreCard && typeof item.coreCard === 'object' ? item.coreCard as Record<string, unknown> : undefined;
  const banned = [actualCountry.toLowerCase(), ...countryNames].filter(Boolean);
  const nonVisualEvidence = /\b(?:location\s+metadata|coordinates?|latitude|longitude|pano(?:rama)?\s*(?:id)?|geocod(?:e|ing)|api)\b|[-+]?\d{1,2}\.\d{3,}\s*[°º]?\s*[NS]?\s*[,/]\s*[-+]?\d{1,3}\.\d{3,}/iu;
  const visible = (line: string) => !nonVisualEvidence.test(line);
  const safe = (line: string) => visible(line) && !frontGiveaway.test(line) && !banned.some((name) => name.length > 2 && line.toLowerCase().includes(name));
  const safeFront = strings(core?.front, 6).filter(safe);
  const extraCards = Array.isArray(item.extraCards) ? item.extraCards.flatMap((card) => {
    if (!card || typeof card !== 'object') return [];
    const entry = card as Record<string, unknown>;
    if (!allowedCardCategories.has(String(entry.category))) return [];
    const front = strings(entry.front, 5).filter(safe);
    return front.length && typeof entry.back === 'string' ? [{ category: String(entry.category), front, back: entry.back.slice(0, 700), clueStrength: Math.max(1, Math.min(5, Number(entry.clueStrength) || 1)) }] : [];
  }).slice(0, 2) : [];
  const analysis: CoachAnalysis = {
    confidence, region: typeof item.region === 'string' ? item.region.slice(0, 120) : '', description: typeof item.description === 'string' ? item.description.slice(0, 1200) : undefined, candidates,
    strongClues: strings(item.strongClues).filter(visible), weakClues: strings(item.weakClues).filter(visible), confusions: strings(item.confusions),
    nextThingsToInspect: strings(item.nextThingsToInspect).filter(visible),
    coreCard: core ? { front: safeFront, backExplanation: typeof core.backExplanation === 'string' ? core.backExplanation.slice(0, 900) : '' } : undefined,
    extraCards,
  };
  if (mode === 'hints') return { ...analysis, region: '', candidates: [], strongClues: [], weakClues: [], confusions: [], nextThingsToInspect: analysis.nextThingsToInspect.filter(safe), coreCard: undefined, extraCards: [] };
  if (mode === 'clue-safe') return { ...analysis, region: '', description: analysis.description && safe(analysis.description) ? analysis.description : undefined, candidates: [], strongClues: analysis.strongClues.filter(safe), weakClues: analysis.weakClues.filter(safe), confusions: [], nextThingsToInspect: analysis.nextThingsToInspect.filter(safe), coreCard: undefined, extraCards: [] };
  if (mode === 'clue') return { ...analysis, coreCard: undefined, extraCards: [] };
  return analysis;
}

export async function callGeminiCoach(carousel: GeminiKeyCarousel, request: { mode: CoachMode; mimeType: string; imageData: string; frames?: Array<{ mimeType: string; imageData: string }>; context?: Record<string, unknown> }, fetcher: typeof fetch = fetch) {
  if (!carousel.size) throw new Error('No Gemini keys are configured.');
  const models = (process.env.GEMINI_COACH_MODELS || 'gemini-2.5-flash-lite,gemini-2.5-flash').split(',').map((model) => model.trim()).filter(Boolean);
  const deadline = Date.now() + 30_000;
  let lastError = new Error('Gemini Coach is unavailable.');
  for (const model of models) {
    for (let attempt = 0; attempt < Math.min(3, Math.max(1, carousel.size)); attempt++) {
      if (Date.now() >= deadline) throw new Error('Gemini request timed out.');
      const state = carousel.next();
      if (!state) throw new Error('All Gemini keys are cooling down.');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Math.min(request.mode === 'analyze360' ? 20_000 : 12_000, deadline - Date.now()));
      try {
        const context = ['hints', 'analyze', 'clue', 'clue-safe'].includes(request.mode) ? undefined : request.context;
        const response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST', signal: controller.signal,
          headers: { 'content-type': 'application/json', 'x-goog-api-key': state.key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: rules }] },
            contents: [{ role: 'user', parts: [{ text: prompt(request.mode, context) }, ...(request.frames || [request]).map((frame) => ({ inlineData: { mimeType: frame.mimeType, data: frame.imageData } }))] }],
            generationConfig: { temperature: 0.25, maxOutputTokens: 1000, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: 'application/json', responseSchema },
          }),
        });
        if (response.status === 429) { carousel.cooldown(state); lastError = new Error('Gemini quota exceeded.'); continue; }
        if (response.status === 404) { lastError = new Error(`${model} is unavailable.`); break; }
        if (!response.ok) { lastError = new Error(response.status >= 500 ? 'Gemini service error.' : 'Gemini request was rejected.'); continue; }
        const raw = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const text = raw.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
        if (!text) { lastError = new Error('Gemini returned an empty response.'); continue; }
        const analysis = normalizeCoachAnalysis(JSON.parse(text), request.mode, String(context?.actualCountry || ''));
        return { analysis, model, generatedAt: Date.now() };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') { lastError = new Error('Gemini request timed out.'); break; }
        lastError = error as Error;
      } finally {
        clearTimeout(timeout);
      }
    }
  }
  throw lastError;
}

export async function fetchStreetViewFrame(view: unknown, googleKey: string, fetcher: typeof fetch = fetch) {
  if (!googleKey) throw new Error('Automatic Coach capture needs a Google Street View Static API key.');
  if (!view || typeof view !== 'object') throw new Error('Current Street View orientation is unavailable.');
  const item = view as Record<string, unknown>;
  const panoId = String(item.panoId || '');
  const heading = Number(item.heading);
  const pitch = Number(item.pitch);
  const zoom = Number(item.zoom);
  if (!panoId || ![heading, pitch, zoom].every(Number.isFinite)) throw new Error('Current Street View orientation is invalid.');
  const query = new URLSearchParams({
    size: '640x480', pano: panoId, heading: String((heading % 360 + 360) % 360),
    pitch: String(Math.max(-90, Math.min(90, pitch))), fov: String(Math.max(25, Math.min(100, 180 / 2 ** zoom))), key: googleKey,
  });
  const response = await fetcher(`https://maps.googleapis.com/maps/api/streetview?${query}`, { headers: { referer: 'http://localhost:3000/' } });
  if (!response.ok) throw new Error(`Street View capture failed (${response.status}). Enable Street View Static API for the Maps key.`);
  const mimeType = response.headers.get('content-type')?.split(';')[0] || '';
  if (!mimeType.startsWith('image/')) throw new Error('Street View capture returned no image.');
  return { mimeType, imageData: Buffer.from(await response.arrayBuffer()).toString('base64') };
}

export async function fetchStreetViewFrames(view: unknown, googleKey: string, fetcher: typeof fetch = fetch) {
  const item = view && typeof view === 'object' ? view as Record<string, unknown> : {};
  const heading = Number(item.heading);
  if (!Number.isFinite(heading)) throw new Error('Current Street View orientation is invalid.');
  return Promise.all([0, 90, 180, 270].map((offset) => fetchStreetViewFrame({ ...item, heading: heading + offset, zoom: 1 }, googleKey, fetcher)));
}

export function createAiCoachMiddleware(keys = loadGeminiKeys(), googleKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY || '') {
  const carousel = new GeminiKeyCarousel(keys);
  return async (req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse, next: () => void) => {
    if (req.url !== '/api/coach' || req.method !== 'POST') return next();
    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
        if (body.length > 12_000_000) throw new Error('Screenshot is too large.');
      }
      const value = JSON.parse(body) as Record<string, unknown>;
      const mode = value.mode as CoachMode;
      const suppliedMime = String(value.mimeType || '');
      const suppliedData = String(value.imageData || '');
      const supplied = ['image/jpeg', 'image/png', 'image/webp'].includes(suppliedMime) && /^[A-Za-z0-9+/=]+$/.test(suppliedData);
      const frames = supplied ? [{ mimeType: suppliedMime, imageData: suppliedData }] : mode === 'analyze360' ? await fetchStreetViewFrames(value.view, googleKey) : [await fetchStreetViewFrame(value.view, googleKey)];
      if (!['hints', 'analyze', 'analyze360', 'explain', 'cards', 'clue', 'clue-safe'].includes(mode) || frames.some((frame) => !['image/jpeg', 'image/png', 'image/webp'].includes(frame.mimeType) || !/^[A-Za-z0-9+/=]+$/.test(frame.imageData))) throw new Error('Invalid Coach request.');
      const result = await callGeminiCoach(carousel, { mode, ...frames[0], frames, context: value.context && typeof value.context === 'object' ? value.context as Record<string, unknown> : undefined });
      res.statusCode = 200; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Coach unavailable.';
      res.statusCode = /timed out/i.test(message) ? 504 : /quota|cooling down/i.test(message) ? 429 : 503;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: message }));
    }
  };
}
