import { useMemo, useState } from 'react';
import { Check, Search } from 'lucide-react';
import { META_COUNTRY_COURSES, META_TOPIC_COURSES, metaCourseName } from '../data/metaCountryCourses';
import { countryDisplayName } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { getFlagCdnUrl } from '../services/geocoding';

type CourseCopy = { beginner: string; topics: string; countries: string; search: string; lessons: string; empty: string; sort: string; alphabetical: string; mostLessons: string; mostComplete: string };
const COPY: Record<string, CourseCopy> = {
  en: { beginner: 'Beginner course', topics: 'Topic courses', countries: 'Country courses', search: 'Search courses', lessons: 'lessons', empty: 'No courses match this search.', sort: 'Sort courses', alphabetical: 'Alphabetical', mostLessons: 'Most lessons', mostComplete: 'Most complete' },
  es: { beginner: 'Curso para principiantes', topics: 'Cursos por tema', countries: 'Cursos por país', search: 'Buscar cursos', lessons: 'lecciones', empty: 'Ningún curso coincide con la búsqueda.', sort: 'Ordenar cursos', alphabetical: 'Alfabético', mostLessons: 'Más lecciones', mostComplete: 'Más completados' },
  pt: { beginner: 'Curso para iniciantes', topics: 'Cursos por tema', countries: 'Cursos por país', search: 'Pesquisar cursos', lessons: 'lições', empty: 'Nenhum curso corresponde à pesquisa.', sort: 'Ordenar cursos', alphabetical: 'Alfabética', mostLessons: 'Mais lições', mostComplete: 'Mais concluídos' },
  fr: { beginner: 'Cours pour débutants', topics: 'Cours thématiques', countries: 'Cours par pays', search: 'Rechercher des cours', lessons: 'leçons', empty: 'Aucun cours ne correspond à la recherche.', sort: 'Trier les cours', alphabetical: 'Alphabétique', mostLessons: 'Plus de leçons', mostComplete: 'Plus terminé' },
  de: { beginner: 'Einsteigerkurs', topics: 'Themenkurse', countries: 'Länderkurse', search: 'Kurse suchen', lessons: 'Lektionen', empty: 'Keine Kurse entsprechen der Suche.', sort: 'Kurse sortieren', alphabetical: 'Alphabetisch', mostLessons: 'Meiste Lektionen', mostComplete: 'Am weitesten' },
  it: { beginner: 'Corso per principianti', topics: 'Corsi tematici', countries: 'Corsi per paese', search: 'Cerca corsi', lessons: 'lezioni', empty: 'Nessun corso corrisponde alla ricerca.', sort: 'Ordina corsi', alphabetical: 'Alfabetico', mostLessons: 'Più lezioni', mostComplete: 'Più completati' },
  ru: { beginner: 'Курс для начинающих', topics: 'Тематические курсы', countries: 'Курсы по странам', search: 'Поиск курсов', lessons: 'уроков', empty: 'Курсы не найдены.', sort: 'Сортировка курсов', alphabetical: 'По алфавиту', mostLessons: 'Больше уроков', mostComplete: 'Больше завершено' },
  sv: { beginner: 'Nybörjarkurs', topics: 'Temakurser', countries: 'Länderkurser', search: 'Sök kurser', lessons: 'lektioner', empty: 'Inga kurser matchar sökningen.', sort: 'Sortera kurser', alphabetical: 'Alfabetiskt', mostLessons: 'Flest lektioner', mostComplete: 'Mest klart' },
};

export function MetaCourseSelector({ selectedCourseId, onSelect, completedByCourse, beginnerTotal }: {
  selectedCourseId: string;
  onSelect: (id: string) => void;
  completedByCourse: Record<string, number>;
  beginnerTotal: number;
}) {
  const { ui } = useLanguagePreferences();
  const copy = COPY[ui] || COPY.en;
  const number = new Intl.NumberFormat(ui);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<'name' | 'total' | 'progress'>('name');
  const search = query.trim().toLocaleLowerCase(ui);
  const beginnerMatches = copy.beginner.toLocaleLowerCase(ui).includes(search);
  const topics = META_TOPIC_COURSES.filter((course) => `${metaCourseName(course.code, ui)} ${course.name}`.toLocaleLowerCase(ui).includes(search));
  const courses = useMemo(() => META_COUNTRY_COURSES.map((course) => ({
    ...course,
    localizedName: countryDisplayName(course.code, ui) || course.name,
  })).filter((course) => `${course.localizedName} ${course.name} ${course.code}`.toLocaleLowerCase(ui).includes(search))
    .sort((a, b) => sort === 'total' ? b.lessonCount - a.lessonCount || a.localizedName.localeCompare(b.localizedName, ui) : sort === 'progress' ? ((completedByCourse[b.code] || 0) / b.lessonCount) - ((completedByCourse[a.code] || 0) / a.lessonCount) || a.localizedName.localeCompare(b.localizedName, ui) : a.localizedName.localeCompare(b.localizedName, ui)), [completedByCourse, search, sort, ui]);

  const renderCourse = (id: string, name: string, total: number, code?: string) => {
    const completed = Math.min(total, Math.max(0, completedByCourse[id] || 0));
    const percent = total ? Math.round(completed / total * 100) : 0;
    const selected = selectedCourseId === id;
    return <button key={id} type="button" className={`meta-course${selected ? ' selected' : ''}`} aria-pressed={selected} onClick={() => onSelect(id)}>
      {code ? <img className="meta-course-flag" src={getFlagCdnUrl(code, 40)} srcSet={`${getFlagCdnUrl(code, 40)} 1x, ${getFlagCdnUrl(code, 80)} 2x`} width="24" height="16" alt="" loading="lazy" referrerPolicy="no-referrer" /> : <img className="meta-course-thumbnail" src={`${import.meta.env?.BASE_URL || '/'}meta-courses/thumbnails/${id}.webp`} width="64" height="52" alt="" loading="lazy" />}
      <span className="meta-course-details"><span className="meta-course-name">{name}</span><span className="meta-course-progress"><span>{number.format(completed)} / {number.format(total)} {copy.lessons}</span><strong>{number.format(percent)}%</strong></span><span className="meta-course-meter" aria-hidden="true"><span style={{ width: `${percent}%` }} /></span></span>
      {selected && <Check size={17} aria-hidden="true" />}
    </button>;
  };

  return <section className="meta-course-selector">
    <div className="meta-course-fixed">
      {beginnerMatches && renderCourse('beginner', copy.beginner, beginnerTotal)}
      <label className="meta-course-search"><Search size={16} aria-hidden="true" /><span className="sr-only">{copy.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label>
      {topics.length > 0 && <><h3>{copy.topics}</h3><div className="meta-topic-course-list">{topics.map((course) => renderCourse(course.code, metaCourseName(course.code, ui), course.lessonCount))}</div></>}
      {courses.length > 0 && <><h3>{copy.countries}</h3><label className="meta-course-sort"><span>{copy.sort}</span><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="name">{copy.alphabetical}</option><option value="total">{copy.mostLessons}</option><option value="progress">{copy.mostComplete}</option></select></label></>}
    </div>
    <div className="meta-course-list" role="group" aria-label={copy.countries}>
      {courses.map((course) => renderCourse(course.code, course.localizedName, course.lessonCount, course.code))}
      {!beginnerMatches && !courses.length && !topics.length && <p className="meta-course-empty">{copy.empty}</p>}
    </div>
  </section>;
}
