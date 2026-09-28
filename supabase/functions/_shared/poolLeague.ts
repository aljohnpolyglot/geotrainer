export type LeaguePlaceCandidate = { key: string; countryCode: string; name: string; kind: 'region' | 'city' };
export const leagueRosterSchema = { type: 'OBJECT', properties: { members: { type: 'ARRAY', items: { type: 'OBJECT', properties: { team: { type: 'STRING' }, city: { type: 'STRING' }, countryCode: { type: 'STRING' } }, required: ['team', 'city', 'countryCode'] } } }, required: ['members'] };
export const leagueRosterPrompt = (description: string) => 'Resolve this sports-league geographic request: ' + JSON.stringify(description) + '. Today is ' + new Date().toISOString().slice(0, 10) + '. Use Google Search to verify the requested season and division from official league or federation sources. If no season is specified, use the current season; if no division is specified, use the top division. List every participating club exactly once with its actual home municipality and ISO country code. Honor exclusions. Do not include historical participants, lower divisions, nearby cities, stadium alternatives, or places whose names merely resemble club names. State if the requested roster cannot be verified; never substitute a broader league or country-wide list.';
export const leagueRosterExtractionPrompt = (description: string, analysis: string) => 'Extract only verified participating clubs and their home municipalities from the following roster analysis for ' + JSON.stringify(description) + '. Do not add teams or cities from your own knowledge. Deduplicate clubs but retain separate clubs sharing one city. Use municipal city names, not club names or state names. If the roster is unverified, return an empty members list. Roster analysis:\n' + analysis.slice(0, 24000);
const cityIdentity = (value: string) => value.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export function leagueRosterPlaces(value: unknown, candidates: LeaguePlaceCandidate[]) {
  const members = value && typeof value === 'object' ? (value as { members?: unknown }).members : undefined;
  if (!Array.isArray(members) || !members.length) throw new Error('Could not create a geographic pool.');
  const cities = new Set(members.flatMap((member) => {
    if (!member || typeof member !== 'object') return [];
    const { team, city, countryCode } = member as Record<string, unknown>;
    return typeof team === 'string' && team.trim() && typeof city === 'string' && city.trim() && typeof countryCode === 'string' ? [countryCode.toUpperCase() + ':' + cityIdentity(city)] : [];
  }));
  const cityKeys = [...new Set(candidates.filter((candidate) => candidate.kind === 'city' && cities.has(candidate.countryCode + ':' + cityIdentity(candidate.name))).map((candidate) => candidate.key))];
  if (!cityKeys.length) throw new Error('Could not create a geographic pool.');
  return { regionKeys: [], cityKeys };
}
