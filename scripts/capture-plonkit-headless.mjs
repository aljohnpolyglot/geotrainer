// Usage: node scripts/capture-plonkit-headless.mjs <plonkit-map-tips.json> [output-folder] [--limit N]
// Opens one country at a time in headless Chrome, scrolls through native HTML, and saves loaded tip images.
// Re-run to resume. Stops on access denial; HTTP 429 waits and retries the same country.
import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const sleep = ms => new Promise(done => setTimeout(done, ms));
const imageUrl = value => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && /(^|\.)plonkit\.net$/.test(url.hostname) && url.pathname.startsWith('/images/');
  } catch { return false; }
};

export function countryJobs(source) {
  if (!Array.isArray(source?.countries)) throw new Error('Expected plonkit-map-tips.json with a countries array.');
  return source.countries.flatMap(country => {
    if (!/^[A-Z]{2}$/.test(country.code || '')) return [];
    let url;
    try { url = new URL(country.pageUrl); } catch { return []; }
    const slug = url.pathname.slice(1);
    if (url.protocol !== 'https:' || !/(^|\.)plonkit\.net$/.test(url.hostname) || !/^[a-z0-9-]+$/.test(slug)) return [];
    const tips = (country.tips || []).filter(tip => /^[A-Za-z0-9]{4}$/.test(tip.id || '') && imageUrl(tip.image));
    return tips.length ? [{ code: country.code, slug, url: url.href, tips }] : [];
  });
}

function chromePath() {
  const candidates = [process.env.CHROME_PATH,
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    '/usr/bin/google-chrome', '/usr/bin/chromium'];
  const found = candidates.find(candidate => candidate && existsSync(candidate));
  if (!found) throw new Error('Chrome was not found. Set CHROME_PATH to its executable.');
  return found;
}

export async function openChrome(executable = chromePath()) {
  const profile = await mkdtemp(join(tmpdir(), 'plonkit-headless-'));
  const child = spawn(executable, ['--headless=new', '--remote-debugging-port=0',
    `--user-data-dir=${profile}`, '--window-size=1600,900', '--no-first-run',
    '--no-default-browser-check', 'about:blank'], { stdio: 'ignore' });
  let socket;
  try {
    const portFile = join(profile, 'DevToolsActivePort');
    let port;
    for (let i = 0; i < 150; i++) {
      if (existsSync(portFile)) { port = Number((await readFile(portFile, 'utf8')).split(/\r?\n/)[0]); break; }
      if (child.exitCode !== null) throw new Error(`Chrome exited with code ${child.exitCode}.`);
      await sleep(100);
    }
    if (!port) throw new Error('Chrome did not start its debugging port.');
    const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
    const page = targets.find(target => target.type === 'page');
    if (!page?.webSocketDebuggerUrl) throw new Error('Chrome did not create a page target.');
    socket = new WebSocket(page.webSocketDebuggerUrl);
    await new Promise((done, fail) => {
      socket.addEventListener('open', done, { once: true });
      socket.addEventListener('error', fail, { once: true });
    });
    let sequence = 0;
    const pending = new Map(), listeners = new Map();
    socket.addEventListener('message', event => {
      const message = JSON.parse(event.data);
      if (message.id) {
        const task = pending.get(message.id);
        if (!task) return;
        pending.delete(message.id); clearTimeout(task.timeout);
        message.error ? task.reject(new Error(message.error.message)) : task.resolve(message.result);
      } else if (message.method) listeners.get(message.method)?.forEach(listener => listener(message.params));
    });
    const call = (method, params = {}) => new Promise((resolveCall, reject) => {
      const id = ++sequence;
      const timeout = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 60_000);
      pending.set(id, { resolve: resolveCall, reject, timeout });
      socket.send(JSON.stringify({ id, method, params }));
    });
    const evaluate = async expression => {
      const result = await call('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || 'Page evaluation failed');
      return result.result?.value;
    };
    await call('Page.enable'); await call('Runtime.enable'); await call('Network.enable');
    return {
      call, evaluate, on(method, listener) {
        if (!listeners.has(method)) listeners.set(method, new Set());
        listeners.get(method).add(listener);
        return () => listeners.get(method)?.delete(listener);
      },
      async close() {
        try { await call('Browser.close'); } catch { child.kill(); }
        socket.close();
        for (let i = 0; i < 10 && child.exitCode === null; i++) await sleep(200);
        if (child.exitCode === null) child.kill();
        const parent = resolve(tmpdir()), target = resolve(profile);
        if (dirname(target) === parent && basename(target).startsWith('plonkit-headless-')) {
          for (let i = 0; i < 5; i++) {
            try { await rm(target, { recursive: true, force: true }); break; }
            catch { await sleep(500); }
          }
        }
      },
    };
  } catch (error) {
    socket?.close(); child.kill();
    const parent = resolve(tmpdir()), target = resolve(profile);
    if (dirname(target) === parent && basename(target).startsWith('plonkit-headless-')) {
      try { await rm(target, { recursive: true, force: true }); } catch { /* Chrome may still be closing. */ }
    }
    throw error;
  }
}

async function waitForPage(browser, slug) {
  for (let i = 0; i < 45; i++) {
    try {
      const state = await browser.evaluate(`({ ready: document.readyState, path: location.pathname,
        payload: document.querySelector('script#__PRELOADED_DATA__')?.textContent || null })`);
      if (state?.ready === 'complete' && state.path === `/${slug}`) {
        if (!state.payload) throw new Error(`Country page ${slug} has no guide data; access may be blocked.`);
        const page = JSON.parse(state.payload)?.data?.public;
        if (page?.slug !== slug || !Array.isArray(page.steps)) throw new Error(`Country page ${slug} has mismatched guide data.`);
        return;
      }
    } catch (error) {
      if (/has no guide data|mismatched guide data/.test(error.message)) throw error;
    }
    await sleep(1000);
  }
  throw new Error(`Country page ${slug} did not load within 45 seconds.`);
}

