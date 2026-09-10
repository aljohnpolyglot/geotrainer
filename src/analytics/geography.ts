import raw from '../data/geography.json';

export type Geography = { continent: string; region: string; subregion: string };
const source = raw as Record<string, Geography>;
const groups: Array<[string, string[]]> = [
  ['Baltics', ['EE', 'LV', 'LT']],
  ['Nordics', ['AX', 'DK', 'FI', 'FO', 'IS', 'NO', 'SE']],
  ['Central Europe', ['AT', 'CH', 'CZ', 'DE', 'HU', 'LI', 'PL', 'SK', 'SI']],
  ['Balkans / Southeastern Europe', ['AL', 'BA', 'BG', 'GR', 'HR', 'ME', 'MK', 'RO', 'RS', 'XK']],
  ['Caucasus', ['AM', 'AZ', 'GE']],
  ['Middle East', ['AE', 'BH', 'IL', 'IQ', 'JO', 'KW', 'LB', 'OM', 'PS', 'QA', 'SA', 'SY', 'TR', 'YE']],
];
const overrides = new Map(groups.flatMap(([name, codes]) => codes.map((code) => [code, name] as const)));
const aliases: Record<string, string> = {
  'Northern Africa': 'North Africa', 'Western Africa': 'West Africa', 'Eastern Africa': 'East Africa',
  'Middle Africa': 'Central Africa', 'Southern Africa': 'Southern Africa', 'South-Eastern Asia': 'Southeast Asia',
  'Southern Asia': 'South Asia', 'Eastern Asia': 'East Asia', 'Western Asia': 'Middle East',
};

export function geographyFor(code?: string): Geography | undefined {
  if (!code) return;
  const found = source[code.toUpperCase()];
  if (!found) return;
  const continent = found.continent === 'Americas'
    ? found.region === 'South America' ? 'South America' : 'North America'
    : found.continent;
  return { continent, region: overrides.get(code.toUpperCase()) || aliases[found.region] || found.region, subregion: found.subregion };
}
