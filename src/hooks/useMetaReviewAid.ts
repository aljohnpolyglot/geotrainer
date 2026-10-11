import { useEffect, useState } from 'react';
import { metaCourseForLesson, loadMetaCountryCourse } from '../data/metaCountryCourses';
import { metaReviewAid } from '../data/metaLessons';
import type { SupportedLanguage } from '../types';
import type { MetaAid } from '../components/LearningAids';

export function useMetaReviewAid(id: string | undefined, language: SupportedLanguage): MetaAid | undefined {
  const [countryAid, setCountryAid] = useState<{ language: SupportedLanguage; aid: MetaAid }>();
  useEffect(() => {
    setCountryAid(undefined);
    const code = id && metaCourseForLesson(id)?.code;
    if (!code) return;
    let active = true;
    void loadMetaCountryCourse(code!, language).then((tips) => {
      const tip = tips.find((item) => item.id === id);
      if (active && tip) setCountryAid({ language, aid: { id: tip.id, imageUrl: tip.image, text: tip.text, note: tip.note, section: tip.section, mapUrl: tip.mapUrl, temporallySensitive: tip.temporallySensitive } });
    }).catch(() => {});
    return () => { active = false; };
  }, [id, language]);
  return metaReviewAid(id, true, language) || (countryAid?.language === language && countryAid.aid.id === id ? countryAid.aid : undefined);
}
