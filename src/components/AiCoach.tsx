import { useEffect, useRef, useState } from 'react';
import { Sparkles, X } from 'lucide-react';
import type { AppMode, CoachAnalysis, CoachMode } from '../types';
import { captureStreetViewScreen, getStreetViewSnapshot } from '../services/streetViewSnapshot';
import { COUNTRIES } from '../data/countries';
import { ClueCapture } from './ClueCapture';

type CoachContext = {
  actualCountry?: string;
  actualRegion?: string;
  guessedCountry?: string;
  score?: number;
  distanceKm?: number | null;
  previousAttempts?: Array<{ guessedCountry?: string; score: number }>;
};

export function AiCoach({ panoId, appMode, revealed, context, onSave, onSaveClue, onClueAnalyzed }: { panoId: string; appMode: AppMode; revealed: boolean; context?: CoachContext; onSave?: (value: { mode: CoachMode; model: string; generatedAt: number; analysis: CoachAnalysis }) => void; onSaveClue: (value: { imageDataUrl: string; model: string; generatedAt: number; analysis: CoachAnalysis }) => Promise<void> | void; onClueAnalyzed?: () => void }) {
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<CoachAnalysis | null>(null);
  const [model, setModel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState<CoachMode | null>(null);
  const [resultMode, setResultMode] = useState<CoachMode | null>(null);
  const [generatedAt, setGeneratedAt] = useState(0);
  const [saved, setSaved] = useState(false);
  const controller = useRef<AbortController | null>(null);

  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => { setResult(null); setError(''); setOpen(false); }, [panoId]);

  const requestCoach = async (mode: CoachMode, body: Record<string, unknown>) => {
    const response = await fetch('/api/coach', { method: 'POST', signal: controller.current!.signal, headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode, ...body, context: revealed ? context : undefined }) });
    const value = await response.json() as { analysis?: CoachAnalysis; model?: string; generatedAt?: number; error?: string };
    return { response, value };
  };

  const run = async (mode: CoachMode) => {
    const view = getStreetViewSnapshot(panoId);
    if (!view) return setError('Street View is still loading. Try again in a moment.');
    controller.current?.abort();
    controller.current = new AbortController();
    setLoading(mode); setError('');
    try {
      let { response, value } = await requestCoach(mode, { view });
      if (mode !== 'analyze360' && !response.ok && /Street View capture|Static API/i.test(value.error || '')) {
        const frame = await captureStreetViewScreen();
        ({ response, value } = await requestCoach(mode, { mimeType: 'image/jpeg', imageData: frame.split(',')[1] }));
      }
      if (!response.ok || !value.analysis) throw new Error(value.error || 'Coach returned an invalid response.');
      setResult(value.analysis); setModel(value.model || 'Gemini'); setResultMode(mode); setGeneratedAt(value.generatedAt || Date.now()); setSaved(false); if (appMode === 'play') onClueAnalyzed?.();
    } catch (caught) {
      if (caught instanceof Error && caught.name !== 'AbortError') setError(caught.message);
    } finally {
      setLoading(null);
    }
  };

  const modes: CoachMode[] = appMode === 'play' ? ['analyze360'] : revealed ? ['explain', 'cards', 'analyze360'] : ['hints', 'analyze', 'analyze360'];
  const labels: Record<CoachMode, string> = { hints: 'Hints', analyze: 'Analyze', analyze360: 'Analyze 360°', explain: 'Explain', cards: 'Generate Cards', clue: 'Clue', 'clue-safe': 'Clue' };
  const loadingLabels: Record<CoachMode, string> = { hints: 'Finding hints…', analyze: 'Analyzing…', analyze360: 'Analyzing 360°…', explain: 'Explaining…', cards: 'Generating cards…', clue: 'Analyzing clue…', 'clue-safe': 'Analyzing clue…' };
  const list = (title: string, values: string[]) => values.length ? <section><strong>{title}</strong><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></section> : null;

  return <div className={`ai-coach ${open ? 'open' : ''}`}>
    {!open ? <button className="coach-launch" onClick={() => setOpen(true)}><Sparkles size={15} /> Coach</button> : <aside aria-label="AI Coach">
      <header><span><Sparkles size={15} /> AI Coach</span><button onClick={() => { controller.current?.abort(); setOpen(false); }} aria-label="Close Coach"><X size={16} /></button></header>
      <p className="coach-note">{appMode === 'play' ? 'AI analysis marks this round assisted. Analyze 360° uploads four transient views automatically.' : 'Automatic analysis images are transient. Saved clue images stay in your local trainer data.'}</p>
      {!!modes.length && <div className="coach-modes">{(loading ? [loading] : modes).map((mode) => <button key={mode} disabled={!!loading} onClick={() => void run(mode)}>{loading === mode ? loadingLabels[mode] : labels[mode]}</button>)}{loading && <button onClick={() => controller.current?.abort()}>Cancel</button>}</div>}
      <ClueCapture onSave={onSaveClue} onAnalyze={onClueAnalyzed} spoilerFree={appMode === 'review' && !revealed} />
      {error && <p className="coach-error" role="alert">{error}</p>}
      {result && <div className="coach-result">
        <h4>Geographic clue analysis</h4>
        {result.region && <h3>{result.region}<small>{result.confidence} confidence</small></h3>}
        {result.candidates.length > 0 && <ol>{result.candidates.map((candidate) => <li key={candidate.countryCode}><b>{COUNTRIES[candidate.countryCode]?.name || candidate.countryCode} <small>{candidate.countryCode}</small></b><span>{Math.round(candidate.confidence * 100)}%</span></li>)}</ol>}
        {list('Strong clues', result.strongClues)}
        {list('Weak / generic', result.weakClues)}
        {list('Confusable with', result.confusions)}
        {list('Inspect next', result.nextThingsToInspect)}
        {result.coreCard && <section className="coach-card"><strong>Core card</strong><em>Front</em><ul>{result.coreCard.front.map((line) => <li key={line}>{line}</li>)}</ul><em>Back</em><p>{result.coreCard.backExplanation}</p></section>}
        {result.extraCards.map((card) => <section className="coach-card" key={card.category}><strong>{card.category} · {'★'.repeat(card.clueStrength)}</strong><em>Front</em><ul>{card.front.map((line) => <li key={line}>{line}</li>)}</ul><em>Back</em><p>{card.back}</p></section>)}
        {appMode !== 'play' && onSave && resultMode && <button className="coach-save" disabled={saved} onClick={() => { onSave({ mode: resultMode, model, generatedAt, analysis: result }); setSaved(true); }}>{saved ? 'Saved' : 'Save coaching note'}</button>}
        <small className="coach-model">{model}</small>
      </div>}
    </aside>}
  </div>;
}
