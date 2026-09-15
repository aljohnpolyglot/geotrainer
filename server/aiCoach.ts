import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import countryCatalog from '../src/data/countryCatalog.json';
import type { CoachAnalysis, CoachMode, CoachStyle, ExplanationDepth } from '../src/types';
import { getCountryKnowledge, getCountryMetaKnowledge, type GeoKnowledgeHint } from './geoguessrKnowledge';

export type { CoachAnalysis, CoachMode } from '../src/types';

type KeyState = { key: string; cooldownUntil: number };
const allowedCardCategories = new Set(['RoadLines', 'Bollards', 'Poles', 'Plates', 'Signs', 'Architecture', 'Plants', 'Vehicles', 'Roads', 'CoverageMeta']);
const countryNames = Object.entries(countryCatalog).flatMap(([code, item]) => [item.name, ...['en', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'sv'].map((locale) => new Intl.DisplayNames(locale, { type: 'region' }).of(code) || '')]).map((name) => name.toLowerCase());
const frontGiveaway = /\p{Regional_Indicator}{2}|\b(?:northern|southern|central|eastern|western)\s+(?:europe|asia|africa|america|oceania)\b/iu;

export class GeminiKeyCarousel {
  private cursor = 0;
  private readonly keys: KeyState[];

  constructor(keys: string[], private readonly cooldownMs = 60_000) {
    this.keys = [...new Set(keys.map((key) => key.trim()).filter(Boolean))].map((key) => ({ key, cooldownUntil: 0 }));
    this.cursor = this.keys.length ? Math.floor(Math.random() * this.keys.length) : 0;
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
  const direct = [env.GEMINI_API_KEYS, env.GEMINI_API_KEY].filter(Boolean).join(',');
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
    locationEstimate: { type: 'OBJECT', properties: { level: { type: 'STRING', enum: ['region', 'city', 'exact'] }, label: { type: 'STRING' }, confidence: { type: 'STRING', enum: ['medium', 'high'] }, basis: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['level', 'label', 'confidence', 'basis'] },
    description: { type: 'STRING' },
    regionalRead: { type: 'OBJECT', properties: { label: { type: 'STRING' }, confidence: { type: 'STRING', enum: ['low', 'medium', 'high'] }, reason: { type: 'STRING' } }, required: ['label', 'confidence', 'reason'] },
    candidates: { type: 'ARRAY', items: { type: 'OBJECT', properties: { countryCode: { type: 'STRING' }, confidence: { type: 'NUMBER' }, rationale: { type: 'STRING' } }, required: ['countryCode', 'confidence', 'rationale'] } },
    strongClues: { type: 'ARRAY', items: { type: 'STRING' } },
    weakClues: { type: 'ARRAY', items: { type: 'STRING' } },
    contradictions: { type: 'ARRAY', items: { type: 'STRING' } },
    confusions: { type: 'ARRAY', items: { type: 'STRING' } },
    nextThingsToInspect: { type: 'ARRAY', items: { type: 'STRING' } },
    coreCard: { type: 'OBJECT', properties: { front: { type: 'ARRAY', items: { type: 'STRING' } }, backExplanation: { type: 'STRING' } }, required: ['front', 'backExplanation'] },
    extraCards: { type: 'ARRAY', items: { type: 'OBJECT', properties: { category: { type: 'STRING' }, front: { type: 'ARRAY', items: { type: 'STRING' } }, back: { type: 'STRING' }, clueStrength: { type: 'INTEGER' } }, required: ['category', 'front', 'back', 'clueStrength'] } },
  },
  required: ['confidence', 'region', 'candidates', 'strongClues', 'weakClues', 'contradictions', 'confusions', 'nextThingsToInspect', 'extraCards'],
};

const rules = `You are a concise, evidence-grounded GeoGuessr teacher viewing imagery inside a GeoGuessr-style app. Analyze only visible geographic scene evidence. Ignore all app and browser interface elements, including GeoGuessr or GeoTrainer text and buttons, navigation arrows, compass overlays, cursors, Google attribution, map controls, and screenshot-tool chrome; never use their language or design as location evidence.
Never manufacture certainty. Prefer a broad region and ranked candidates when uncertain, and say when the image is insufficient.
Build every response from one shared evidence pass: first identify directly OBSERVED features, then separate reasonable INFERRED interpretations from SPECULATIVE possibilities. Speculation must never materially drive a country ranking. Never invent acronym meanings, company identities, crops, historical events, wars, colonial explanations, industries, architectural terms, road regulations, geological causes, regional associations, or economic relationships. If an identity or cause is uncertain, say exactly that.
Only when no known-result metadata is provided and the overall analysis is high confidence, actively assess whether at least two independent visible clues strongly support a region, city, district or quarter, landmark, or exact place narrower than a country. If they do, return a high-confidence locationEstimate, using exact for a district, quarter, landmark, or exact place, so the interface can say "Most likely in …". Country guesses belong only in candidates. Omit locationEstimate for generic scenes or whenever narrower-location confidence is not high.
Known result context is an answer key, never evidence. Never cite location metadata, coordinates, panorama IDs, geocoding, or API data as clues, and never invent an exact locality from them.
Systematically check road lines and surface, driving side, bollards, poles and wires, signs and language, plates and vehicles, Google car or camera meta, architecture, terrain, vegetation, climate, and sun. State which categories were actually visible; do not imply that an unseen feature supports a guess.
Separate direct observations from geographic inferences. If text is blurry or partially hidden, call it unreadable instead of guessing what it says. Weigh distinctive clues against contradictions before ranking candidates. A brand, billboard, bottled product, shop, or vehicle model is weak evidence unless the image visibly contains a genuinely location-specific marker; ordinary international brands are not country evidence. Generic buildings, clouds, tropical vegetation, and road quality are weak evidence. Do not use Street View coverage prevalence as geographic evidence or default to commonly covered countries.
Actively list contradictions or missing expected features for the leading candidate in contradictions. If a clue supports several countries, describe the ambiguity instead of forcing a country-specific claim. Candidate confidence is comparative visual confidence, not certainty or a calibrated probability; keep it low when evidence is generic.
Separate strong evidence from generic or weak clues. Generic vegetation is never country-specific.
For every meaningful clue, explain WHAT is visible, WHY it matters, what it supports and argues against, why it separates one current candidate from another, how strong that separation is, the main confusers, and what would confirm or overturn it. A strength label without its mechanics is incomplete. Explicitly mark country-standard clues versus environmental or regional clues.
Every major candidate rationale must compactly cover positive evidence, negative or missing evidence, why it ranks above or below the next candidate, its main confuser, and the highest-information decider. When the top candidates are close, explicitly state “Why X > Y”; if no visible feature justifies the gap, call them effectively tied and reduce the gap or confidence. Do not hide ranking logic behind percentages. A regionalRead confidence must never exceed the overall confidence.
Treat cloudy sky, green grass, generic trees, ordinary cars, fences, fields, and unremarkable house colors as near-zero or low separation value and explain why. Do not count several clues produced by the same underlying environment as independent evidence. If no genuinely strong country clue exists, say so in strongClues and rank the best available evidence honestly.
Never use “common in”, “typical of”, “suggests”, “consistent with”, or “often found in” as a complete explanation: continue with the underlying reason, comparison set, limitation, and country-separation value. Every nextThingToInspect must explain why it provides more information than rechecking generic scenery. If a regional read is unsupported, explain which missing terrain, road-standard, language, geology, or settlement evidence prevents it.
After reveal, always give realistic confusion countries.
Normal card fronts contain only visible non-spoiler clues: no country, flag, coordinates, city, explicit region, or readable language that reveals the answer.
Create at most two extra cards, and only when a clue has real geographic value. Keep every list short.`;

const aiLanguageNames: Record<string, string> = { en: 'English', es: 'Spanish', pt: 'Portuguese', fr: 'French', de: 'German', it: 'Italian', ru: 'Russian', sv: 'Swedish' };

export function sanitizeCoachContext(value: unknown): Record<string, unknown> | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const source = value as Record<string, unknown>;
  const text = (key: string) => typeof source[key] === 'string' ? String(source[key]).slice(0, 120) : undefined;
  const number = (key: string) => Number.isFinite(source[key]) ? Number(source[key]) : undefined;
  const previousAttempts = Array.isArray(source.previousAttempts) ? source.previousAttempts.slice(0, 5).map((item) => {
    const attempt = item && typeof item === 'object' ? item as Record<string, unknown> : {};
    return { guessedCountry: typeof attempt.guessedCountry === 'string' ? attempt.guessedCountry.slice(0, 120) : undefined, score: Number.isFinite(attempt.score) ? Number(attempt.score) : 0 };
  }) : undefined;
  const previousCoachCandidates = Array.isArray(source.previousCoachCandidates) ? source.previousCoachCandidates.filter((item): item is string => typeof item === 'string').slice(0, 4) : undefined;
  return { actualCountry: text('actualCountry'), actualRegion: text('actualRegion'), guessedCountry: text('guessedCountry'), score: number('score'), distanceKm: number('distanceKm'), previousAttempts, previousCoachCandidates };
}

