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
    const matchingTitle = (titles: string[]) => {
      const candidates = titles.filter((value) => value.toLocaleLowerCase().includes(normalized));
      return candidates.find((value) => region && value.toLocaleLowerCase().includes(region.toLocaleLowerCase()))
        || candidates.find((value) => value.toLocaleLowerCase() === normalized)
        || (!region ? candidates[0] : undefined);
    };
    let title: string | undefined;
    try {
      title = matchingTitle(await search(query, edition));
      if (!title && region) title = matchingTitle(await search(place, edition));
    } catch (error) {
      if (edition === 'en') throw error;
      continue;
    }
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
  }
  return null;
}
