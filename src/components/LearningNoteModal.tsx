import { createPortal } from 'react-dom';
import { ExternalLink, X } from 'lucide-react';
import { CountryFlag } from './CountryFlag';
import { countryName, useHubTranslate } from './trainerHubUtils';
import { StreetViewContainer } from './StreetViewContainer';
import type { CoachAnalysis } from '../types';
import { CoachLocationEstimate } from './CoachLocationEstimate';
import { CoachRichText } from './CoachRichText';
import { countryDisplayName } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

export type LearningNoteDetail = { countryCode: string; source: string; text: string; at: number; note?: string; category?: string; imageUrl?: string; panoId?: string; temporallySensitive?: boolean; analysis?: CoachAnalysis };

export function LearningNoteModal({ detail, onClose }: { detail: LearningNoteDetail; onClose: () => void }) {
  const t = useHubTranslate();
  const { ai } = useLanguagePreferences();
  const streetViewUrl = detail.panoId ? `https://www.google.com/maps/@?api=1&map_action=pano&pano=${encodeURIComponent(detail.panoId)}` : '';
  const list = (title: string, values: string[]) => values.length ? <section><strong>{title}</strong><ul>{values.map((value) => <li key={value}><CoachRichText text={value} /></li>)}</ul></section> : null;
  return createPortal(<div className="clue-gallery-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <aside className="clue-gallery detail-open learning-note-detail" role="dialog" aria-modal="true" aria-label={detail.source}>
      <header><span /><div><h2><CountryFlag code={detail.countryCode} />{countryName(detail.countryCode)}</h2><p>{detail.category ? `${t(detail.category)} · ` : ''}{detail.source}</p></div><button className="icon-button" onClick={onClose} aria-label={t('close')}><X size={17} /></button></header>
      <div className={`learning-note-detail-body coach-output-${detail.analysis?.style || 'quick'}`}>{detail.panoId && <div className="learning-note-scene"><StreetViewContainer currentLocation={{ panoId: detail.panoId, countryCode: detail.countryCode, lat: 0, lng: 0 }} isLoading={false} onNextLocation={() => {}} canMove canPan canZoom showCompass={false} />{detail.imageUrl && <img src={detail.imageUrl} alt={detail.source} />}</div>}{!detail.panoId && detail.imageUrl && <img src={detail.imageUrl} alt={detail.source} />}{detail.text && <p><CoachRichText text={detail.text} /></p>}{detail.analysis && <div className="available-note-analysis"><CoachLocationEstimate estimate={detail.analysis.locationEstimate} />{!!detail.analysis.candidates.length && <section><strong>{t('candidates')}</strong><ul>{detail.analysis.candidates.map((candidate) => <li key={candidate.countryCode}><CountryFlag code={candidate.countryCode} />{countryDisplayName(candidate.countryCode, ai)} · {Math.round(candidate.confidence * 100)}%{candidate.rationale && <small><CoachRichText text={candidate.rationale} /></small>}</li>)}</ul></section>}{list(t('strongClues'), detail.analysis.strongClues)}{list(t('weakGeneric'), detail.analysis.weakClues)}{list(t('contradictionsGaps'), detail.analysis.contradictions || [])}{list(t('confusableWith'), detail.analysis.confusions)}{list(t('inspectNext'), detail.analysis.nextThingsToInspect)}</div>}{detail.note && <p>{detail.note}</p>}{detail.temporallySensitive && <small className="meta-temporal-warning">{t('This imagery Meta may change over time. Use it as supporting evidence.')}</small>}<time>{new Date(detail.at).toLocaleString()}</time>{streetViewUrl && <a href={streetViewUrl} target="_blank" rel="noreferrer"><ExternalLink size={15} />{t('Reopen clue location')}</a>}</div>
    </aside>
  </div>, document.body);
}
