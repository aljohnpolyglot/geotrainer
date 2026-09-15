import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Eye, ExternalLink, Trash2, X } from 'lucide-react';
import type { ClueRecord } from '../types';
import { countryDisplayName, translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { CountryFlag } from './CountryFlag';
import { StreetViewContainer } from './StreetViewContainer';
import { CoachLocationEstimate } from './CoachLocationEstimate';
import { coachStyleLabel } from '../services/coachPreferences';
import { CoachRichText } from './CoachRichText';

export function ClueGallery({ country, clues, initialSelectedId, onClose, onDelete }: { country: string; clues: ClueRecord[]; initialSelectedId?: string; onClose: () => void; onDelete: (id: string) => void }) {
  const { ui, ai } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [selected, setSelected] = useState<ClueRecord | null>(() => clues.find((clue) => clue.id === initialSelectedId) || (clues.length === 1 ? clues[0] : null));
  const displayCountry = countryDisplayName(selected?.countryCode || clues[0]?.countryCode || '', ui) || country;
  const list = (title: string, values: string[]) => values.length ? <section><strong>{title}</strong><ul>{values.map((value) => <li key={value}><CoachRichText text={value} /></li>)}</ul></section> : null;
  const streetViewUrl = (clue: ClueRecord) => `https://www.google.com/maps/@?api=1&map_action=pano&pano=${encodeURIComponent(clue.panoId)}`;
  const location = selected?.lat !== undefined && selected.lng !== undefined ? { countryCode: selected.countryCode, lat: selected.lat, lng: selected.lng, panoId: selected.panoId } : null;
  return createPortal(<div className="clue-gallery-backdrop"><aside className={`clue-gallery${selected ? ' detail-open' : ''}`} aria-label={`${displayCountry} ${t('knownClues')}`}>
    <header><span /><div><h2><CountryFlag code={selected?.countryCode || clues[0]?.countryCode} />{displayCountry}</h2><p>{selected ? `${t(selected.origin === 'personal' ? 'Personal' : 'AI-assisted')}${selected.analysis.style ? ` · ${coachStyleLabel(selected.analysis.style)}` : ''} · ${new Date(selected.createdAt).toLocaleString(ui)}` : `${clues.length} ${t('knownClues')}`}</p></div><button className="icon-button" onClick={onClose} aria-label={t('close')}><X size={17} /></button></header>
    {selected ? <div className={`clue-gallery-detail coach-output-${selected.analysis.style || 'quick'}`}>{location ? <div className="clue-gallery-streetview"><StreetViewContainer currentLocation={location} isLoading={false} onNextLocation={() => {}} canMove canPan canZoom showCompass={false} /><img className="clue-gallery-reference" src={selected.imageDataUrl} alt={t('savedVisualClue')} /></div> : <img src={selected.imageDataUrl} alt={t('savedVisualClue')} />}
      {selected.analysis.style && <p className="coach-history-profile"><strong>{coachStyleLabel(selected.analysis.style)}</strong>{selected.analysis.depth && <span>{t(selected.analysis.depth[0].toUpperCase() + selected.analysis.depth.slice(1))}</span>}</p>}{selected.analysis.description && <p><CoachRichText text={selected.analysis.description} /></p>}
      <CoachLocationEstimate estimate={selected.analysis.locationEstimate} />
      {!!selected.analysis.candidates.length && <ol>{selected.analysis.candidates.map((candidate) => <li key={candidate.countryCode}><div><b><CountryFlag code={candidate.countryCode} />{countryDisplayName(candidate.countryCode, ai)}</b><span>{Math.round(candidate.confidence * 100)}%</span></div>{candidate.rationale && <small><CoachRichText text={candidate.rationale} /></small>}</li>)}</ol>}
      {list(t('strongClues'), selected.analysis.strongClues)}{list(t('weakGeneric'), selected.analysis.weakClues)}{list(t('contradictionsGaps'), selected.analysis.contradictions || [])}{list(t('confusableWith'), selected.analysis.confusions)}{list(t('inspectNext'), selected.analysis.nextThingsToInspect)}
      {selected.analysis.coreCard && <section><strong>{t('coreCard')}</strong><ul>{selected.analysis.coreCard.front.map((item) => <li key={item}><CoachRichText text={item} /></li>)}</ul><p><CoachRichText text={selected.analysis.coreCard.backExplanation} /></p></section>}
      {selected.analysis.extraCards.map((card) => <section key={card.category}><strong>{card.category}</strong><ul>{card.front.map((item) => <li key={item}><CoachRichText text={item} /></li>)}</ul><p><CoachRichText text={card.back} /></p></section>)}
      {selected.lat !== undefined && selected.lng !== undefined && <small className="clue-coordinates">{selected.lat.toFixed(5)}, {selected.lng.toFixed(5)}</small>}
      <div className="clue-detail-actions"><a className="button secondary" href={streetViewUrl(selected)} target="_blank" rel="noreferrer"><ExternalLink size={15} />{t('Reopen clue location')}</a><button className="button secondary" onClick={() => { onDelete(selected.id); setSelected(null); }}><Trash2 size={15} />{t('deleteClue')}</button></div>
    </div> : <div className="clue-gallery-list">
      {clues.map((clue) => <article key={clue.id}>{clue.imageDataUrl && <img src={clue.imageDataUrl} alt={t('savedVisualClue')} />}<div className="clue-gallery-summary"><small>{t(clue.origin === 'personal' ? 'Personal' : 'AI-assisted')}{clue.analysis.style ? ` · ${coachStyleLabel(clue.analysis.style)}` : ''} · {new Date(clue.createdAt).toLocaleString(ui)}</small><p>{clue.analysis.description || clue.analysis.strongClues[0] || t('savedVisualClue')}</p>{!!clue.analysis.candidates.length && <div className="clue-gallery-candidates">{clue.analysis.candidates.map((candidate) => <span key={candidate.countryCode}><CountryFlag code={candidate.countryCode} />{countryDisplayName(candidate.countryCode, ai)}<b>{Math.round(candidate.confidence * 100)}%</b></span>)}</div>}{!!clue.analysis.strongClues.length && <ul>{clue.analysis.strongClues.map((item) => <li key={item}>{item}</li>)}</ul>}{clue.lat !== undefined && clue.lng !== undefined && <small className="clue-coordinates">{clue.lat.toFixed(5)}, {clue.lng.toFixed(5)}</small>}</div><div className="clue-gallery-actions"><button className="icon-button" onClick={() => setSelected(clue)} aria-label={t('Details')} title={t('Details')}><Eye size={15} /></button><a className="icon-button" href={streetViewUrl(clue)} target="_blank" rel="noreferrer" aria-label={t('Reopen clue location')} title={t('Reopen clue location')}><ExternalLink size={15} /></a><button className="icon-button" onClick={() => onDelete(clue.id)} aria-label={t('deleteClue')}><Trash2 size={15} /></button></div></article>)}
      {!clues.length && <p className="empty">{t('noVisualClues')}</p>}
    </div>}
  </aside></div>, document.body);
}
