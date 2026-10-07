import { ExternalLink, Lightbulb } from 'lucide-react';
import type { MetaCountryCourseTip } from '../data/metaCountryCourses';
import { countryDisplayName, translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { CoachRichText } from './CoachRichText';
import { CountryFlag } from './CountryFlag';
import { MetaAttribution } from './MetaAttribution';

export function MetaCourseCard({ tip, courseId, position, total }: { tip: MetaCountryCourseTip; courseId: string; position: number; total: number }) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  return <div className="meta-course-stage"><article className="meta-course-card">
    <header><Lightbulb size={20} aria-hidden="true" /><span><small><CountryFlag code={courseId} /> {countryDisplayName(courseId, ui)} · {position.toLocaleString(ui)}/{total.toLocaleString(ui)}</small><h2>{tip.section}</h2></span></header>
    {tip.image && <img src={tip.image} alt={t('Meta reference clue')} />}
    <div className="meta-course-card-copy"><CoachRichText text={tip.text} />{tip.note && <aside><strong>{t('Note')}</strong><CoachRichText text={tip.note} /></aside>}</div>
    <footer><MetaAttribution countryCourse /><a href={tip.mapUrl} target="_blank" rel="noopener noreferrer"><ExternalLink size={16} />{t('Open clue in Google Maps')}</a></footer>
  </article></div>;
}
