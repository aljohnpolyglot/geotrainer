import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { AppMode, CoachAnalysis, CoachMode } from '../types';
import { captureStreetViewImage, getStreetViewSnapshot } from '../services/streetViewSnapshot';
import { ClueCapture } from './ClueCapture';
import { trainerDb } from '../data/trainerDb';
import { countryDisplayName, translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { useDraggablePanel } from '../hooks/useDraggablePanel';
import { postCoach } from '../services/coachClient';
import { CountryFlag } from './CountryFlag';
import { CoachLocationEstimate } from './CoachLocationEstimate';
import { useCoachPreferences } from '../services/useCoachPreferences';
import { COACH_OUTPUT_LABELS, coachStyleLabel } from '../services/coachPreferences';
import { CoachStylePicker } from './CoachStylePicker';
import { CoachRichText } from './CoachRichText';

type CoachContext = {
  actualCountry?: string;
  actualRegion?: string;
  guessedCountry?: string;
  score?: number;
  distanceKm?: number | null;
  previousAttempts?: Array<{ guessedCountry?: string; score: number }>;
};

export function AiCoach({ panoId, appMode, revealed, context, onSave, onSaveClue, onClueAnalyzed }: { panoId: string; appMode: AppMode; revealed: boolean; context?: CoachContext; onSave?: (value: { mode: CoachMode; model: string; generatedAt: number; analysis: CoachAnalysis; clueId?: string }) => Promise<void> | void; onSaveClue: (value: { imageDataUrl: string; model: string; generatedAt: number; analysis: CoachAnalysis }) => Promise<string | void> | string | void; onClueAnalyzed?: () => void }) {
  const { ui, ai, game, ready: languageReady } = useLanguagePreferences();
  const coachPreferences = useCoachPreferences();
  const t = (key: string) => translate(ui, key);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CoachAnalysis | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<CoachMode | null>(null);
  const [saved, setSaved] = useState(false);
  const [clueBusy, setClueBusy] = useState(false);
  const [pendingMode, setPendingMode] = useState<CoachMode | null>(null);
  const [activeStyle, setActiveStyle] = useState(coachPreferences.style);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const { panelRef, dragHandleProps, dragStyle, dragging } = useDraggablePanel<HTMLDivElement>();

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    void trainerDb.setting<{ coachOpen?: boolean }>('workspace.panels').then((saved) => {
      if (typeof saved?.coachOpen === 'boolean') setOpen(saved.coachOpen);
    });
  }, []);

  const setCoachOpen = (value: boolean) => {
    setOpen(value);
    void trainerDb.setting<{ tab?: string; historyKind?: string; statisticsSection?: string; coachOpen?: boolean }>('workspace.panels').then((saved) => trainerDb.setSetting('workspace.panels', { ...saved, coachOpen: value }));
  };

  const requestCoach = async (mode: CoachMode, body: Record<string, unknown>) => {
    const response = await postCoach({ mode, language: ai, gameLanguage: game, ...coachPreferences, ...body, context: revealed ? { ...context, previousCoachCandidates: result?.candidates.map(({ countryCode }) => countryCode) } : undefined }, controller.current!.signal);
    const value = await response.json() as { analysis?: CoachAnalysis; model?: string; generatedAt?: number; error?: string };
    return { response, value };
  };

  const run = async (mode: CoachMode, style = coachPreferences.style) => {
    if (!languageReady || loading || clueBusy) return;
    const view = getStreetViewSnapshot(panoId);
    if (!view) return setError(t('streetViewLoading'));
    const historyImage = onSave ? captureStreetViewImage(panoId) : Promise.resolve(undefined);
    controller.current?.abort();
    controller.current = new AbortController();
    const currentRequest = ++requestId.current;
    setLoading(mode); setSaved(false); setError(''); setActiveStyle(style);
    try {
      setPendingMode(null); let { response, value } = await requestCoach(mode, { view, style });
      if ((!response.ok || !value.analysis) && mode === 'analyze360') ({ response, value } = await requestCoach(revealed ? 'explain' : 'analyze', { view, style }));
      if (currentRequest !== requestId.current) return;
      if (!response.ok || !value.analysis) throw new Error(value.error || t('coachInvalidResponse'));
      const completedAt = value.generatedAt || Date.now();
      const completedModel = value.model || 'Gemini';
      const styled = { ...value.analysis, style, depth: coachPreferences.depth }; const merged = result && mode !== 'explain' ? { ...styled, strongClues: [...new Set([...result.strongClues, ...styled.strongClues])], weakClues: [...new Set([...result.weakClues, ...styled.weakClues])], contradictions: [...new Set([...(result.contradictions || []), ...(styled.contradictions || [])])], confusions: [...new Set([...result.confusions, ...styled.confusions])], nextThingsToInspect: [...new Set([...result.nextThingsToInspect, ...styled.nextThingsToInspect])] } : styled;
      setResult(merged);
      if (appMode === 'play') onClueAnalyzed?.();
      const imageDataUrl = await historyImage;
      const clueId = imageDataUrl ? await onSaveClue({ imageDataUrl, model: completedModel, generatedAt: completedAt, analysis: merged }) : undefined;
      await onSave?.({ mode, model: completedModel, generatedAt: completedAt, analysis: merged, ...(clueId ? { clueId } : {}) });
      setSaved(true);
    } catch (caught) {
      if (currentRequest === requestId.current && caught instanceof Error && caught.name !== 'AbortError') setError(caught.message);
    } finally {
      if (currentRequest === requestId.current) setLoading(null);
    }
  };

  const list = (title: string, values: string[]) => values.length ? <section><strong>{title}</strong><ul>{values.map((value) => <li key={value}><CoachRichText text={value} /></li>)}</ul></section> : null;
  const outputLabels = COACH_OUTPUT_LABELS[result?.style || activeStyle];

  return <><button className="coach-launch coach-launch-fixed" aria-pressed={open} onClick={() => setCoachOpen(!open)} aria-label={t('AI Coach')} title={t('AI Coach')}><img src={`${import.meta.env.BASE_URL}assets/ai-coach-mark.png`} alt="" /></button>
{open && <div ref={panelRef} style={dragStyle} className="ai-coach open"><aside aria-label={t('AI Coach')}>
<header {...dragHandleProps} className={dragging ? 'dragging' : ''}><span><img src={`${import.meta.env.BASE_URL}assets/ai-coach-mark.png`} alt="" /> {t('AI Coach')}</span><button onClick={() => { requestId.current += 1; controller.current?.abort(); setLoading(null); setPendingMode(null); setCoachOpen(false); }} aria-label={t('close')}><X size={16} /></button></header>
      {(!coachPreferences.askEveryTime || result) && <p className="coach-profile"><strong>{coachStyleLabel(result?.style || activeStyle)}</strong><span>{t((result?.depth || coachPreferences.depth)[0].toUpperCase() + (result?.depth || coachPreferences.depth).slice(1))}</span></p>}<p className="coach-note">{appMode === 'play' ? t('aiAssistedNote') : t('transientImagesNote')}</p>
      <div className="coach-modes"><button disabled={!languageReady || !!loading || clueBusy} onClick={() => { const mode = revealed ? 'explain' : 'analyze360'; if (coachPreferences.askEveryTime) setPendingMode(mode); else void run(mode); }}>{loading ? t(loading === 'explain' ? 'explaining' : 'analyzing') : t(revealed ? 'explain' : 'analyze')}</button>{loading && <button onClick={() => controller.current?.abort()}>{t('cancel')}</button>}</div>
      {pendingMode && <CoachStylePicker selected={activeStyle} onSelect={(style) => void run(pendingMode, style)} onClose={() => setPendingMode(null)} />}
      <ClueCapture panoId={panoId} disabled={!languageReady || !!loading} onBusyChange={setClueBusy} onSave={onSaveClue} onAnalyze={onClueAnalyzed} />
      {error && <p className="coach-error" role="alert">{error}</p>}
      {result && <div className={`coach-result coach-output-${result.style || activeStyle}`}>
        <h4>{coachStyleLabel(result.style || activeStyle)}</h4>
        {result.description && <section className="coach-style-lead"><strong>{t(outputLabels.lead)}</strong><p className="coach-description"><CoachRichText text={result.description} /></p></section>}
        {!revealed && result.region && <h3>{result.region}<small>{result.confidence} {t('confidence')}</small></h3>}
        {!revealed && result.candidates.length > 0 && <><div className="coach-ranking-head"><strong>{t('candidates')}</strong><small>{t('Relative likelihood')}</small></div><ol>{result.candidates.map((candidate) => <li key={candidate.countryCode}><div><b><CountryFlag code={candidate.countryCode} />{countryDisplayName(candidate.countryCode, ai)}</b><span>{Math.round(candidate.confidence * 100)}%</span></div>{candidate.rationale && <small><CoachRichText text={candidate.rationale} /></small>}</li>)}</ol></>}
        {!revealed && <CoachLocationEstimate estimate={result.locationEstimate} />}
        {!revealed && <section className="coach-regional-read"><strong>{t('Regional read')}</strong><p><CoachRichText text={result.regionalRead ? `${result.regionalRead.label} — ${t(result.regionalRead.confidence)} ${t('confidence')}. ${result.regionalRead.reason}` : t('Insufficient evidence.')} /></p></section>}
        {list(t(outputLabels.strong), result.strongClues)}
        {list(t(outputLabels.weak), result.weakClues)}
        {list(t(outputLabels.contradictions), result.contradictions || [])}
        {list(t(outputLabels.confusions), result.confusions)}
        {list(t(outputLabels.next), result.nextThingsToInspect)}
        {result.coreCard && <section className="coach-card"><strong>{t('Learning note')}</strong><ul>{result.coreCard.front.map((line) => <li key={line}><CoachRichText text={line} /></li>)}</ul><p><CoachRichText text={result.coreCard.backExplanation} /></p></section>}
        {result.extraCards.map((card) => <section className="coach-card" key={card.category}><strong>{card.category}</strong><ul>{card.front.map((line) => <li key={line}><CoachRichText text={line} /></li>)}</ul><p><CoachRichText text={card.back} /></p></section>)}
        {saved && <p className="coach-autosaved" role="status">{appMode === 'study' ? t('savedAutomatically') : t('savedAutomatically')}</p>}
      </div>}
    </aside></div>}
  </>;
}
