import { useEffect, useRef, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { AppMode, CoachAnalysis, CoachMode } from '../types';
import { getStreetViewSnapshot } from '../services/streetViewSnapshot';
import { COUNTRIES } from '../data/countries';
import { ClueCapture } from './ClueCapture';
import { trainerDb } from '../data/trainerDb';
import { normalizeLanguagePreferences, translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { useDraggablePanel } from '../hooks/useDraggablePanel';
import { postCoach } from '../services/coachClient';

type CoachContext = {
  actualCountry?: string;
  actualRegion?: string;
  guessedCountry?: string;
  score?: number;
  distanceKm?: number | null;
  previousAttempts?: Array<{ guessedCountry?: string; score: number }>;
};

export function AiCoach({ panoId, appMode, revealed, context, onSave, onSaveClue, onClueAnalyzed }: { panoId: string; appMode: AppMode; revealed: boolean; context?: CoachContext; onSave?: (value: { mode: CoachMode; model: string; generatedAt: number; analysis: CoachAnalysis }) => void; onSaveClue: (value: { imageDataUrl: string; model: string; generatedAt: number; analysis: CoachAnalysis }) => Promise<void> | void; onClueAnalyzed?: () => void }) {
  const { ui } = useLanguagePreferences();
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
    requestId.current += 1;
    controller.current?.abort();
    controller.current = null;
    if (panoId !== initialPano.current) void trainerDb.setting<Record<string, unknown>>('workspace.panels').then((saved) => trainerDb.setSetting('workspace.panels', { ...saved, coachOpen: false }));
    setResult(null); setError(''); setOpen(false); setLoading(null); setSaved(false);
  }, [panoId]);

  const setCoachOpen = (value: boolean) => {
    setOpen(value);
    void trainerDb.setting<{ tab?: string; historyKind?: string; statisticsSection?: string; coachOpen?: boolean }>('workspace.panels').then((saved) => trainerDb.setSetting('workspace.panels', { ...saved, coachOpen: value }));
  };

  const requestCoach = async (mode: CoachMode, body: Record<string, unknown>) => {
    const preferences = normalizeLanguagePreferences(await trainerDb.setting('languagePreferences'));
    const response = await postCoach({ mode, ...body, language: preferences.ai, gameLanguage: preferences.game, context: revealed ? context : undefined }, controller.current!.signal);
    const value = await response.json() as { analysis?: CoachAnalysis; model?: string; generatedAt?: number; error?: string };
    return { response, value };
  };

  const run = async (mode: CoachMode) => {
    if (loading || clueBusy) return;
    const view = getStreetViewSnapshot(panoId);
    if (!view) return setError(t('streetViewLoading'));
    controller.current?.abort();
    controller.current = new AbortController();
    const currentRequest = ++requestId.current;
    setLoading(mode); setSaved(false); setError('');
    try {
      const { response, value } = await requestCoach(mode, { view });
      if (currentRequest !== requestId.current) return;
      if (!response.ok || !value.analysis) throw new Error(value.error || t('coachInvalidResponse'));
      const completedAt = value.generatedAt || Date.now();
      const completedModel = value.model || 'Gemini';
      setResult(value.analysis); setSaved(true);
      onSave?.({ mode, model: completedModel, generatedAt: completedAt, analysis: value.analysis });
      if (appMode === 'play') onClueAnalyzed?.();
    } catch (caught) {
      if (currentRequest === requestId.current && caught instanceof Error && caught.name !== 'AbortError') setError(caught.message);
    } finally {
      if (currentRequest === requestId.current) setLoading(null);
    }
  };

  const modes: CoachMode[] = appMode === 'play' ? ['analyze360'] : revealed ? ['explain', 'cards', 'analyze360'] : ['hints', 'analyze', 'analyze360'];
  const labels: Record<CoachMode, string> = { hints: t('hints'), analyze: t('analyze'), analyze360: t('analyze360'), explain: t('explain'), cards: t('generateCards'), clue: t('clue'), 'clue-safe': t('clue') };
  const loadingLabels: Record<CoachMode, string> = { hints: t('findingHints'), analyze: t('analyzing'), analyze360: t('analyzing360'), explain: t('explaining'), cards: t('generatingCards'), clue: t('analyzingClue'), 'clue-safe': t('analyzingClue') };
  const list = (title: string, values: string[]) => values.length ? <section><strong>{title}</strong><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></section> : null;

  return <div ref={panelRef} style={dragStyle} className={`ai-coach ${open ? 'open' : ''}`}>
{!open ? <button className="coach-launch" onClick={() => setCoachOpen(true)} aria-label={t('AI Coach')} title={t('AI Coach')}><Sparkles size={15} aria-hidden="true" /></button> : <aside aria-label={t('AI Coach')}>
<header {...dragHandleProps} className={dragging ? 'dragging' : ''}><span><Sparkles size={15} /> {t('AI Coach')}</span><button onClick={() => { requestId.current += 1; controller.current?.abort(); setLoading(null); setCoachOpen(false); }} aria-label={t('close')}><X size={16} /></button></header>
      <p className="coach-note">{appMode === 'play' ? t('aiAssistedNote') : t('transientImagesNote')}</p>
      {!!modes.length && <div className="coach-modes">{(loading ? [loading] : modes).map((mode) => <button key={mode} disabled={!!loading || clueBusy} onClick={() => void run(mode)}>{loading === mode ? loadingLabels[mode] : labels[mode]}</button>)}{loading && <button onClick={() => controller.current?.abort()}>{t('cancel')}</button>}</div>}
      <ClueCapture panoId={panoId} disabled={!!loading} onBusyChange={setClueBusy} onSave={onSaveClue} onAnalyze={onClueAnalyzed} spoilerFree={appMode === 'review' && !revealed} />
      {error && <p className="coach-error" role="alert">{error}</p>}
      {result && <div className="coach-result">
        <h4>{t('geographicClueAnalysis')}</h4>
        {result.region && <h3>{result.region}<small>{result.confidence} {t('confidence')}</small></h3>}
        {result.candidates.length > 0 && <ol>{result.candidates.map((candidate) => <li key={candidate.countryCode}><b>{COUNTRIES[candidate.countryCode]?.name || candidate.countryCode} <small>{candidate.countryCode}</small></b><span>{Math.round(candidate.confidence * 100)}%</span></li>)}</ol>}
        {list(t('strongClues'), result.strongClues)}
        {list(t('weakGeneric'), result.weakClues)}
        {list(t('contradictionsGaps'), result.contradictions || [])}
        {list(t('confusableWith'), result.confusions)}
        {list(t('inspectNext'), result.nextThingsToInspect)}
        {result.coreCard && <section className="coach-card"><strong>{t('coreCard')}</strong><em>{t('front')}</em><ul>{result.coreCard.front.map((line) => <li key={line}>{line}</li>)}</ul><em>{t('back')}</em><p>{result.coreCard.backExplanation}</p></section>}
        {result.extraCards.map((card) => <section className="coach-card" key={card.category}><strong>{card.category} · {'★'.repeat(card.clueStrength)}</strong><em>{t('front')}</em><ul>{card.front.map((line) => <li key={line}>{line}</li>)}</ul><em>{t('back')}</em><p>{card.back}</p></section>)}
        {saved && <p className="coach-autosaved" role="status">{appMode === 'study' ? t('savedAutomatically') : t('savedAutomatically')}</p>}
      </div>}
    </aside>}
  </div>;
}
