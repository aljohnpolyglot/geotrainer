// Paste into DevTools while OpenGuessr's Duel history popup is open.
// It visits every match overview and round, then downloads a GeoTrainer map JSON.
(() => {
  if (location.hostname !== 'openguessr.com' || location.pathname !== '/multiplayer') {
    throw new Error('Open OpenGuessr multiplayer and its Duel history first.');
  }
  if (window.__duelExportRunning) throw new Error('A Duel history export is already running.');

  const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
  const popup = title => [...document.querySelectorAll('.ui-window')]
    .find(element => element.querySelector('h1')?.textContent?.trim() === title);
  const waitFor = async (read, label, timeout = 12000) => {
    const until = Date.now() + timeout;
    do {
      const value = read();
      if (value) return value;
      await sleep(100);
    } while (Date.now() < until && !window.__duelExportStop);
    throw new Error(`Timed out waiting for ${label}.`);
  };
  const pointFromFrame = frame => {
    if (!frame?.src) return null;
    const url = new URL(frame.src);
    if (url.hostname !== 'www.google.com' || url.pathname !== '/maps/embed/v1/streetview') return null;
    const [lat, lng] = (url.searchParams.get('location') || '').split(',').map(Number);
    if (!Number.isFinite(lat) || Math.abs(lat) > 90 || !Number.isFinite(lng) || Math.abs(lng) > 180) return null;
    const heading = Number(url.searchParams.get('heading'));
    const panoId = url.searchParams.get('pano');
    return { lat, lng, ...(url.searchParams.has('heading') && Number.isFinite(heading) ? { heading } : {}), ...(panoId ? { panoId, panoIdSource: 'embed' } : {}) };
  };
  const resolvePanoId = async point => {
    if (point.panoId || !window.google?.maps?.StreetViewService) return point;
    try {
      const maps = window.google.maps;
      const data = await Promise.race([
        new Promise(resolve => new maps.StreetViewService().getPanorama(
          { location: { lat: point.lat, lng: point.lng }, radius: 50 },
          (result, status) => resolve(status === maps.StreetViewStatus.OK ? result : null),
        )),
        sleep(2000).then(() => null),
      ]);
      const panoId = data?.location?.pano;
      return panoId ? { ...point, panoId, panoIdSource: 'coordinate lookup' } : point;
    } catch { return point; }
  };
  const totalsFrom = overview => [...overview.querySelectorAll('.score-panel .score-row')].flatMap(row => {
    const name = row.querySelector('.score-name')?.textContent?.trim();
    const total = Number(row.querySelector('.score-points')?.textContent?.replace(/[^\d]/g, ''));
    return name && Number.isFinite(total) ? [{ name, total }] : [];
  });
  const scoredLocation = (round, matchNumber) => {
    const multiplier = round.round >= 4 ? 1.5 : 1;
    return { lat: round.lat, lng: round.lng, ...(round.heading === undefined ? {} : { heading: round.heading }),
      ...(round.panoId ? { panoId: round.panoId, panoIdSource: round.panoIdSource } : {}),
      matchNumber, round: round.round, multiplier, myScore: round.myScore, opponentScore: round.opponentScore,
      myBaseScore: round.myScore === null ? null : Math.round(round.myScore / multiplier),
      opponentBaseScore: round.opponentScore === null ? null : Math.round(round.opponentScore / multiplier),
      scoreGap: round.scoreGap, status: round.status };
  };
  const weakestFirst = (a, b) => (a.myBaseScore ?? Infinity) - (b.myBaseScore ?? Infinity)
    || a.matchNumber - b.matchNumber || a.round - b.round;
  const download = data => {
    const href = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }));
    const link = document.createElement('a');
    link.href = href;
    link.download = `geotrainer-openguessr-duels-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(href), 30000);
  };
  const choosePrevious = () => new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file'; input.accept = '.json,application/json';
    input.oncancel = () => reject(new Error('No previous export selected.'));
    input.onchange = async () => {
      try {
        const file = input.files?.[0];
        if (!file) throw new Error('No previous export selected.');
        const data = JSON.parse(await file.text());
        if (data.name !== 'My OpenGuessr duels' || !Array.isArray(data.games) || !Array.isArray(data.locations)) throw new Error('Choose a Duel exporter JSON file.');
        resolve(data);
      } catch (error) { reject(error); }
    };
    input.click();
  });

  window.__duelExportRunning = true;
  window.stopOpenGuessrDuelExport = () => { window.__duelExportStop = true; };
  window.__duelExportStop = false;
  window.__duelExportTask = (async () => {
    const games = [], locations = [], errors = [];
    let matchNumber = 0, emptyStreak = 0, interrupted = false, resumeFrom = 1, myName = window.__duelExportPlayerName || '';
    try {
      if (!popup('Duel history')) throw new Error('Open Duel history before running this snippet.');
      if (window.__duelExportResume) {
        const previous = await choosePrevious();
        const missingScores = previous.games.some(game => game.rounds?.some(round => !round.scores?.length || round.myScore === null || round.myScore === undefined));
        resumeFrom = missingScores ? 1 : Number.isInteger(previous.nextMatchNumber) ? previous.nextMatchNumber
          : Math.max(0, ...previous.games.filter(game => game.rounds?.length).map(game => game.matchNumber)) + 1;
        games.push(...previous.games.filter(game => game.matchNumber < resumeFrom));
        locations.push(...games.flatMap(game => game.rounds.map(round => scoredLocation(round, game.matchNumber))));
        errors.push(...(previous.errors || []).filter(error => error.matchNumber < resumeFrom));
        console.log(missingScores ? 'The earlier export lacks scores; recapturing its matches.' : `Resuming at duel ${resumeFrom} with ${locations.length} saved rounds.`);
      }
      while (!window.__duelExportStop) {
        const history = popup('Duel history');
        const rows = [...history.querySelectorAll('.match-history-item-container')];
        if (!myName) {
          const counts = new Map();
          rows.forEach(row => row.querySelectorAll('.player-name').forEach(element => {
            const name = element.textContent.trim();
            counts.set(name, (counts.get(name) || 0) + 1);
          }));
          myName = [...counts].sort((a, b) => b[1] - a[1])[0]?.[0] || '';
        }
        const page = history.querySelector('.page-counter')?.textContent?.trim() || '?';
        for (let rowIndex = 0; rowIndex < rows.length && !window.__duelExportStop; rowIndex++) {
          matchNumber++;
          if (matchNumber < resumeFrom) continue;
          const row = rows[rowIndex];
          const players = [...row.querySelectorAll('.player-name')].map(element => element.textContent.trim());
          const game = { matchNumber, page, players, rounds: [] };
          try {
            row.querySelector('button[aria-label="Match overview"]')?.click();
            await waitFor(() => popup('Overview'), 'match overview');
            await sleep(1400);
            const overview = popup('Overview');
            if (!pointFromFrame(overview?.querySelector('iframe[src*="/maps/embed/v1/streetview"]')) && overview?.textContent?.includes('No data available')) {
              throw new Error('No data available in match overview.');
            }
            await waitFor(() => pointFromFrame(popup('Overview')?.querySelector('iframe[src*="/maps/embed/v1/streetview"]')), 'match panorama');
            const tabs = [...overview.querySelectorAll('.tabs-row button')];
            const panoLookups = [];
            const previousTotals = new Map();
            let priorTotalsKnown = true;
            for (let roundIndex = 0; roundIndex < tabs.length && !window.__duelExportStop; roundIndex++) {
              try {
                const previousSrc = overview.querySelector('iframe[src*="/maps/embed/v1/streetview"]')?.src;
                if (roundIndex) tabs[roundIndex].click();
                const point = await waitFor(() => {
                  const current = popup('Overview');
                  const frame = current?.querySelector('iframe[src*="/maps/embed/v1/streetview"]');
                  const active = current?.querySelectorAll('.tabs-row button')[roundIndex]?.classList.contains('active');
                  return active && (roundIndex === 0 || frame?.src !== previousSrc) ? pointFromFrame(frame) : null;
                }, `match ${matchNumber} round ${roundIndex + 1}`);
                let totals = [];
                try {
                  totals = await waitFor(() => {
                    const current = popup('Overview');
                    const scores = current && totalsFrom(current);
                    return scores?.length === players.length ? scores : null;
                  }, `match ${matchNumber} round ${roundIndex + 1} scores`, 3000);
                } catch (error) {
                  errors.push({ matchNumber, round: roundIndex + 1, error: error.message });
                }
                const scores = totals.map(({ name, total }) => ({ name, total, roundScore: priorTotalsKnown ? total - (previousTotals.get(name) || 0) : null }));
                totals.forEach(({ name, total }) => previousTotals.set(name, total));
                priorTotalsKnown = !!totals.length;
                const mine = scores.find(score => score.name === myName);
                const opponent = scores.find(score => score.name !== myName);
                const scoreGap = mine?.roundScore !== null && mine?.roundScore !== undefined && opponent?.roundScore !== null && opponent?.roundScore !== undefined ? mine.roundScore - opponent.roundScore : null;
                const status = scoreGap === null ? null : scoreGap > 0 ? 'won' : scoreGap < 0 ? 'lost' : 'tied';
                const round = { round: roundIndex + 1, ...point, scores, myScore: mine?.roundScore ?? null, opponentScore: opponent?.roundScore ?? null, scoreGap, status };
                game.rounds.push(round);
                const location = scoredLocation(round, matchNumber);
                locations.push(location);
                if (!point.panoId) panoLookups.push(resolvePanoId(point).then(resolved => {
                  if (resolved.panoId) { round.panoId = location.panoId = resolved.panoId; round.panoIdSource = location.panoIdSource = resolved.panoIdSource; }
                }));
              } catch (error) {
                errors.push({ matchNumber, round: roundIndex + 1, error: error.message });
              }
            }
            await Promise.all(panoLookups);
          } catch (error) {
            errors.push({ matchNumber, error: error.message });
          } finally {
            popup('Overview')?.querySelector('.close-popup-button')?.click();
          }
          const last = game.rounds.at(-1);
          game.myTotal = last?.scores.find(score => score.name === myName)?.total ?? null;
          game.opponentTotal = last?.scores.find(score => score.name !== myName)?.total ?? null;
          game.status = game.myTotal === null || game.opponentTotal === null ? null : game.myTotal > game.opponentTotal ? 'won' : game.myTotal < game.opponentTotal ? 'lost' : 'tied';
          games.push(game);
          console.log(`Duel ${matchNumber}: ${game.rounds.length} rounds captured (${locations.length} total).`);
          emptyStreak = game.rounds.length ? 0 : emptyStreak + 1;
          if (emptyStreak >= 3) { interrupted = true; break; }
        }
        if (interrupted) break;
        const next = history.querySelector('.pagination-controls button:last-child');
        if (!next || next.disabled) break;
        const oldPage = page;
        next.click();
        await waitFor(() => popup('Duel history')?.querySelector('.page-counter')?.textContent?.trim() !== oldPage, 'next history page');
      }
      if (!locations.length) throw new Error('No round locations were captured.');
      const orderedLocations = locations.sort(weakestFirst);
      const reviewOrder = orderedLocations.filter(round => round.myBaseScore !== null);
      download({ name: 'My OpenGuessr duels', source: location.href, capturedAt: new Date().toISOString(), myName, locations: orderedLocations, games, reviewOrder, errors, stopped: window.__duelExportStop, nextMatchNumber: interrupted ? matchNumber - 2 : window.__duelExportStop ? matchNumber : null });
      console.log(`Downloaded ${locations.length} rounds from ${games.length} duels; ${locations.filter(item => item.panoId).length} panorama IDs; ${errors.length} errors.`);
    } finally {
      window.__duelExportRunning = false;
    }
  })();
  window.__duelExportTask.catch(error => console.error(`Duel export failed: ${error.message}`));
})();
