import fs from 'node:fs/promises';
import path from 'node:path';
import { loadGeminiKeys } from '../server/aiCoach';

type SourceTip = { id: string; section: string; text: string; note?: string | null };
type Country = { code: string; tips: SourceTip[] };
type Translation = Pick<SourceTip, 'id' | 'section' | 'text'> & { note?: string | null };
type Asset = { code: string; language: string; tips: Translation[] };

const languages = { es: 'Spanish', pt: 'Portuguese', fr: 'French', de: 'German', it: 'Italian', ru: 'Russian', sv: 'Swedish' } as const;
const sourcePath = 'C:/Users/user-MSI/Downloads/plonkit-map-tips.json';
const outputDir = 'public/meta-courses';
const batchCharLimit = Number(process.env.META_COURSE_BATCH_CHAR_LIMIT || 9000);
const minimumRequestIntervalMs = Number(process.env.META_COURSE_REQUEST_INTERVAL_MS || 4_000);
const workerCount = 1;
const source = JSON.parse(await fs.readFile(sourcePath, 'utf8')) as { countries: Country[] };
const countries = source.countries.filter((country) => /^[A-Z]{2}$/u.test(country.code) && country.tips?.length);
const keys = loadGeminiKeys();
if (!keys.length) throw new Error('No Gemini keys are configured.');
const disabledKeys = new Set<string>();
const keyCooldowns = new Map<string, number>();
let lastRequestAt = 0;
await fs.mkdir(outputDir, { recursive: true });

function chunks(tips: SourceTip[]) {
  const result: SourceTip[][] = [];
  let batch: SourceTip[] = [];
  let chars = 0;
  for (const tip of tips) {
    const size = JSON.stringify(tip).length;
    if (batch.length && chars + size > batchCharLimit) { result.push(batch); batch = []; chars = 0; }
    batch.push(tip);
    chars += size;
  }
  if (batch.length) result.push(batch);
  return result;
}

function preserved(source: string, translated: string) {
  return preservationIssues(source, translated).length === 0;
}

function preservationIssues(source: string, translated: string) {
  const stripUrls = (value: string) => value.replace(/https?:\/\/[^)\s\]]+/gu, '');
  const urls = (value: string) => value.match(/https?:\/\/[^)\s\]]+/gu) || [];
  const linkDestinations = (value: string) => [...value.matchAll(/\]\(([^)]+)\)/gu)].map((match) => match[1]);
  const markers = (value: string) => stripUrls(value).match(/\*\*|__|~~|!!|(?<!\*)\*(?!\*)|(?<!_)_(?!_)/gu) || [];
  const numbers = (value: string) => stripUrls(value).match(/\d+(?:[.,]\d+)?%?/gu) || [];
  const issues = [];
  if (JSON.stringify(urls(source)) !== JSON.stringify(urls(translated)) || JSON.stringify(linkDestinations(source)) !== JSON.stringify(linkDestinations(translated))) issues.push('URLs/links');
  if (JSON.stringify(markers(source).sort()) !== JSON.stringify(markers(translated).sort())) issues.push('Markdown');
  if (JSON.stringify(numbers(source).sort()) !== JSON.stringify(numbers(translated).sort())) issues.push('numbers');
  return issues;
}

