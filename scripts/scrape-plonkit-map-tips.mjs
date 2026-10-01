#!/usr/bin/env node
// Run: node scripts/scrape-plonkit-map-tips.mjs [--output path] [--delay-ms 7000] [--limit 2]
// Writes only Google Maps-linked tips. A sibling .progress.json file makes runs resumable.

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { setTimeout as sleep } from 'node:timers/promises';

const BASE = 'https://www.plonkit.net';
const DEFAULT_OUTPUT = fileURLToPath(new URL('./plonkit-map-tips.json', import.meta.url));

export function preloadedData(html) {
  const match = html.match(/<script\b[^>]*\bid=["']__PRELOADED_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) throw new Error('No __PRELOADED_DATA__ script in the page');
  const payload = JSON.parse(match[1]);
  if (!payload.success || !payload.data) throw new Error('Invalid preloaded page data');
  return payload.data;
}

function isGoogleMapsLink(link) {
  if (typeof link !== 'string') return false;
  try {
    const url = new URL(link, BASE);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    if (host === 'goo.gl') return url.pathname.startsWith('/maps/');
    if (host === 'maps.app.goo.gl') return true;
    if (!/(^|\.)google\.(?:com|[a-z]{2}|(?:com|co)\.[a-z]{2})$/.test(host)) return false;
    return host.startsWith('maps.google.') || /^\/maps(?:\/|$)/.test(url.pathname);
  } catch {
    return false;
  }
}

export function extractCountry(country, html) {
  const page = preloadedData(html).public;
  if (!page || !Array.isArray(page.steps) || page.slug !== country.slug) {
    throw new Error(`Country data missing or mismatched for ${country.slug}`);
  }

  const pageUrl = new URL(`/${country.slug}`, BASE).href;
  const tips = page.steps.flatMap(section =>
    (Array.isArray(section.items) ? section.items : [])
      .filter(item => item.kind === 'tip' && isGoogleMapsLink(item.data?.image?.imageLink))
      .map(item => {
        const lines = item.data.text;
        if (!Array.isArray(lines) || !lines.every(line => typeof line === 'string')) {
          throw new Error(`Invalid text in ${country.slug} tip ${item.id || '(no id)'}`);
        }
        const notes = lines.filter(line => /^NOTE\s*:/i.test(line));
        const text = lines.filter(line => !/^NOTE\s*:/i.test(line));
        return {
          id: item.id || null,
          section: section.title || null,
          mapUrl: new URL(item.data.image.imageLink, pageUrl).href,
          image: item.data.image.imageUrl
            ? new URL(item.data.image.imageUrl, pageUrl).href
            : null,
          text: text.join('\n\n').trim(),
          note: notes.length
            ? notes.map(line => line.replace(/^NOTE\s*:\s*/i, '')).join('\n\n')
            : null,
          fullText: lines.join('\n\n').trim(),
        };
      }),
  );

  return {
    name: country.title,
    code: country.code,
    lastUpdated: country.updatedAt,
    pageUrl,
    mapTipCount: tips.length,
    tips,
  };
}

export function retryAfterMs(header, now = Date.now()) {
  if (!header) return 0;
  const seconds = /^\d+$/.test(header.trim()) ? Number(header) : NaN;
  const deadline = Number.isFinite(seconds) ? now + seconds * 1000 : Date.parse(header);
  return Number.isFinite(deadline) ? Math.max(0, deadline - now) : 0;
}

export async function requestPage(url, state, save, fetchPage = fetch, pause = sleep) {
  for (let attempt = 0; attempt < 3; attempt++) {
    let response;
    try {
      response = await fetchPage(url, { signal: AbortSignal.timeout(30_000) });
    } catch (error) {
      if (attempt === 2) throw error;
      const delay = 10_000 * 2 ** attempt;
      console.warn(`Network error for ${url}; retrying in ${delay / 1000}s: ${error.message}`);
      await pause(delay);
      continue;
    }

    if (response.status === 429) {
      const delay = Math.max(
        retryAfterMs(response.headers.get('Retry-After')),
        60_000 * 2 ** attempt,
      );
      state.cooldownUntil = Date.now() + delay;
      await save();
      console.warn(`HTTP 429 for ${url}; cooldown ${Math.ceil(delay / 1000)}s`);
      if (attempt === 2 || delay > 3_600_000) {
        const error = new Error('HTTP 429 cooldown saved; stopping to respect the site limit');
        error.rateLimited = true;
        throw error;
      }
      await pause(delay);
      continue;
    }

    if (response.status === 408 || response.status === 425 || response.status >= 500) {
      if (attempt === 2) throw new Error(`HTTP ${response.status} after three attempts`);
      const delay = 10_000 * 2 ** attempt;
      console.warn(`HTTP ${response.status} for ${url}; retrying in ${delay / 1000}s`);
      await pause(delay);
      continue;
    }

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    state.cooldownUntil = 0;
    return response.text();
  }
  throw new Error('Request failed after three attempts');
}

async function writeJson(path, value) {
  await mkdir(dirname(path), { recursive: true });
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
  await rename(temporary, path);
}

function options(args) {
  const parsed = { output: DEFAULT_OUTPUT, delayMs: 7_000, limit: Infinity };
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    if (flag === '--help') {
      console.log('Usage: node scripts/scrape-plonkit-map-tips.mjs [--output path] [--delay-ms 7000] [--limit 2]');
      process.exit(0);
    }
    if (!['--output', '--delay-ms', '--limit'].includes(flag) || !args[i + 1]) {
      throw new Error(`Unknown or incomplete option: ${flag}`);
    }
    const value = args[++i];
    if (flag === '--output') parsed.output = resolve(value);
    else {
      const number = Number(value);
      if (!Number.isSafeInteger(number) || number < (flag === '--limit' ? 1 : 0)) {
        throw new Error(`Invalid ${flag}: ${value}`);
      }
      parsed[flag === '--limit' ? 'limit' : 'delayMs'] = number;
    }
  }
  return parsed;
}

async function main() {
  const { output, delayMs, limit } = options(process.argv.slice(2));
  const progressPath = `${output}.progress.json`;
  let state = { version: 1, records: {}, cooldownUntil: 0 };
  try {
    state = JSON.parse(await readFile(progressPath, 'utf8'));
    if (state.version !== 1 || !state.records || typeof state.records !== 'object' || Array.isArray(state.records)) {
      throw new Error('Unsupported checkpoint format');
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw new Error(`Cannot read ${progressPath}: ${error.message}`);
  }

  const save = () => writeJson(progressPath, state);
  if (state.cooldownUntil > Date.now()) {
    const delay = state.cooldownUntil - Date.now();
    console.log(`Respecting saved cooldown: ${Math.ceil(delay / 1000)}s`);
    while (state.cooldownUntil > Date.now()) {
      await sleep(Math.min(60_000, state.cooldownUntil - Date.now()));
    }
  }

  const guideHtml = await requestPage(`${BASE}/guide`, state, save);
  const countries = preloadedData(guideHtml);
  if (!Array.isArray(countries) || !countries.every(country =>
    /^[a-z0-9-]+$/.test(country.slug) && country.title && country.updatedAt
  ) || new Set(countries.map(country => country.slug)).size !== countries.length) {
    throw new Error('Guide country list is missing or invalid');
  }

  const exportResults = async () => {
    const completed = countries.flatMap(country => {
      const record = state.records[country.slug];
      return record?.lastUpdated === country.updatedAt ? [record] : [];
    });
    const withMaps = completed.filter(record => record.result.tips.length > 0);
    await writeJson(output, {
      source: `${BASE}/guide`,
      scrapedAt: new Date().toISOString(),
      totalCountriesListed: countries.length,
      completedCountries: completed.length,
      countriesWithMapInfo: withMaps.length,
      totalMapTips: withMaps.reduce((sum, record) => sum + record.result.mapTipCount, 0),
      countries: withMaps.map(record => record.result),
    });
    console.log(`${completed.length}/${countries.length} checked; ${withMaps.length} countries and ${withMaps.reduce((sum, record) => sum + record.result.mapTipCount, 0)} map-linked tips in ${output}`);
  };

  let processed = 0;
  let failures = 0;
  for (const [index, country] of countries.entries()) {
    if (state.records[country.slug]?.lastUpdated === country.updatedAt) continue;
    if (processed >= limit) break;
    await sleep(delayMs);

    console.log(`[${index + 1}/${countries.length}] ${country.title}`);
    try {
      const html = await requestPage(`${BASE}/${country.slug}`, state, save);
      const result = extractCountry(country, html);
      state.records[country.slug] = { slug: country.slug, lastUpdated: country.updatedAt, result };
      await save();
      await exportResults();
      processed++;
      failures = 0;
    } catch (error) {
      console.error(`${country.title}: ${error.message}`);
      if (error.rateLimited || ++failures >= 3) {
        console.error('Stopping with saved progress. Rerun later to retry unfinished countries.');
        break;
      }
    }
  }
  await exportResults();
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
