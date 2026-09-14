import { useEffect, useRef, useState } from 'react';
import { Camera, Clipboard, Upload } from 'lucide-react';
import type { CoachAnalysis } from '../types';
import { getStreetViewSnapshot } from '../services/streetViewSnapshot';
import { COUNTRIES } from '../data/countries';
import { trainerDb } from '../data/trainerDb';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { postCoach } from '../services/coachClient';
import { CountryFlag } from './CountryFlag';
import { CoachLocationEstimate } from './CoachLocationEstimate';
import { compressClueImage } from '../services/clueImages';

type SavedClue = { imageDataUrl: string; model: string; generatedAt: number; analysis: CoachAnalysis };
type ClueDraft = { panoId: string; imageDataUrl: string; clueId?: string; analysis?: CoachAnalysis; saved: boolean };

async function prepareImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10_000_000) throw new Error('Paste a JPEG, PNG, or WebP image under 10 MB.');
  const source = URL.createObjectURL(file);
  try {
    return await compressClueImage(source);
  } finally { URL.revokeObjectURL(source); }
}

export function ClueCapture({ panoId, disabled, onBusyChange, onSave, onSaved, onImageChange, onAnalyze, expanded, collapseSavedAnalysis }: { panoId: string; disabled?: boolean; onBusyChange?: (busy: boolean) => void; onSave: (clue: SavedClue) => Promise<string | void> | string | void; onSaved?: (clueId?: string) => void; onImageChange?: (imageDataUrl: string) => void; onAnalyze?: () => void; expanded?: boolean; collapseSavedAnalysis?: boolean }) {
  const { ui, ai, game, ready: languageReady } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [image, setImage] = useState('');
  const [analysis, setAnalysis] = useState<CoachAnalysis>();
  const [status, setStatus] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    let active = true;
    requestId.current += 1; controller.current?.abort(); controller.current = null; setImage(''); setAnalysis(undefined); setStatus(''); setSaved(false); setBusy(false); onBusyChange?.(false); onSaved?.(undefined);
    void trainerDb.setting<ClueDraft>('workspace.clueDraft').then((draft) => {
      if (active && draft?.panoId === panoId) { setImage(draft.imageDataUrl); onImageChange?.(draft.imageDataUrl); setAnalysis(draft.analysis); setSaved(draft.saved); if (draft.clueId) onSaved?.(draft.clueId); if (draft.saved && draft.analysis) onAnalyze?.(); }
    });
    return () => { active = false; };
  }, [panoId]);

  const run = async (task: (signal: AbortSignal, isCurrent: () => boolean) => Promise<void>) => {
    controller.current?.abort();
    const active = new AbortController(); controller.current = active;
    const currentRequest = ++requestId.current;
    setBusy(true); onBusyChange?.(true);
    try { await task(active.signal, () => currentRequest === requestId.current && !active.signal.aborted); }
    catch (error) { if (currentRequest === requestId.current && !(error instanceof Error && error.name === 'AbortError')) setStatus(error instanceof Error ? error.message : t('clueActionFailed')); }
    finally { if (currentRequest === requestId.current) { setBusy(false); onBusyChange?.(false); } }
  };

  const choose = async (file?: File) => {
    if (!file || disabled || busy) return;
    try { const prepared = await prepareImage(file); setImage(prepared); onImageChange?.(prepared); onSaved?.(undefined); setAnalysis(undefined); setSaved(false); setStatus(''); void trainerDb.setSetting('workspace.clueDraft', { panoId, imageDataUrl: prepared, saved: false } satisfies ClueDraft); }
    catch (error) { setStatus(error instanceof Error ? error.message : t('imageReadFailed')); }
  };
  const analyze = async () => {
    if (!languageReady || !image || disabled || busy) return;
    const sourceImage = image;
    setStatus(t('analyzingClue')); setSaved(false);
    await run(async (signal, isCurrent) => {
      const response = await postCoach({ mode: 'clue', mimeType: 'image/jpeg', imageData: sourceImage.split(',')[1], language: ai, gameLanguage: game }, signal);
      const value = await response.json() as { analysis?: CoachAnalysis; model?: string; generatedAt?: number; error?: string };
      if (!response.ok || !value.analysis) throw new Error(value.error || t('coachNoClue'));
      if (!isCurrent()) return;
      const completedAt = value.generatedAt || Date.now();
      const completedModel = value.model || 'Gemini';
      setAnalysis(value.analysis); onAnalyze?.();
      const clueId = await onSave({ imageDataUrl: sourceImage, model: completedModel, generatedAt: completedAt, analysis: value.analysis });
      if (clueId) onSaved?.(clueId);
      setSaved(true); setStatus(''); void trainerDb.setSetting('workspace.clueDraft', { panoId, imageDataUrl: sourceImage, ...(clueId ? { clueId } : {}), analysis: value.analysis, saved: true } satisfies ClueDraft);
    });
  };
  const capture = async () => run(async (signal, isCurrent) => {
    const view = getStreetViewSnapshot(panoId);
    if (!view) throw new Error(t('streetViewLoading'));
    setStatus(t('capturingView'));
    const response = await postCoach({ mode: 'capture', view }, signal);
    const value = await response.json() as { imageDataUrl?: string; error?: string };
    if (!response.ok || !value.imageDataUrl) throw new Error(value.error || t('captureFailed'));
    if (!isCurrent()) return;
    setImage(value.imageDataUrl); onImageChange?.(value.imageDataUrl); onSaved?.(undefined); setAnalysis(undefined); setSaved(false); setStatus(''); void trainerDb.setSetting('workspace.clueDraft', { panoId, imageDataUrl: value.imageDataUrl, saved: false } satisfies ClueDraft);
  });
  return <details className={`clue-capture${expanded ? ' expanded' : ''}`} open={expanded || undefined}>
    <summary className={expanded ? 'clue-capture-summary-hidden' : undefined}><Clipboard size={14} /> {t('knownClues')}</summary>
    <div className="clue-drop" tabIndex={0} onPaste={(event) => void choose(event.clipboardData.files[0])}>
      {image ? <img src={image} alt={t('clueToAnalyze')} /> : <p>{t('clueDropHint')}</p>}
    </div>
    <div className="clue-actions">
      <label><Upload size={14} /> {t('upload')}<input disabled={disabled || busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void choose(event.target.files?.[0])} /></label>
      <button disabled={disabled || busy} onClick={() => void capture()}><Camera size={14} /> {t('capture')}</button>
