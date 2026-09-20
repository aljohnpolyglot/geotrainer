import { useEffect, useMemo, useState } from 'react';
import { Eye, MapPin, NotebookPen, Search, Sparkles, Trash2, X } from 'lucide-react';
import type { ClueRecord, CoachHistoryNote, LearnedMeta, NotebookNote, TrainerLocation } from '../types';
import { COUNTRIES } from '../data/countries';
import { CountryFlag } from './CountryFlag';
import { ClueGallery } from './ClueGallery';
import { countryName, missingNotebookPhotoNotes, notebookClueLinks, pageBounds, savedClueCount, useHubTranslate, visibleNotebookNotes } from './trainerHubUtils';
import { localizeMetaLesson, metaLessonById } from '../data/metaLessons';
import { LearningNoteModal, type LearningNoteDetail } from './LearningNoteModal';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { coachStyleLabel } from '../services/coachPreferences';
import { CoachRichText } from './CoachRichText';

type ClueView = 'library' | 'countries' | 'insights';

export function TrainerHubClues({ clues, learnedMetas, notebookNotes, coachNotes, locations, onDelete, onDeleteNote, onSaveNote, onTrainCountries }: { clues: ClueRecord[]; learnedMetas: LearnedMeta[]; notebookNotes: NotebookNote[]; coachNotes: CoachHistoryNote[]; locations: TrainerLocation[]; onDelete: (id: string) => void; onDeleteNote: (note: NotebookNote) => void; onSaveNote: (note: NotebookNote) => Promise<void>; onTrainCountries: (codes: string[], name: string) => void }) {
  const t = useHubTranslate(); const { ui } = useLanguagePreferences(); const [view, setView] = useState<ClueView>('library'); const [query, setQuery] = useState(''); const [country, setCountry] = useState(''); const [source, setSource] = useState<'all' | 'personal' | 'coach' | 'meta'>('all'); const [page, setPage] = useState(1); const [gallery, setGallery] = useState<{ country: string; clueId?: string } | null>(null); const [detail, setDetail] = useState<LearningNoteDetail | null>(null); const [failedImages, setFailedImages] = useState(() => new Set<string>());
  const noteLinks = useMemo(() => notebookClueLinks(clues, notebookNotes), [clues, notebookNotes]);
  const displayNotes = useMemo(() => visibleNotebookNotes(notebookNotes, noteLinks), [notebookNotes, noteLinks]);
  const activeNotes = useMemo(() => notebookNotes.filter((note) => !note.deletedAt), [notebookNotes]);
  const missingPhotos = useMemo(() => new Set(missingNotebookPhotoNotes(clues, notebookNotes, failedImages)), [clues, failedImages, notebookNotes]);
  const metaRows = useMemo(() => learnedMetas.map((learned) => { const lesson = metaLessonById(learned.id); return { learned, lesson: lesson && localizeMetaLesson(lesson, ui) }; }).filter((row) => !!row.lesson).sort((a, b) => b.learned.learnedAt - a.learned.learnedAt), [learnedMetas, ui]);
  const filtered = useMemo(() => { const linked = new Set([...noteLinks.values(), ...coachNotes.flatMap((note) => note.clueId ? [note.clueId] : [])]); return clues.filter((clue) => !linked.has(clue.id) && (source === 'all' || source === 'personal' ? clue.origin === 'personal' || source === 'all' : source === 'coach' ? clue.origin !== 'personal' : false) && (!country || clue.countryCode === country) && (!query || `${countryName(clue.countryCode)} ${clue.analysis.description} ${clue.analysis.strongClues.join(' ')}`.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => b.createdAt - a.createdAt); }, [clues, coachNotes, country, noteLinks, query, source]);
  const filteredMetas = useMemo(() => (source === 'all' || source === 'meta' ? metaRows : []).filter(({ learned, lesson }) => (!country || learned.countryCode === country) && (!query || `${countryName(learned.countryCode)} ${lesson?.text} ${lesson?.note || ''}`.toLowerCase().includes(query.toLowerCase()))), [country, metaRows, query, source]);
  const filteredNotes = useMemo(() => (source === 'all' || source === 'personal' ? displayNotes : []).filter((note) => (!country || note.countryCode === country) && (!query || `${countryName(note.countryCode)} ${note.category || ''} ${note.text}`.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => b.updatedAt - a.updatedAt), [country, displayNotes, query, source]);
  const filteredCoach = useMemo(() => (source === 'all' || source === 'coach' ? coachNotes : []).filter((note) => (!country || note.countryCode === country) && (!query || `${countryName(note.countryCode)} ${note.analysis.description || ''} ${note.analysis.strongClues.join(' ')}`.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => b.generatedAt - a.generatedAt), [coachNotes, country, query, source]);
  useEffect(() => setPage(1), [country, query, source]);
  const timeline = useMemo(() => [...filtered.map((value) => ({ kind: 'clue' as const, value, at: value.createdAt })), ...filteredCoach.map((value) => ({ kind: 'coach' as const, value, at: value.generatedAt })), ...filteredNotes.map((value) => ({ kind: 'note' as const, value, at: value.updatedAt })), ...filteredMetas.map((value) => ({ kind: 'meta' as const, value, at: value.learned.learnedAt }))].sort((a, b) => b.at - a.at), [filtered, filteredCoach, filteredMetas, filteredNotes]);
  const totalFiltered = timeline.length; const paging = pageBounds(totalFiltered, page); const pageRows = timeline.slice(paging.start, paging.end);
  const groups = useMemo(() => [...new Set([...clues.map((clue) => clue.countryCode), ...learnedMetas.map((meta) => meta.countryCode), ...activeNotes.map((note) => note.countryCode), ...coachNotes.map((note) => note.countryCode)])].map((code) => { const rows = clues.filter((clue) => clue.countryCode === code); const metas = learnedMetas.filter((meta) => meta.countryCode === code); const notes = notebookNotes.filter((note) => note.countryCode === code); const visibleNotes = activeNotes.filter((note) => note.countryCode === code); const coaches = coachNotes.filter((note) => note.countryCode === code); const analyzed = [...rows.map((row) => row.analysis), ...coaches.map((row) => row.analysis)].filter((analysis) => analysis.candidates.length); return { code, count: savedClueCount(rows, notes, metas, coaches), latest: Math.max(0, ...rows.map((row) => row.createdAt), ...metas.map((row) => row.learnedAt), ...visibleNotes.map((row) => row.updatedAt), ...coaches.map((row) => row.generatedAt)), confidence: analyzed.length ? analyzed.reduce((sum, analysis) => sum + (analysis.candidates[0]?.confidence || 0), 0) / analyzed.length : 0 }; }).filter((group) => group.count > 0).sort((a, b) => b.count - a.count || countryName(a.code).localeCompare(countryName(b.code))), [activeNotes, clues, coachNotes, learnedMetas, notebookNotes]);
  const analyses = [...clues.map((clue) => clue.analysis), ...coachNotes.map((note) => note.analysis)].filter((analysis) => analysis.candidates.length); const analyzed = analyses.length; const averageConfidence = analyzed ? analyses.reduce((sum, analysis) => sum + (analysis.candidates[0]?.confidence || 0), 0) / analyzed : 0;
  const streetViewUrl = (panoId: string) => `https://www.google.com/maps/@?api=1&map_action=pano&pano=${encodeURIComponent(panoId)}`;
  const noteImage = (note: NotebookNote) => clues.find((clue) => clue.id === noteLinks.get(note))?.imageDataUrl;
  const coachImage = (note: CoachHistoryNote) => (note.clueId ? clues.find((clue) => clue.id === note.clueId)?.imageDataUrl : undefined) || locations.find((location) => location.panoId === note.panoId)?.imageDataUrl;
  const openNote = (note: NotebookNote) => setDetail({ countryCode: note.countryCode, source: t('Personal'), text: note.text, at: note.updatedAt, category: note.category, panoId: note.panoId, imageUrl: noteImage(note), missingImage: missingPhotos.has(note) });
  const openCoach = (note: CoachHistoryNote) => setDetail({ countryCode: note.countryCode, source: `${t('AI-assisted')}${note.analysis.style ? ` · ${coachStyleLabel(note.analysis.style)}` : ''}`, text: note.analysis.description || '', analysis: note.analysis, at: note.generatedAt, panoId: note.panoId, imageUrl: coachImage(note) });
  const openMeta = (learned: LearnedMeta, lesson: NonNullable<ReturnType<typeof metaLessonById>>) => setDetail({ countryCode: learned.countryCode, source: t('Meta lessons'), text: lesson.text, at: learned.learnedAt, note: lesson.note, temporallySensitive: lesson.temporallySensitive, imageUrl: lesson.imageUrl, panoId: lesson.panoId });
  return <section className="clues-panel">
    <div className="statistics-title">
<div>
<h2>{t('Clues')}</h2>
<p>{t('Your saved visual clues, organized for study.')}</p>
</div>
<nav>{(['library', 'countries', 'insights'] as ClueView[]).map((item) => <button key={item} className={view === item ? 'active' : ''} onClick={() => setView(item)}>{t(item === 'library' ? 'Library' : item === 'countries' ? 'Countries' : 'Insights')}</button>)}</nav>
</div>
    <div className="metric-strip">
<div>
<span>{t('Saved clues')}</span>
<strong>{savedClueCount(clues, notebookNotes, learnedMetas, coachNotes)}</strong>
</div>
<div>
<span>{t('Countries covered')}</span>
<strong>{groups.length}</strong>
</div>
<div>
<span>{t('Analyzed')}</span>
<strong>{analyzed}</strong>
</div>
<div>
<span>{t('Average confidence')}</span>
<strong>{Math.round(averageConfidence * 100)}%</strong>
</div>
</div>
    {view === 'library' && <>
<div className="clue-tools">
<label>
<Search size={14} />
<input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search clues')} />
</label>
<select aria-label={t('Clue source')} value={source} onChange={(event) => setSource(event.target.value as typeof source)}>
<option value="all">{t('All sources')}</option>
<option value="personal">{t('Personal')}</option>
<option value="coach">{t('AI-assisted')}</option>
<option value="meta">{t('Meta lessons')}</option>
</select>
<div className="clue-country-filter">
<select aria-label={t('Countries')} value={country} onChange={(event) => setCountry(event.target.value)}>
<option value="">{t('allCountries')}</option>{groups.map((group) => <option key={group.code} value={group.code}>{countryName(group.code)} ({group.count})</option>)}</select>{country && <button className="icon-button" onClick={() => setCountry('')} aria-label={t('clearCountryFilter')} title={t('clearCountryFilter')}>
<X size={16} />
</button>}</div>
</div>
<div className="clue-library">{pageRows.map((row, index) => row.kind === 'clue' ? (() => { const clue = row.value; return <article className={`coach-output-${clue.analysis.style || 'quick'}`} key={clue.id} role="button" tabIndex={0} onClick={() => setGallery({ country: clue.countryCode, clueId: clue.id })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setGallery({ country: clue.countryCode, clueId: clue.id }); } }}>
<img src={clue.imageDataUrl} alt={t('savedVisualClue')} />
<div>
<h3>
<CountryFlag code={clue.countryCode} />{countryName(clue.countryCode)}</h3>
<p><CoachRichText text={clue.analysis.description || clue.analysis.strongClues[0] || t('savedVisualClue')} /></p>
<small>{t(clue.origin === 'personal' ? 'Personal' : 'AI-assisted')}{clue.analysis.style ? ` · ${coachStyleLabel(clue.analysis.style)}` : ''} · {new Date(clue.createdAt).toLocaleString(ui)}</small>
</div>
<div className="clue-row-actions">
<button className="icon-button" onClick={(event) => { event.stopPropagation(); setGallery({ country: clue.countryCode, clueId: clue.id }); }} aria-label={t('Details')}>
<Eye size={16} />
</button>
<a className="icon-button" href={streetViewUrl(clue.panoId)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} aria-label={t('Reopen clue location')} title={t('Reopen clue location')}>
<MapPin size={16} />
</a>
<button className="icon-button" onClick={(event) => { event.stopPropagation(); onDelete(clue.id); }} aria-label={t('deleteClue')}>
<Trash2 size={16} />
</button>
</div>
</article>; })() : row.kind === 'coach' ? (() => { const note = row.value; return <article className={`coach-output-${note.analysis.style || 'quick'}`} key={note.id} role="button" tabIndex={0} onClick={() => openCoach(note)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openCoach(note); } }}>
{coachImage(note) ? <img src={coachImage(note)} alt="" /> : <div className="clue-note-icon"><Sparkles size={24} /></div>}
<div><h3><CountryFlag code={note.countryCode} />{countryName(note.countryCode)}</h3><p><CoachRichText text={note.analysis.description || note.analysis.strongClues[0] || t('Learning note')} /></p><small>{t('AI-assisted')}{note.analysis.style ? ` · ${coachStyleLabel(note.analysis.style)}` : ''} · {new Date(note.generatedAt).toLocaleString(ui)}</small></div>
<div className="clue-row-actions"><button className="icon-button" onClick={(event) => { event.stopPropagation(); openCoach(note); }} aria-label={t('Details')} title={t('Details')}><Eye size={16} /></button><a className="icon-button" href={streetViewUrl(note.panoId)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} aria-label={t('Reopen clue location')} title={t('Reopen clue location')}><MapPin size={16} /></a></div>
</article>; })() : row.kind === 'note' ? (() => { const note = row.value; return <article key={note.id || `note:${note.panoId}:${index}`} role="button" tabIndex={0} onClick={() => openNote(note)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openNote(note); } }}>
{noteImage(note) && !failedImages.has(note.clueId || '') ? <img src={noteImage(note)} alt="" onError={() => note.clueId && setFailedImages((current) => new Set(current).add(note.clueId!))} /> : <div className="clue-note-icon"><NotebookPen size={24} /></div>}
<div>
<h3>
<CountryFlag code={note.countryCode} />{countryName(note.countryCode)}</h3>
{note.category && <small>{t(note.category)}</small>}
{missingPhotos.has(note) && <p className="clue-integrity-error">{t('Saved photo is missing. Keep this note; recovery may still restore it.')}</p>}
{note.text && <p><CoachRichText text={note.text} /></p>}
<small>{t('Personal')} · {new Date(note.updatedAt).toLocaleString(ui)}</small>
</div>
<div className="clue-row-actions"><button className="icon-button" onClick={(event) => { event.stopPropagation(); openNote(note); }} aria-label={t('Details')} title={t('Details')}><Eye size={16} /></button><a className="icon-button" href={streetViewUrl(note.panoId)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} aria-label={t('Reopen clue location')} title={t('Reopen clue location')}><MapPin size={16} /></a><button className="icon-button" onClick={(event) => { event.stopPropagation(); onDeleteNote(note); }} aria-label={t('Delete note')} title={t('Delete note')}><Trash2 size={16} /></button></div>
</article>; })() : (() => { const { learned, lesson } = row.value; return lesson && <article key={`meta:${lesson.id}`} role="button" tabIndex={0} onClick={() => openMeta(learned, lesson)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openMeta(learned, lesson); } }}>
<img src={lesson.imageUrl} alt={t('Meta reference clue')} />
<div>
<h3>
<CountryFlag code={learned.countryCode} />{countryName(learned.countryCode)}</h3>
<p>{lesson.text}</p>{lesson.note && <small>{lesson.note}</small>}{lesson.temporallySensitive && <small className="meta-temporal-warning">{t('This imagery Meta may change over time. Use it as supporting evidence.')}</small>}<small>{t('Meta lessons')} · {new Date(learned.learnedAt).toLocaleString(ui)}</small>
</div>
<div className="clue-row-actions"><button className="icon-button" onClick={(event) => { event.stopPropagation(); openMeta(learned, lesson); }} aria-label={t('Details')} title={t('Details')}><Eye size={16} /></button><a className="icon-button" href={streetViewUrl(lesson.panoId)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} aria-label={t('Reopen clue location')} title={t('Reopen clue location')}><MapPin size={16} /></a></div>
</article>; })())}{!totalFiltered && <p className="empty">{t('No clues match these filters.')}</p>}</div>
{paging.pages > 1 && <nav className="clue-pagination" aria-label={t('Library')}><button disabled={paging.current === 1} onClick={() => setPage(paging.current - 1)}>{t('Previous')}</button><span aria-live="polite">{paging.current} / {paging.pages}</span><button disabled={paging.current === paging.pages} onClick={() => setPage(paging.current + 1)}>{t('Next')}</button></nav>}
</>}
    {view === 'countries' && <div className="table-scroll">
<table>
<thead>
<tr>
<th>{t('Country')}</th>
<th>{t('Saved clues')}</th>
<th>{t('Average confidence')}</th>
<th>{t('Latest')}</th>
<th />
</tr>
</thead>
<tbody>{groups.map((group) => <tr key={group.code}>
<td>
<CountryFlag code={group.code} />{countryName(group.code)}</td>
<td>{group.count}</td>
<td>{Math.round(group.confidence * 100)}%</td>
<td>{new Date(group.latest).toLocaleDateString()}</td>
<td>
<button className="review-location-button" onClick={() => onTrainCountries([group.code], countryName(group.code))}>{t('Practice')}</button>
</td>
</tr>)}</tbody>
</table>
</div>}
    {view === 'insights' && <div className="clue-insights">
<p>{t('Confidence reflects the Coach estimate, not a verified answer.')}</p>{groups.slice(0, 8).map((group) => <button key={group.code} onClick={() => { setCountry(group.code); setView('library'); }}>
<span>
<CountryFlag code={group.code} />{countryName(group.code)}</span>
<strong>{group.count}</strong>
</button>)}</div>}
    {gallery && <ClueGallery country={countryName(gallery.country)} clues={clues.filter((clue) => clue.countryCode === gallery.country)} notes={notebookNotes} initialSelectedId={gallery.clueId} onClose={() => setGallery(null)} onDelete={onDelete} onSaveNote={onSaveNote} />}
    {detail && <LearningNoteModal detail={detail} onClose={() => setDetail(null)} />}
  </section>;
}
