import { readFile, writeFile } from 'node:fs/promises';
import { parse, join } from 'node:path';
import { fileURLToPath } from 'node:url';

export function orderOpenGuessrDuels(data) {
  if (data?.name !== 'My OpenGuessr duels' || !Array.isArray(data.games)) throw new Error('Choose an OpenGuessr Duel exporter JSON file.');
  const locations = data.games.flatMap(game => (game.rounds || []).flatMap(round => {
    if (!Number.isFinite(round.lat) || Math.abs(round.lat) > 90 || !Number.isFinite(round.lng) || Math.abs(round.lng) > 180) return [];
    const multiplier = round.round >= 4 ? 1.5 : 1;
    const myScore = Number.isFinite(round.myScore) ? round.myScore : null;
    const opponentScore = Number.isFinite(round.opponentScore) ? round.opponentScore : null;
    return [{ lat: round.lat, lng: round.lng, ...(Number.isFinite(round.heading) ? { heading: round.heading } : {}),
      matchNumber: game.matchNumber, round: round.round, multiplier, myScore, opponentScore,
      myBaseScore: myScore === null ? null : Math.round(myScore / multiplier),
      opponentBaseScore: opponentScore === null ? null : Math.round(opponentScore / multiplier),
      scoreGap: round.scoreGap ?? null, status: round.status ?? null }];
  }));
  if (!locations.length) throw new Error('No valid round locations found.');
  locations.sort((a, b) => (a.myBaseScore ?? Infinity) - (b.myBaseScore ?? Infinity)
    || a.matchNumber - b.matchNumber || a.round - b.round);
  return { ...data, locations, reviewOrder: locations.filter(point => point.myBaseScore !== null) };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const input = process.argv[2];
  if (!input) throw new Error('Pass the existing OpenGuessr Duel JSON file path.');
  const file = parse(input);
  const output = join(file.dir, `${file.name}-weakest-first.json`);
  const data = orderOpenGuessrDuels(JSON.parse(await readFile(input, 'utf8')));
  await writeFile(output, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Saved ${data.locations.length} rounds to ${output}`);
}
