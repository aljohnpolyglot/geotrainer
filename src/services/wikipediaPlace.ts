export async function wikipediaPlaceUrl(place: string, region?: string): Promise<string | null> {
  const query = [place, region].filter(Boolean).join(' ');
  const search = async (term: string): Promise<string[]> => {
    const params = new URLSearchParams({ action: 'opensearch', search: term, limit: '5', namespace: '0', format: 'json', origin: '*' });
    const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
    if (!response.ok) throw new Error('Wikipedia lookup failed');
    const results: unknown = await response.json();
    if (!Array.isArray(results) || !Array.isArray(results[1])) throw new Error('Invalid Wikipedia response');
    return results[1].filter((value): value is string => typeof value === 'string');
  };
  let titles = await search(query);
  if (!titles.length && region) titles = await search(place);
  if (!titles.length) return null;
  const normalized = place.toLocaleLowerCase().trim();
  const title = titles.find((value) => {
    const candidate = value.toLocaleLowerCase();
    return candidate.includes(normalized) && (!region || candidate.includes(region.toLocaleLowerCase()) || normalized.includes(' ') && candidate === normalized);
  });
  return title ? `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}` : `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
}