const styleInstructions: Record<CoachStyle, string> = {
  quick: 'QUICK GUESS: Preserve the concise current Coach behavior. Put the short conclusion in description, 2–5 strongest visible clues in strongClues, and keep other lists brief. Prioritize ranked countries, relative likelihood, confidence, and no long lesson.',
  meta: 'META COACH: Put the verdict in description. In strongClues, format each important clue with S/A/B/C/D tier, COUNTRYIFIER/REGIONIFIER/ELIMINATOR/CONFIRMER/VIBE role, and reliability. Put limitations in weakClues, confusers in confusions, and the highest-value meta to seek in nextThingsToInspect. Distinguish national standards from regional clues and changing coverage metas.',
  elimination: 'ELIMINATION COACH: Put the current candidate pool in description, evidence keeping candidates in strongClues, countries or groups argued against with calibrated reasons in contradictions, plausible survivors in confusions, and the best separator in nextThingsToInspect. Avoid “impossible” unless genuinely near-absolute.',
  'deep-geography': 'DEEP GEOGRAPHY: Lead the description field with a grounded WHAT → FUNCTION → CAUSE → HUMAN RESPONSE → VISIBLE RESULT → GEOGUESSR VALUE chain. Use geography, climate, geology, agriculture, economics, history, or infrastructure only when the image supports the chain. If a generic object has no defensible geographic cause, explicitly say this image cannot support a deep causal explanation; do not replace the chain with generic country rankings.',
  memory: 'MEMORY COACH: Put one truthful compact memory anchor in description, cause/effect steps in strongClues, exceptions in weakClues, contrast pairs in confusions, and recall questions in nextThingsToInspect. Never invent a story merely to make it memorable.',
  'pro-analyst': 'PRO ANALYST: Put the calibrated verdict in description, positive evidence with weights in strongClues, low-value evidence in weakClues, conflicts in contradictions, main ambiguity in confusions, and highest-information next clues in nextThingsToInspect. Address clue independence, uncertainty, and false precision.',
};
const depthInstructions: Record<ExplanationDepth, string> = {
  short: 'DEPTH SHORT: Keep this quickly readable during play with 2–5 major clues.',
  normal: 'DEPTH NORMAL: Balance play and learning: major clues, confusers, a short explanation, and one important takeaway.',
  deep: 'DEPTH DEEP: Add relevant causal or geographic context, multiple confusers, and strong-versus-weak evidence, but no wall of text.',
};
const validStyles = new Set(Object.keys(styleInstructions)); const validDepths = new Set(Object.keys(depthInstructions));

