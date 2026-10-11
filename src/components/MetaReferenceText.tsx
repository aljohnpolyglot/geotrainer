import { CoachRichText } from './CoachRichText';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export function metaReferenceContent(text: string) {
  const images: { path: string; label: string }[] = [];
  const copy = text.replace(/\[([^\]]+)\]\((\/images\/[^)\s?]+)\??\)/g, (_match, label: string, path: string) => {
    images.push({ path, label });
    return label;
  });
  return { copy, images };
}

export function MetaReferenceText({ text }: { text: string }) {
  const { ui } = useLanguagePreferences();
  const { copy, images } = metaReferenceContent(text);
  const base = import.meta.env?.BASE_URL || '/';
  return <><CoachRichText text={copy} />{images.map(({ path }) => <figure className="meta-reference-figure" key={path}><img src={`${base}${path.slice(1)}`} alt={translate(ui, 'Meta reference clue')} loading="lazy" /></figure>)}</>;
}