async function translateBatch(language: string, countryCode: string, batch: SourceTip[], keyOffset: number, maxAttempts?: number) {
  const input = batch.map(({ id, section, text, note }) => ({ id: `${countryCode}-${id}`, section, text, ...(note ? { note } : {}) }));
  const prompt = `Translate the section headings and GeoGuessr learning tips from English into ${language}. Translate section, text, and note naturally and accurately. Preserve factual meaning, country/place names, quoted sign text, road codes, abbreviations, numbers, URLs, and markdown link destinations. Keep markdown formatting and links intact. Do not add facts. Return each input ID exactly once and include translated section and text; include note only when input has a non-empty note. Return only JSON.\n${JSON.stringify(input)}`;
  let error = '';
  let cursor = keyOffset;
  let attempts = 0;
  let cooldownRounds = 0;
  while (attempts < (maxAttempts ?? Math.max(3, keys.length * 2))) {
    const now = Date.now();
    const active = keys.filter((key) => !disabledKeys.has(key));
    if (!active.length) break;
    const available = keys.map((key, index) => ({ key, index })).filter(({ key }) => !disabledKeys.has(key) && (keyCooldowns.get(key) || 0) <= now);
    if (!available.length) {
      if (++cooldownRounds > 3) {
        console.log(`${language}: ${countryCode} stopped after ${cooldownRounds - 1} quota cooldown rounds; completed batches remain saved for resume`);
        break;
      }
      const nextAvailable = Math.min(...active.map((key) => keyCooldowns.get(key) || 0));
      console.log(`${language}: ${countryCode} waiting ${Math.ceil(Math.max(0, nextAvailable - now) / 1000)}s for a cooled key`);
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, nextAvailable - now)));
      continue;
    }
    const selected = available.find(({ index }) => index >= cursor) || available[0];
    const { key, index } = selected;
    cursor = (index + 1) % keys.length;
    const waitMs = Math.max(0, lastRequestAt + minimumRequestIntervalMs - Date.now());
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastRequestAt = Date.now();
    let response: Response;
    try {
      response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        signal: AbortSignal.timeout(45_000),
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: {
          temperature: 0, maxOutputTokens: 16384, thinkingConfig: { thinkingBudget: 0 }, responseMimeType: 'application/json',
          responseSchema: { type: 'ARRAY', items: { type: 'OBJECT', properties: { id: { type: 'STRING' }, section: { type: 'STRING' }, text: { type: 'STRING' }, note: { type: 'STRING' } }, required: ['id', 'section', 'text'] } },
        } }),
      });
    } catch {
      attempts++;
      error = 'Gemini request failed or timed out';
      console.log(`${language}: ${countryCode} request timed out or failed; retrying on another key`);
      continue;
    }
    if (!response.ok) {
      error = `Gemini returned ${response.status}`;
      if (response.status === 403) {
        disabledKeys.add(key);
        attempts++;
        console.log(`${language}: ${countryCode} key ${index + 1}/${keys.length} unavailable (403); trying next configured key`);
      }
      else if (response.status === 429) {
        const body = await response.json().catch(() => null) as { error?: { message?: string } } | null;
        const retrySeconds = Number(body?.error?.message?.match(/retry in ([\d.]+)s/iu)?.[1] || 55);
        keyCooldowns.set(key, Date.now() + (retrySeconds + 2) * 1000);
        attempts++;
        console.log(`${language}: ${countryCode} key ${index + 1}/${keys.length} rate limited; retry in about ${retrySeconds}s`);
      } else if (response.status === 503) keyCooldowns.set(key, Date.now() + 5_000);
      else attempts++;
      continue;
    }
    try {
      const raw = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const body = raw.candidates?.[0]?.content?.parts?.find((part) => part.text)?.text;
      if (!body) { error = 'Gemini returned no translation'; continue; }
      const translated = JSON.parse(body) as Translation[];
      const byId = new Map(translated.map((item) => [item.id, item]));
      const sourcePreservationFailures = batch.flatMap((tip) => {
        const item = byId.get(`${countryCode}-${tip.id}`);
        if (!item) return [`${tip.id}:missing`];
        const failures: string[] = [];
        for (const field of ['section', 'text', ...(tip.note ? ['note'] : [])] as const) {
          if (!item[field]?.trim()) failures.push(`${tip.id}:${field}:empty`);
          else failures.push(...preservationIssues(tip[field] || '', item[field]).map((issue) => `${tip.id}:${field}:${issue}`));
        }
        if (!tip.note && item.note?.trim()) failures.push(`${tip.id}:unexpected-note`);
        return failures;
      });
      if (translated.length !== batch.length || byId.size !== batch.length || sourcePreservationFailures.length) {
        error = 'Gemini returned an incomplete batch or changed source facts, URLs, or Markdown';
        console.log(`${language}: ${countryCode} batch rejected by completeness/preservation checks (${sourcePreservationFailures.slice(0, 8).join(', ') || 'ID count'}); retrying on another key`);
        attempts++;
        continue;
      }
      return input.map(({ id }) => byId.get(id)!);
    } catch { error = 'Gemini returned invalid JSON'; attempts++; }
  }
  throw new Error(error || 'Translation failed');
}

