// Chrome DevTools Snippet: run once on https://www.plonkit.net/ (or /guide).
// Pick the existing map-tip JSON once and an output folder once. ZIPs continue automatically.
// Only URLs and completed progress are saved in IndexedDB; image bytes stay in memory until each ZIP is written.
void (window.__plonkitImageZipTask = (async () => {
  if (!/(^|\.)plonkit\.net$/.test(location.hostname)) throw new Error('Open https://www.plonkit.net/ first.');
  if (window.__plonkitImageZipRunning) return console.warn('Image capture is already running.');
  if (!window.showDirectoryPicker) throw new Error('This script needs Chrome folder access.');
  window.__plonkitImageZipRunning = true;
  let db, stopped = false;
  window.__plonkitImageZipStop = () => { stopped = true; console.log('Stopping after the current request; saved images will be written to a ZIP.'); };
  try {
    const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
    const pauseUntil = async deadline => {
      while (!stopped && deadline > Date.now()) await sleep(Math.min(60_000, deadline - Date.now()));
    };
    const isImageUrl = value => {
      try {
        const url = new URL(value);
        return url.protocol === 'https:' && /(^|\.)plonkit\.net$/.test(url.hostname) && url.pathname.startsWith('/images/');
      } catch { return false; }
    };
    const isCourseId = value => /^[A-Z]{2}-[A-Za-z0-9]{4}$/.test(String(value || ''));
    const chooseJson = () => new Promise((resolve, reject) => {
      const panel = document.createElement('div');
      Object.assign(panel.style, { position: 'fixed', zIndex: '2147483647', top: '20px', right: '20px',
        maxWidth: '360px', padding: '16px', background: '#fff', color: '#111', border: '2px solid #333' });
      const label = document.createElement('label');
      label.textContent = 'Choose plonkit-map-tips.json or meta-course-image-report.json: ';
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.json,application/json'; label.append(input);
      const cancel = document.createElement('button');
      cancel.type = 'button'; cancel.textContent = 'Cancel';
      cancel.onclick = () => { panel.remove(); reject(new Error('File selection cancelled')); };
      input.onchange = async () => {
        try {
          if (!input.files?.[0]) return;
          const data = JSON.parse(await input.files[0].text());
          const raw = Array.isArray(data.missingImages)
            ? data.missingImages.map(item => ({ url: item.url, id: item.references?.[0] }))
            : (data.countries || []).filter(country => /^[A-Z]{2}$/.test(country.code || ''))
              .flatMap(country => (country.tips || []).map(tip => ({ url: tip.image, id: `${country.code}-${tip.id}` })));
          const entries = [...new Map(raw.filter(item => isImageUrl(item.url) && isCourseId(item.id))
            .map(item => [item.url, item])).values()];
          if (!entries.length) throw new Error('No country-course image URLs found in this JSON.');
          panel.remove(); resolve(entries);
        } catch (error) { panel.remove(); reject(error); }
      };
      panel.append(label, cancel); document.body.append(panel);
    });
    const chooseFolder = () => new Promise((resolve, reject) => {
      const panel = document.createElement('div');
      Object.assign(panel.style, { position: 'fixed', zIndex: '2147483647', top: '20px', right: '20px',
        maxWidth: '360px', padding: '16px', background: '#fff', color: '#111', border: '2px solid #333' });
      const label = document.createElement('p');
      label.textContent = 'Choose one folder for all image ZIPs. Keep this tab open; rate-limit waits are automatic.';
      const button = document.createElement('button');
      button.type = 'button'; button.textContent = 'Choose folder and start';
      button.onclick = async () => {
        try {
          const folder = await window.showDirectoryPicker({ mode: 'readwrite', startIn: 'downloads' });
          panel.remove(); resolve(folder);
        } catch (error) { panel.remove(); reject(error); }
      };
      panel.append(label, button); document.body.append(panel);
    });
    db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('plonkit-image-zip', 1);
      request.onupgradeneeded = () => request.result.createObjectStore('state');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    const read = () => new Promise((resolve, reject) => {
      const request = db.transaction('state').objectStore('state').get('progress');
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    const save = state => new Promise((resolve, reject) => {
      const transaction = db.transaction('state', 'readwrite');
      transaction.objectStore('state').put(state, 'progress');
      transaction.oncomplete = resolve;
      transaction.onerror = () => reject(transaction.error);
    });
    let state = await read();
    if (!state) {
      state = { version: 1, entries: await chooseJson(), done: [], cooldownUntil: 0 };
      await save(state);
    }
    if (state.version !== 1 || !Array.isArray(state.entries) || !Array.isArray(state.done)) {
      throw new Error('Saved image progress has an unsupported format.');
    }
    // The first Snippet included regional subcourses and fictional tips. Keep its completed country images.
    state.entries = state.entries.filter(item => isImageUrl(item.url) && isCourseId(item.id));
    const allowed = new Set(state.entries.map(item => item.url));
    state.done = [...new Set(state.done.filter(url => allowed.has(url)))];
    await save(state);
    const done = new Set(state.done);
    const remaining = state.entries.filter(item => !done.has(item.url));
    if (!remaining.length) return console.log(`All ${state.entries.length} country-course images have been exported.`);
    const folder = await chooseFolder();
    console.log(`${state.done.length}/${state.entries.length} exported. Keep this tab open; call __plonkitImageZipStop() to pause.`);

    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
    const crc32 = bytes => { let c = 0xffffffff; for (const byte of bytes) c = table[(c ^ byte) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
    const encoder = new TextEncoder();
    const u16 = (view, at, value) => view.setUint16(at, value, true);
    const u32 = (view, at, value) => view.setUint32(at, value, true);
    let batch = [], requests = 0, consecutiveFailures = 0;
    const flush = async () => {
      if (!batch.length) return;
      const manifest = { pageUrl: location.href, capturedAt: new Date().toISOString(),
        entries: batch.map(item => ({ id: item.id, url: item.url, file: item.file, mimeType: item.mimeType })) };
      const files = [...batch.map(item => ({ name: item.file, data: item.data })),
        { name: 'manifest.json', data: encoder.encode(JSON.stringify(manifest, null, 2)) }];
      const local = [], central = [];
      let offset = 0;
      for (const item of files) {
        const name = encoder.encode(item.name), size = item.data.length, crc = crc32(item.data);
        const header = new Uint8Array(30 + name.length), hv = new DataView(header.buffer);
        u32(hv, 0, 0x04034b50); u16(hv, 4, 20); u16(hv, 6, 0x0800); u32(hv, 14, crc);
        u32(hv, 18, size); u32(hv, 22, size); u16(hv, 26, name.length); header.set(name, 30);
        local.push(header, item.data);
        const record = new Uint8Array(46 + name.length), rv = new DataView(record.buffer);
        u32(rv, 0, 0x02014b50); u16(rv, 4, 20); u16(rv, 6, 20); u16(rv, 8, 0x0800); u16(rv, 10, 0);
        u32(rv, 16, crc); u32(rv, 20, size); u32(rv, 24, size); u16(rv, 28, name.length);
        u32(rv, 42, offset); record.set(name, 46); central.push(record);
        offset += header.length + size;
      }
      const centralSize = central.reduce((sum, bytes) => sum + bytes.length, 0);
      const end = new Uint8Array(22), ev = new DataView(end.buffer);
      u32(ev, 0, 0x06054b50); u16(ev, 8, files.length); u16(ev, 10, files.length);
      u32(ev, 12, centralSize); u32(ev, 16, offset);
      const start = state.done.length + 1, finish = start + batch.length - 1;
      const name = `plonkit-images-${String(start).padStart(4, '0')}-${String(finish).padStart(4, '0')}.zip`;
      const handle = await folder.getFileHandle(name, { create: true });
      const writer = await handle.createWritable();
      try {
        await writer.write(new Blob([...local, ...central, end], { type: 'application/zip' }));
        await writer.close();
      } catch (error) { await writer.abort?.(); throw error; }
      state.done.push(...batch.map(item => item.url));
      await save(state);
      console.log(`Saved ${name}: ${state.done.length}/${state.entries.length} images exported.`);
      batch = [];
    };

    for (const item of remaining) {
      if (stopped) break;
      let failures = 0;
      while (!stopped) {
        if (state.cooldownUntil > Date.now()) {
          console.log(`Cooling down until ${new Date(state.cooldownUntil).toLocaleTimeString()}...`);
          await pauseUntil(state.cooldownUntil);
        }
        if (stopped) break;
        if (requests++) await sleep(state.paceMs || 2000);
        try {
          const response = await fetch(item.url, { credentials: 'include', signal: AbortSignal.timeout(30000) });
          if (response.status === 429 || response.status === 503) {
            await flush();
            const after = response.headers.get('Retry-After');
            const parsed = /^\d+$/.test(after || '') ? Date.now() + Number(after) * 1000 : Date.parse(after || '');
            state.strikes = (state.strikes || 0) + 1;
            state.paceMs = Math.min(10_000, Math.round((state.paceMs || 2000) * 1.5));
            const delay = Math.min(60 * 60_000, 10 * 60_000 * 2 ** Math.min(state.strikes - 1, 3));
            state.cooldownUntil = Math.max(Date.now() + delay, Number.isFinite(parsed) ? parsed : 0);
            await save(state);
            console.warn(`HTTP ${response.status}; waiting ${Math.ceil((state.cooldownUntil - Date.now()) / 60000)} minutes, then retrying automatically at ${state.paceMs / 1000}s between images.`);
            continue;
          }
          if (response.status === 403) {
            await flush();
            console.warn('HTTP 403; site access is blocked. Progress is saved; stopping.');
            return;
          }
          if (response.status === 404) {
            console.warn(`${item.id}: HTTP 404; skipping this unavailable image.`);
            break;
          }
          if (!response.ok) throw new Error(`HTTP ${response.status}`);
          const blob = await response.blob();
          if (!blob.type.startsWith('image/')) {
            await flush();
            console.warn(`Expected an image, received ${blob.type || 'unknown content'}; stopping.`);
            return;
          }
          const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
            'image/gif': 'gif', 'image/avif': 'avif' })[blob.type] || 'img';
          const id = String(item.id).replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
          const file = `images/${String(batch.length + 1).padStart(3, '0')}-${id}.${ext}`;
          batch.push({ ...item, file, mimeType: blob.type, data: new Uint8Array(await blob.arrayBuffer()) });
          state.strikes = 0; state.cooldownUntil = 0; consecutiveFailures = 0;
          console.log(`[${state.done.length + batch.length}/${state.entries.length}] ${item.id}`);
          if (batch.length === 50) await flush();
          break;
        } catch (error) {
          failures++; consecutiveFailures++;
          console.warn(`${item.id}: ${error.message}`);
          if (failures < 3) { await sleep(5000 * failures); continue; }
          if (consecutiveFailures >= 3) {
            await flush();
            console.warn('Several requests failed. Progress is saved; stopping.');
            return;
          }
          break;
        }
      }
    }
    await flush();
    console.log(`Finished this pass: ${state.done.length}/${state.entries.length} images exported.`);
  } catch (error) {
    console.error(`Image capture stopped: ${error.message}`);
  } finally {
    db?.close(); window.__plonkitImageZipRunning = false;
  }
})());
