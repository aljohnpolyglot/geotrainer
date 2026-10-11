// Paste into DevTools on an OpenGuessr community map page, then click Play.
// Downloads the locations returned to the page as GeoTrainer-uploadable JSON.
(() => {
  if (location.hostname !== 'openguessr.com' || !/^\/maps\/community\/[^/]+\/?$/.test(location.pathname)) {
    throw new Error('Open an OpenGuessr community map page first.');
  }
  if (window.stopOpenGuessrLocationCapture) window.stopOpenGuessrLocationCapture();
  const originalFetch = window.fetch;
  const title = document.querySelector('.map-title')?.textContent?.trim() || location.pathname.split('/').pop();
  const listedCount = Number(document.querySelector('.location-amount-text')?.textContent?.replace(/[^\d]/g, '')) || null;
  const source = location.href;
  const pointsFrom = entries => entries.flatMap(entry => {
    const lat = Array.isArray(entry) ? entry[0] : entry?.lat;
    const lng = Array.isArray(entry) ? entry[1] : entry?.lng;
    const details = Array.isArray(entry) ? entry[2] : entry;
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) return [];
    return [{ lat, lng,
      ...(Number.isFinite(details?.heading) ? { heading: details.heading } : {}),
      ...(typeof details?.panoramaId === 'string' ? { panoId: details.panoramaId } :
        typeof details?.panoId === 'string' ? { panoId: details.panoId } : {}),
    }];
  });
  const download = locations => {
    const json = { name: title, source, locations };
    const href = URL.createObjectURL(new Blob([JSON.stringify(json, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = href;
    link.download = `geotrainer-${location.pathname.split('/').pop()}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 30_000);
  };
  window.stopOpenGuessrLocationCapture = () => {
    window.fetch = originalFetch;
    delete window.stopOpenGuessrLocationCapture;
  };
  window.fetch = async function (...args) {
    const response = await originalFetch.apply(this, args);
    const requestUrl = typeof args[0] === 'string' ? args[0] : args[0]?.url || args[0]?.href;
    let url;
    try { url = new URL(requestUrl, location.href); } catch { return response; }
    if (url.hostname !== 'accounts.openguessr.com' || !response.ok) return response;
    try {
      const payload = await response.clone().json();
      if (!Array.isArray(payload?.locations)) return response;
      const locations = pointsFrom(payload.locations);
      if (!locations.length) return response;
      download(locations);
      window.stopOpenGuessrLocationCapture();
      console.log(`Downloaded ${locations.length}${listedCount ? ` of ${listedCount}` : ''} locations from ${title}.`);
    } catch (error) { console.warn(`Could not export location response: ${error.message}`); }
    return response;
  };
  console.log('Location capture ready. Click Play on this map; the JSON downloads when its locations arrive.');
})();