const largeBatchProbe = process.argv.includes('--probe-large-batch');
if (largeBatchProbe) {
  const country = countries.find((item) => item.code === 'US');
  if (!country) throw new Error('US sample course is unavailable');
  const batch = chunks(country.tips)[0];
  console.log(`Large batch probe: ${batch.length} tips / ${batch.reduce((sum, tip) => sum + JSON.stringify(tip).length, 0)} source characters; one request maximum`);
  try {
    await translateBatch('Spanish', country.code, batch, 1, 1);
    console.log('Large batch probe passed ID, URL, number, Markdown, and completeness validation; no asset was written.');
  } catch (error) {
    console.log(`Large batch probe stopped safely: ${error instanceof Error ? error.message : 'request failed'}`);
    process.exitCode = 1;
  }
} else {

for (const [locale, language] of Object.entries(languages)) {
  let translatedCount = 0;
  let nextCountryIndex = 0;
  const worker = async () => {
    while (nextCountryIndex < countries.length) {
    const countryIndex = nextCountryIndex++;
    const country = countries[countryIndex];
    const outputPath = path.join(outputDir, `${country.code.toLowerCase()}.${locale}.json`);
    const existing = await fs.readFile(outputPath, 'utf8').then((text) => JSON.parse(text) as Asset).catch(() => ({ code: country.code, language: locale, tips: [] }));
    const byId = new Map<string, Translation>(existing.tips.map((tip): [string, Translation] => [tip.id, tip]));
    const pending = country.tips.filter((tip) => {
      const saved = byId.get(`${country.code}-${tip.id}`);
      return !saved?.section || !saved.text || (!!tip.note && !saved.note);
    });
    const batches = chunks(pending);
    for (const [batchIndex, batch] of batches.entries()) {
      const translated = await translateBatch(language, country.code, batch, countryIndex + batchIndex);
      translated.forEach((tip) => byId.set(tip.id, tip));
      const tips = country.tips.flatMap((tip) => {
        const saved = byId.get(`${country.code}-${tip.id}`);
        return saved ? [saved] : [];
      });
      await fs.writeFile(outputPath, `${JSON.stringify({ code: country.code, language: locale, tips })}\n`, 'utf8');
      translatedCount += translated.length;
      console.log(`${locale}: ${country.code} batch ${batchIndex + 1}/${batches.length}; ${translatedCount} tips translated this locale`);
    }
    console.log(`${locale}: ${country.code} complete`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(workerCount, countries.length) }, worker));
  console.log(`${locale}: translated ${translatedCount} tips; existing completed tips were reused`);
}

const missing: string[] = [];
for (const [locale] of Object.entries(languages)) for (const country of countries) {
  const assetPath = path.join(outputDir, `${country.code.toLowerCase()}.${locale}.json`);
  const asset = JSON.parse(await fs.readFile(assetPath, 'utf8')) as Asset;
  const byId = new Map<string, Translation>(asset.tips.map((tip) => [tip.id, tip]));
  for (const tip of country.tips) {
    const saved = byId.get(`${country.code}-${tip.id}`);
    if (!saved?.section || !saved.text || (!!tip.note && !saved.note)) missing.push(`${country.code}-${tip.id}:${locale}`);
    if (saved && (!preserved(tip.section, saved.section) || !preserved(tip.text, saved.text) || (!!tip.note && !preserved(tip.note, saved.note || '')))) missing.push(`${country.code}-${tip.id}:${locale}:source-preservation`);
    if (saved && /\\u[0-9a-f]{4}|�/iu.test(`${saved.section} ${saved.text} ${saved.note || ''}`)) missing.push(`${country.code}-${tip.id}:${locale}:encoding`);
  }
  if (asset.tips.length !== country.tips.length) missing.push(`${country.code}:${locale}:count`);
}
if (missing.length) throw new Error(`Translation QA failed for ${missing.length} entries; first: ${missing.slice(0, 8).join(', ')}`);
console.log(`QA passed: ${countries.length} countries × ${Object.keys(languages).length} locales; ${countries.reduce((sum, country) => sum + country.tips.length, 0)} tips per locale.`);
}