export function buildCoachPrompt(mode: CoachMode, context?: Record<string, unknown>, knowledge: GeoKnowledgeHint[] = [], metaKnowledge: GeoKnowledgeHint[] = [], language = 'en', style: CoachStyle = 'quick', depth: ExplanationDepth = 'normal') {
  const languageInstruction = `MANDATORY OUTPUT LANGUAGE: ${aiLanguageNames[language] || 'English'}. Write every natural-language JSON string value in fluent, idiomatic ${aiLanguageNames[language] || 'English'}, even when signs or reference facts use another language. Every major candidate rationale must include positive evidence, negative or missing evidence, why it ranks above or below its nearest candidate, its main confuser, and the highest-information decider. The top candidate must also give its strongest clues. If candidates are close, explain exactly why #1 is ahead or call them effectively tied. Relative likelihood is an AI confidence estimate, not a measured probability. Return regionalRead when a subregion is supported; otherwise omit it and explain the missing regional evidence in contradictions. Never translate JSON property names, ISO country codes, or card category identifiers. ${styleInstructions[style]} ${depthInstructions[depth]}`;
  if (mode === 'hints') return `${languageInstruction} Give only spoiler-free things to inspect. Do not name any country, city, region, coordinate, or likely answer. Put hints in nextThingsToInspect; leave region, candidates, confusions and cards empty.`;
  if (mode === 'analyze360') return `${languageInstruction} Synthesize evidence across four views taken 90 degrees apart from the same panorama. Give a short region/vibe and up to four ranked candidate countries with honest confidence. For every candidate, rationale must explain in one specific sentence which visible evidence supports that country and what distinguishes it from the other candidates. Also return direct observations in strongClues, generic or uncertain evidence in weakClues, contradictions in contradictions, and what to inspect next. Do not treat repeated features across views as independent evidence. Add locationEstimate only when multiple independent visible clues meet its strict evidence threshold. Leave cards empty.`;
  if (mode === 'clue-safe') return `${languageInstruction} Treat this as a user-selected clue crop. If one foreground object is clearly the intended subject, identify it at the narrowest visually defensible level and describe it first. For a sign, explain the visible symbol, letter, number, color, and restriction or instruction it communicates; do not stop at its shape. For a readable brand or organization, explain what it is and the clue's reliability, including whether its products or presence can cross borders. For vegetation, attempt a plant family or species and cite visible identifying traits. For road furniture, name the feature type and its exact colors, shape, reflector, stripe, border, and mounting pattern. If resolution is insufficient, say the exact identity is unreadable and name the detail needed; never invent specificity. Use the surrounding scene only as supporting or contradictory context. Put a detailed visual description in description, useful observable traits in strongClues, limitations in weakClues, and comparison features in nextThingsToInspect. Do not name or infer a country, city, region, coordinate, or likely answer. Leave region, candidates, confusions and cards empty.`;
  if (mode === 'clue') return `${languageInstruction} Treat this as a user-selected clue crop. If one foreground object is clearly the intended subject, identify it at the narrowest visually defensible level and describe it first. For a sign, explain the visible symbol, letter, number, color, and restriction or instruction it communicates; do not stop at its shape or possible countries. For a readable brand or organization, explain what it is, where it originates or primarily operates, and whether its products or presence cross borders so the evidence strength makes sense. For vegetation, attempt a plant family or species and cite visible identifying traits. For road furniture, name the feature type and its exact colors, shape, reflector, stripe, border, and mounting pattern. If resolution is insufficient, say the exact identity is unreadable and name the detail needed; never invent specificity. Use the surrounding scene only as supporting or contradictory context. Separate direct observation from inference. Explain where that specific variant is commonly found, where it also occurs, and how reliable it is; do not turn a broad plant range into country-level confidence. Give a broad region and up to four ranked candidate countries with honest numeric confidence. For every candidate, rationale must explain in one specific sentence which visible evidence supports that country and what distinguishes it from the other candidates. Include realistic confusions, limitations, contradictions, and exact comparison features. Add locationEstimate only when multiple independent visible clues meet its strict evidence threshold. Leave cards empty.`;
  if (mode === 'analyze') return `${languageInstruction} Give a short region/vibe and up to four ranked candidate countries with honest confidence. For every candidate, rationale must explain in one specific sentence which visible evidence supports that country and what distinguishes it from the other candidates. Also return direct observations in strongClues, generic or uncertain evidence in weakClues, contradictions in contradictions, and what to inspect next. Add locationEstimate only when multiple independent visible clues meet its strict evidence threshold. Leave cards empty.`;
  const facts = JSON.stringify(context || {});
  const reference = knowledge.length ? `\nRetrieved GeoGuessr reference facts for the known country: ${JSON.stringify(knowledge)}\nUse only facts that match visible evidence; ignore irrelevant entries.` : '';
  const metaReference = mode === 'explain' && metaKnowledge.length ? `\nGeoMetas facts for only the known country: ${JSON.stringify(metaKnowledge)}\nMention a fact only when its described feature is clearly visible in the supplied image; otherwise ignore it completely.` : '';
  if (mode === 'cards') return `${languageInstruction} Known result context (answer key only): ${facts}${reference}\nGenerate one core card plus only genuinely useful specialized cards from visible clues. Explain why the known country fits and realistic confusions without claiming the answer key was visible.`;
  return `${languageInstruction} Known result context (answer key only): ${facts}${reference}${metaReference}\nExplain briefly which visible clues support the known country, which clues were generic, and realistic confusions. If the image alone was insufficient to identify the known country, say so plainly. If previous Coach candidates missed it, acknowledge the mismatch and explain which ambiguous evidence caused it; never retrofit generic clues as proof. Do not claim the answer key or location metadata was visible. Leave region, locationEstimate, and candidates empty.`;
}

