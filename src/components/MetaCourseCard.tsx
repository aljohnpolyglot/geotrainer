import { ExternalLink, Lightbulb } from 'lucide-react';
import type { MetaCountryCourseTip } from '../data/metaCountryCourses';
import { metaCourseName } from '../data/metaCountryCourses';
import { countryDisplayName, translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { CountryFlag } from './CountryFlag';
import { MetaAttribution } from './MetaAttribution';
import { MetaReferenceText } from './MetaReferenceText';

export function MetaCourseCard({ tip, courseId, position, total }: { tip: MetaCountryCourseTip; courseId: string; position: number; total: number }) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  return <div className="meta-course-stage"><article className="meta-course-card">
    <header><Lightbulb size={20} aria-hidden="true" /><span><small>{!courseId.startsWith('geocoach-') && <CountryFlag code={courseId} />} {courseId.startsWith('geocoach-') ? metaCourseName(courseId, ui) : countryDisplayName(courseId, ui)} · {position.toLocaleString(ui)}/{total.toLocaleString(ui)}</small><h2>{tip.section}</h2></span></header>
    {tip.image && <img src={tip.image} alt={t('Meta reference clue')} />}
    <div className="meta-course-card-copy"><MetaReferenceText text={tip.text} />{tip.note && <aside><strong>{t('Note')}</strong><MetaReferenceText text={tip.note} /></aside>}</div>
    <footer><MetaAttribution countryCourse lessonId={tip.id} /><a href={tip.mapUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} />{t('Open clue in Google Maps')}</a></footer>
  </article></div>;
}
