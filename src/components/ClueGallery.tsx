import { MapPin, Trash2, X } from 'lucide-react';
import type { ClueRecord } from '../types';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export function ClueGallery({ country, clues, onClose, onDelete, onOpen }: { country: string; clues: ClueRecord[]; onClose: () => void; onDelete: (id: string) => void; onOpen: (clue: ClueRecord) => void }) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  return <aside className="clue-gallery" aria-label={`${country} ${t('knownClues')}`}>
    <header><div><h2>{country}</h2><p>{clues.length} {t('knownClues')}</p></div><button className="icon-button" onClick={onClose} aria-label={t('close')}><X size={17} /></button></header>
    <div className="clue-gallery-list">
      {clues.map((clue) => <article key={clue.id}>
        <img src={clue.imageDataUrl} alt={t('savedVisualClue')} />
        <div><p>{clue.analysis.description || clue.analysis.strongClues.join(' ') || t('savedVisualClue')}</p>
          {!!clue.analysis.candidates.length && <p className="clue-gallery-candidates">{clue.analysis.candidates.map((candidate) => `${candidate.countryCode} ${Math.round(candidate.confidence * 100)}%`).join(' · ')}</p>}
          {!!clue.analysis.strongClues.length && <ul>{clue.analysis.strongClues.map((item) => <li key={item}>{item}</li>)}</ul>}
          {!!clue.analysis.contradictions?.length && <small>{clue.analysis.contradictions.join(' · ')}</small>}
          {clue.lat !== undefined && clue.lng !== undefined && <small className="clue-coordinates">{clue.lat.toFixed(5)}, {clue.lng.toFixed(5)}</small>}
          <small>{new Date(clue.createdAt).toLocaleDateString()}</small>
        </div>
        <div className="clue-gallery-actions"><button className="icon-button" onClick={() => onOpen(clue)} aria-label={t('Reopen clue location')} title={t('Reopen clue location')}><MapPin size={15} /></button><button className="icon-button" onClick={() => onDelete(clue.id)} aria-label={t('deleteClue')}><Trash2 size={15} /></button></div>
      </article>)}
      {!clues.length && <p className="empty">{t('noVisualClues')}</p>}
    </div>
  </aside>;
}
