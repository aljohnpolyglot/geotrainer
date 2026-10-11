import { translate } from '../services/language';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { metaCourseForLesson } from '../data/metaCountryCourses';

export function MetaAttribution({ countryCourse, compact = false, lessonId }: { countryCourse: boolean; compact?: boolean; lessonId?: string }) {
  const { ui } = useLanguagePreferences();
  const t = (key: string) => translate(ui, key);
  const topic = lessonId && metaCourseForLesson(lessonId);
  return <small className="meta-attribution">{t('Source')}: {topic?.sourceUrl
    ? <a href={topic.sourceUrl} target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>GeoCoach · {topic.creator}</a>
    : countryCourse
    ? <a href="https://www.plonkit.net/guide" target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>Plonk It</a>
    : <a href="https://geometas.com/" target="_blank" rel="noopener noreferrer" onClick={(event) => event.stopPropagation()}>GeoMetas</a>}{!compact && <>. {t('GeoTrainer is independent; check the original guide for updates.')}</>}</small>;
}
