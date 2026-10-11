import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
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
  const [openImage, setOpenImage] = useState<string>();
  const { copy, images } = metaReferenceContent(text);
  const base = import.meta.env?.BASE_URL || '/';
  useEffect(() => { if (!openImage) return; const close = (event: KeyboardEvent) => { if (event.key === 'Escape') setOpenImage(undefined); }; window.addEventListener('keydown', close); return () => window.removeEventListener('keydown', close); }, [openImage]);
  return <><CoachRichText text={copy} />{images.map(({ path }) => <figure className="meta-reference-figure" key={path}><button type="button" onClick={() => setOpenImage(`${base}${path.slice(1)}`)} aria-label={translate(ui, 'Enter Fullscreen')} title={translate(ui, 'Enter Fullscreen')}><img src={`${base}${path.slice(1)}`} alt={translate(ui, 'Meta reference clue')} loading="lazy" /></button></figure>)}{openImage && createPortal(<div className="clue-image-viewer" role="dialog" aria-modal="true" aria-label={translate(ui, 'Meta reference clue')} onMouseDown={(event) => { if (event.target === event.currentTarget) setOpenImage(undefined); }}><button type="button" autoFocus onClick={() => setOpenImage(undefined)} aria-label={translate(ui, 'close')} title={translate(ui, 'close')}><X size={22} /></button><img src={openImage} alt={translate(ui, 'Meta reference clue')} /></div>, document.body)}</>;
}
