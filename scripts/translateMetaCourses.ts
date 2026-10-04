import fs from 'node:fs/promises';
import path from 'node:path';
import { loadGeminiKeys } from '../server/aiCoach';
import { loadEnv } from 'vite';

type SourceTip = { id: string; section: string; text: string; note?: string | null };
type Country = { code: string; tips: SourceTip[] };
type Translation = Pick<SourceTip, 'id' | 'section' | 'text'> & { note?: string | null };
type Asset = { code: string; language: string; tips: Translation[] };

const languages = { es: 'Spanish', pt: 'Portuguese', fr: 'French', de: 'German', it: 'Italian', ru: 'Russian', sv: 'Swedish' } as const;
const models = (process.env.META_COURSE_MODELS || 'gemini-3.1-flash-lite,gemini-3.5-flash-lite,gemini-3.5-flash').split(',').map((model) => model.trim()).filter(Boolean);
const requestedCountries = (process.env.META_COUNTRIES || '').split(',').filter(Boolean);
const excludedCountries = new Set((process.env.META_EXCLUDE_COUNTRIES || '').split(',').filter(Boolean));
const selectedLanguages = Object.entries(languages).filter(([locale]) => !process.env.META_LOCALES || process.env.META_LOCALES.split(',').includes(locale));
const outputDir = 'public/meta-courses';
const batchCharLimit = Number(process.env.META_COURSE_BATCH_CHAR_LIMIT || 9000);
const minimumRequestIntervalMs = Number(process.env.META_COURSE_REQUEST_INTERVAL_MS || 1_000);
const workerCount = Number(process.env.META_COURSE_WORKERS || 4);
const files = (await fs.readdir(outputDir)).filter((file) => /^[A-Z]{2}\.json$/.test(file) && (!requestedCountries.length || requestedCountries.includes(file.slice(0, 2))) && !excludedCountries.has(file.slice(0, 2)));
const countries = await Promise.all(files.map(async (file) => {
  const country = JSON.parse(await fs.readFile(path.join(outputDir, file), 'utf8')) as Country;
  return { ...country, tips: country.tips.map((tip) => ({ ...tip, id: tip.id.replace(`${country.code}-`, '') })) };
}));
const keys = loadGeminiKeys({ ...loadEnv('development', process.cwd(), ''), ...process.env });
if (!keys.length) throw new Error('No Gemini keys are configured.');
const disabledKeys = new Set<string>();
const disabledKeyModels = new Set<string>();
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

function protectSource(value: string, tokens: Map<string, string>) {
  let index = tokens.size;
  return value.replace(/https?:\/\/[^\s)\]]+|"[^"\n]+"|“[^”\n]+”|‘[^’\n]+’|'[^'\n]{2,}'|\d+(?:[.,]\d+)?%?|\*\*|__|~~|!!|(?<!\*)\*(?!\*)|(?<!_)_(?!_)/gu, (literal) => {
    if (literal.startsWith("'") && !/[A-Z0-9]/u.test(literal)) return literal;
    const token = `QXZKEEP${String(index++).padStart(5, '0')}ZQX`;
    tokens.set(token, literal);
    return token;
  });
}

function restoreSource(value: string, tokens: Map<string, string>) {
  for (const [token, literal] of tokens) {
    value = value.split(token).join(literal);
  }
  return value;
}