export const decodeCoachText = (value: string) => value
  .replace(/\\u([0-9a-f]{4})/gi, (_, hex: string) => String.fromCharCode(Number.parseInt(hex, 16)))
  .replace(/(\p{L})(?:u)?(00[89a-f][0-9a-f])(?=$|[^\p{L}\p{N}])/giu, (_, lead: string, hex: string) => lead + String.fromCharCode(Number.parseInt(hex, 16)));
function strings(value: unknown, max = 6): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string').map((item) => decodeCoachText(item).trim()).filter(Boolean).slice(0, max) : [];
}

export function normalizeCoachAnalysis(value: unknown, mode: CoachMode, actualCountry = ''): CoachAnalysis {
  if (!value || typeof value !== 'object') throw new Error('Coach returned malformed JSON.');
  const item = value as Record<string, unknown>;
  const candidateMap = new Map<string, { confidence: number; rationale?: string }>();
  if (Array.isArray(item.candidates)) item.candidates.forEach((candidate) => {
    if (!candidate || typeof candidate !== 'object') return [];
    const entry = candidate as Record<string, unknown>;
    const countryCode = typeof entry.countryCode === 'string' ? entry.countryCode.trim().toUpperCase() : '';
    const confidence = Math.max(0, Math.min(1, Number(entry.confidence))); const previous = candidateMap.get(countryCode);
    if (countryCatalog[countryCode] && Number.isFinite(entry.confidence) && (!previous || confidence >= previous.confidence)) candidateMap.set(countryCode, { confidence, ...(typeof entry.rationale === 'string' ? { rationale: decodeCoachText(entry.rationale).trim().slice(0, 900) } : {}) });
  });
  const candidates = [...candidateMap].map(([countryCode, candidate]) => ({ countryCode, ...candidate })).sort((a, b) => b.confidence - a.confidence).slice(0, 4);
  const candidateTotal = candidates.reduce((sum, candidate) => sum + candidate.confidence, 0);
  if (candidateTotal > 1) candidates.forEach((candidate) => { candidate.confidence /= candidateTotal; });
  const requestedConfidence = ['low', 'medium', 'high'].includes(String(item.confidence)) ? item.confidence as CoachAnalysis['confidence'] : 'low';
  const confidence: CoachAnalysis['confidence'] = !candidates.length ? 'low' : requestedConfidence === 'high' && candidates[0].confidence < .65 ? 'medium' : requestedConfidence === 'medium' && candidates[0].confidence < .2 ? 'low' : requestedConfidence;
  const core = item.coreCard && typeof item.coreCard === 'object' ? item.coreCard as Record<string, unknown> : undefined;
  const banned = [actualCountry.toLowerCase(), ...countryNames].filter(Boolean);
  const nonVisualEvidence = /\b(?:location\s+metadata|coordinates?|latitude|longitude|pano(?:rama)?\s*(?:id)?|geocod(?:e|ing)|api)\b|[-+]?\d{1,2}\.\d{3,}\s*[°º]?\s*[NS]?\s*[,/]\s*[-+]?\d{1,3}\.\d{3,}/iu;
  const visible = (line: string) => !nonVisualEvidence.test(line);
  const safe = (line: string) => visible(line) && !frontGiveaway.test(line) && !banned.some((name) => name.length > 2 && line.toLowerCase().includes(name));
  const rawEstimate = item.locationEstimate && typeof item.locationEstimate === 'object' ? item.locationEstimate as Record<string, unknown> : undefined;
  const estimateLevel = String(rawEstimate?.level);
  const estimateConfidence = String(rawEstimate?.confidence);
  const estimateBasis = strings(rawEstimate?.basis, 4).filter(visible);
  const estimateLabel = typeof rawEstimate?.label === 'string' ? decodeCoachText(rawEstimate.label).trim().slice(0, 160) : '';
  const locationEstimate = !actualCountry && confidence === 'high' && ['analyze', 'analyze360', 'clue'].includes(mode) && ['region', 'city', 'exact'].includes(estimateLevel) && estimateConfidence === 'high' && estimateLabel && !countryNames.includes(estimateLabel.toLowerCase()) && visible(estimateLabel) && estimateBasis.length >= 2
    ? { level: estimateLevel as 'region' | 'city' | 'exact', label: estimateLabel, confidence: 'high' as const, basis: estimateBasis }
    : undefined;
  const rawRegionalRead = item.regionalRead && typeof item.regionalRead === 'object' ? item.regionalRead as Record<string, unknown> : undefined;
  const regionalConfidence = ['low', 'medium', 'high'].includes(String(rawRegionalRead?.confidence)) ? rawRegionalRead?.confidence as CoachAnalysis['confidence'] : undefined;
  const confidenceRank = { low: 0, medium: 1, high: 2 } as const;
  const regionalRead = !actualCountry && regionalConfidence && typeof rawRegionalRead?.label === 'string' && typeof rawRegionalRead.reason === 'string' && visible(rawRegionalRead.label) && visible(rawRegionalRead.reason) ? { label: decodeCoachText(rawRegionalRead.label).slice(0, 120), confidence: confidenceRank[regionalConfidence] > confidenceRank[confidence] ? confidence : regionalConfidence, reason: decodeCoachText(rawRegionalRead.reason).slice(0, 500) } : undefined;
  const safeFront = strings(core?.front, 6).filter(safe);
  const extraCards = mode === 'cards' && Array.isArray(item.extraCards) ? item.extraCards.flatMap((card) => {
    if (!card || typeof card !== 'object') return [];
    const entry = card as Record<string, unknown>;
    if (!allowedCardCategories.has(String(entry.category))) return [];
    const front = strings(entry.front, 5).filter(safe);
    return front.length && typeof entry.back === 'string' ? [{ category: String(entry.category), front, back: decodeCoachText(entry.back).slice(0, 700), clueStrength: Math.max(1, Math.min(5, Number(entry.clueStrength) || 1)) }] : [];
  }).slice(0, 2) : [];
  const analysis: CoachAnalysis = {
    confidence, region: typeof item.region === 'string' ? decodeCoachText(item.region).slice(0, 120) : '', locationEstimate, regionalRead, description: typeof item.description === 'string' ? decodeCoachText(item.description).slice(0, 1200) : undefined, candidates,
    strongClues: strings(item.strongClues).filter(visible), weakClues: strings(item.weakClues).filter(visible), contradictions: strings(item.contradictions).filter(visible), confusions: strings(item.confusions),
    nextThingsToInspect: strings(item.nextThingsToInspect).filter(visible),
    coreCard: mode === 'cards' && core ? { front: safeFront, backExplanation: typeof core.backExplanation === 'string' ? decodeCoachText(core.backExplanation).slice(0, 900) : '' } : undefined,
    extraCards,
  };
  if (mode === 'hints') return { ...analysis, region: '', regionalRead: undefined, candidates: [], strongClues: [], weakClues: [], contradictions: [], confusions: [], nextThingsToInspect: analysis.nextThingsToInspect.filter(safe), coreCard: undefined, extraCards: [] };
  if (mode === 'clue-safe') return { ...analysis, region: '', regionalRead: undefined, description: analysis.description && safe(analysis.description) ? analysis.description : undefined, candidates: [], strongClues: analysis.strongClues.filter(safe), weakClues: analysis.weakClues.filter(safe), contradictions: analysis.contradictions.filter(safe), confusions: [], nextThingsToInspect: analysis.nextThingsToInspect.filter(safe), coreCard: undefined, extraCards: [] };
  if (mode === 'clue') return { ...analysis, coreCard: undefined, extraCards: [] };
  if (mode === 'explain') return { ...analysis, region: '', locationEstimate: undefined, regionalRead: undefined, candidates: [] };
  return analysis;
}

