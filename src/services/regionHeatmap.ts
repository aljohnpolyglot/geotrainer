const cyrillic: Record<string, string> = { а:'a', б:'b', в:'v', г:'g', д:'d', е:'e', ё:'yo', ж:'zh', з:'z', и:'i', й:'y', к:'k', л:'l', м:'m', н:'n', о:'o', п:'p', р:'r', с:'s', т:'t', у:'u', ф:'f', х:'kh', ц:'ts', ч:'ch', ш:'sh', щ:'shch', ъ:'', ы:'y', ь:'', э:'e', ю:'yu', я:'ya', і:'i', ї:'yi', є:'ye', ґ:'g' };
const latinize = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[а-яёіїєґ]/g, (letter) => cyrillic[letter]);
const plainName = (name: string) => latinize(name).replace(/[^a-z0-9]/g, '');
export const normalizeRegionName = (name: string) => latinize(name)
  .replace(/\b(county|province|region|state|prefecture|department|departement|oblast|republic|respublika|krai|kray|okrug|autonomous|avtonomnaya|l[aä]n|city|of)\b/g, '')
  .replace(/[^a-z0-9]/g, '');

const aliases: Record<string, string> = {
  bavaria: 'bayern', hesse: 'hessen', 'lowersaxony': 'niedersachsen',
  northrhinewestphalia: 'nordrheinwestfalen', rhinelandpalatinate: 'rheinlandpfalz',
  saxony: 'sachsen', saxonyanhalt: 'sachsenanhalt', thuringia: 'thuringen',
};

const russianAliases: Record<string, string> = {
  adygeyarepublic:'RUAD', altai:'RUAL', altairepublic:'RUAL', altaikrai:'RUALT', altaykrai:'RUALT',
  arkhangelskaya:'RUARK', buryatiyarepublic:'RUBU', chukotka:'RUCHU', ingushetiyarepublic:'RUIN',
  jewishautonomousoblast:'RUYEV', kabardinobalkariyarepublic:'RUKB', kalmykiyarepublic:'RUKL',
  karachayevocherkesiyarepublic:'RUKC', khakasiyarepublic:'RUKK', khantymansia:'RUKHM',
  kuzbass:'RUKEM', leningradskayaoblast:'RULEN', magadanoblast:'RUMAG', mordoviyarepublic:'RUMO',
  moscow:'RUMOS', moscowoblast:'RUMOW', moscowregion:'RUMOW', nizhnynovgorodoblast:'RUNIZ',
  northossetiaalania:'RUSE', oryoloblast:'RUORL', republicoftyva:'RUTY', sakha:'RUSA',
  stpetersburg:'RUSPE', saintpetersburg:'RUSPE', udmurtiyarepublic:'RUUD', yamalonenets:'RUYAN',
  zabaykalskiytransbaikalkray:'RUZAB', transbaikalkrai:'RUZAB',
};

export function findRegionId(countryCode: string, regions: Record<string, string>, name?: string, shortCode?: string, alternateNames?: Record<string, string>): string | undefined {
  const country = countryCode.toUpperCase();
  const code = shortCode?.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (code && regions[`${country}${code}`]) return `${country}${code}`;
  const key = plainName(name || '');
  const alias = country === 'RU' && russianAliases[key] || alternateNames?.[key];
  if (alias && regions[alias]) return alias;
  const normalized = normalizeRegionName(name || '');
  if (!normalized) return undefined;
  const target = aliases[normalized] || normalized;
  return Object.keys(regions).find((id) => { const candidate = normalizeRegionName(regions[id]); return candidate === target || country === 'SE' && target === `${candidate}s`; });
}

export function regionNameAliases(countryCode: string, regions: Record<string, string>, pools: Array<{ name: string; names?: Record<string, string> }>) {
  const aliases: Record<string, string> = {};
  const ambiguous = new Set<string>();
  for (const pool of pools) {
    const id = findRegionId(countryCode, regions, pool.name);
    if (!id) continue;
    for (const name of [pool.name, ...Object.values(pool.names || {})]) {
      const key = plainName(name);
      if (!key || ambiguous.has(key)) continue;
      if (aliases[key] && aliases[key] !== id) { delete aliases[key]; ambiguous.add(key); }
      else aliases[key] = id;
    }
  }
  return aliases;
}

export function regionSvgMarkup(source: string, regions: Record<string, string>, values: Record<string, number | null>, colors: readonly string[], emptyLabel: string, label: string) {
  const document = new DOMParser().parseFromString(source, 'image/svg+xml');
  const root = document.documentElement;
  const escape = (value: string) => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;');
  const viewBox = root.getAttribute('viewBox') || root.getAttribute('viewbox') || '0 0 1000 1000';
  const paths = [...document.querySelectorAll('path[id]')].flatMap((path) => {
    const id = path.getAttribute('id') || '';
    const d = path.getAttribute('d');
    if (!regions[id] || !d) return [];
    const value = values[id];
    const fill = value == null ? 'var(--choropleth-empty)' : colors[Math.min(3, Math.floor(value * 4))];
    return `<path id="${escape(id)}" d="${escape(d)}" style="fill:${fill}"><title>${escape(regions[id])} · ${value == null ? escape(emptyLabel) : `${Math.round(value * 100)}%`}</title></path>`;
  });
  return `<svg class="coverage-choropleth-svg" role="img" aria-label="${escape(label)}" viewBox="${escape(viewBox)}" xmlns="http://www.w3.org/2000/svg">${paths.join('')}</svg>`;
}