async function translateBatch(language: string, countryCode: string, batch: SourceTip[], keyOffset: number, maxAttempts?: number) {
  const input = batch.map(({ id, section, text, note }) => ({ id: `${countryCode}-${id}`, section, text, ...(note ? { note } : {}) }));
  const protectedTokens = new Map<string, string>();
  const protectedInput = input.map((tip) => Object.fromEntries(Object.entries(tip).map(([key, value]) => [key, key === 'id' ? value : protectSource(value, protectedTokens)])) as Translation);
  const prompt = `Translate the section headings and GeoGuessr learning tips from English into ${language}. Translate naturally and accurately. Preserve factual meaning. Copy every QXZKEEP token exactly once; these tokens protect quoted sign text, road codes, numbers, URLs, and markdown formatting, and must not be translated or edited. Translate link labels while leaving the adjacent protected destination and markdown intact. Do not add facts or notes that are absent from the input. Return each input ID exactly once and include translated section and text; include note only when input has a non-empty note. Return only JSON.\n${JSON.stringify(protectedInput)}`;
  let error = '';
  let cursor = keyOffset % (keys.length * models.length);
  let attempts = 0;
  let validationFailures = 0;
  while (attempts < (maxAttempts ?? Math.max(3, keys.length * models.length * 2))) {
    const now = Date.now();
    const pairs = keys.flatMap((key, index) => models.map((model, modelIndex) => ({ key, index, model, slot: index * models.length + modelIndex, pairId: `${index}:${model}` })));
    const active = pairs.filter(({ key, pairId }) => !disabledKeys.has(key) && !disabledKeyModels.has(pairId));
    if (!active.length) break;
    const available = active.filter(({ pairId }) => (keyCooldowns.get(pairId) || 0) <= now);
    if (!available.length) {
      const nextAvailable = Math.min(...active.map(({ pairId }) => keyCooldowns.get(pairId) || 0));
      console.log(`${language}: ${countryCode} waiting ${Math.ceil(Math.max(0, nextAvailable - now) / 1000)}s for a cooled key`);
      await new Promise((resolve) => setTimeout(resolve, Math.max(1, nextAvailable - now)));
      continue;
    }
    const selected = available.find(({ slot }) => slot >= cursor) || available[0];
    const { key, index, model, slot, pairId } = selected;
    cursor = (slot + 1) % (keys.length * models.length);
    const waitMs = Math.max(0, lastRequestAt + minimumRequestIntervalMs - Date.now());
    if (waitMs) await new Promise((resolve) => setTimeout(resolve, waitMs));
    lastRequestAt = Date.now();
    let response: Response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        redirect: 'error',
        headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
        signal: AbortSignal.timeout(45_000),
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: prompt }] }], generationConfig: {
          temperature: 0, maxOutputTokens: Math.max(2048, Math.min(4096, Math.ceil(prompt.length * .6))), responseMimeType: 'application/json',
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
        const body = await response.json().catch(() => null) as { error?: { message?: string; details?: Array<{ violations?: Array<{ quotaMetric?: string; quotaId?: string }> }> } } | null;
        const quotaIds = [...new Set((body?.error?.details || []).flatMap((detail) => (detail.violations || []).flatMap((violation) => [violation.quotaMetric, violation.quotaId].filter((value): value is string => !!value))))];
        const quotaSummary = quotaIds.join(', ').slice(0, 220);
        const quotaKind = /per[_ -]?day|daily|requestsperday|rpd/iu.test(quotaSummary) ? 'daily quota'
          : /per[_ -]?minute|requestsperminute|rpm|rate/iu.test(quotaSummary) ? 'rate limit' : 'unspecified quota';
        const retrySeconds = Number(body?.error?.message?.match(/retry in ([\d.]+)s/iu)?.[1] || 55);
        if (quotaKind === 'daily quota') disabledKeyModels.add(pairId);
        else keyCooldowns.set(pairId, Date.now() + (retrySeconds + 2) * 1000);
        console.log(`${language}: ${countryCode} ${model} key ${index + 1}/${keys.length} ${quotaKind}${quotaKind === 'daily quota' ? '; switching model' : `; retry in about ${retrySeconds}s`}${quotaSummary ? ` (${quotaSummary})` : ''}`);
        if (quotaKind !== 'daily quota') attempts++;
      } else if (response.status === 503) { keyCooldowns.set(pairId, Date.now() + 5_000); attempts++; }
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
          const restoredField = restoreSource(item[field] || '', protectedTokens);
          if (!restoredField.trim()) failures.push(`${tip.id}:${field}:empty`);
          else if ((field === 'section' && tip.section !== 'Kampala' || field === 'text') && restoredField.trim() === (tip[field] || '').trim()) failures.push(`${tip.id}:${field}:untranslated`);
          else failures.push(...preservationIssues(tip[field] || '', restoredField).map((issue) => `${tip.id}:${field}:${issue}`));
        }
        return failures;
      });
      if (translated.length !== batch.length || byId.size !== batch.length || sourcePreservationFailures.length) {
        error = 'Gemini returned an incomplete batch or changed source facts, URLs, or Markdown';
        console.log(`${language}: ${countryCode} batch rejected by completeness/preservation checks (${sourcePreservationFailures.slice(0, 8).join(', ') || 'ID count'}); retrying on another key`);
        attempts++;
        if (++validationFailures >= 3) break;
        continue;
      }
      const protectedOutput = JSON.stringify(translated);
      for (const token of protectedTokens.keys()) {
        if (protectedOutput.split(token).length - 1 !== 1) throw new Error(`Translation changed protected source token ${token}`);
      }
      const restored = input.map(({ id, note }) => {
        const translatedTip = byId.get(id)!;
        return {
          id,
          section: restoreSource(translatedTip.section, protectedTokens),
          text: restoreSource(translatedTip.text, protectedTokens),
          ...(note ? { note: restoreSource(translatedTip.note || '', protectedTokens) } : {}),
        };
      });
      const restoredText = JSON.stringify(restored);
      for (const token of protectedTokens.keys()) {
        if (restoredText.includes(token)) throw new Error(`Translation changed protected source token ${token}`);
      }
      return restored;
    } catch { error = 'Gemini returned invalid JSON'; attempts++; }
  }
  throw new Error(error || 'Translation failed');
}

