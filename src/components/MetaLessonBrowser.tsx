import { useMemo, useState } from 'react';
import { Check, ChevronLeft, ChevronRight, Search } from 'lucide-react';
import { localizeMetaLesson, META_LESSONS } from '../data/metaLessons';
import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';

const PAGE_SIZE = 20;

export function MetaLessonBrowser({ completed, selectedId, onSelect }: { completed: Set<string>; selectedId?: string; onSelect: (id: string) => void }) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(0);
  const lessons = useMemo(() => {
    const search = query.trim().toLocaleLowerCase(ui);
    return META_LESSONS.filter((lesson) => !completed.has(lesson.id)).map((lesson) => localizeMetaLesson(lesson, ui))
      .filter((lesson) => !search || `${lesson.text} ${lesson.note || ''}`.toLocaleLowerCase(ui).includes(search));
  }, [completed, query, ui]);
  const pages = Math.max(1, Math.ceil(lessons.length / PAGE_SIZE));
  const currentPage = Math.min(page, pages - 1);
  const visible = lessons.slice(currentPage * PAGE_SIZE, (currentPage + 1) * PAGE_SIZE);

  return <div className="meta-lesson-browser">
    <label className="meta-lesson-search"><Search size={16} aria-hidden="true" /><span className="sr-only">{t('Search Meta lessons')}</span><input value={query} onChange={(event) => { setQuery(event.target.value); setPage(0); }} placeholder={t('Search Meta lessons')} /></label>
    <small className="meta-lesson-count">{lessons.length} {t('lessons remaining')}</small>
    {visible.length ? <div className="meta-lesson-list" role="listbox" aria-label={t('Browse Meta lessons')}>
      {visible.map((lesson) => <button key={lesson.id} type="button" role="option" aria-selected={selectedId === lesson.id} className={selectedId === lesson.id ? 'selected' : ''} onClick={() => onSelect(lesson.id)}>
        <img src={lesson.imageUrl} alt="" loading="lazy" /><span>{lesson.text}</span>{selectedId === lesson.id && <Check size={18} aria-hidden="true" />}
      </button>)}
    </div> : <p className="meta-lesson-empty">{t('No unfinished Meta lessons match this search.')}</p>}
    {pages > 1 && <div className="meta-lesson-pagination"><button type="button" className="icon-button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} aria-label={t('Previous page')} title={t('Previous page')}><ChevronLeft size={17} /></button><span>{currentPage + 1} / {pages}</span><button type="button" className="icon-button" disabled={currentPage + 1 >= pages} onClick={() => setPage(currentPage + 1)} aria-label={t('Next page')} title={t('Next page')}><ChevronRight size={17} /></button></div>}
  </div>;
}
