import { useMemo, useState } from 'react';
import { Eye, Lightbulb, MapPin, NotebookPen, Search, Trash2, X } from 'lucide-react';
import type { ClueRecord, LearnedMeta, NotebookNote, TrainerLocation } from '../types';
import { COUNTRIES } from '../data/countries';
import { CountryFlag } from './CountryFlag';
import { ClueGallery } from './ClueGallery';
import { countryName, useHubTranslate } from './trainerHubUtils';
import { localizeMetaLesson, metaLessonById } from '../data/metaLessons';
import { LearningNoteModal, type LearningNoteDetail } from './LearningNoteModal';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

type ClueView = 'library' | 'countries' | 'insights';

export function TrainerHubClues({ clues, learnedMetas, notebookNotes, onDelete, onTrainCountries }: { clues: ClueRecord[]; learnedMetas: LearnedMeta[]; notebookNotes: NotebookNote[]; locations: TrainerLocation[]; onDelete: (id: string) => void; onTrainCountries: (codes: string[], name: string) => void }) {
  const t = useHubTranslate(); const { ui } = useLanguagePreferences(); const [view, setView] = useState<ClueView>('library'); const [query, setQuery] = useState(''); const [country, setCountry] = useState(''); const [source, setSource] = useState<'all' | 'personal' | 'coach' | 'meta'>('all'); const [gallery, setGallery] = useState<{ country: string; clueId?: string } | null>(null); const [detail, setDetail] = useState<LearningNoteDetail | null>(null);
  const metaRows = useMemo(() => learnedMetas.map((learned) => { const lesson = metaLessonById(learned.id); return { learned, lesson: lesson && localizeMetaLesson(lesson, ui) }; }).filter((row) => !!row.lesson).sort((a, b) => b.learned.learnedAt - a.learned.learnedAt), [learnedMetas, ui]);
  const filtered = useMemo(() => { const linked = new Set(notebookNotes.flatMap((note) => note.clueId ? [note.clueId] : [])); return clues.filter((clue) => !linked.has(clue.id) && (source === 'all' || source === 'personal' ? clue.origin === 'personal' || source === 'all' : source === 'coach' ? clue.origin !== 'personal' : false) && (!country || clue.countryCode === country) && (!query || `${countryName(clue.countryCode)} ${clue.analysis.description} ${clue.analysis.strongClues.join(' ')}`.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => b.createdAt - a.createdAt); }, [clues, country, notebookNotes, query, source]);
  const filteredMetas = useMemo(() => (source === 'all' || source === 'meta' ? metaRows : []).filter(({ learned, lesson }) => (!country || learned.countryCode === country) && (!query || `${countryName(learned.countryCode)} ${lesson?.text} ${lesson?.note || ''}`.toLowerCase().includes(query.toLowerCase()))), [country, metaRows, query, source]);
  const filteredNotes = useMemo(() => (source === 'all' || source === 'personal' ? notebookNotes : []).filter((note) => (!country || note.countryCode === country) && (!query || `${countryName(note.countryCode)} ${note.category || ''} ${note.text}`.toLowerCase().includes(query.toLowerCase()))).sort((a, b) => b.updatedAt - a.updatedAt), [country, notebookNotes, query, source]);
  const groups = useMemo(() => [...new Set([...clues.map((clue) => clue.countryCode), ...learnedMetas.map((meta) => meta.countryCode), ...notebookNotes.map((note) => note.countryCode)])].map((code) => { const rows = clues.filter((clue) => clue.countryCode === code); const metas = learnedMetas.filter((meta) => meta.countryCode === code); const notes = notebookNotes.filter((note) => note.countryCode === code); return { code, count: rows.length + metas.length + notes.length, latest: Math.max(0, ...rows.map((row) => row.createdAt), ...metas.map((row) => row.learnedAt), ...notes.map((row) => row.updatedAt)), confidence: rows.length ? rows.reduce((sum, row) => sum + (row.analysis.candidates[0]?.confidence || 0), 0) / rows.length : 0 }; }).sort((a, b) => b.count - a.count || countryName(a.code).localeCompare(countryName(b.code))), [clues, learnedMetas, notebookNotes]);
  const analyzed = clues.filter((clue) => clue.analysis.candidates.length).length; const averageConfidence = analyzed ? clues.reduce((sum, clue) => sum + (clue.analysis.candidates[0]?.confidence || 0), 0) / analyzed : 0;
  const streetViewUrl = (clue: ClueRecord) => `https://www.google.com/maps/@?api=1&map_action=pano&pano=${encodeURIComponent(clue.panoId)}`;
  const noteImage = (note: NotebookNote) => (note.clueId ? clues.find((clue) => clue.id === note.clueId) : undefined)?.imageDataUrl || clues.filter((clue) => clue.panoId === note.panoId).sort((a, b) => Math.abs(a.createdAt - note.updatedAt) - Math.abs(b.createdAt - note.updatedAt))[0]?.imageDataUrl;
  const openNote = (note: NotebookNote) => setDetail({ countryCode: note.countryCode, source: t('Personal'), text: note.text, at: note.updatedAt, category: note.category, panoId: note.panoId, imageUrl: noteImage(note) });
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
<strong>{clues.length + learnedMetas.length + notebookNotes.length}</strong>
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
<div className="clue-library">{filtered.map((clue) => <article key={clue.id} role="button" tabIndex={0} onClick={() => setGallery({ country: clue.countryCode, clueId: clue.id })} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); setGallery({ country: clue.countryCode, clueId: clue.id }); } }}>
<img src={clue.imageDataUrl} alt={t('savedVisualClue')} />
<div>
<h3>
<CountryFlag code={clue.countryCode} />{countryName(clue.countryCode)}</h3>
<p>{clue.analysis.description || clue.analysis.strongClues[0] || t('savedVisualClue')}</p>
<small>{t(clue.origin === 'personal' ? 'Personal' : 'AI-assisted')} · {new Date(clue.createdAt).toLocaleString(ui)}</small>
</div>
<div>
<button className="icon-button" onClick={(event) => { event.stopPropagation(); setGallery({ country: clue.countryCode, clueId: clue.id }); }} aria-label={t('Details')}>
<Eye size={16} />
</button>
<a className="icon-button" href={streetViewUrl(clue)} target="_blank" rel="noreferrer" onClick={(event) => event.stopPropagation()} aria-label={t('Reopen clue location')}>
<MapPin size={16} />
</a>
<button className="icon-button" onClick={(event) => { event.stopPropagation(); onDelete(clue.id); }} aria-label={t('deleteClue')}>
<Trash2 size={16} />
</button>
</div>
</article>)}{filteredNotes.map((note, index) => <article key={note.id || `note:${note.panoId}:${index}`} role="button" tabIndex={0} onClick={() => openNote(note)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openNote(note); } }}>
{noteImage(note) ? <img src={noteImage(note)} alt="" /> : <div className="clue-note-icon"><NotebookPen size={24} /></div>}
<div>
<h3>
<CountryFlag code={note.countryCode} />{countryName(note.countryCode)}</h3>
{note.category && <small>{t(note.category)}</small>}
{note.text && <p>{note.text}</p>}
<small>{t('Personal')} · {new Date(note.updatedAt).toLocaleString(ui)}</small>
</div>
</article>)}{filteredMetas.map(({ learned, lesson }) => lesson && <article key={`meta:${lesson.id}`} role="button" tabIndex={0} onClick={() => openMeta(learned, lesson)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openMeta(learned, lesson); } }}>
<img src={lesson.imageUrl} alt={t('Meta reference clue')} />
<div>
<h3>
<CountryFlag code={learned.countryCode} />{countryName(learned.countryCode)}</h3>
<p>{lesson.text}</p>{lesson.note && <small>{lesson.note}</small>}{lesson.temporallySensitive && <small className="meta-temporal-warning">{t('This imagery Meta may change over time. Use it as supporting evidence.')}</small>}<small>{t('Meta lessons')} · {new Date(learned.learnedAt).toLocaleString(ui)}</small>
</div>
<div>
<Lightbulb size={16} />
</div>
</article>)}{!filtered.length && !filteredNotes.length && !filteredMetas.length && <p className="empty">{t('No clues match these filters.')}</p>}</div>
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
    {gallery && <ClueGallery country={countryName(gallery.country)} clues={clues.filter((clue) => clue.countryCode === gallery.country)} initialSelectedId={gallery.clueId} onClose={() => setGallery(null)} onDelete={onDelete} />}
    {detail && <LearningNoteModal detail={detail} onClose={() => setDetail(null)} />}
  </section>;
}
