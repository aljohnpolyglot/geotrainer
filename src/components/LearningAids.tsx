import { useEffect, useState } from 'react';
import { Files, Images, Lightbulb, NotebookPen, X } from 'lucide-react';
import type { ClueRecord, CoachAnalysis, CoachHistoryNote, NotebookNote } from '../types';
import { trainerDb } from '../data/trainerDb';
import { COUNTRIES } from '../data/countries';
import { CountryFlag } from './CountryFlag';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { ClueCapture } from './ClueCapture';
import { useDraggablePanel } from '../hooks/useDraggablePanel';
import { CoachLocationEstimate } from './CoachLocationEstimate';
import { nearbyReviewPoint } from '../data/reviewIdentity';

export type MetaAid = { id: string; imageUrl: string; text?: string; note?: string; temporallySensitive?: boolean };
const NOTE_CATEGORIES = ['Architecture', 'Bollards', 'Camera generations', 'Companies', 'Countries', 'Currencies', 'Domains', 'Driving side', 'Flags', 'Follow cars', 'Google vehicles', 'House numbers', 'License plates', 'Road lines', 'Nature', 'Phone numbers', 'Post boxes', 'Rifts', 'Scenery', 'Sidewalks', 'Signs', 'Snow', 'Street suffixes', 'Traffic lights', 'Utility poles', 'Years'] as const;
type NoteDraft = { panoId: string; text: string; category: string };

