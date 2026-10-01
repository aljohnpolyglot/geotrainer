import { useMemo, useState } from 'react';
import { Check, Lightbulb, Search } from 'lucide-react';
import { META_COUNTRY_COURSES } from '../data/metaCountryCourses';
import { countryDisplayName } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { getFlagCdnUrl } from '../services/geocoding';

type CourseCopy = { beginner: string; countries: string; search: string; lessons: string; empty: string; sort: string; alphabetical: string; mostLessons: string; mostComplete: string };
const COPY: Record<string, CourseCopy> = {
  en: { beginner: 'Beginner course', countries: 'Country courses', search: 'Search countries', lessons: 'lessons', empty: 'No countries match this search.', sort: 'Sort courses', alphabetical: 'Alphabetical', mostLessons: 'Most lessons', mostComplete: 'Most complete' },
  es: { beginner: 'Curso para principiantes', countries: 'Cursos por país', search: 'Buscar países', lessons: 'lecciones', empty: 'Ningún país coincide con la búsqueda.', sort: 'Ordenar cursos', alphabetical: 'Alfabético', mostLessons: 'Más lecciones', mostComplete: 'Más completados' },
  pt: { beginner: 'Curso para iniciantes', countries: 'Cursos por país', search: 'Pesquisar países', lessons: 'lições', empty: 'Nenhum país corresponde à pesquisa.', sort: 'Ordenar cursos', alphabetical: 'Alfabética', mostLessons: 'Mais lições', mostComplete: 'Mais concluídos' },
  fr: { beginner: 'Cours pour débutants', countries: 'Cours par pays', search: 'Rechercher des pays', lessons: 'leçons', empty: 'Aucun pays ne correspond à la recherche.', sort: 'Trier les cours', alphabetical: 'Alphabétique', mostLessons: 'Plus de leçons', mostComplete: 'Plus terminé' },
  de: { beginner: 'Einsteigerkurs', countries: 'Länderkurse', search: 'Länder suchen', lessons: 'Lektionen', empty: 'Keine Länder entsprechen der Suche.', sort: 'Kurse sortieren', alphabetical: 'Alphabetisch', mostLessons: 'Meiste Lektionen', mostComplete: 'Am weitesten' },
  it: { beginner: 'Corso per principianti', countries: 'Corsi per paese', search: 'Cerca paesi', lessons: 'lezioni', empty: 'Nessun paese corrisponde alla ricerca.', sort: 'Ordina corsi', alphabetical: 'Alfabetico', mostLessons: 'Più lezioni', mostComplete: 'Più completati' },
  ru: { beginner: 'Курс для начинающих', countries: 'Курсы по странам', search: 'Поиск стран', lessons: 'уроков', empty: 'Страны не найдены.', sort: 'Сортировка курсов', alphabetical: 'По алфавиту', mostLessons: 'Больше уроков', mostComplete: 'Больше завершено' },
  sv: { beginner: 'Nybörjarkurs', countries: 'Länderkurser', search: 'Sök länder', lessons: 'lektioner', empty: 'Inga länder matchar sökningen.', sort: 'Sortera kurser', alphabetical: 'Alfabetiskt', mostLessons: 'Flest lektioner', mostComplete: 'Mest klart' },
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
  const courses = useMemo(() => META_COUNTRY_COURSES.map((course) => ({
    ...course,
    localizedName: countryDisplayName(course.code, ui) || course.name,
  })).filter((course) => !query.trim() || `${course.localizedName} ${course.name} ${course.code}`.toLocaleLowerCase(ui).includes(query.trim().toLocaleLowerCase(ui)))
    .sort((a, b) => sort === 'total' ? b.lessonCount - a.lessonCount || a.localizedName.localeCompare(b.localizedName, ui) : sort === 'progress' ? ((completedByCourse[b.code] || 0) / b.lessonCount) - ((completedByCourse[a.code] || 0) / a.lessonCount) || a.localizedName.localeCompare(b.localizedName, ui) : a.localizedName.localeCompare(b.localizedName, ui)), [completedByCourse, query, sort, ui]);

  const renderCourse = (id: string, name: string, total: number, code?: string) => {
    const completed = Math.min(total, Math.max(0, completedByCourse[id] || 0));
    const percent = total ? Math.round(completed / total * 100) : 0;
    const selected = selectedCourseId === id;
    return <button key={id} type="button" className={`meta-course${selected ? ' selected' : ''}`} aria-pressed={selected} onClick={() => onSelect(id)}>
      {code ? <img className="meta-course-flag" src={getFlagCdnUrl(code, 40)} srcSet={`${getFlagCdnUrl(code, 40)} 1x, ${getFlagCdnUrl(code, 80)} 2x`} width="24" height="16" alt="" loading="lazy" referrerPolicy="no-referrer" /> : <span className="meta-course-beginner-icon" aria-hidden="true"><Lightbulb size={15} /></span>}
      <span className="meta-course-details"><span className="meta-course-name">{name}</span><span className="meta-course-progress"><span>{number.format(completed)} / {number.format(total)} {copy.lessons}</span><strong>{number.format(percent)}%</strong></span><span className="meta-course-meter" aria-hidden="true"><span style={{ width: `${percent}%` }} /></span></span>
      {selected && <Check size={17} aria-hidden="true" />}
    </button>;
  };

  return <section className="meta-course-selector" aria-label={copy.countries}>
    <div className="meta-course-fixed">
      {renderCourse('beginner', copy.beginner, beginnerTotal)}
      <h3>{copy.countries}</h3>
      <label className="meta-course-search"><Search size={16} aria-hidden="true" /><span className="sr-only">{copy.search}</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={copy.search} /></label>
      <label className="meta-course-sort"><span>{copy.sort}</span><select value={sort} onChange={(event) => setSort(event.target.value as typeof sort)}><option value="name">{copy.alphabetical}</option><option value="total">{copy.mostLessons}</option><option value="progress">{copy.mostComplete}</option></select></label>
    </div>
    <div className="meta-course-list" role="group" aria-label={copy.countries}>
      {courses.map((course) => renderCourse(course.code, course.localizedName, course.lessonCount, course.code))}
      {!courses.length && <p className="meta-course-empty">{copy.empty}</p>}
    </div>
  </section>;
}
