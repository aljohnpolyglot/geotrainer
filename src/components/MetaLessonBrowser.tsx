import { useMemo, useState } from 'react';
import { Check, CheckCircle2, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { filterMetaLessonsByCompletion, localizeMetaLesson, META_LESSONS, type MetaCompletionFilter } from '../data/metaLessons';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { MetaAttribution } from './MetaAttribution';

const PAGE_SIZE = 20;

export type MetaLessonChoice = { id: string; text: string; note?: string; imageUrl?: string; section?: string };

export function MetaLessonBrowser({ completed, selectedId, onSelect, lessons: lessonChoices = META_LESSONS }: { completed: Set<string>; selectedId?: string; onSelect: (id?: string) => void; lessons?: MetaLessonChoice[] }) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState<MetaCompletionFilter>(() => lessonChoices.every((lesson) => completed.has(lesson.id)) ? 'all' : 'unfinished');
  const lessons = useMemo(() => {
    const search = query.trim().toLocaleLowerCase(ui);
    const localized = lessonChoices === META_LESSONS ? filterMetaLessonsByCompletion(META_LESSONS, completed, filter).map((lesson) => localizeMetaLesson(lesson, ui)) : lessonChoices.filter((lesson) => filter === 'all' || (filter === 'completed' ? completed.has(lesson.id) : !completed.has(lesson.id)));
    return localized
      .filter((lesson) => !search || `${lesson.text} ${lesson.note || ''}`.toLocaleLowerCase(ui).includes(search));
  }, [completed, filter, lessonChoices, query, ui]);
  const pages = Math.max(1, Math.ceil(lessons.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = lessons.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return <div className="meta-lesson-browser">
    <MetaAttribution countryCourse={lessonChoices !== META_LESSONS} />
    <label className="meta-lesson-search"><Search size={16} aria-hidden="true" /><span className="sr-only">{t('Search Meta lessons')}</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder={t('Search Meta lessons')} /></label>
    <div className="meta-lesson-browser-bar"><small className="meta-lesson-count">{lessonChoices.filter((lesson) => !completed.has(lesson.id)).length} {t('lessons remaining')}</small><div className="meta-lesson-filters" role="group" aria-label={t('Filter Meta lessons')}>{([['all', 'All'], ['unfinished', 'Not yet'], ['completed', 'Done']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} className={filter === value ? 'selected' : ''} onClick={() => { setFilter(value); setPage(0); }}>{t(label)}</button>)}</div></div>
    {visible.length ? <div className="meta-lesson-list" role="listbox" aria-label={t('Browse Meta lessons')}>
      {visible.map((lesson) => { const done = completed.has(lesson.id); return <button key={lesson.id} type="button" role="option" aria-selected={selectedId === lesson.id} className={`${done ? 'completed' : ''}${selectedId === lesson.id ? ' selected' : ''}${lesson.imageUrl ? '' : ' no-image'}`} onClick={() => onSelect(lesson.id)}>
        {lesson.imageUrl && <img src={lesson.imageUrl} alt="" loading="lazy" />}<span className="meta-lesson-copy">{lesson.section && <small>{lesson.section}</small>}<span>{lesson.text}</span>{lesson.note && <small>{lesson.note}</small>}{done && <small><CheckCircle2 size={13} aria-hidden="true" />{t('Done')}</small>}</span>{selectedId === lesson.id && <Check size={18} aria-hidden="true" />}
      </button>; })}
    </div> : <p className="meta-lesson-empty">{t('No Meta lessons match this search or filter.')}</p>}
    {pages > 1 && <div className="meta-lesson-pagination"><button type="button" className="icon-button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} aria-label={t('Previous page')} title={t('Previous page')}><ChevronLeft size={17} /></button><span>{currentPage + 1} / {pages}</span><button type="button" className="icon-button" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)} aria-label={t('Next page')} title={t('Next page')}><ChevronRight size={17} /></button></div>}
  </div>;
}
