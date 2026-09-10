import { Trash2, X } from 'lucide-react';
import type { ClueRecord } from '../types';

export function ClueGallery({ country, clues, onClose, onDelete }: { country: string; clues: ClueRecord[]; onClose: () => void; onDelete: (id: string) => void }) {
  return <aside className="clue-gallery" aria-label={`${country} known clues`}>
    <header><div><h2>{country}</h2><p>{clues.length} saved visual clue{clues.length === 1 ? '' : 's'}</p></div><button className="icon-button" onClick={onClose} aria-label="Close known clues"><X size={17} /></button></header>
    <div className="clue-gallery-list">
      {clues.map((clue) => <article key={clue.id}>
        <img src={clue.imageDataUrl} alt="Saved visual clue" />
        <div><p>{clue.analysis.description || clue.analysis.strongClues.join(' ') || 'Saved visual clue'}</p><small>{new Date(clue.createdAt).toLocaleDateString()} · {clue.model}</small></div>
        <button className="icon-button" onClick={() => onDelete(clue.id)} aria-label="Delete clue"><Trash2 size={15} /></button>
      </article>)}
      {!clues.length && <p className="empty">No visual clues saved for this country yet.</p>}
    </div>
  </aside>;
}
