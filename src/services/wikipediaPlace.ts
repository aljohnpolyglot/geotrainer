import type { SupportedLanguage } from '../types';

export async function wikipediaPlaceUrl(place: string, region?: string, language: SupportedLanguage = 'en'): Promise<string | null> {
  const query = [place, region].filter(Boolean).join(' ');
  const search = async (term: string, edition: SupportedLanguage): Promise<string[]> => {
    const params = new URLSearchParams({ action: 'opensearch', search: term, limit: '5', namespace: '0', format: 'json', origin: '*' });
    const response = await fetch(`https://${edition}.wikipedia.org/w/api.php?${params}`);
    if (!response.ok) throw new Error('Wikipedia lookup failed');
    const results: unknown = await response.json();
    if (!Array.isArray(results) || !Array.isArray(results[1])) throw new Error('Invalid Wikipedia response');
    return results[1].filter((value): value is string => typeof value === 'string');
  };
  const normalized = place.toLocaleLowerCase().trim();
  for (const edition of language === 'en' ? ['en'] as const : [language, 'en'] as const) {
    let titles: string[];
    try {
      titles = await search(query, edition);
      if (!titles.length && region) titles = await search(place, edition);
    } catch (error) {
      if (edition === 'en') throw error;
      continue;
    }
    if (!titles.length) continue;
    const title = titles.find((value) => {
      const candidate = value.toLocaleLowerCase();
      return candidate.includes(normalized) && (!region || candidate.includes(region.toLocaleLowerCase()) || normalized.includes(' ') && candidate === normalized);
    });
    if (title) {
      if (edition === 'en' && language !== 'en') {
        try {
          const params = new URLSearchParams({ action: 'query', prop: 'langlinks', titles: title, lllang: language, format: 'json', origin: '*' });
          const response = await fetch(`https://en.wikipedia.org/w/api.php?${params}`);
          if (response.ok) {
            const data: unknown = await response.json();
            const pages = (data as { query?: { pages?: Record<string, { langlinks?: Array<{ '*': string }> }> } })?.query?.pages;
            const translated = pages && Object.values(pages)[0]?.langlinks?.[0]?.['*'];
            if (translated) return `https://${language}.wikipedia.org/wiki/${encodeURIComponent(translated.replace(/ /g, '_'))}`;
          }
        } catch { /* English article remains available. */ }
      }
      return `https://${edition}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
    }
    if (edition === 'en') return `https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(query)}`;
  }
  return null;
}
