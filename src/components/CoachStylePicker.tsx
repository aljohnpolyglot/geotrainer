import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Check, X } from 'lucide-react';
import type { CoachStyle } from '../types';
import { COACH_STYLES, COACH_STYLE_ICONS, COACH_STYLE_NAMES, coachGuide } from '../services/coachPreferences';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export function CoachStylePicker({ selected, onSelect, onClose }: { selected: CoachStyle; onSelect: (style: CoachStyle) => void; onClose: () => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key); const guide = coachGuide(ui);
  useEffect(() => { const close = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); }; document.addEventListener('keydown', close); return () => document.removeEventListener('keydown', close); }, [onClose]);
  return createPortal(<div className="coach-style-picker-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><section className="coach-style-picker" role="dialog" aria-modal="true" aria-label={t('Choose a Coach style')}><div className="coach-style-picker-head"><div><strong>{t('Choose a Coach style')}</strong><small>{t('Same evidence, different coaching')}</small></div><button type="button" onClick={onClose} aria-label={t('cancel')}><X size={18} /></button></div><div className="coach-style-options" role="listbox">{COACH_STYLES.map((style) => <button autoFocus={style === selected} type="button" role="option" aria-selected={style === selected} key={style} onClick={() => onSelect(style)}><span className="coach-style-icon" aria-hidden="true">{COACH_STYLE_ICONS[style]}</span><span><strong>{COACH_STYLE_NAMES[style]}</strong><small>{guide.styles[style].purpose}</small></span>{style === selected && <Check className="coach-style-check" size={17} aria-hidden="true" />}</button>)}</div></section></div>, document.body);
}
