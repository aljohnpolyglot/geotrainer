import { useEffect, useRef, useState } from 'react';
import { Camera, Check, Clipboard, Crop, Upload } from 'lucide-react';
import type { CoachAnalysis } from '../types';
import { getStreetViewSnapshot } from '../services/streetViewSnapshot';
import { countryDisplayName, translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { postCoach } from '../services/coachClient';
import { CountryFlag } from './CountryFlag';
import { CoachLocationEstimate } from './CoachLocationEstimate';
import { compressClueImage } from '../services/clueImages';
import { useCoachPreferences } from '../services/useCoachPreferences';
import { CoachStylePicker } from './CoachStylePicker';
import { COACH_OUTPUT_LABELS, coachStyleLabel } from '../services/coachPreferences';
import { CoachRichText } from './CoachRichText';
import { readWorkspaceDraft, writeWorkspaceDraft } from '../services/workspaceDrafts';
import { ImageCropModal } from './ImageCropModal';

type SavedClue = { imageDataUrl: string; model: string; generatedAt: number; analysis: CoachAnalysis };
type ClueDraft = { panoId: string; imageDataUrl: string; clueId?: string; analysis?: CoachAnalysis; saved: boolean };

async function prepareImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10_000_000) throw new Error('Paste a JPEG, PNG, or WebP image under 10 MB.');
  const source = URL.createObjectURL(file);
  try {
    return await compressClueImage(source);
  } finally { URL.revokeObjectURL(source); }
}