export function LearningAids({ lesson, panoId, lat, lng, countryCode, reviewActive, answerVisible, adviceOpen, refreshKey, onAdviceClose, onSaveClue, onNoteSaved }: {
  lesson?: MetaAid;
  panoId: string;
  lat: number;
  lng: number;
  countryCode: string;
  reviewActive: boolean;
  answerVisible: boolean;
  adviceOpen: boolean;
  refreshKey: number;
  onAdviceClose: (forever: boolean) => void;
  onSaveClue: (clue: { imageDataUrl: string; model: string; generatedAt: number; analysis: CoachAnalysis; origin?: 'personal' | 'coach' }) => Promise<string | void> | string | void;
  onNoteSaved: () => Promise<void> | void;
}) {
  const { ui } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [open, setOpen] = useState<'meta' | 'clues' | 'notebook' | 'available' | null>(null);
  const [clues, setClues] = useState<ClueRecord[]>([]);
  const [notes, setNotes] = useState<Array<{ id: string; source: string; text: string; category?: string; imageUrl?: string; analysis?: CoachAnalysis; at: number }>>([]);
  const [clueIndex, setClueIndex] = useState(0);
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteClueId, setNoteClueId] = useState<string>();
  const [noteImage, setNoteImage] = useState('');
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const { panelRef, dragHandleProps, dragStyle, dragging } = useDraggablePanel<HTMLElement>();

  useEffect(() => { setOpen(null); setClueIndex(0); setNoteClueId(undefined); setNoteImage(''); }, [panoId]);
  useEffect(() => { void Promise.all([trainerDb.setting<NotebookNote[]>('notebook.notes'), trainerDb.setting<CoachHistoryNote[]>('coach.notes'), trainerDb.attempts(), trainerDb.studyVisits(), trainerDb.clues()]).then(([personal = [], coach = [], attempts, visits, savedClues]) => {
    const current = { panoId, lat, lng, countryCode }; const relatedPanos = new Set([panoId]);
    visits.forEach((item) => { if (nearbyReviewPoint(current, item)) relatedPanos.add(item.panoId); });
    attempts.forEach((item) => { if (nearbyReviewPoint(current, { panoId: item.panoId, lat: item.actualLat, lng: item.actualLng, countryCode: item.countryCode })) relatedPanos.add(item.panoId); });
    const nearbyClues = savedClues.filter((item) => relatedPanos.has(item.panoId) || (typeof item.lat === 'number' && typeof item.lng === 'number' && nearbyReviewPoint(current, { panoId: item.panoId, lat: item.lat, lng: item.lng, countryCode: item.countryCode })));
    nearbyClues.forEach((item) => relatedPanos.add(item.panoId)); setClues(nearbyClues);
    const coachByRun = new Map(coach.filter((item) => relatedPanos.has(item.panoId)).map((item) => [`${item.generatedAt}:${item.mode}:${item.model}`, item]));
    [...visits, ...attempts].filter((item) => relatedPanos.has(item.panoId) && item.coachAnalysis && item.coachGeneratedAt && item.coachMode).forEach((item) => { const model = item.coachModel || 'Gemini'; const key = `${item.coachGeneratedAt}:${item.coachMode}:${model}`; if (!coachByRun.has(key)) coachByRun.set(key, { id: `coach-legacy:${key}`, panoId: item.panoId, countryCode: item.countryCode, mode: item.coachMode!, model, generatedAt: item.coachGeneratedAt!, analysis: item.coachAnalysis! }); });
    const relevantPersonal = personal.filter((item) => relatedPanos.has(item.panoId) || !!item.clueId && nearbyClues.some((clue) => clue.id === item.clueId));
    const personalImage = (note: NotebookNote) => (note.clueId ? nearbyClues.find((clue) => clue.id === note.clueId) : undefined)?.imageDataUrl || nearbyClues.filter((clue) => clue.panoId === note.panoId).sort((a, b) => Math.abs(a.createdAt - note.updatedAt) - Math.abs(b.createdAt - note.updatedAt))[0]?.imageDataUrl;
    const linkedClues = new Set(relevantPersonal.flatMap((item) => item.clueId ? [item.clueId] : []));
    setNotes([...relevantPersonal.map((item) => { const linked = item.clueId ? nearbyClues.find((clue) => clue.id === item.clueId) : undefined; return { id: item.id || `personal:${item.updatedAt}`, source: t('Personal'), text: item.text, category: item.category, imageUrl: personalImage(item), analysis: linked && (linked.analysis.description || linked.analysis.strongClues.length) ? linked.analysis : undefined, at: item.updatedAt }; }), ...[...coachByRun.values()].map((item) => ({ id: item.id, source: t('AI-assisted'), text: item.analysis.description || '', analysis: item.analysis, at: item.generatedAt })), ...nearbyClues.filter((item) => !linkedClues.has(item.id)).map((item) => ({ id: item.id, source: t(item.origin === 'personal' ? 'Personal' : 'AI-assisted'), text: item.analysis.description || '', imageUrl: item.imageDataUrl, analysis: item.analysis, at: item.createdAt }))].sort((a, b) => b.at - a.at));
  }); }, [panoId, lat, lng, countryCode, refreshKey, ui]);
  useEffect(() => { setImageFailed(false); setImageLoaded(false); }, [lesson?.id]);
  const fullContent = !reviewActive || answerVisible;
  useEffect(() => {
    setNote(''); setCategory(''); setCategoryOpen(false); setNoteSaved(false);
    void trainerDb.setting<NoteDraft>('workspace.noteDraft').then((draft) => { if (draft?.panoId === panoId) { setNote(draft.text); setCategory(draft.category); } });
  }, [panoId]);
  const clue = clues[clueIndex];
  const list = (title: string, values: string[]) => values.length ? <section><strong>{title}</strong><ul>{values.map((value) => <li key={value}>{value}</li>)}</ul></section> : null;
  const analysisDetails = (analysis: CoachAnalysis) => <div className="available-note-analysis"><CoachLocationEstimate estimate={analysis.locationEstimate} />{!!analysis.candidates.length && <section><strong>{t('candidates')}</strong><ul>{analysis.candidates.map((candidate) => <li key={candidate.countryCode}><CountryFlag code={candidate.countryCode} />{COUNTRIES[candidate.countryCode]?.name || candidate.countryCode} · {Math.round(candidate.confidence * 100)}%{candidate.rationale && <small>{candidate.rationale}</small>}</li>)}</ul></section>}{list(t('strongClues'), analysis.strongClues)}{list(t('weakGeneric'), analysis.weakClues)}{list(t('contradictionsGaps'), analysis.contradictions || [])}{list(t('confusableWith'), analysis.confusions)}{list(t('inspectNext'), analysis.nextThingsToInspect)}{analysis.coreCard && <section><strong>{t('coreCard')}</strong><ul>{analysis.coreCard.front.map((value) => <li key={value}>{value}</li>)}</ul><p>{analysis.coreCard.backExplanation}</p></section>}{analysis.extraCards.map((card) => <section key={card.category}><strong>{card.category}</strong><ul>{card.front.map((value) => <li key={value}>{value}</li>)}</ul><p>{card.back}</p></section>)}</div>;
  const saveNotebookNote = async () => {
    const updatedAt = Date.now(); let clueId = noteClueId;
    if (noteImage && !clueId) clueId = await onSaveClue({ imageDataUrl: noteImage, model: 'Notebook', generatedAt: updatedAt, analysis: { confidence: 'low', region: '', candidates: [], strongClues: [], weakClues: [], confusions: [], nextThingsToInspect: [], extraCards: [] }, origin: 'personal' }) || undefined;
    const saved = await trainerDb.setting<NotebookNote[]>('notebook.notes') || [];
    await trainerDb.setSetting('notebook.notes', [{ id: `note-${crypto.randomUUID()}`, panoId, countryCode, text: note.trim(), ...(category ? { category } : {}), ...(clueId ? { clueId } : {}), updatedAt }, ...saved]);
    setNote(''); setCategory(''); setNoteClueId(undefined); setNoteImage(''); setNoteSaved(true); void trainerDb.setSetting('workspace.noteDraft', null); window.setTimeout(() => setNoteSaved(false), 700); await onNoteSaved();
  };

  return <>
    <div className="learning-aids" aria-label={t('Learning aids')}>
      {lesson && <button type="button" aria-pressed={open === 'meta'} onClick={() => setOpen(open === 'meta' ? null : 'meta')} title={t(fullContent ? 'Meta' : 'Hint')}><Lightbulb size={17} /><span>{t(fullContent ? 'Meta' : 'Hint')}</span></button>}
      {reviewActive && clues.length > 0 && <button type="button" aria-pressed={open === 'clues'} onClick={() => setOpen(open === 'clues' ? null : 'clues')} title={t('Show Clues')}><Images size={17} /><span>{t('Show Clues')}</span></button>}
      <button type="button" aria-pressed={open === 'notebook'} onClick={() => setOpen(open === 'notebook' ? null : 'notebook')} title={t('Notebook')}><NotebookPen size={17} /><span>{t('Notebook')}</span></button>
      {notes.length > 0 && <button type="button" aria-pressed={open === 'available'} onClick={() => setOpen(open === 'available' ? null : 'available')} title={t('Available notes')}><Files size={17} /><span>{t('Available notes')}</span><b>{notes.length}</b></button>}
    </div>
    {adviceOpen && lesson && <aside className="meta-advice" role="status"><p>{t('Meta clues are always available from the lightbulb in the top-right.')}</p><div><button onClick={() => onAdviceClose(false)}>{t('Okay')}</button><button onClick={() => onAdviceClose(true)}>{t("Don't show again")}</button></div></aside>}
    {open === 'meta' && lesson && <aside ref={panelRef} style={dragStyle} className="learning-aid-panel" aria-label={t(fullContent ? 'Meta' : 'Hint')}>
      <header {...dragHandleProps} className={dragging ? 'dragging' : ''}><span><Lightbulb size={17} />{t(fullContent ? 'Meta' : 'Hint')}</span><button onClick={() => setOpen(null)} aria-label={t('close')}><X size={16} /></button></header>
      {imageFailed ? <p className="learning-aid-safe">{t('Reference image unavailable')}</p> : <img src={lesson.imageUrl} alt={t('Meta reference clue')} onLoad={() => setImageLoaded(true)} onError={() => setImageFailed(true)} />}
      {(imageLoaded || imageFailed) && (fullContent ? <div className="learning-aid-copy"><p>{lesson.text}</p>{lesson.note && <p className="meta-comparison">{lesson.note}</p>}{lesson.temporallySensitive && <small className="meta-temporal-warning">{t('This imagery Meta may change over time. Use it as supporting evidence.')}</small>}</div> : <p className="learning-aid-safe">{t('Use the reference image as a visual hint. The full Meta appears after your guess.')}</p>)}
    </aside>}
    {open === 'clues' && clue && <aside ref={panelRef} style={dragStyle} className="learning-aid-panel" aria-label={t('Show Clues')}>
      <header {...dragHandleProps} className={dragging ? 'dragging' : ''}><span><Images size={17} />{t('Show Clues')}</span><button onClick={() => setOpen(null)} aria-label={t('close')}><X size={16} /></button></header>
      <img src={clue.imageDataUrl} alt={t('savedVisualClue')} />
      {fullContent ? <div className="learning-aid-copy">{clue.analysis.description && <p>{clue.analysis.description}</p>}{list(t('strongClues'), clue.analysis.strongClues)}{!!clue.analysis.candidates.length && <section><strong>{t('candidates')}</strong><ul>{clue.analysis.candidates.map((candidate) => <li key={candidate.countryCode}><CountryFlag code={candidate.countryCode} />{COUNTRIES[candidate.countryCode]?.name || candidate.countryCode}</li>)}</ul></section>}</div> : <p className="learning-aid-safe">{t('Use your saved image as a visual hint. Notes appear after your guess.')}</p>}
      {clues.length > 1 && <footer><button disabled={clueIndex === 0} onClick={() => setClueIndex((value) => value - 1)}>{t('Previous')}</button><span>{clueIndex + 1} / {clues.length}</span><button disabled={clueIndex === clues.length - 1} onClick={() => setClueIndex((value) => value + 1)}>{t('Next')}</button></footer>}
    </aside>}
    {open === 'available' && <aside ref={panelRef} style={dragStyle} className="learning-aid-panel available-notes-panel" aria-label={t('Available notes')}>
      <header {...dragHandleProps} className={dragging ? 'dragging' : ''}><span><Files size={17} />{t('Available notes')} ({notes.length})</span><button onClick={() => setOpen(null)} aria-label={t('close')}><X size={16} /></button></header>
      {fullContent ? <div className="available-notes-list">{notes.map((item) => <article key={item.id}>{item.imageUrl && <img src={item.imageUrl} alt="" />}<strong>{item.category ? `${t(item.category)} · ` : ''}{item.source}</strong>{item.text && <p>{item.text}</p>}{item.analysis && analysisDetails(item.analysis)}<small>{new Date(item.at).toLocaleString(ui)}</small></article>)}</div> : <p className="learning-aid-safe">{t('Notes are available after your guess.')}</p>}
    </aside>}
    {open === 'notebook' && <aside ref={panelRef} style={dragStyle} className="learning-aid-panel notebook-panel" aria-label={t('Notebook')}>
      <header {...dragHandleProps} className={dragging ? 'dragging' : ''}><span><NotebookPen size={17} />{t('Notebook')}</span><button onClick={() => setOpen(null)} aria-label={t('close')}><X size={16} /></button></header>
      <><ClueCapture panoId={panoId} onSave={(clue) => onSaveClue({ ...clue, origin: 'personal' })} onSaved={setNoteClueId} onImageChange={setNoteImage} spoilerFree={reviewActive && !answerVisible} expanded collapseSavedAnalysis />
        <label>{t('Clue category (optional)')}<div className="note-category-picker" onKeyDown={(event) => { if (event.key === 'Escape') setCategoryOpen(false); }}><button type="button" aria-expanded={categoryOpen} onClick={() => setCategoryOpen((value) => !value)}>{category ? t(category) : t('Choose a category')}<span aria-hidden="true">⌄</span></button>{categoryOpen && <div role="listbox" aria-label={t('Clue category (optional)')}><button type="button" role="option" aria-selected={!category} onClick={() => { setCategory(''); setCategoryOpen(false); setNoteSaved(false); void trainerDb.setSetting('workspace.noteDraft', { panoId, text: note, category: '' } satisfies NoteDraft); }}>{t('Any category')}</button>{[...NOTE_CATEGORIES].sort((a, b) => t(a).localeCompare(t(b), ui)).map((item) => <button type="button" role="option" aria-selected={category === item} key={item} onClick={() => { setCategory(item); setCategoryOpen(false); setNoteSaved(false); void trainerDb.setSetting('workspace.noteDraft', { panoId, text: note, category: item } satisfies NoteDraft); }}>{t(item)}</button>)}</div>}</div></label>
        <label>{t('Personal hint or note')}<textarea value={note} maxLength={5000} placeholder={t('Write what you noticed, such as “bollards have a black cap.”')} onChange={(event) => { const text = event.target.value; setNote(text); setNoteSaved(false); void trainerDb.setSetting('workspace.noteDraft', { panoId, text, category } satisfies NoteDraft); }} /></label>
        <button className="notebook-save" disabled={noteSaved} onClick={() => void saveNotebookNote()}>{t(noteSaved ? 'Saved' : 'Save note for Review')}</button></>
    </aside>}
  </>;
}