const englishLeakWords = new Set(['the', 'and', 'this', 'that', 'with', 'from', 'which', 'where', 'other', 'look', 'likely', 'common', 'road', 'sign', 'country', 'overall', 'suggests', 'found', 'appears', 'nearby', 'buildings', 'vehicles', 'lighting', 'daytime', 'background', 'check', 'style', 'used', 'green', 'yellow']);
export function coachLanguageMatches(analysis: CoachAnalysis, language = 'en') {
  if (language === 'en') return true;
  const text = [analysis.region, analysis.description, analysis.regionalRead?.label, analysis.regionalRead?.reason, ...analysis.candidates.flatMap((item) => item.rationale || []), ...analysis.strongClues, ...analysis.weakClues, ...(analysis.contradictions || []), ...analysis.confusions, ...analysis.nextThingsToInspect].filter(Boolean).join(' ').toLowerCase();
  const words = text.match(/[a-zÀ-ž]+/gu) || [];
  const english = words.filter((word) => englishLeakWords.has(word)).length;
  return english < 8 || english / Math.max(words.length, 1) < .12;
}

const vagueRationale = [
  /consistent with|similar to|common in|typical of/iu,
  /coerente con|simile (?:a|agli?|alle?)|comune in|tipic[oa]/iu,
  /coherente con|similar a|común en|típic[oa]/iu,
  /coerente com|semelhante a|comum em|típic[oa]/iu,
  /cohérent avec|similaire à|courant en|typique de/iu,
  /entspricht|ähnlich(?:e|er|es)?|typisch für/iu,
  /характерн\w* для|похож\w* на|типичн\w* для/iu,
  /stämmer överens med|liknar|typisk(?:t)? för/iu,
];
export const coachRationalesAreSpecific = (analysis: CoachAnalysis) => analysis.candidates.every((candidate) => !!candidate.rationale && (candidate.rationale.length >= 180 || !vagueRationale.some((pattern) => pattern.test(candidate.rationale!))));