<button disabled={!languageReady || disabled || busy || !image} onClick={() => void analyze()}>{t('Analyze clue')}</button>
    </div>
    {status && <p className="coach-status" role="status">{status}</p>}
    {analysis && (!saved || !collapseSavedAnalysis) && <div className="clue-analysis">
      {analysis.region && <h3>{analysis.region}<small>{analysis.confidence} {t('confidence')}</small></h3>}
      <CoachLocationEstimate estimate={analysis.locationEstimate} />
      {!!analysis.candidates.length && <ol>{analysis.candidates.map((candidate) => <li key={candidate.countryCode}><div><b><CountryFlag code={candidate.countryCode} />{COUNTRIES[candidate.countryCode]?.name || candidate.countryCode}</b><span>{Math.round(candidate.confidence * 100)}%</span></div>{candidate.rationale && <small>{candidate.rationale}</small>}</li>)}</ol>}
      {analysis.description && <p>{analysis.description}</p>}
      {!!analysis.strongClues.length && <><strong>{t('usefulTraits')}</strong><ul>{analysis.strongClues.map((item) => <li key={item}>{item}</li>)}</ul></>}
      {!!analysis.weakClues.length && <><strong>{t('limitations')}</strong><ul>{analysis.weakClues.map((item) => <li key={item}>{item}</li>)}</ul></>}
      {!!analysis.contradictions?.length && <><strong>{t('contradictionsGaps')}</strong><ul>{analysis.contradictions.map((item) => <li key={item}>{item}</li>)}</ul></>}
      {!!analysis.confusions.length && <><strong>{t('confusableWith')}</strong><ul>{analysis.confusions.map((item) => <li key={item}>{item}</li>)}</ul></>}
      {!!analysis.nextThingsToInspect.length && <><strong>{t('inspectNext')}</strong><ul>{analysis.nextThingsToInspect.map((item) => <li key={item}>{item}</li>)}</ul></>}
      {saved && <p className="coach-autosaved" role="status">{t('savedAutomatically')}</p>}
    </div>}
  </details>;
}