async function translateBatchResilient(language: string, countryCode: string, batch: SourceTip[], keyOffset: number): Promise<Translation[]> {
  try { return await translateBatch(language, countryCode, batch, keyOffset); }
  catch (error) {
    if (batch.length < 2) throw error;
    const midpoint = Math.ceil(batch.length / 2);
    console.log(`${language}: ${countryCode} splitting a rejected ${batch.length}-tip batch and retrying smaller parts`);
    return [
      ...await translateBatchResilient(language, countryCode, batch.slice(0, midpoint), keyOffset),
      ...await translateBatchResilient(language, countryCode, batch.slice(midpoint), keyOffset + midpoint),
    ];
  }
}

const largeBatchProbe = process.argv.includes('--probe-large-batch');
if (largeBatchProbe) {
  const country = countries.find((item) => item.code === 'US');
  if (!country) throw new Error('US sample course is unavailable');
  const batch = chunks(country.tips)[0];
  console.log(`Fallback-model probe: ${batch.length} tips / ${batch.reduce((sum, tip) => sum + JSON.stringify(tip).length, 0)} source characters; writes no asset`);
  try {
    await translateBatch('Spanish', country.code, batch, 1);
    console.log('Fallback-model probe passed ID, URL, number, Markdown, and completeness validation; no asset was written.');
  } catch (error) {
    console.log(`Large batch probe stopped safely: ${error instanceof Error ? error.message : 'request failed'}`);
    process.exitCode = 1;
  }
} else {

for (const [locale, language] of selectedLanguages) {
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
      return !saved?.section || !saved.text || (!!tip.note && !saved.note)
        || (tip.section !== 'Kampala' && saved.section === tip.section)
        || saved.text === tip.text;
    });
    const batches = chunks(pending);
    let countryFailed = false;
    for (const [batchIndex, batch] of batches.entries()) {
      let translated: Translation[];
      try { translated = await translateBatchResilient(language, country.code, batch, countryIndex + batchIndex); }
      catch (error) {
        countryFailed = true;
        console.log(`${locale}: ${country.code} batch ${batchIndex + 1}/${batches.length} deferred after retries${error instanceof Error ? ` (${error.message})` : ''}`);
        break;
      }
      translated.forEach((tip) => byId.set(tip.id, tip));
      const tips = country.tips.flatMap((tip) => {
        const saved = byId.get(`${country.code}-${tip.id}`);
        return saved ? [saved] : [];
      });
      await fs.writeFile(outputPath, `${JSON.stringify({ code: country.code, language: locale, tips })}\n`, 'utf8');
      translatedCount += translated.length;
      console.log(`${locale}: ${country.code} batch ${batchIndex + 1}/${batches.length}; ${translatedCount} tips translated this locale`);
    }
    if (!countryFailed) console.log(`${locale}: ${country.code} complete`);
    }
  };
  await Promise.all(Array.from({ length: Math.min(workerCount, countries.length) }, worker));
  console.log(`${locale}: translated ${translatedCount} tips; existing completed tips were reused`);
}

const missing: string[] = [];
for (const [locale] of selectedLanguages) for (const country of countries) {
  const assetPath = path.join(outputDir, `${country.code.toLowerCase()}.${locale}.json`);
  let asset: Asset;
  try {
    asset = JSON.parse(await fs.readFile(assetPath, 'utf8')) as Asset;
  } catch {
    missing.push(`${country.code}:${locale}:missing-file`);
    continue;
  }
  const byId = new Map<string, Translation>(asset.tips.map((tip) => [tip.id, tip]));
  for (const tip of country.tips) {
    const saved = byId.get(`${country.code}-${tip.id}`);
    if (!saved?.section || !saved.text || (!!tip.note && !saved.note)) missing.push(`${country.code}-${tip.id}:${locale}`);
    if (saved && (tip.section !== 'Kampala' && saved.section === tip.section || saved.text === tip.text)) missing.push(`${country.code}-${tip.id}:${locale}:untranslated`);
    if (saved && (preservationIssues(tip.section, saved.section).includes('URLs/links') || preservationIssues(tip.text, saved.text).includes('URLs/links') || (!!tip.note && preservationIssues(tip.note, saved.note || '').includes('URLs/links')))) missing.push(`${country.code}-${tip.id}:${locale}:links`);
    if (saved && /\\u[0-9a-f]{4}|�/iu.test(`${saved.section} ${saved.text} ${saved.note || ''}`)) missing.push(`${country.code}-${tip.id}:${locale}:encoding`);
  }
  if (asset.tips.length !== country.tips.length) missing.push(`${country.code}:${locale}:count`);
}
if (missing.length) throw new Error(`Translation QA failed for ${missing.length} entries; first: ${missing.slice(0, 8).join(', ')}`);
console.log(`QA passed: ${countries.length} countries × ${selectedLanguages.length} locales; ${countries.reduce((sum, country) => sum + country.tips.length, 0)} tips per locale.`);
}
