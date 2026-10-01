// Run on a Plonkit country page you opened yourself. Downloads one ZIP; never visits another page.
void (window.__plonkitImageZipTask = (async () => {
  if (!/(^|\.)plonkit\.net$/.test(location.hostname)) throw new Error('Open a Plonkit country page first.');
  const script = document.querySelector('script#__PRELOADED_DATA__');
  if (!script) throw new Error('This page has no preloaded guide data.');
  const payload = JSON.parse(script.textContent);
  const page = payload?.data?.public;
  if (!payload.success || !page || !Array.isArray(page.steps)) throw new Error('Invalid Plonkit page data.');

  const entries = page.steps.flatMap(section => (section.items || [])
    .filter(item => item.kind === 'tip' && typeof item.data?.image?.imageUrl === 'string'
      && typeof item.data?.image?.imageLink === 'string')
    .map(item => ({ id: item.id || null, section: section.title || null,
      url: new URL(item.data.image.imageUrl, location.origin).href,
      mapUrl: new URL(item.data.image.imageLink, location.origin).href,
      text: Array.isArray(item.data.text) ? item.data.text.join('\n\n') : '' })));
  if (!entries.length) throw new Error('No map-linked tip images on this page.');
  const selected = entries.slice(0, 100);
  const files = [{ name: 'page.html', data: new TextEncoder().encode('<!doctype html>\n' + document.documentElement.outerHTML) }];
  const manifest = { slug: page.slug || location.pathname.split('/').filter(Boolean).pop() || 'page',
    capturedAt: new Date().toISOString(), pageUrl: location.href, entries: [] };
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const loadedImages = new Map();
  for (const image of document.querySelectorAll('img')) {
    if (!image.complete || image.naturalWidth < 1) continue;
    for (const source of [image.currentSrc, image.src, image.getAttribute('src')].filter(Boolean)) {
      try {
        const url = new URL(source, location.href);
        if (url.origin === location.origin) loadedImages.set(url.href, image);
      } catch {}
    }
  }
  const extension = type => ({ 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' })[type] || 'img';
  const saveBlob = async (item, index, blob, loadedFromDocument = false) => {
    if (!blob?.type.startsWith('image/')) throw new Error(`Non-image response (${blob?.type || 'unknown type'})`);
    const safeId = String(item.id || 'tip').replace(/[^A-Za-z0-9_-]/g, '_').slice(0, 80);
    const name = `images/${String(index + 1).padStart(3, '0')}-${safeId}.${extension(blob.type)}`;
    files.push({ name, data: new Uint8Array(await blob.arrayBuffer()) });
    manifest.entries.push({ ...item, file: name, mimeType: blob.type, ...(loadedFromDocument ? { loadedFromDocument: true } : {}) });
    console.log(`Saved ${index + 1}/${selected.length}: ${item.id || item.url}`);
  };
  let requests = 0;
  for (const [index, item] of selected.entries()) {
    try {
      const image = loadedImages.get(item.url);
      if (image) {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = image.naturalWidth; canvas.height = image.naturalHeight;
          const context = canvas.getContext('2d');
          if (!context) throw new Error('Canvas is unavailable');
          context.drawImage(image, 0, 0);
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          if (blob) { await saveBlob(item, index, blob, true); continue; }
        } catch (error) { console.warn(`Could not export loaded image ${item.url}; trying its page URL: ${error.message}`); }
      }
      if (requests++) await wait(1000);
      const response = await fetch(item.url, { credentials: 'include', signal: AbortSignal.timeout(30000) });
      if (response.status === 429) throw new Error('HTTP 429; stopped. Wait before trying again.');
      if (response.status === 403 || response.status === 503) throw new Error(`HTTP ${response.status}; access was blocked. Stopped.`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await saveBlob(item, index, await response.blob());
    } catch (error) {
      manifest.entries.push({ ...item, error: error.message });
      console.warn(`${item.id || item.url}: ${error.message}`);
      if (/HTTP (?:429|403|503)/.test(error.message)) break;
    }
  }
  files.push({ name: 'manifest.json', data: new TextEncoder().encode(JSON.stringify(manifest, null, 2)) });

  // Small store-only ZIP writer; avoids loading a library into the page.
  const crcTable = new Uint32Array(256);
  for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcTable[n] = c >>> 0; }
  const crc32 = bytes => { let c = 0xffffffff; for (const byte of bytes) c = crcTable[(c ^ byte) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const enc = new TextEncoder();
  const local = [], central = [];
  let offset = 0;
  const u16 = (view, at, value) => view.setUint16(at, value, true);
  const u32 = (view, at, value) => view.setUint32(at, value, true);
  for (const file of files) {
    const name = enc.encode(file.name), crc = crc32(file.data), size = file.data.length;
    const header = new Uint8Array(30 + name.length), hv = new DataView(header.buffer);
    u32(hv, 0, 0x04034b50); u16(hv, 4, 20); u16(hv, 6, 0x0800); u16(hv, 8, 0);
    u32(hv, 14, crc); u32(hv, 18, size); u32(hv, 22, size); u16(hv, 26, name.length); header.set(name, 30);
    local.push(header, file.data);
    const record = new Uint8Array(46 + name.length), rv = new DataView(record.buffer);
    u32(rv, 0, 0x02014b50); u16(rv, 4, 20); u16(rv, 6, 20); u16(rv, 8, 0x0800); u16(rv, 10, 0);
    u32(rv, 16, crc); u32(rv, 20, size); u32(rv, 24, size); u16(rv, 28, name.length); u32(rv, 42, offset); record.set(name, 46);
    central.push(record); offset += header.length + size;
  }
  const centralSize = central.reduce((sum, part) => sum + part.length, 0);
  const end = new Uint8Array(22), ev = new DataView(end.buffer);
  u32(ev, 0, 0x06054b50); u16(ev, 8, files.length); u16(ev, 10, files.length); u32(ev, 12, centralSize); u32(ev, 16, offset);
  const archive = new Blob([...local, ...central, end], { type: 'application/zip' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(archive); link.download = `plonkit-${String(manifest.slug).replace(/[^A-Za-z0-9_-]/g, '_')}-images.zip`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 60000);
  console.log(`ZIP ready: ${manifest.entries.filter(item => item.file).length} images saved; ${manifest.entries.filter(item => item.error).length} unavailable.`);
})());
