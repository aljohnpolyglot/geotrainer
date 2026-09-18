export const normalizeRegionName = (name: string) => name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/\b(county|province|region|state|prefecture|department|departement|oblast|republic|l[aä]n)\b/g, '')
  .replace(/[^a-z0-9]/g, '');

const aliases: Record<string, string> = {
  bavaria: 'bayern', hesse: 'hessen', 'lowersaxony': 'niedersachsen',
  northrhinewestphalia: 'nordrheinwestfalen', rhinelandpalatinate: 'rheinlandpfalz',
  saxony: 'sachsen', saxonyanhalt: 'sachsenanhalt', thuringia: 'thuringen',
};

export function findRegionId(countryCode: string, regions: Record<string, string>, name?: string, shortCode?: string): string | undefined {
  const country = countryCode.toUpperCase();
  const code = shortCode?.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  if (code && regions[`${country}${code}`]) return `${country}${code}`;
  const normalized = normalizeRegionName(name || '');
  if (!normalized) return undefined;
  const target = aliases[normalized] || normalized;
  return Object.keys(regions).find((id) => normalizeRegionName(regions[id]) === target);
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