export async function callGeminiCoach(carousel: GeminiKeyCarousel, request: { mode: CoachMode; mimeType: string; imageData: string; frames?: Array<{ mimeType: string; imageData: string }>; context?: Record<string, unknown>; language?: string; style?: CoachStyle; depth?: ExplanationDepth }, fetcher: typeof fetch = fetch) {
  if (!carousel.size) throw new Error('No Gemini keys are configured.');
  const models = (process.env.GEMINI_COACH_MODELS || 'gemini-2.5-flash-lite,gemini-2.5-flash').split(',').map((model) => model.trim()).filter(Boolean);
  const deadline = Date.now() + 60_000;
  let lastError = new Error('Gemini Coach is unavailable.');
  let groundedFallback: { analysis: CoachAnalysis; model: string; generatedAt: number } | undefined;
  for (const model of models) {
    for (let attempt = 0; attempt < Math.max(1, carousel.size); attempt++) {
      if (Date.now() >= deadline) throw new Error('Gemini request timed out.');
      const state = carousel.next();
      if (!state) throw new Error('All Gemini keys are cooling down.');
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Math.min(request.mode === 'analyze360' ? 35_000 : 25_000, deadline - Date.now()));
      try {
        const context = ['hints', 'analyze', 'clue', 'clue-safe'].includes(request.mode) ? undefined : request.context;
        const knowledge = context ? getCountryKnowledge(String(context.actualCountry || ''), 6) : [];
        const metaKnowledge = context && request.mode === 'explain' ? getCountryMetaKnowledge(String(context.actualCountry || ''), 8) : [];
        const response = await fetcher(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
          method: 'POST', signal: controller.signal,
          headers: { 'content-type': 'application/json', 'x-goog-api-key': state.key },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: rules }] },
            contents: [{ role: 'user', parts: [{ text: buildCoachPrompt(request.mode, context, knowledge, metaKnowledge, request.language, request.style, request.depth) }, ...(request.frames || [request]).map((frame) => ({ inlineData: { mimeType: frame.mimeType, data: frame.imageData } }))] }],
            generationConfig: { temperature: 0.25, maxOutputTokens: request.depth === 'deep' ? 3400 : request.depth === 'short' ? 1600 : 2400, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: 'application/json', responseSchema },
          }),
        });
        if (response.status === 429) { carousel.cooldown(state); lastError = new Error('Gemini quota exceeded.'); continue; }
        if (response.status === 404) { lastError = new Error(`${model} is unavailable.`); break; }
        if (!response.ok) { lastError = new Error(response.status >= 500 ? 'Gemini service error.' : 'Gemini request was rejected.'); continue; }
        const raw = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
        const text = raw.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
        if (!text) { lastError = new Error('Gemini returned an empty response.'); continue; }
        const analysis = normalizeCoachAnalysis(JSON.parse(text), request.mode, String(context?.actualCountry || ''));
        if (!coachLanguageMatches(analysis, request.language)) { lastError = new Error('Gemini returned mixed-language output.'); continue; }
        if (['analyze', 'analyze360', 'clue'].includes(request.mode) && !coachRationalesAreSpecific(analysis)) { groundedFallback ||= { analysis, model, generatedAt: Date.now() }; lastError = new Error('Gemini returned vague candidate reasoning.'); continue; }
        return { analysis, model, generatedAt: Date.now() };
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') { lastError = new Error('Gemini request timed out.'); break; }
        lastError = error as Error;
      } finally {
        clearTimeout(timeout);
      }
    }
  }
  if (groundedFallback) return groundedFallback;
  throw lastError;
}

