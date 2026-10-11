// Run as a Chrome DevTools Snippet on openguessr.com/maps to collect loaded community map pages.
// On one community map page, it captures that page. Pass an array of map URLs for a specific batch.
(() => {
  if (location.hostname !== 'openguessr.com') throw new Error('Open openguessr.com first.');
  const mapPath = /^\/maps\/community\/[^/]+\/?$/;
  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const mapUrl = value => {
    try { const url = new URL(value, location.href); return url.origin === location.origin && mapPath.test(url.pathname) ? url.href : ''; }
    catch { return ''; }
  };
  const visibleLinks = () => [...document.querySelectorAll('a[href]')].map(a => mapUrl(a.href)).filter(Boolean);
  const readMap = (page, url) => {
    const title = page.querySelector('.header-container .map-title')?.textContent?.trim();
    if (!title || title === '...') return null;
    const countText = page.querySelector('.location-amount-text')?.textContent || '';
    const svg = page.querySelector('.map-container svg');
    return {
      url, title,
      author: (page.querySelector('.author-text')?.textContent || '').trim().replace(/^by\s+/i, ''),
      locationCount: Number(countText.replace(/[^\d]/g, '')) || null,
      description: [...page.querySelectorAll('.description-scroll p')].map(p => p.textContent.trim()).filter(Boolean).join('\n'),
      likes: Number((page.querySelector('#likes-text')?.textContent || '').replace(/[^\d]/g, '')) || 0,
      previewPointCount: svg?.querySelectorAll('.point-feature').length || 0,
      html: [page.querySelector('.header-container'), page.querySelector('.information'), page.querySelector('.map-container')]
        .filter(Boolean).map(element => element.outerHTML).join('\n'),
    };
  };
  const readRemote = async url => {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTML request failed (${response.status}).`);
    const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
    const ready = readMap(parsed, url);
    if (ready) return ready;
    // shortcut: client-rendered pages need one hidden frame each; replace when a public HTML feed is known.
    const frame = document.createElement('iframe');
    Object.assign(frame.style, { position: 'fixed', width: '1024px', height: '768px', opacity: '0', pointerEvents: 'none', zIndex: '-1' });
    frame.src = url; document.body.append(frame);
    try {
      for (let attempt = 0; attempt < 60; attempt++) {
        await sleep(250);
        const map = frame.contentDocument && readMap(frame.contentDocument, url);
        if (map) return map;
      }
      throw new Error('Map page did not render within 15 seconds.');
    } finally { frame.remove(); }
  };
  const download = data => {
    const blobUrl = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = blobUrl; link.download = `openguessr-community-html-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link); link.click(); link.remove();
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30_000);
  };
  window.captureOpenGuessrCommunityHtml = async suppliedUrls => {
    if (window.__openGuessrHtmlRunning) throw new Error('Capture is already running.');
    window.__openGuessrHtmlRunning = true;
    let stopped = false;
    window.stopOpenGuessrCommunityHtml = () => { stopped = true; };
    try {
      const urls = new Set(Array.isArray(suppliedUrls) ? suppliedUrls.map(mapUrl).filter(Boolean) : []);
      if (!urls.size && mapUrl(location.href)) urls.add(location.href);
      if (!urls.size) {
        let unchanged = 0, previous = 0;
        for (let attempt = 0; attempt < 60 && unchanged < 4 && !stopped; attempt++) {
          visibleLinks().forEach(url => urls.add(url));
          unchanged = urls.size === previous ? unchanged + 1 : 0; previous = urls.size;
          window.scrollTo(0, document.documentElement.scrollHeight);
          await sleep(750);
        }
        visibleLinks().forEach(url => urls.add(url));
      }
      if (!urls.size) throw new Error('No community map links found. Open /maps or pass an array of map URLs.');
      console.log(`Found ${urls.size} community map pages.`);
      const maps = [], errors = [];
      for (const url of urls) {
        if (stopped) break;
        try {
          const map = url === location.href ? readMap(document, url) : await readRemote(url);
          if (!map) throw new Error('Map metadata was not rendered.');
          maps.push(map); console.log(`${maps.length}/${urls.size}: ${map.title} (${map.locationCount ?? '?'} locations)`);
        } catch (error) { errors.push({ url, error: error.message }); console.warn(`${url}: ${error.message}`); }
        await sleep(500);
      }
      download({ capturedAt: new Date().toISOString(), maps, errors, found: urls.size, stopped });
      console.log(`Downloaded ${maps.length} map pages; ${errors.length} failed.`);
      return { captured: maps.length, failed: errors.length, found: urls.size };
    } finally { window.__openGuessrHtmlRunning = false; }
  };
  window.__openGuessrHtmlTask = window.captureOpenGuessrCommunityHtml();
  window.__openGuessrHtmlTask.catch(error => console.error(`Map capture failed: ${error.message}`));
})();
