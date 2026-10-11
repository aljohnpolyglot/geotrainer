import { useEffect, useState } from 'react';
import { ExternalLink } from 'lucide-react';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { wikipediaPlaceUrl } from '../services/wikipediaPlace';

const COPY: Record<string, { open: string; missing: string }> = {
  en: { open: 'Open on Wikipedia', missing: 'Wikipedia article unavailable.' },
  es: { open: 'Abrir en Wikipedia', missing: 'Artículo de Wikipedia no disponible.' },
  pt: { open: 'Abrir na Wikipédia', missing: 'Artigo da Wikipédia indisponível.' },
  fr: { open: 'Ouvrir sur Wikipédia', missing: 'Article Wikipédia indisponible.' },
  de: { open: 'Auf Wikipedia öffnen', missing: 'Wikipedia-Artikel nicht verfügbar.' },
  it: { open: 'Apri su Wikipedia', missing: 'Articolo di Wikipedia non disponibile.' },
  ru: { open: 'Открыть в Википедии', missing: 'Статья в Википедии недоступна.' },
  sv: { open: 'Öppna på Wikipedia', missing: 'Wikipedia-artikeln är inte tillgänglig.' },
};

export function WikipediaPlaceLink({ name, place, region, className }: { name: string; place: string; region?: string; className?: string }) {
  const { ui, wikipedia } = useLanguagePreferences();
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let active = true;
    setUrl(null); setFailed(false);
    if (place) void wikipediaPlaceUrl(place, region, wikipedia).then((result) => { if (active) { setUrl(result); setFailed(!result); } }).catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [place, region, wikipedia]);
  return <span className={className}>{url ? <a className="location-wikipedia-link" href={url} target="_blank" rel="noopener noreferrer" title={COPY[ui].open} aria-label={`${COPY[ui].open}: ${name}`}>{name}<ExternalLink size={12} aria-hidden="true" /></a> : name}{failed && <small className="location-wikipedia-error" role="status">{COPY[ui].missing}</small>}</span>;
}
