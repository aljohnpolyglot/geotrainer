import { useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, Eye, ExternalLink, Trash2, X } from 'lucide-react';
import type { ClueRecord } from '../types';
import { COUNTRIES } from '../data/countries';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { CountryFlag } from './CountryFlag';
import { StreetViewContainer } from './StreetViewContainer';
import { CoachLocationEstimate } from './CoachLocationEstimate';

export function ClueGallery({ country, clues, initialSelectedId, onClose, onDelete }: { country: string; clues: ClueRecord[]; initialSelectedId?: string; onClose: () => void; onDelete: (id: string) => void }) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [selected, setSelected] = useState<ClueRecord | null>(() => clues.find((clue) => clue.id === initialSelectedId) || (clues.length === 1 ? clues[0] : null));
  const list = (title: string, values: string[]) => values.length ? <section><strong>{title}</strong><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></section> : null;
  const streetViewUrl = (clue: ClueRecord) => `https://www.google.com/maps/@?api=1&map_action=pano&pano=${encodeURIComponent(clue.panoId)}`;
  const location = selected?.lat !== undefined && selected.lng !== undefined ? { countryCode: selected.countryCode, lat: selected.lat, lng: selected.lng, panoId: selected.panoId } : null;
  return createPortal(<div className="clue-gallery-backdrop"><aside className={`clue-gallery${selected ? ' detail-open' : ''}`} aria-label={`${country} ${t('knownClues')}`}>
    <header>{selected ? <button className="icon-button" onClick={() => clues.length === 1 ? onClose() : setSelected(null)} aria-label={t('Back')}><ArrowLeft size={17} /></button> : <span />}<div><h2><CountryFlag code={selected?.countryCode || clues[0]?.countryCode} />{country}</h2><p>{selected ? t('Details') : `${clues.length} ${t('knownClues')}`}</p></div><button className="icon-button" onClick={onClose} aria-label={t('close')}><X size={17} /></button></header>
    {selected ? <div className="clue-gallery-detail">{location ? <div className="clue-gallery-streetview"><StreetViewContainer currentLocation={location} isLoading={false} onNextLocation={() => {}} canMove canPan canZoom showCompass={false} /></div> : <img src={selected.imageDataUrl} alt={t('savedVisualClue')} />}
      {selected.analysis.description && <p>{selected.analysis.description}</p>}
      <CoachLocationEstimate estimate={selected.analysis.locationEstimate} />
      {!!selected.analysis.candidates.length && <ol>{selected.analysis.candidates.map((candidate) => <li key={candidate.countryCode}><b><CountryFlag code={candidate.countryCode} />{COUNTRIES[candidate.countryCode]?.name || candidate.countryCode}</b><span>{Math.round(candidate.confidence * 100)}%</span></li>)}</ol>}
      {list(t('strongClues'), selected.analysis.strongClues)}{list(t('weakGeneric'), selected.analysis.weakClues)}{list(t('contradictionsGaps'), selected.analysis.contradictions || [])}{list(t('confusableWith'), selected.analysis.confusions)}{list(t('inspectNext'), selected.analysis.nextThingsToInspect)}
      {selected.analysis.coreCard && <section><strong>{t('coreCard')}</strong><ul>{selected.analysis.coreCard.front.map((item) => <li key={item}>{item}</li>)}</ul><p>{selected.analysis.coreCard.backExplanation}</p></section>}
      {selected.analysis.extraCards.map((card) => <section key={card.category}><strong>{card.category}</strong><ul>{card.front.map((item) => <li key={item}>{item}</li>)}</ul><p>{card.back}</p></section>)}
      {selected.lat !== undefined && selected.lng !== undefined && <small className="clue-coordinates">{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</small>}
      <div className="clue-detail-actions"><a className="button secondary" href={streetViewUrl(selected)} target="_blank" rel="noreferrer"><ExternalLink size={15} />{t('Reopen clue location')}</a><button className="button secondary" onClick={() => { onDelete(selected.id); setSelected(null); }}><Trash2 size={15} />{t('deleteClue')}</button></div>
    </div> : <div className="clue-gallery-list">
      {clues.map((clue) => <article key={clue.id}><img src={clue.imageDataUrl} alt={t('savedVisualClue')} /><div><p>{clue.analysis.description || clue.analysis.strongClues.join(' ') || t('savedVisualClue')}</p>{!!clue.analysis.candidates.length && <p className="clue-gallery-candidates">{clue.analysis.candidates.map((candidate) => <span key={candidate.countryCode}><CountryFlag code={candidate.countryCode} />{COUNTRIES[candidate.countryCode]?.name || candidate.countryCode} {Math.round(candidate.confidence * 100)}%</span>)}</p>}{!!clue.analysis.strongClues.length && <ul>{clue.analysis.strongClues.map((item) => <li key={item}>{item}</li>)}</ul>}{clue.lat !== undefined && clue.lng !== undefined && <small className="clue-coordinates">{clue.lat.toFixed(5)}, {clue.lng.toFixed(5)}</small>}<small>{new Date(clue.createdAt).toLocaleDateString()}</small></div><div className="clue-gallery-actions"><button className="icon-button" onClick={() => setSelected(clue)} aria-label={t('Details')} title={t('Details')}><Eye size={15} /></button><a className="icon-button" href={streetViewUrl(clue)} target="_blank" rel="noreferrer" aria-label={t('Reopen clue location')} title={t('Reopen clue location')}><ExternalLink size={15} /></a><button className="icon-button" onClick={() => onDelete(clue.id)} aria-label={t('deleteClue')}><Trash2 size={15} /></button></div></article>)}
      {!clues.length && <p className="empty">{t('noVisualClues')}</p>}
    </div>}
  </aside></div>, document.body);
}
