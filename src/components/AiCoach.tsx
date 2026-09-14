import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import type { AppMode, CoachAnalysis, CoachMode } from '../types';
import { getStreetViewSnapshot } from '../services/streetViewSnapshot';
import { COUNTRIES } from '../data/countries';
import { ClueCapture } from './ClueCapture';
import { trainerDb } from '../data/trainerDb';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { useDraggablePanel } from '../hooks/useDraggablePanel';
import { postCoach } from '../services/coachClient';
import { CountryFlag } from './CountryFlag';
import { CoachLocationEstimate } from './CoachLocationEstimate';

type CoachContext = {
  actualCountry?: string;
  actualRegion?: string;
  guessedCountry?: string;
  score?: number;
  distanceKm?: number | null;
  previousAttempts?: Array<{ guessedCountry?: string; score: number }>;
};

export function AiCoach({ panoId, appMode, revealed, context, onSave, onSaveClue, onClueAnalyzed }: { panoId: string; appMode: AppMode; revealed: boolean; context?: CoachContext; onSave?: (value: { mode: CoachMode; model: string; generatedAt: number; analysis: CoachAnalysis }) => void; onSaveClue: (value: { imageDataUrl: string; model: string; generatedAt: number; analysis: CoachAnalysis }) => Promise<void> | void; onClueAnalyzed?: () => void }) {
  const { ui, ai, game, ready: languageReady } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CoachAnalysis | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<CoachMode | null>(null);
  const [saved, setSaved] = useState(false);
  const [clueBusy, setClueBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  const initialPano = useRef(panoId);
  const { panelRef, dragHandleProps, dragStyle, dragging } = useDraggablePanel<HTMLDivElement>();

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    void trainerDb.setting<{ coachOpen?: boolean }>('workspace.panels').then((saved) => {
      if (panoId === initialPano.current && typeof saved?.coachOpen === 'boolean') setOpen(saved.coachOpen);
    });
  }, [panoId]);
  useEffect(() => {
    requestId.current += 1; controller.current?.abort(); controller.current = null; setError(''); setLoading(null); setResult(null); setSaved(false);
  }, [panoId]);

  const setCoachOpen = (value: boolean) => {
    setOpen(value);
    void trainerDb.setting<{ tab?: string; historyKind?: string; statisticsSection?: string; coachOpen?: boolean }>('workspace.panels').then((saved) => trainerDb.setSetting('workspace.panels', { ...saved, coachOpen: value }));
  };

  const requestCoach = async (mode: CoachMode, body: Record<string, unknown>) => {
    const response = await postCoach({ mode, ...body, language: ai, gameLanguage: game, context: revealed ? { ...context, previousCoachCandidates: result?.candidates.map(({ countryCode }) => countryCode) } : undefined }, controller.current!.signal);
    const value = await response.json() as { analysis?: CoachAnalysis; model?: string; generatedAt?: number; error?: string };
    return { response, value };
  };

  const run = async (mode: CoachMode) => {
    if (!languageReady || loading || clueBusy) return;
    const view = getStreetViewSnapshot(panoId);
    if (!view) return setError(t('streetViewLoading'));
    controller.current?.abort();
    controller.current = new AbortController();
    const currentRequest = ++requestId.current;
    setLoading(mode); setSaved(false); setError('');
    try {
      let { response, value } = await requestCoach(mode, { view });
      if ((!response.ok || !value.analysis) && mode === 'analyze360') ({ response, value } = await requestCoach(revealed ? 'explain' : 'analyze', { view }));
      if (currentRequest !== requestId.current) return;
      if (!response.ok || !value.analysis) throw new Error(value.error || t('coachInvalidResponse'));
      const completedAt = value.generatedAt || Date.now();
      const completedModel = value.model || 'Gemini';
      const merged = result && mode !== 'explain' ? { ...value.analysis, strongClues: [...new Set([...result.strongClues, ...value.analysis.strongClues])], weakClues: [...new Set([...result.weakClues, ...value.analysis.weakClues])], contradictions: [...new Set([...(result.contradictions || []), ...(value.analysis.contradictions || [])])], confusions: [...new Set([...result.confusions, ...value.analysis.confusions])], nextThingsToInspect: [...new Set([...result.nextThingsToInspect, ...value.analysis.nextThingsToInspect])] } : value.analysis;
      setResult(merged); setSaved(true);
      onSave?.({ mode, model: completedModel, generatedAt: completedAt, analysis: merged });
      if (appMode === 'play') onClueAnalyzed?.();
    } catch (caught) {
      if (currentRequest === requestId.current && caught instanceof Error && caught.name !== 'AbortError') setError(caught.message);
    } finally {
      if (currentRequest === requestId.current) setLoading(null);
    }
  };

  const list = (title: string, values: string[]) => values.length ? <section><strong>{title}</strong><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></section> : null;

  return <><button className="coach-launch coach-launch-fixed" aria-pressed={open} onClick={() => setCoachOpen(!open)} aria-label={t('AI Coach')} title={t('AI Coach')}><img src={`${import.meta.env.BASE_URL}assets/ai-coach-mark.png`} alt="" /></button>
{open && <div ref={panelRef} style={dragStyle} className="ai-coach open"><aside aria-label={t('AI Coach')}>
<header {...dragHandleProps} className={dragging ? 'dragging' : ''}><span><img src={`${import.meta.env.BASE_URL}assets/ai-coach-mark.png`} alt="" /> {t('AI Coach')}</span><button onClick={() => { requestId.current += 1; controller.current?.abort(); setLoading(null); setCoachOpen(false); }} aria-label={t('close')}><X size={16} /></button></header>
      <p className="coach-note">{appMode === 'play' ? t('aiAssistedNote') : t('transientImagesNote')}</p>
      <div className="coach-modes"><button disabled={!languageReady || !!loading || clueBusy} onClick={() => void run(revealed ? 'explain' : 'analyze360')}>{loading ? t(loading === 'explain' ? 'explaining' : 'analyzing') : t(revealed ? 'explain' : 'analyze')}</button>{loading && <button onClick={() => controller.current?.abort()}>{t('cancel')}</button>}</div>
      <ClueCapture panoId={panoId} disabled={!languageReady || !!loading} onBusyChange={setClueBusy} onSave={onSaveClue} onAnalyze={onClueAnalyzed} spoilerFree={appMode === 'review' && !revealed} />
      {error && <p className="coach-error" role="alert">{error}</p>}
      {result && <div className="coach-result">
        <h4>{t('geographicClueAnalysis')}</h4>
        {!revealed && result.region && <h3>{result.region}<small>{result.confidence} {t('confidence')}</small></h3>}
        {!revealed && result.candidates.length > 0 && <ol>{result.candidates.map((candidate) => <li key={candidate.countryCode}><div><b><CountryFlag code={candidate.countryCode} />{COUNTRIES[candidate.countryCode]?.name || candidate.countryCode}</b><span>{Math.round(candidate.confidence * 100)}%</span></div>{candidate.rationale && <small>{candidate.rationale}</small>}</li>)}</ol>}
        {!revealed && <CoachLocationEstimate estimate={result.locationEstimate} />}
        {list(t('strongClues'), result.strongClues)}
        {list(t('weakGeneric'), result.weakClues)}
        {list(t('contradictionsGaps'), result.contradictions || [])}
        {list(t('confusableWith'), result.confusions)}
        {list(t('inspectNext'), result.nextThingsToInspect)}
        {result.coreCard && <section className="coach-card"><strong>{t('Learning note')}</strong><ul>{result.coreCard.front.map((line) => <li key={line}>{line}</li>)}</ul><p>{result.coreCard.backExplanation}</p></section>}
        {result.extraCards.map((card) => <section className="coach-card" key={card.category}><strong>{card.category}</strong><ul>{card.front.map((line) => <li key={line}>{line}</li>)}</ul><p>{card.back}</p></section>)}
        {saved && <p className="coach-autosaved" role="status">{appMode === 'study' ? t('savedAutomatically') : t('savedAutomatically')}</p>}
      </div>}
    </aside></div>}
  </>;
}
