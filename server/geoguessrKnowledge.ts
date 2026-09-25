import dataset from './data/geoguessr-hints.json' with { type: 'json' };
import geometas from './data/geometas-hints.json' with { type: 'json' };

type SourceHint = { cat?: string; type?: string; text?: string; uniq?: string; uniq_note?: string };
type SourceCountry = { name: string; slug: string; links?: { plonkit?: string | null }; hints?: SourceHint[] };
type MetaCountry = { name: string; hints?: Array<{ tags?: string[]; text?: string }> };

export type GeoKnowledgeHint = { country: string; category: string; type: string; text: string; source?: string };

const aliases: Record<string, string> = {
  israel: 'israel and the west bank', macao: 'macau', pitcairn: 'pitcairn islands',
  'u s virgin islands': 'us virgin islands', 'united states of america': 'united states',
};

function key(value: string) {
  const normalized = value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/&/g, ' and ').replace(/[^a-z0-9]+/g, ' ').replace(/^the\s+/, '').trim();
  return aliases[normalized] || normalized;
}

export function getCountryKnowledge(countryName: string, limit = 10): GeoKnowledgeHint[] {
  if (!countryName || limit < 1) return [];
  const country = (dataset.countries as SourceCountry[]).find((item) => key(item.name) === key(countryName));
  if (!country) return [];
  const ranked = [...(country.hints || [])].sort((a, b) => Number(b.uniq === 'unique') - Number(a.uniq === 'unique') || Number(a.cat !== 'country') - Number(b.cat !== 'country'));
  const diverse = [...new Map(ranked.map((hint) => [hint.type || 'general', hint])).values(), ...ranked];
  return [...new Set(diverse)]
    .slice(0, Math.min(12, limit))
    .flatMap((hint) => typeof hint.text === 'string' ? [{
      country: country.name,
      category: hint.cat || 'country',
      type: hint.type || 'general',
      text: hint.text.replace(/\*\*/g, '').slice(0, 500),
      source: country.links?.plonkit || undefined,
    }] : []);
}

export function getCountryMetaKnowledge(countryName: string, limit = 8): GeoKnowledgeHint[] {
  if (!countryName || limit < 1) return [];
  const country = (geometas.countries as MetaCountry[]).find((item) => key(item.name) === key(countryName));
  if (!country) return [];
  const hints = country.hints || [];
  const diverse = [...new Map(hints.map((hint) => [hint.tags?.[0] || 'general', hint])).values(), ...hints];
  return [...new Set(diverse)].slice(0, Math.min(12, limit)).flatMap((hint) => typeof hint.text === 'string' ? [{
    country: country.name,
    category: 'meta',
    type: hint.tags?.join(', ') || 'general',
    text: hint.text.slice(0, 700),
    source: 'https://geometas.com/',
  }] : []);
}
