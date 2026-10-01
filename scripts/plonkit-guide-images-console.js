// Run as a DevTools Snippet on https://www.plonkit.net/ or /guide.
// Choose the existing plonkit-map-tips.json once. Each run downloads one ZIP of up to 50 images.
// Re-run to continue; URL progress (never image bytes) is saved in this site's IndexedDB.
void (window.__plonkitImageZipTask = (async () => {
  if (!/(^|\.)plonkit\.net$/.test(location.hostname)) {
    throw new Error('Open https://www.plonkit.net/ first.');
  }
  if (window.__plonkitImageZipRunning) return console.warn('Image capture is already running.');
  window.__plonkitImageZipRunning = true;
  let db;
  try {
    const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
    const isImageUrl = value => {
      try {
        const url = new URL(value);
        return url.protocol === 'https:' && /(^|\.)plonkit\.net$/.test(url.hostname) &&
          url.pathname.startsWith('/images/');
      } catch { return false; }
    };
    const chooseJson = () => new Promise((resolve, reject) => {
      const panel = document.createElement('div');
      Object.assign(panel.style, { position: 'fixed', zIndex: '2147483647', top: '20px', right: '20px',
        maxWidth: '360px', padding: '16px', background: '#fff', color: '#111', border: '2px solid #333' });
      const label = document.createElement('label');
      label.textContent = 'Choose your existing plonkit-map-tips.json (or scripts/meta-course-image-report.json): ';
      const input = document.createElement('input');
      input.type = 'file'; input.accept = '.json,application/json';
      label.append(input);
      const cancel = document.createElement('button');
      cancel.type = 'button'; cancel.textContent = 'Cancel';
      cancel.onclick = () => { panel.remove(); reject(new Error('File selection cancelled')); };
      input.onchange = async () => {
        try {
          if (!input.files?.[0]) return;
          const data = JSON.parse(await input.files[0].text());
          const raw = Array.isArray(data.missingImages)
            ? data.missingImages.map(item => ({ url: item.url, id: item.references?.[0] }))
            : (data.countries || []).flatMap(country => (country.tips || [])
              .map(tip => ({ url: tip.image, id: `${country.code || country.name}-${tip.id || 'tip'}` })));
          const entries = [...new Map(raw.filter(item => isImageUrl(item.url))
            .map(item => [item.url, item])).values()];
          if (!entries.length) throw new Error('No Plonk It image URLs found in this JSON.');
          panel.remove(); resolve(entries);
        } catch (error) { panel.remove(); reject(error); }
      };
      panel.append(label, cancel); document.body.append(panel);
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
    if (state.cooldownUntil > Date.now()) {
      console.warn(`Rate-limit cooldown: try again in ${Math.ceil((state.cooldownUntil - Date.now()) / 60000)} minutes.`);
      return;
    }
    const done = new Set(state.done);
    const remaining = state.entries.filter(item => isImageUrl(item.url) && !done.has(item.url));
    if (!remaining.length) return console.log(`All ${state.entries.length} images have been exported.`);
    const batch = remaining.slice(0, 50);
    const files = [];
    const manifest = { pageUrl: location.href, capturedAt: new Date().toISOString(), entries: [] };
    let blocked = false;
    for (const [index, item] of batch.entries()) {
      if (index) await wait(2000);
      try {
        const response = await fetch(item.url, { credentials: 'include', signal: AbortSignal.timeout(30000) });
        if ([403, 429, 503].includes(response.status)) {
          const after = response.headers.get('Retry-After');
          const parsed = /^\d+$/.test(after || '') ? Date.now() + Number(after) * 1000 : Date.parse(after || '');
          state.cooldownUntil = Math.max(Date.now() + 10 * 60_000, Number.isFinite(parsed) ? parsed : 0);
          blocked = true;
          throw new Error(`HTTP ${response.status}; stopped and saved progress`);
        }
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        if (!blob.type.startsWith('image/')) throw new Error(`Expected an image, got ${blob.type || 'unknown content'}`);
        const ext = ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp',
          'image/gif': 'gif', 'image/avif': 'avif' })[blob.type] || 'img';
        const id = String(item.id || 'tip').replace(/[^A-Za-z0-9._-]/g, '_').slice(0, 80);
        const file = `images/${String(index + 1).padStart(3, '0')}-${id}.${ext}`;
        files.push({ name: file, data: new Uint8Array(await blob.arrayBuffer()), url: item.url });
        manifest.entries.push({ ...item, file, mimeType: blob.type });
        console.log(`[${index + 1}/${batch.length}] ${item.id || item.url}`);
      } catch (error) {
        manifest.entries.push({ ...item, error: error.message });
        console.warn(`${item.id || item.url}: ${error.message}`);
        if (blocked) break;
      }
    }
    if (!files.length) {
      await save(state);
      return console.warn('No images downloaded. No ZIP created.');
    }
    files.push({ name: 'manifest.json', data: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) });

    // Store-only ZIP: one dependency-free archive per batch.
    const table = new Uint32Array(256);
    for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; table[n] = c >>> 0; }
    const crc32 = bytes => { let c = 0xffffffff; for (const byte of bytes) c = table[(c ^ byte) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
    const encoder = new TextEncoder(), local = [], central = [];
    const u16 = (view, at, value) => view.setUint16(at, value, true);
    const u32 = (view, at, value) => view.setUint32(at, value, true);
    let offset = 0;
    for (const item of files) {
      const name = encoder.encode(item.name), size = item.data.length, crc = crc32(item.data);
      const header = new Uint8Array(30 + name.length), hv = new DataView(header.buffer);
      u32(hv, 0, 0x04034b50); u16(hv, 4, 20); u16(hv, 6, 0x0800); u32(hv, 14, crc);
      u32(hv, 18, size); u32(hv, 22, size); u16(hv, 26, name.length); header.set(name, 30);
      local.push(header, item.data);
      const record = new Uint8Array(46 + name.length), rv = new DataView(record.buffer);
      u32(rv, 0, 0x02014b50); u16(rv, 4, 20); u16(rv, 6, 20); u16(rv, 8, 0x0800);
      u32(rv, 16, crc); u32(rv, 20, size); u32(rv, 24, size); u16(rv, 28, name.length);
      u32(rv, 42, offset); record.set(name, 46); central.push(record);
      offset += header.length + size;
    }
    const centralSize = central.reduce((sum, bytes) => sum + bytes.length, 0);
    const end = new Uint8Array(22), ev = new DataView(end.buffer);
    u32(ev, 0, 0x06054b50); u16(ev, 8, files.length); u16(ev, 10, files.length);
    u32(ev, 12, centralSize); u32(ev, 16, offset);
    const archive = new Blob([...local, ...central, end], { type: 'application/zip' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(archive);
    link.download = `plonkit-images-${state.done.length + 1}-${state.done.length + files.length - 1}.zip`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
    state.done.push(...files.filter(file => file.url).map(file => file.url));
    await save(state);
    console.log(`ZIP ready: ${state.done.length}/${state.entries.length} images exported. Run this snippet again for the next batch.`);
  } finally {
    db?.close(); window.__plonkitImageZipRunning = false;
  }
})());
