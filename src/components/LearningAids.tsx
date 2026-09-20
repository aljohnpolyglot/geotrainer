import { useEffect, useState } from 'react';
import { Camera, Check, Files, Images, Lightbulb, LoaderCircle, NotebookPen, Trash2, TriangleAlert, X } from 'lucide-react';
import type { ClueRecord, CoachAnalysis, CoachHistoryNote, NotebookNote } from '../types';
import { trainerDb } from '../data/trainerDb';
import { CountryFlag } from './CountryFlag';
import { countryDisplayName, translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { ClueCapture } from './ClueCapture';
import { useDraggablePanel } from '../hooks/useDraggablePanel';
import { CoachLocationEstimate } from './CoachLocationEstimate';
import { nearbyReviewPoint } from '../data/reviewIdentity';
import { coachStyleLabel } from '../services/coachPreferences';
import { CoachRichText } from './CoachRichText';
import { deleteCoachHistoryNote, deleteNotebookHistoryNote, NOTEBOOK_NOTE_MAX_LENGTH, saveNotebookHistoryNote, splitDuplicateNotes } from '../services/coachHistory';
import { richClipboardHtmlToMarkdown } from '../services/richClipboard';
import { clearWorkspaceDraft, readWorkspaceDraft, writeWorkspaceDraft } from '../services/workspaceDrafts';
import { notebookClueLinks, visibleNotebookNotes } from './trainerHubUtils';
import { captureStreetView360 } from '../services/streetViewSnapshot';
import { clueImageFingerprint } from '../data/clueDedup';

export type MetaAid = { id: string; imageUrl: string; text?: string; note?: string; temporallySensitive?: boolean };
const NOTE_CATEGORIES = ['Architecture', 'Bollards', 'Camera generations', 'Companies', 'Countries', 'Currencies', 'Domains', 'Driving side', 'Flags', 'Follow cars', 'Google vehicles', 'House numbers', 'License plates', 'Road lines', 'Nature', 'Phone numbers', 'Post boxes', 'Rifts', 'Scenery', 'Sidewalks', 'Signs', 'Snow', 'Street suffixes', 'Traffic lights', 'Utility poles', 'Years'] as const;
type NoteDraft = { panoId: string; text: string; category: string };
type AvailableNote = { id: string; source: string; text: string; category?: string; imageUrl?: string; imageKey?: string; missingImage?: boolean; analysis?: CoachAnalysis; at: number; notebook?: NotebookNote; coach?: CoachHistoryNote; clueId?: string };

export function LearningAids({ lesson, panoId, lat, lng, countryCode, adviceOpen, refreshKey, onAdviceClose, onSaveClue, onNoteSaved }: {
  lesson?: MetaAid;
  panoId: string;
  lat: number;
  lng: number;
  countryCode: string;
  adviceOpen: boolean;
  refreshKey: number;
  onAdviceClose: (forever: boolean) => void;
  onSaveClue: (clue: { imageDataUrl: string; model: string; generatedAt: number; analysis: CoachAnalysis; origin?: 'personal' | 'coach'; location?: { panoId: string; lat: number; lng: number; countryCode: string } }) => Promise<string | void> | string | void;
  onNoteSaved: () => Promise<void> | void;
}) {
  const { ui, ai } = useLanguagePreferences(); const t = (key: string) => translate(ui, key);
  const [open, setOpen] = useState<'meta' | 'clues' | 'notebook' | 'available' | null>(null);
  const [clues, setClues] = useState<ClueRecord[]>([]);
  const [notes, setNotes] = useState<AvailableNote[]>([]);
  const [notesRefreshKey, setNotesRefreshKey] = useState(0);
  const [clueIndex, setClueIndex] = useState(0);
  const [note, setNote] = useState('');
  const [category, setCategory] = useState('');
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [noteSaved, setNoteSaved] = useState(false);
  const [noteClueId, setNoteClueId] = useState<string>();
  const [noteImage, setNoteImage] = useState('');
  const [noteFormKey, setNoteFormKey] = useState(0);
  const [imageFailed, setImageFailed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [capture360, setCapture360] = useState<'idle' | 'busy' | 'copied' | 'error'>('idle');
  const { panelRef, dragHandleProps, dragStyle, dragging } = useDraggablePanel<HTMLElement>();

  useEffect(() => { let active = true; void Promise.all([trainerDb.setting<NotebookNote[]>('notebook.notes'), trainerDb.setting<CoachHistoryNote[]>('coach.notes'), trainerDb.attempts(), trainerDb.studyVisits(), trainerDb.clues(), trainerDb.locations()]).then(([personal = [], coach = [], attempts, visits, savedClues, locations]) => { if (!active) return;
    const current = { panoId, lat, lng, countryCode }; const relatedPanos = new Set([panoId]);
    locations.forEach((item) => { if (nearbyReviewPoint(current, item)) relatedPanos.add(item.panoId); });
    visits.forEach((item) => { if (nearbyReviewPoint(current, item)) relatedPanos.add(item.panoId); });
    attempts.forEach((item) => { if (nearbyReviewPoint(current, { panoId: item.panoId, lat: item.actualLat, lng: item.actualLng, countryCode: item.countryCode })) relatedPanos.add(item.panoId); });
    const nearbyClues = savedClues.filter((item) => relatedPanos.has(item.panoId) || (typeof item.lat === 'number' && typeof item.lng === 'number' && nearbyReviewPoint(current, { panoId: item.panoId, lat: item.lat, lng: item.lng, countryCode: item.countryCode })));
    const deletedCoachRuns = new Set(coach.filter((item) => item.deletedAt).map((item) => `${item.generatedAt}:${item.mode}:${item.model}`));
    const deletedClueIds = new Set([...personal.filter((item) => item.deletedAt && item.clueId).map((item) => item.clueId!), ...coach.filter((item) => item.deletedAt && item.clueId).map((item) => item.clueId!)]); const visibleNearbyClues = nearbyClues.filter((item) => !deletedClueIds.has(item.id));
    nearbyClues.forEach((item) => relatedPanos.add(item.panoId)); setClues((previous) => [...new Map([...previous.filter((item) => !deletedClueIds.has(item.id)), ...visibleNearbyClues].map((item) => [item.id, item])).values()].sort((a, b) => b.createdAt - a.createdAt));
    const coachByRun = new Map(coach.filter((item) => !item.deletedAt && relatedPanos.has(item.panoId)).map((item) => [`${item.generatedAt}:${item.mode}:${item.model}`, item]));
    [...visits, ...attempts].filter((item) => relatedPanos.has(item.panoId) && item.coachAnalysis && item.coachGeneratedAt && item.coachMode).forEach((item) => { const model = item.coachModel || 'Gemini'; const key = `${item.coachGeneratedAt}:${item.coachMode}:${model}`; if (!coachByRun.has(key) && !deletedCoachRuns.has(key)) coachByRun.set(key, { id: `coach-legacy:${key}`, panoId: item.panoId, countryCode: item.countryCode, mode: item.coachMode!, model, generatedAt: item.coachGeneratedAt!, analysis: item.coachAnalysis! }); });
    const relevantPersonal = personal.filter((item) => relatedPanos.has(item.panoId) || !!item.clueId && nearbyClues.some((clue) => clue.id === item.clueId)); const personalLinks = notebookClueLinks(nearbyClues, relevantPersonal); const displayedPersonal = visibleNotebookNotes(relevantPersonal, personalLinks);
    const linkedClues = new Set([...personalLinks.values(), ...[...coachByRun.values()].flatMap((item) => item.clueId ? [item.clueId] : [])]);
    const currentNotes: AvailableNote[] = [...displayedPersonal.map((item) => { const linked = visibleNearbyClues.find((clue) => clue.id === personalLinks.get(item)); return { id: item.id || `personal:${item.updatedAt}`, source: t('Personal'), text: item.text, category: item.category, imageUrl: linked?.imageDataUrl, imageKey: linked?.imageFingerprint || clueImageFingerprint(linked?.imageDataUrl), missingImage: !!item.clueId && (!linked || !linked.imageDataUrl), analysis: linked && (linked.analysis.description || linked.analysis.strongClues.length) ? linked.analysis : undefined, at: item.updatedAt, notebook: item, clueId: linked?.id }; }), ...[...coachByRun.values()].map((item) => { const linked = item.clueId ? visibleNearbyClues.find((clue) => clue.id === item.clueId) : undefined; return { id: item.id, source: t('AI-assisted'), text: item.analysis.description || '', imageUrl: linked?.imageDataUrl, imageKey: linked?.imageFingerprint || clueImageFingerprint(linked?.imageDataUrl), analysis: item.analysis, at: item.generatedAt, coach: item, clueId: item.clueId }; }), ...visibleNearbyClues.filter((item) => !linkedClues.has(item.id)).map((item) => ({ id: item.id, source: t(item.origin === 'personal' ? 'Personal' : 'AI-assisted'), text: item.analysis.description || '', imageUrl: item.imageDataUrl, imageKey: item.imageFingerprint || clueImageFingerprint(item.imageDataUrl), analysis: item.analysis, at: item.createdAt, clueId: item.id }))];
    const merged = [...new Map(currentNotes.map((item) => [item.id, item])).values()].sort((a, b) => b.at - a.at); const deduped = splitDuplicateNotes(merged); setNotes(deduped.unique);
    if (deduped.duplicates.length) void Promise.all(deduped.duplicates.map((item) => item.notebook ? deleteNotebookHistoryNote(item.notebook) : item.coach ? Promise.all([deleteCoachHistoryNote(item.coach), item.clueId ? trainerDb.deleteClue(item.clueId) : Promise.resolve()]) : item.clueId ? trainerDb.deleteClue(item.clueId) : Promise.resolve())).then(() => onNoteSaved());
  }); return () => { active = false; }; }, [panoId, lat, lng, countryCode, refreshKey, notesRefreshKey, ui]);
  useEffect(() => { setImageFailed(false); setImageLoaded(false); }, [lesson?.id]);
  useEffect(() => {
    void readWorkspaceDraft<NoteDraft>('note', panoId).then((draft) => { if (draft) { setNote(draft.text.slice(0, NOTEBOOK_NOTE_MAX_LENGTH)); setCategory(draft.category); } });
  }, [panoId]);
  const clue = clues[clueIndex];
  const deleteAvailableNote = async (item: AvailableNote) => { setNotes((current) => current.filter((note) => note.id !== item.id)); if (item.notebook) await deleteNotebookHistoryNote(item.notebook); else if (item.coach) await Promise.all([deleteCoachHistoryNote(item.coach), item.clueId ? trainerDb.deleteClue(item.clueId) : Promise.resolve()]); else if (item.clueId) await trainerDb.deleteClue(item.clueId); setNotesRefreshKey((value) => value + 1); await onNoteSaved(); };
  const updateNote = (text: string) => { const limited = text.slice(0, NOTEBOOK_NOTE_MAX_LENGTH); setNote(limited); setNoteSaved(false); void writeWorkspaceDraft('note', { panoId, text: limited, category } satisfies NoteDraft); };
  const list = (title: string, values: string[]) => values.length ? <section><strong>{title}</strong><ul>{values.map((value) => <li key={value}><CoachRichText text={value} /></li>)}</ul></section> : null;
  const analysisDetails = (analysis: CoachAnalysis) => <div className={`available-note-analysis coach-output-${analysis.style || 'quick'}`}>{analysis.style && <p className="coach-history-profile"><strong>{coachStyleLabel(analysis.style)}</strong>{analysis.depth && <span>{t(analysis.depth[0].toUpperCase() + analysis.depth.slice(1))}</span>}</p>}<CoachLocationEstimate estimate={analysis.locationEstimate} />{!!analysis.candidates.length && <section><strong>{t('candidates')}</strong><ul>{analysis.candidates.map((candidate) => <li key={candidate.countryCode}><CountryFlag code={candidate.countryCode} />{countryDisplayName(candidate.countryCode, ai)} · {Math.round(candidate.confidence * 100)}%{candidate.rationale && <small><CoachRichText text={candidate.rationale} /></small>}</li>)}</ul></section>}{list(t('strongClues'), analysis.strongClues)}{list(t('weakGeneric'), analysis.weakClues)}{list(t('contradictionsGaps'), analysis.contradictions || [])}{list(t('confusableWith'), analysis.confusions)}{list(t('inspectNext'), analysis.nextThingsToInspect)}{analysis.coreCard && <section><strong>{t('coreCard')}</strong><ul>{analysis.coreCard.front.map((value) => <li key={value}><CoachRichText text={value} /></li>)}</ul><p><CoachRichText text={analysis.coreCard.backExplanation} /></p></section>}{analysis.extraCards.map((card) => <section key={card.category}><strong>{card.category}</strong><ul>{card.front.map((value) => <li key={value}><CoachRichText text={value} /></li>)}</ul><p><CoachRichText text={card.back} /></p></section>)}</div>;
  const saveNotebookNote = async () => {
    const updatedAt = Date.now(); let clueId = noteClueId;
    if (noteImage && !clueId) clueId = await onSaveClue({ imageDataUrl: noteImage, model: 'Notebook', generatedAt: updatedAt, analysis: { confidence: 'low', region: '', candidates: [], strongClues: [], weakClues: [], confusions: [], nextThingsToInspect: [], extraCards: [] }, origin: 'personal' }) || undefined;
    await saveNotebookHistoryNote({ id: `note-${crypto.randomUUID()}`, panoId, countryCode, text: note.trim(), ...(category ? { category } : {}), ...(clueId ? { clueId } : {}), updatedAt });
    setNote(''); setCategory(''); setCategoryOpen(false); setNoteClueId(undefined); setNoteImage(''); setNoteSaved(true); setNotesRefreshKey((value) => value + 1);
    await Promise.all([clearWorkspaceDraft('note', panoId), clearWorkspaceDraft('clue', panoId)]); setNoteFormKey((value) => value + 1);
    window.setTimeout(() => setNoteSaved(false), 700); await onNoteSaved();
  };
  const copy360 = async () => {
    if (capture360 === 'busy') return; setCapture360('busy');
    try { if (!navigator.clipboard?.write || typeof ClipboardItem === 'undefined') throw new Error(); const blob = await captureStreetView360(panoId); await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]); setCapture360('copied'); window.setTimeout(() => setCapture360('idle'), 1800); }
    catch { setCapture360('error'); window.setTimeout(() => setCapture360('idle'), 3000); }
  };

  return <>
    <div className="learning-aids" aria-label={t('Learning aids')}>
      <button type="button" disabled={capture360 === 'busy'} aria-busy={capture360 === 'busy'} onClick={() => void copy360()} title={t(capture360 === 'busy' ? 'Capturing 360° view…' : capture360 === 'copied' ? '360° view copied' : capture360 === 'error' ? 'Could not copy 360° view' : 'Copy 360° view to clipboard')}>{capture360 === 'busy' ? <LoaderCircle className="spin" size={17} /> : capture360 === 'copied' ? <Check size={17} /> : capture360 === 'error' ? <TriangleAlert size={17} /> : <Camera size={17} />}<span>{t(capture360 === 'busy' ? 'Capturing 360° view…' : capture360 === 'copied' ? '360° view copied' : capture360 === 'error' ? 'Could not copy 360° view' : 'Copy 360° view to clipboard')}</span><i aria-hidden="true">360°</i></button>
      {lesson && <button type="button" aria-pressed={open === 'meta'} onClick={() => setOpen(open === 'meta' ? null : 'meta')} title={t('Meta')}><Lightbulb size={17} /><span>{t('Meta')}</span></button>}
      <button type="button" aria-pressed={open === 'clues'} onClick={() => setOpen(open === 'clues' ? null : 'clues')} title={t('Show Clues')}><Images size={17} /><span>{t('Show Clues')}</span><b>{clues.length}</b></button>
      <button type="button" aria-pressed={open === 'notebook'} onClick={() => setOpen(open === 'notebook' ? null : 'notebook')} title={t('Notebook')}><NotebookPen size={17} /><span>{t('Notebook')}</span></button>
      {notes.length > 0 && <button type="button" aria-pressed={open === 'available'} onClick={() => setOpen(open === 'available' ? null : 'available')} title={t('Available notes')}><Files size={17} /><span>{t('Available notes')}</span><b>{notes.length}</b></button>}
    </div>
    {adviceOpen && lesson && <aside className="meta-advice" role="status"><p>{t('Meta clues are always available from the lightbulb in the top-right.')}</p><div><button onClick={() => onAdviceClose(false)}>{t('Okay')}</button><button onClick={() => onAdviceClose(true)}>{t("Don't show again")}</button></div></aside>}
    {open === 'meta' && lesson && <aside ref={panelRef} style={dragStyle} className="learning-aid-panel" aria-label={t('Meta')}>
      <header {...dragHandleProps} className={dragging ? 'dragging' : ''}><span><Lightbulb size={17} />{t('Meta')}</span><button onClick={() => setOpen(null)} aria-label={t('close')}><X size={16} /></button></header>
      {imageFailed ? <p className="learning-aid-safe">{t('Reference image unavailable')}</p> : <img src={lesson.imageUrl} alt={t('Meta reference clue')} onLoad={() => setImageLoaded(true)} onError={() => setImageFailed(true)} />}
      {(imageLoaded || imageFailed) && <div className="learning-aid-copy"><p>{lesson.text}</p>{lesson.note && <p className="meta-comparison">{lesson.note}</p>}{lesson.temporallySensitive && <small className="meta-temporal-warning">{t('This imagery Meta may change over time. Use it as supporting evidence.')}</small>}</div>}
    </aside>}
    {open === 'clues' && <aside ref={panelRef} style={dragStyle} className="learning-aid-panel" aria-label={t('Show Clues')}>
      <header {...dragHandleProps} className={dragging ? 'dragging' : ''}><span><Images size={17} />{t('Show Clues')}</span><button onClick={() => setOpen(null)} aria-label={t('close')}><X size={16} /></button></header>
      {clue ? <><img src={clue.imageDataUrl} alt={t('savedVisualClue')} />
        <div className="learning-aid-copy">{clue.analysis.description && <p><CoachRichText text={clue.analysis.description} /></p>}{list(t('strongClues'), clue.analysis.strongClues)}{!!clue.analysis.candidates.length && <section><strong>{t('candidates')}</strong><ul>{clue.analysis.candidates.map((candidate) => <li key={candidate.countryCode}><CountryFlag code={candidate.countryCode} />{countryDisplayName(candidate.countryCode, ai)} · {Math.round(candidate.confidence * 100)}%{candidate.rationale && <small><CoachRichText text={candidate.rationale} /></small>}</li>)}</ul></section>}</div>
        {clues.length > 1 && <footer><button disabled={clueIndex === 0} onClick={() => setClueIndex((value) => value - 1)}>{t('Previous')}</button><span>{clueIndex + 1} / {clues.length}</span><button disabled={clueIndex === clues.length - 1} onClick={() => setClueIndex((value) => value + 1)}>{t('Next')}</button></footer>}</> : <p className="learning-aid-safe">{t('No saved clues for this location.')}</p>}
    </aside>}
    {open === 'available' && <aside ref={panelRef} style={dragStyle} className="learning-aid-panel available-notes-panel" aria-label={t('Available notes')}>
      <header {...dragHandleProps} className={dragging ? 'dragging' : ''}><span><Files size={17} />{t('Available notes')} ({notes.length})</span><button onClick={() => setOpen(null)} aria-label={t('close')}><X size={16} /></button></header>
      <div className="available-notes-list">{notes.map((item) => <article key={item.id}><button type="button" className="icon-button available-note-delete" onClick={() => void deleteAvailableNote(item)} aria-label={t('Delete note')} title={t('Delete note')}><Trash2 size={16} /></button>{item.imageUrl && <img src={item.imageUrl} alt="" onError={() => setNotes((current) => current.map((note) => note.id === item.id ? { ...note, imageUrl: undefined, missingImage: true } : note))} />}<strong>{item.category ? `${t(item.category)} · ` : ''}{item.source}</strong>{item.missingImage && <p className="clue-integrity-error">{t('Saved photo is missing. Keep this note; recovery may still restore it.')}</p>}{item.text && <p><CoachRichText text={item.text} /></p>}{item.analysis && analysisDetails(item.analysis)}<small>{new Date(item.at).toLocaleString(ui)}</small></article>)}</div>
    </aside>}
    {open === 'notebook' && <aside ref={panelRef} style={dragStyle} className="learning-aid-panel notebook-panel" aria-label={t('Notebook')}>
      <header {...dragHandleProps} className={dragging ? 'dragging' : ''}><span><NotebookPen size={17} />{t('Notebook')}</span><button onClick={() => setOpen(null)} aria-label={t('close')}><X size={16} /></button></header>
      <><div key={noteFormKey}><ClueCapture panoId={panoId} onSave={(clue) => onSaveClue({ ...clue, origin: 'personal', location: { panoId, lat, lng, countryCode } })} onSaved={setNoteClueId} onImageChange={setNoteImage} expanded collapseSavedAnalysis /></div>
        <label>{t('Clue category (optional)')}<div className="note-category-picker" onKeyDown={(event) => { if (event.key === 'Escape') setCategoryOpen(false); }}><button type="button" aria-expanded={categoryOpen} onClick={() => setCategoryOpen((value) => !value)}>{category ? t(category) : t('Choose a category')}<span aria-hidden="true">⌄</span></button>{categoryOpen && <div role="listbox" aria-label={t('Clue category (optional)')}><button type="button" role="option" aria-selected={!category} onClick={() => { setCategory(''); setCategoryOpen(false); setNoteSaved(false); void writeWorkspaceDraft('note', { panoId, text: note, category: '' } satisfies NoteDraft); }}>{t('Any category')}</button>{[...NOTE_CATEGORIES].sort((a, b) => t(a).localeCompare(t(b), ui)).map((item) => <button type="button" role="option" aria-selected={category === item} key={item} onClick={() => { setCategory(item); setCategoryOpen(false); setNoteSaved(false); void writeWorkspaceDraft('note', { panoId, text: note, category: item } satisfies NoteDraft); }}>{t(item)}</button>)}</div>}</div></label>
        <label>{t('Personal hint or note')}<textarea aria-describedby="notebook-note-limit" value={note} maxLength={NOTEBOOK_NOTE_MAX_LENGTH} placeholder={t('Write what you noticed, such as “bollards have a black cap.”')} onChange={(event) => updateNote(event.target.value)} onPaste={(event) => { const html = event.clipboardData.getData('text/html'); if (!html) return; event.preventDefault(); const start = event.currentTarget.selectionStart; const pasted = richClipboardHtmlToMarkdown(html); updateNote(`${note.slice(0, start)}${pasted}${note.slice(event.currentTarget.selectionEnd)}`); }} /><small id="notebook-note-limit" className="notebook-note-limit">{note.length.toLocaleString(ui)} / {NOTEBOOK_NOTE_MAX_LENGTH.toLocaleString(ui)}</small></label>
        <button className="notebook-save" disabled={noteSaved} onClick={() => void saveNotebookNote()}>{t(noteSaved ? 'Saved' : 'Save note for Review')}</button></>
    </aside>}
  </>;
}