export async function fetchStreetViewFrame(view: unknown, googleKey: string, fetcher: typeof fetch = fetch, timeoutMs = 8_000) {
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
  let response: Response;
  try {
    response = await fetcher(`https://maps.googleapis.com/maps/api/streetview?${query}`, { headers: { referer: 'http://localhost:3000/' }, signal: AbortSignal.timeout(timeoutMs) });
  } catch (error) {
    if (error instanceof Error && (error.name === 'TimeoutError' || error.name === 'AbortError')) throw new Error('Street View capture timed out. Try again.');
    throw error;
  }
  if (!response.ok) throw new Error(`Street View capture failed (${response.status}). Add Street View Static API to this key's API restrictions in Google Cloud.`);
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
      const mode = value.mode as CoachMode | 'capture';
      if (mode === 'capture') {
        const frame = await fetchStreetViewFrame(value.view, googleKey);
        res.statusCode = 200;
        res.setHeader('content-type', 'application/json');
        res.end(JSON.stringify({ imageDataUrl: `data:${frame.mimeType};base64,${frame.imageData}` }));
        return;
      }
      const suppliedMime = String(value.mimeType || '');
      const suppliedData = String(value.imageData || '');
      const supplied = ['image/jpeg', 'image/png', 'image/webp'].includes(suppliedMime) && /^[A-Za-z0-9+/=]+$/.test(suppliedData);
      const frames = supplied ? [{ mimeType: suppliedMime, imageData: suppliedData }] : mode === 'analyze360' ? await fetchStreetViewFrames(value.view, googleKey) : [await fetchStreetViewFrame(value.view, googleKey)];
      if (!['hints', 'analyze', 'analyze360', 'explain', 'cards', 'clue', 'clue-safe'].includes(mode) || frames.some((frame) => !['image/jpeg', 'image/png', 'image/webp'].includes(frame.mimeType) || !/^[A-Za-z0-9+/=]+$/.test(frame.imageData))) throw new Error('Invalid Coach request.');
      const language = typeof value.language === 'string' && Object.prototype.hasOwnProperty.call(aiLanguageNames, value.language) ? value.language : 'en';
      const style = validStyles.has(String(value.style)) ? value.style as CoachStyle : 'quick'; const depth = validDepths.has(String(value.depth)) ? value.depth as ExplanationDepth : 'normal';
      const result = await callGeminiCoach(carousel, { mode, ...frames[0], frames, language, style, depth, context: sanitizeCoachContext(value.context) });
      res.statusCode = 200; res.setHeader('content-type', 'application/json'); res.end(JSON.stringify(result));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Coach unavailable.';
      res.statusCode = /timed out/i.test(message) ? 504 : /quota|cooling down/i.test(message) ? 429 : 503;
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify({ error: message }));
    }
  };
}