export function ClueCapture({ panoId, disabled, showAnalyze = true, onBusyChange, onSave, onSaved, onImageChange, onAnalyze, expanded, collapseSavedAnalysis }: { panoId: string; disabled?: boolean; showAnalyze?: boolean; onBusyChange?: (busy: boolean) => void; onSave: (clue: SavedClue) => Promise<string | void> | string | void; onSaved?: (clueId?: string) => void; onImageChange?: (imageDataUrl: string) => void; onAnalyze?: () => void; expanded?: boolean; collapseSavedAnalysis?: boolean }) {
  const { ui, ai, game, ready: languageReady } = useLanguagePreferences();
  const coachPreferences = useCoachPreferences();
  const t = (key: string) => translate(ui, key);
  const [image, setImage] = useState('');
  const [analysis, setAnalysis] = useState<CoachAnalysis>();
  const [status, setStatus] = useState('');
  const [saved, setSaved] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [busy, setBusy] = useState(false);
  const [choosingStyle, setChoosingStyle] = useState(false);
  const [cropping, setCropping] = useState(false);
  const controller = useRef<AbortController | null>(null);
  const requestId = useRef(0);
  useEffect(() => () => controller.current?.abort(), []);
  useEffect(() => {
    controller.current?.abort(); requestId.current += 1; setImage(''); setAnalysis(undefined); setStatus(''); setSaved(false); setSavedToast(false); setBusy(false); setChoosingStyle(false); setCropping(false); onBusyChange?.(false); onImageChange?.(''); onSaved?.(undefined);
    let active = true;
    void readWorkspaceDraft<ClueDraft>('clue', panoId).then((draft) => {
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

  const replaceImage = (value: string) => { setImage(value); onImageChange?.(value); onSaved?.(undefined); setAnalysis(undefined); setSaved(false); setChoosingStyle(false); setStatus(''); void writeWorkspaceDraft('clue', { panoId, imageDataUrl: value, saved: false } satisfies ClueDraft); };
  const choose = async (file?: File) => {
    if (!file || disabled || busy) return;
    try { replaceImage(await prepareImage(file)); }
    catch (error) { setStatus(error instanceof Error ? error.message : t('imageReadFailed')); }
  };
  const analyze = async (style = coachPreferences.style) => {
    if (!languageReady || !image || disabled || busy) return;
    const sourceImage = image;
    setStatus(t('analyzingClue')); setSaved(false);
    await run(async (signal, isCurrent) => {
      setChoosingStyle(false); const response = await postCoach({ mode: 'clue', mimeType: 'image/jpeg', imageData: sourceImage.split(',')[1], language: ai, gameLanguage: game, ...coachPreferences, style }, signal);
      const value = await response.json() as { analysis?: CoachAnalysis; model?: string; generatedAt?: number; error?: string };
      if (!response.ok || !value.analysis) throw new Error(value.error || t('coachNoClue'));
      if (!isCurrent()) return;
      const completedAt = value.generatedAt || Date.now();
      const completedModel = value.model || 'Gemini';
      const styled = { ...value.analysis, style, depth: coachPreferences.depth }; setAnalysis(styled); onAnalyze?.();
      const clueId = await onSave({ imageDataUrl: sourceImage, model: completedModel, generatedAt: completedAt, analysis: styled });
      if (clueId) onSaved?.(clueId);
      setSaved(true); setSavedToast(true); window.setTimeout(() => setSavedToast(false), 3000); setStatus(''); void writeWorkspaceDraft('clue', { panoId, imageDataUrl: sourceImage, ...(clueId ? { clueId } : {}), analysis: styled, saved: true } satisfies ClueDraft);
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
    replaceImage(value.imageDataUrl);
  });
  return <><details className={`clue-capture${expanded ? ' expanded' : ''}`} open={expanded || undefined}>
    <summary className={expanded ? 'clue-capture-summary-hidden' : undefined}><Clipboard size={14} /> {t('knownClues')}</summary>
    <div className="clue-drop" tabIndex={0} onPaste={(event) => void choose(event.clipboardData.files[0])}>
      {image ? <><img src={image} alt={t('clueToAnalyze')} /><button type="button" className="clue-crop-button" onClick={() => setCropping(true)} aria-label={t('Crop image')} title={t('Crop image')}><Crop size={15} /><span>{t('Edit')}</span></button></> : <p>{t('clueDropHint')}</p>}
    </div>
    <div className="clue-actions">
      <label><Upload size={14} /> {t('upload')}<input disabled={disabled || busy} type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void choose(event.target.files?.[0])} /></label>
      <button disabled={disabled || busy} onClick={() => void capture()}><Camera size={14} /> {t('capture')}</button>
      {showAnalyze && <button disabled={!languageReady || disabled || busy || !image} onClick={() => coachPreferences.askEveryTime ? setChoosingStyle(true) : void analyze()}>{t('Analyze clue')}</button>}
    </div>
    {choosingStyle && <CoachStylePicker selected={coachPreferences.style} onSelect={(style) => void analyze(style)} onClose={() => setChoosingStyle(false)} />}
    {status && <p className="coach-status" role="status">{status}</p>}
    {analysis && (!saved || !collapseSavedAnalysis) && <div className={`clue-analysis coach-output-${analysis.style || coachPreferences.style}`}>
      {analysis.style && <p className="coach-history-profile"><strong>{coachStyleLabel(analysis.style)}</strong>{analysis.depth && <span>{t(analysis.depth[0].toUpperCase() + analysis.depth.slice(1))}</span>}</p>}
      {analysis.description && <section className="coach-style-lead"><strong>{t(COACH_OUTPUT_LABELS[analysis.style || coachPreferences.style].lead)}</strong><p><CoachRichText text={analysis.description} /></p></section>}
      {analysis.region && <h3>{analysis.region}<small>{analysis.confidence} {t('confidence')}</small></h3>}
      <CoachLocationEstimate estimate={analysis.locationEstimate} />
      {!!analysis.candidates.length && <><div className="coach-ranking-head"><strong>{t('candidates')}</strong><small>{t('Relative likelihood')}</small></div><ol>{analysis.candidates.map((candidate) => <li key={candidate.countryCode}><div><b><CountryFlag code={candidate.countryCode} />{countryDisplayName(candidate.countryCode, ai)}</b><span>{Math.round(candidate.confidence * 100)}%</span></div>{candidate.rationale && <small><CoachRichText text={candidate.rationale} /></small>}</li>)}</ol></>}
      <section className="coach-regional-read"><strong>{t('Regional read')}</strong><p><CoachRichText text={analysis.regionalRead ? `${analysis.regionalRead.label} — ${t(analysis.regionalRead.confidence)} ${t('confidence')}. ${analysis.regionalRead.reason}` : t('Insufficient evidence.')} /></p></section>
      {!!analysis.strongClues.length && <><strong>{t(COACH_OUTPUT_LABELS[analysis.style || coachPreferences.style].strong)}</strong><ul>{analysis.strongClues.map((item) => <li key={item}><CoachRichText text={item} /></li>)}</ul></>}
      {!!analysis.weakClues.length && <><strong>{t(COACH_OUTPUT_LABELS[analysis.style || coachPreferences.style].weak)}</strong><ul>{analysis.weakClues.map((item) => <li key={item}><CoachRichText text={item} /></li>)}</ul></>}
      {!!analysis.contradictions?.length && <><strong>{t(COACH_OUTPUT_LABELS[analysis.style || coachPreferences.style].contradictions)}</strong><ul>{analysis.contradictions.map((item) => <li key={item}><CoachRichText text={item} /></li>)}</ul></>}
      {!!analysis.confusions.length && <><strong>{t(COACH_OUTPUT_LABELS[analysis.style || coachPreferences.style].confusions)}</strong><ul>{analysis.confusions.map((item) => <li key={item}><CoachRichText text={item} /></li>)}</ul></>}
      {!!analysis.nextThingsToInspect.length && <><strong>{t(COACH_OUTPUT_LABELS[analysis.style || coachPreferences.style].next)}</strong><ul>{analysis.nextThingsToInspect.map((item) => <li key={item}><CoachRichText text={item} /></li>)}</ul></>}
    </div>}
    {cropping && image && <ImageCropModal image={image} t={t} onCancel={() => setCropping(false)} onApply={(value) => { replaceImage(value); setCropping(false); }} />}
  </details>{savedToast && <div className="settings-saved-toast" role="status" aria-live="polite"><Check size={19} />{t('Image and analysis saved in Notebook')}</div>}</>;
}
