// Browser version: run as a Chrome DevTools Snippet on https://www.plonkit.net/guide.
// Downloads JSON; saves progress in this site's IndexedDB, not console history/localStorage.
void (window.__plonkitMapTipsTask = (async () => {
  if (!/(^|\.)plonkit\.net$/.test(location.hostname)) {
    throw new Error('Open https://www.plonkit.net/guide before running this snippet');
  }
  if (window.__plonkitMapTipsRunning) {
    console.warn('The map-tip scraper is already running in this tab.');
    return;
  }
  window.__plonkitMapTipsRunning = true;
  let db = null;
  try {
    const base = location.origin;
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const pause = async deadline => {
      while (deadline > Date.now()) await sleep(Math.min(60_000, deadline - Date.now()));
    };
    const retryAfterMs = header => {
      if (!header) return 0;
      const seconds = /^\d+$/.test(header.trim()) ? Number(header) : NaN;
      const deadline = Number.isFinite(seconds) ? Date.now() + seconds * 1000 : Date.parse(header);
      return Number.isFinite(deadline) ? Math.max(0, deadline - Date.now()) : 0;
    };
    const preloaded = html => {
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const script = doc.querySelector('script#__PRELOADED_DATA__');
      if (!script) throw new Error('Page has no preloaded guide data');
      const payload = JSON.parse(script.textContent);
      if (!payload.success || !payload.data) throw new Error('Invalid guide data');
      return payload.data;
    };
    const isMapLink = link => {
      if (typeof link !== 'string') return false;
      try {
        const url = new URL(link, base);
        const host = url.hostname.toLowerCase();
        if (!['http:', 'https:'].includes(url.protocol)) return false;
        if (host === 'goo.gl') return url.pathname.startsWith('/maps/');
        if (host === 'maps.app.goo.gl') return true;
        return /(^|\.)google\.(?:com|[a-z]{2}|(?:com|co)\.[a-z]{2})$/.test(host) &&
          (host.startsWith('maps.google.') || /^\/maps(?:\/|$)/.test(url.pathname));
      } catch {
        return false;
      }
    };

    // IndexedDB can hold the full checkpoint without the small localStorage quota.
    try {
      db = await new Promise((resolve, reject) => {
        const request = indexedDB.open('plonkit-map-tip-scraper', 1);
        request.onupgradeneeded = () => request.result.createObjectStore('checkpoint');
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.warn(`IndexedDB unavailable; progress lasts only while this tab stays open: ${error.message}`);
    }
    const readCheckpoint = () => !db ? Promise.resolve(null) : new Promise((resolve, reject) => {
      const request = db.transaction('checkpoint').objectStore('checkpoint').get('progress');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    let state = await readCheckpoint() || window.__plonkitMapTipsProgress || {
      version: 1, records: {}, cooldownUntil: 0,
    };
    if (state.version !== 1 || !state.records || Array.isArray(state.records)) {
      throw new Error('Unsupported saved checkpoint format');
    }
    const save = () => {
      window.__plonkitMapTipsProgress = state;
      if (!db) return Promise.resolve();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction('checkpoint', 'readwrite');
        transaction.objectStore('checkpoint').put(state, 'progress');
        transaction.oncomplete = resolve;
        transaction.onerror = () => reject(transaction.error);
      });
    };

    const requestPage = async url => {
      for (let attempt = 0; attempt < 3; attempt++) {
        let response;
        try {
          response = await fetch(url, {
            credentials: 'include', signal: AbortSignal.timeout(30_000),
          });
        } catch (error) {
          if (attempt === 2) throw error;
          const delay = 10_000 * 2 ** attempt;
          console.warn(`Network error; retrying in ${delay / 1000}s: ${error.message}`);
          await sleep(delay);
          continue;
        }
        if (response.status === 429) {
          const delay = Math.max(retryAfterMs(response.headers.get('Retry-After')), 60_000 * 2 ** attempt);
          state.cooldownUntil = Date.now() + delay;
          await save();
          console.warn(`HTTP 429; cooldown ${Math.ceil(delay / 1000)}s`);
          if (attempt === 2 || delay > 3_600_000) {
            const error = new Error('Rate limit persists; stop and resume later');
            error.rateLimited = true;
            throw error;
          }
          await pause(state.cooldownUntil);
          continue;
        }
        if (response.status === 408 || response.status === 425 || response.status >= 500) {
          if (attempt === 2) throw new Error(`HTTP ${response.status} after three attempts`);
          const delay = 10_000 * 2 ** attempt;
          console.warn(`HTTP ${response.status}; retrying in ${delay / 1000}s`);
          await sleep(delay);
          continue;
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        state.cooldownUntil = 0;
        return response.text();
      }
      throw new Error('Request failed after three attempts');
    };

    const extractCountry = (country, html) => {
      const page = preloaded(html).public;
      if (!page || page.slug !== country.slug || !Array.isArray(page.steps)) {
        throw new Error(`Missing or mismatched guide data for ${country.slug}`);
      }
      const pageUrl = new URL(`/${country.slug}`, base).href;
      const tips = page.steps.flatMap(section =>
        (Array.isArray(section.items) ? section.items : [])
          .filter(item => item.kind === 'tip' && isMapLink(item.data?.image?.imageLink))
          .map(item => {
            const lines = item.data.text;
            if (!Array.isArray(lines) || !lines.every(line => typeof line === 'string')) {
              throw new Error(`Invalid text in ${country.slug} tip ${item.id || '(no id)'}`);
            }
            const notes = lines.filter(line => /^NOTE\s*:/i.test(line));
            return {
              id: item.id || null,
              section: section.title || null,
              mapUrl: new URL(item.data.image.imageLink, pageUrl).href,
              image: item.data.image.imageUrl ? new URL(item.data.image.imageUrl, pageUrl).href : null,
              text: lines.filter(line => !/^NOTE\s*:/i.test(line)).join('\n\n').trim(),
              note: notes.length ? notes.map(line => line.replace(/^NOTE\s*:\s*/i, '')).join('\n\n') : null,
              fullText: lines.join('\n\n').trim(),
            };
          }),
      );
      return {
        name: country.title, code: country.code, lastUpdated: country.updatedAt,
        pageUrl, mapTipCount: tips.length, tips,
      };
    };

    const download = countries => {
      const completed = countries.flatMap(country => {
        const record = state.records[country.slug];
        return record?.lastUpdated === country.updatedAt ? [record] : [];
      });
      const withMaps = completed.filter(record => record.result.tips.length > 0);
      const output = {
        source: `${base}/guide`, scrapedAt: new Date().toISOString(),
        totalCountriesListed: countries.length, completedCountries: completed.length,
        countriesWithMapInfo: withMaps.length,
        totalMapTips: withMaps.reduce((sum, record) => sum + record.result.mapTipCount, 0),
        countries: withMaps.map(record => record.result),
      };
      const url = URL.createObjectURL(new Blob([JSON.stringify(output, null, 2)], { type: 'application/json' }));
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = 'plonkit-map-tips.json';
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      console.log(`Downloaded JSON: ${completed.length}/${countries.length} checked; ${output.totalMapTips} map-linked tips.`);
    };

    if (state.cooldownUntil > Date.now()) {
      console.log(`Respecting saved cooldown: ${Math.ceil((state.cooldownUntil - Date.now()) / 1000)}s`);
      await pause(state.cooldownUntil);
    }
    const guide = preloaded(await requestPage(`${base}/guide`));
    if (!Array.isArray(guide) || !guide.every(country =>
      /^[a-z0-9-]+$/.test(country.slug) && country.title && country.updatedAt
    ) || new Set(guide.map(country => country.slug)).size !== guide.length) {
      throw new Error('Guide country list is missing or invalid');
    }

    let failures = 0;
    for (const [index, country] of guide.entries()) {
      if (state.records[country.slug]?.lastUpdated === country.updatedAt) continue;
      await sleep(7_000);
      console.log(`[${index + 1}/${guide.length}] ${country.title}`);
      try {
        const html = await requestPage(`${base}/${country.slug}`);
        const result = extractCountry(country, html);
        state.records[country.slug] = { lastUpdated: country.updatedAt, result };
        await save();
        failures = 0;
        console.log(`  ${result.mapTipCount} map-linked tips`);
      } catch (error) {
        console.warn(`${country.title}: ${error.message}`);
        if (error.rateLimited || ++failures >= 3) {
          console.warn('Stopped with saved progress. Run the snippet again later to resume.');
          break;
        }
      }
    }
    download(guide);
  } catch (error) {
    console.error(`Map-tip scrape stopped: ${error.message}`);
  } finally {
    db?.close();
    window.__plonkitMapTipsRunning = false;
  }
})());