export async function scrollPage(browser, delayMs = 1200) {
  let position = 0, atEnd = 0;
  for (let i = 0; i < 250; i++) {
    const size = await browser.evaluate(`({ height: document.scrollingElement?.scrollHeight || 0,
      viewport: window.innerHeight })`);
    position = Math.min(size.height, position + Math.max(500, Math.floor(size.viewport * 0.8)));
    await browser.evaluate(`window.scrollTo(0, ${position})`);
    await sleep(delayMs);
    atEnd = position >= size.height - size.viewport ? atEnd + 1 : 0;
    if (atEnd >= 3) break;
  }
}

export async function captureTip(browser, id, mapUrl) {
  return browser.evaluate(`(() => {
    const root = document.getElementById(${JSON.stringify(id)});
    const anchor = [...document.querySelectorAll('a[href]')].find(a => a.href === ${JSON.stringify(mapUrl || '')});
    const img = root?.querySelector('a[href] img') || anchor?.querySelector('img');
    if (!img?.complete || !img.naturalWidth) return null;
    try {
      const scale = Math.min(1, 1600 / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL('image/webp', 0.9).split(',')[1];
    } catch { return null; }
  })()`);
}

async function captureCountry(browser, country, output) {
  const folder = join(output, country.slug), images = join(folder, 'images');
  await mkdir(images, { recursive: true });
  const manifestPath = join(folder, 'manifest.json');
  let manifest;
  try { manifest = JSON.parse(await readFile(manifestPath, 'utf8')); }
  catch { manifest = { pageUrl: country.url, entries: [] }; }
  const saved = new Map(manifest.entries.filter(entry => entry.file).map(entry => [entry.url, entry]));
  const pending = country.tips.filter(tip => !saved.has(tip.image) || !existsSync(join(folder, saved.get(tip.image).file)));
  if (!pending.length) return { captured: 0, missing: 0, blocked: 0 };
  const statuses = [];
  const off = browser.on('Network.responseReceived', event => {
    if (event?.response?.url?.startsWith('https://www.plonkit.net/')) statuses.push(event.response.status);
  });
  try {
    await browser.call('Page.navigate', { url: country.url });
    await waitForPage(browser, country.slug);
    await scrollPage(browser);
    await writeFile(join(folder, 'page.html'), '<!doctype html>\n' + await browser.evaluate('document.documentElement.outerHTML'), 'utf8');
    let captured = 0;
    for (const tip of pending) {
      const data = await captureTip(browser, tip.id, tip.mapUrl);
      if (!data) continue;
      const file = `images/${country.code}-${tip.id}.webp`;
      await writeFile(join(folder, file), Buffer.from(data, 'base64'));
      saved.set(tip.image, { id: `${country.code}-${tip.id}`, url: tip.image, file, mimeType: 'image/webp' });
      manifest.entries = [...saved.values()];
      await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
      captured++;
    }
    const missing = country.tips.length - saved.size;
    return { captured, missing,
      blocked: missing && statuses.includes(403) ? 403 : missing && statuses.includes(429) ? 429 : 0 };
  } finally { off(); }
}

async function main() {
  const args = process.argv.slice(2);
  if (!args[0] || args.includes('--help')) {
    console.log('Usage: node scripts/capture-plonkit-headless.mjs <plonkit-map-tips.json> [output-folder] [--limit N]');
    return;
  }
  const input = resolve(args[0]);
  const output = resolve(args[1] && !args[1].startsWith('--') ? args[1] : join(dirname(input), 'plonkit-captures'));
  const limitAt = args.indexOf('--limit');
  const limit = limitAt >= 0 ? Number(args[limitAt + 1]) : Infinity;
  if (!(limit > 0)) throw new Error('--limit must be a positive number.');
  const countries = countryJobs(JSON.parse(await readFile(input, 'utf8'))).slice(0, limit);
  await mkdir(output, { recursive: true });
  const browser = await openChrome();
  try {
    let strikes = 0;
    for (let index = 0; index < countries.length; index++) {
      const country = countries[index];
      for (;;) {
        console.log(`[${index + 1}/${countries.length}] ${country.slug}`);
        try {
          const result = await captureCountry(browser, country, output);
          console.log(`  ${result.captured} new images; ${result.missing} still missing.`);
          if (result.blocked === 403) throw new Error('HTTP 403: access denied. Stopping.');
          if (result.blocked === 429) {
            strikes++;
            const delay = Math.min(60 * 60_000, 10 * 60_000 * 2 ** Math.min(strikes - 1, 3));
            console.warn(`  HTTP 429: waiting ${Math.ceil(delay / 60000)} minutes, then retrying this page.`);
            await sleep(delay); continue;
          }
          strikes = 0;
          break;
        } catch (error) {
          if (/access may be blocked|did not load/.test(error.message) && strikes < 3) {
            strikes++;
            const delay = 10 * 60_000 * strikes;
            console.warn(`  ${error.message} Waiting ${delay / 60000} minutes before retry.`);
            await sleep(delay); continue;
          }
          throw error;
        }
      }
      if (index + 1 < countries.length) await sleep(15_000);
    }
    console.log(`Saved HTML and images in ${output}`);
  } finally { await browser.close(); }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
