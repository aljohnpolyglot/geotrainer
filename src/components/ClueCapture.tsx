import { useState } from 'react';
import { Camera, Clipboard, Upload } from 'lucide-react';
import type { CoachAnalysis } from '../types';
import { captureStreetViewScreen } from '../services/streetViewSnapshot';
import { COUNTRIES } from '../data/countries';

type SavedClue = { imageDataUrl: string; model: string; generatedAt: number; analysis: CoachAnalysis };

async function prepareImage(file: File) {
  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 10_000_000) throw new Error('Paste a JPEG, PNG, or WebP image under 10 MB.');
  const source = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = source;
    await image.decode();
    const scale = Math.min(1, 1280 / image.width);
    const canvas = document.createElement('canvas'); canvas.width = Math.round(image.width * scale); canvas.height = Math.round(image.height * scale);
    canvas.getContext('2d')!.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', .86);
  } finally { URL.revokeObjectURL(source); }
}

export function ClueCapture({ onSave, onAnalyze, spoilerFree }: { onSave: (clue: SavedClue) => Promise<void> | void; onAnalyze?: () => void; spoilerFree?: boolean }) {
  const [image, setImage] = useState('');
  const [analysis, setAnalysis] = useState<CoachAnalysis>();
  const [model, setModel] = useState('');
  const [generatedAt, setGeneratedAt] = useState(0);
  const [status, setStatus] = useState('');
  const [saved, setSaved] = useState(false);

  const choose = async (file?: File) => {
    if (!file) return;
    try { setImage(await prepareImage(file)); setAnalysis(undefined); setSaved(false); setStatus(''); }
    catch (error) { setStatus(error instanceof Error ? error.message : 'Could not read that image.'); }
  };
  const analyze = async () => {
    if (!image) return;
    setStatus('Analyzing clue…');
    try {
      const response = await fetch('/api/coach', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ mode: spoilerFree ? 'clue-safe' : 'clue', mimeType: 'image/jpeg', imageData: image.split(',')[1] }) });
      const value = await response.json() as { analysis?: CoachAnalysis; model?: string; generatedAt?: number; error?: string };
      if (!response.ok || !value.analysis) throw new Error(value.error || 'Coach returned no clue description.');
      setAnalysis(value.analysis); setModel(value.model || 'Gemini'); setGeneratedAt(value.generatedAt || Date.now()); setStatus(''); onAnalyze?.();
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Could not analyze this clue.'); }
  };
  return <details className="clue-capture">
    <summary><Clipboard size={14} /> Clue notebook</summary>
    <div className="clue-drop" tabIndex={0} onPaste={(event) => void choose(event.clipboardData.files[0])}>
      {image ? <img src={image} alt="Clue to analyze" /> : <p>Paste an image here, upload one, or capture the current Street View.</p>}
    </div>
    <div className="clue-actions">
      <label><Upload size={14} /> Upload<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => void choose(event.target.files?.[0])} /></label>
      <button onClick={() => void captureStreetViewScreen().then((value) => { setImage(value); setAnalysis(undefined); setSaved(false); }).catch((error: Error) => setStatus(error.message))}><Camera size={14} /> Capture</button>
      <button disabled={!image || status === 'Analyzing clue…'} onClick={() => void analyze()}>Analyze clue</button>
    </div>
    {status && <p className="coach-status" role="status">{status}</p>}
    {analysis && <div className="clue-analysis">
      {analysis.region && <h3>{analysis.region}<small>{analysis.confidence} confidence</small></h3>}
      {!!analysis.candidates.length && <ol>{analysis.candidates.map((candidate) => <li key={candidate.countryCode}><b>{COUNTRIES[candidate.countryCode]?.name || candidate.countryCode}</b><span>{Math.round(candidate.confidence * 100)}%</span></li>)}</ol>}
      {analysis.description && <p>{analysis.description}</p>}
      {!!analysis.strongClues.length && <><strong>Useful traits</strong><ul>{analysis.strongClues.map((item) => <li key={item}>{item}</li>)}</ul></>}
      {!!analysis.weakClues.length && <><strong>Limitations</strong><ul>{analysis.weakClues.map((item) => <li key={item}>{item}</li>)}</ul></>}
      {!!analysis.confusions.length && <><strong>Confusable with</strong><ul>{analysis.confusions.map((item) => <li key={item}>{item}</li>)}</ul></>}
      {!!analysis.nextThingsToInspect.length && <><strong>Inspect next</strong><ul>{analysis.nextThingsToInspect.map((item) => <li key={item}>{item}</li>)}</ul></>}
      <button className="coach-save" disabled={saved} onClick={() => void Promise.resolve(onSave({ imageDataUrl: image, model, generatedAt, analysis })).then(() => setSaved(true))}>{saved ? 'Clue saved' : 'Save to country clues'}</button>
    </div>}
  </details>;
}
