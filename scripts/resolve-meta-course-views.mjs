#!/usr/bin/env node
// Resolve Plonk It map links to their exact Google Street View spawn metadata.
// Run: node scripts/resolve-meta-course-views.mjs [--limit 20] [--delay-ms 500]

import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const root = fileURLToPath(new URL('../public/meta-courses/', import.meta.url));
const checkpointPath = fileURLToPath(new URL('../public/meta-courses/views.progress.json', import.meta.url));
const viewsDir = fileURLToPath(new URL('../public/meta-courses/views/', import.meta.url));
const viewsManifestPath = fileURLToPath(new URL('../public/meta-courses/views/manifest.json', import.meta.url));
const number = '(-?\\d+(?:\\.\\d+)?)';
const atPattern = new RegExp(`/maps/@${number},${number},[^/]*`);

export function viewFromGoogleMapsUrl(value) {
  let url;
  try { url = new URL(value); } catch { return null; }
  const host = url.hostname.toLowerCase();
  if (!/(^|\.)google\.(?:com|[a-z]{2}|(?:com|co)\.[a-z]{2})$/.test(host)) return null;

  const params = url.searchParams;
  let panoId = params.get('pano');
  let lat;
  let lng;
  let heading;
  let pitch;
  if (panoId && params.get('viewpoint')) {
    [lat, lng] = params.get('viewpoint').split(',').map(Number);
    heading = Number(params.get('heading') || 0);
    pitch = Number(params.get('pitch') || 0);
  } else {
    const matched = url.pathname.match(atPattern);
    const pano = url.pathname.match(/!1s([^!/?]+)/);
    if (!matched || !pano) return null;
    panoId = decodeURIComponent(pano[1]);
    lat = Number(matched[1]);
    lng = Number(matched[2]);
    const headingMatch = matched[0].match(/(-?\d+(?:\.\d+)?)h(?:,|$)/);
    const tiltMatch = matched[0].match(/(-?\d+(?:\.\d+)?)t(?:,|$)/);
    heading = headingMatch ? Number(headingMatch[1]) : 0;
    pitch = tiltMatch ? 90 - Number(tiltMatch[1]) : 0;
  }
  if (!panoId || !Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180
    || !Number.isFinite(heading) || !Number.isFinite(pitch)) return null;
  return { panoId, lat, lng, heading: ((heading % 360) + 360) % 360, pitch: Math.max(-90, Math.min(90, pitch)) };
}

function retryAfterMs(header) {
  if (!header) return 0;
  const seconds = /^\d+$/.test(header.trim()) ? Number(header) : NaN;
  const deadline = Number.isFinite(seconds) ? Date.now() + seconds * 1000 : Date.parse(header);
  return Number.isFinite(deadline) ? Math.max(0, deadline - Date.now()) : 0;
}

async function atomicJson(path, data) {
  const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, `${JSON.stringify(data)}\n`, 'utf8');
  await rename(temporary, path);
}

async function writeViewsManifest(courses) {
  const countries = [];
  for (const { code } of courses) {
    try {
      const sidecar = JSON.parse(await readFile(`${viewsDir}${code}.json`, 'utf8'));
      if (sidecar.code === code && Array.isArray(sidecar.views) && sidecar.views.length) {
        countries.push({ code, file: `${code}.json`, viewCount: sidecar.views.length });
      }
    } catch (error) { if (error.code !== 'ENOENT') throw error; }
  }
  await atomicJson(viewsManifestPath, { countries });
}

async function followMapLink(link, state) {
  let url = new URL(link);
  for (let redirect = 0; redirect < 5; redirect++) {
    const direct = viewFromGoogleMapsUrl(url.href);
    if (direct) return direct;
    if (!['goo.gl', 'maps.app.goo.gl'].includes(url.hostname.toLowerCase())) return null;
    for (let attempt = 0; attempt < 3; attempt++) {
      let response;
      try {
        response = await fetch(url, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(30_000) });
      } catch (error) {
        if (attempt === 2) throw error;
        await sleep(10_000 * 2 ** attempt);
        continue;
      }
      if (response.status === 429) {
        const delay = Math.max(retryAfterMs(response.headers.get('Retry-After')), 60_000 * 2 ** attempt);
        state.cooldownUntil = Date.now() + delay;
        await atomicJson(checkpointPath, state);
        console.warn(`Map link HTTP 429; cooldown ${Math.ceil(delay / 1000)}s`);
        if (attempt === 2 || delay > 3_600_000) throw new Error('Map link rate limit persists; resume later');
        await sleep(delay);
        continue;
      }
      if (response.status >= 500 || response.status === 408) {
        if (attempt === 2) throw new Error(`Map link HTTP ${response.status}`);
        await sleep(10_000 * 2 ** attempt);
        continue;
      }
      const next = response.headers.get('location');
      if (!next) return null;
      url = new URL(next, url);
      state.cooldownUntil = 0;
      break;
    }
  }
  return viewFromGoogleMapsUrl(url.href);
}

async function main() {
  const args = process.argv.slice(2);
  let limit = Infinity;
  let delayMs = 500;
  for (let i = 0; i < args.length; i++) {
    const flag = args[i];
    const value = Number(args[++i]);
    if (!['--limit', '--delay-ms'].includes(flag) || !Number.isSafeInteger(value) || value < (flag === '--limit' ? 1 : 0)) {
      throw new Error(`Invalid option: ${flag}`);
    }
    if (flag === '--limit') limit = value;
    else delayMs = value;
  }
  const manifest = JSON.parse(await readFile(`${root}manifest.json`, 'utf8'));
  let state = { version: 1, views: {}, cooldownUntil: 0 };
  try {
    state = JSON.parse(await readFile(checkpointPath, 'utf8'));
    if (state.version !== 1 || !state.views || typeof state.views !== 'object') throw new Error('Invalid view checkpoint');
  } catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(viewsDir, { recursive: true });
  if (state.cooldownUntil > Date.now()) await sleep(state.cooldownUntil - Date.now());
  let fetched = 0;
  let stopped = false;
  for (const country of manifest) {
    const data = JSON.parse(await readFile(`${root}${country.code}.json`, 'utf8'));
    for (const tip of data.tips) {
      if (Object.hasOwn(state.views, tip.id)) continue;
      if (fetched >= limit) break;
      try {
        await sleep(delayMs);
        state.views[tip.id] = await followMapLink(tip.mapUrl, state);
        await atomicJson(checkpointPath, state);
        fetched++;
      } catch (error) {
        console.error(`${tip.id}: ${error.message}`);
        await atomicJson(checkpointPath, state);
        stopped = true;
        break;
      }
    }
    const views = data.tips.flatMap((tip) => state.views[tip.id] ? [{ id: tip.id, ...state.views[tip.id] }] : []);
    await atomicJson(`${viewsDir}${country.code}.json`, { code: country.code, views });
    const checked = data.tips.filter((tip) => Object.hasOwn(state.views, tip.id)).length;
    console.log(`${country.code}: ${checked}/${data.tips.length} checked, ${views.length} exact views`);
    if (fetched >= limit || stopped) break;
  }
  const checked = Object.keys(state.views).length;
  const resolved = Object.values(state.views).filter(Boolean).length;
  await writeViewsManifest(manifest);
  console.log(`Total: ${checked}/${manifest.reduce((sum, country) => sum + country.lessonCount, 0)} checked, ${resolved} exact views`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === resolve(process.argv[1])) {
  main().catch((error) => { console.error(error.message); process.exitCode = 1; });
}
