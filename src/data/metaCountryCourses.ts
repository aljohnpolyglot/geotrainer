import manifest from './metaCountryCoursesManifest.json';
import topicManifest from './metaTopicCoursesManifest.json';
import type { MetaLesson, SupportedLanguage } from '../types';
import { loadMetaCountryViews, viewFromGoogleMapsUrl, type MetaMapView } from './metaCountryViews';

export interface MetaCountryCourseSummary {
  code: string;
  name: string;
  lessonCount: number;
  sourceUrl?: string;
  creator?: string;
}

export interface MetaCountryCourseTip {
  id: string;
  section: string;
  mapUrl: string;
  image?: string;
  text: string;
  note?: string;
  temporallySensitive?: boolean;
}

export const META_COUNTRY_COURSES = manifest as MetaCountryCourseSummary[];
export const META_TOPIC_COURSES = topicManifest as MetaCountryCourseSummary[];
export const META_ALL_COURSES = [...META_COUNTRY_COURSES, ...META_TOPIC_COURSES];
export const metaCourseForLesson = (id: string) => META_ALL_COURSES.find((course) => id.startsWith(`${course.code}-`));
const TOPIC_NAMES: Record<string, Record<SupportedLanguage, string>> = {
  'geocoach-plates': { en: 'US license plates', es: 'Matrículas de EE. UU.', pt: 'Matrículas dos EUA', fr: 'Plaques des États-Unis', de: 'US-Kennzeichen', it: 'Targhe degli Stati Uniti', ru: 'Номерные знаки США', sv: 'Registreringsskyltar i USA' },
  'geocoach-bollards': { en: 'World bollards', es: 'Bolardos del mundo', pt: 'Balizadores do mundo', fr: 'Balises du monde', de: 'Leitpfosten weltweit', it: 'Delineatori nel mondo', ru: 'Дорожные столбики мира', sv: 'Vägstolpar i världen' },
  'geocoach-latin-america': { en: 'Identify Latin America', es: 'Identificar Latinoamérica', pt: 'Identificar a América Latina', fr: 'Reconnaître l’Amérique latine', de: 'Lateinamerika erkennen', it: 'Riconoscere l’America Latina', ru: 'Как узнать Латинскую Америку', sv: 'Känn igen Latinamerika' },
  'geocoach-pedestrian-signs': { en: 'European pedestrian signs', es: 'Señales peatonales europeas', pt: 'Sinais de pedestres europeus', fr: 'Panneaux piétons européens', de: 'Europäische Fußgängerschilder', it: 'Segnali pedonali europei', ru: 'Пешеходные знаки Европы', sv: 'Europeiska gångskyltar' },
  'geocoach-google-cars': { en: 'World Google cars', es: 'Coches de Google del mundo', pt: 'Carros do Google pelo mundo', fr: 'Voitures Google dans le monde', de: 'Google-Autos weltweit', it: 'Auto Google nel mondo', ru: 'Автомобили Google в мире', sv: 'Google-bilar i världen' },
  'geocoach-baltics': { en: 'Identify the Baltics', es: 'Distinguir los países bálticos', pt: 'Identificar os países bálticos', fr: 'Reconnaître les pays baltes', de: 'Baltikum erkennen', it: 'Riconoscere i Paesi baltici', ru: 'Как различать страны Балтии', sv: 'Känn igen Baltikum' },
  'geocoach-malaysia-indonesia': { en: 'Malaysia vs Indonesia', es: 'Malasia o Indonesia', pt: 'Malásia ou Indonésia', fr: 'Malaisie ou Indonésie', de: 'Malaysia oder Indonesien', it: 'Malesia o Indonesia', ru: 'Малайзия или Индонезия', sv: 'Malaysia eller Indonesien' },
  'geocoach-south-asia-languages': { en: 'Languages of South Asia', es: 'Lenguas del sur de Asia', pt: 'Línguas do Sul da Ásia', fr: 'Langues d’Asie du Sud', de: 'Sprachen Südasiens', it: 'Lingue dell’Asia meridionale', ru: 'Языки Южной Азии', sv: 'Språk i Sydasien' },
  'geocoach-usa-bollards': { en: 'US roadside posts', es: 'Postes de carretera de EE. UU.', pt: 'Balizadores rodoviários dos EUA', fr: 'Balises routières des États-Unis', de: 'US-Leitpfosten', it: 'Delineatori stradali degli USA', ru: 'Дорожные столбики США', sv: 'Vägstolpar i USA' },
};
export const metaCourseName = (code: string, language: SupportedLanguage) => TOPIC_NAMES[code]?.[language]
  || META_COUNTRY_COURSES.find((course) => course.code === code)?.name || code;

export function normalizeMetaCountryCourse(code: string, value: unknown): MetaCountryCourseTip[] {
  if (!value || typeof value !== 'object' || (value as { code?: unknown }).code !== code || !Array.isArray((value as { tips?: unknown }).tips)) return [];
  const seen = new Set<string>();
  return (value as { tips: unknown[] }).tips.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const tip = item as Partial<MetaCountryCourseTip>;
    if (typeof tip.id !== 'string' || !tip.id.startsWith(`${code}-`) || seen.has(tip.id)
      || typeof tip.section !== 'string' || !tip.section.trim()
      || typeof tip.mapUrl !== 'string' || !/^https?:\/\//i.test(tip.mapUrl)
      || typeof tip.text !== 'string' || !tip.text.trim()
      || (tip.image !== undefined && (typeof tip.image !== 'string' || !/^meta-courses\/images\/[A-Za-z0-9._-]+$/.test(tip.image)))
      || (tip.note !== undefined && typeof tip.note !== 'string')
      || (tip.temporallySensitive !== undefined && typeof tip.temporallySensitive !== 'boolean')) return [];
    seen.add(tip.id);
    return [{ id: tip.id, section: tip.section, mapUrl: tip.mapUrl, ...(tip.image ? { image: tip.image } : {}), text: tip.text, ...(tip.note ? { note: tip.note } : {}), ...(tip.temporallySensitive ? { temporallySensitive: true } : {}) }];
  });
}

export function localizeMetaCountryCourse(code: string, language: SupportedLanguage, tips: MetaCountryCourseTip[], value: unknown): MetaCountryCourseTip[] {
  if (!value || typeof value !== 'object' || (value as { code?: unknown }).code !== code
    || (value as { language?: unknown }).language !== language || !Array.isArray((value as { tips?: unknown }).tips)) {
    throw new Error(`Invalid Meta country course translation: ${code}/${language}`);
  }
  const sourceById = new Map(tips.map((tip) => [tip.id, tip]));
  const localized = new Map<string, { section: string; text: string; note?: string }>();
  for (const item of (value as { tips: unknown[] }).tips) {
    if (!item || typeof item !== 'object') throw new Error(`Invalid Meta country course translation: ${code}/${language}`);
    const row = item as { id?: unknown; section?: unknown; text?: unknown; note?: unknown };
    if (typeof row.id !== 'string' || typeof row.section !== 'string' || !row.section.trim()
      || typeof row.text !== 'string' || !row.text.trim() || (row.note !== undefined && typeof row.note !== 'string')) {
      throw new Error(`Invalid Meta country course translation: ${code}/${language}`);
    }
    const source = sourceById.get(row.id) ?? tips.find((tip) => tip.id.endsWith(`-${row.id}`));
    if (!source || localized.has(source.id) || (source.note && (typeof row.note !== 'string' || !row.note.trim()))) {
      throw new Error(`Incomplete Meta country course translation: ${code}/${language}`);
    }
    localized.set(source.id, { section: row.section, text: row.text, ...(typeof row.note === 'string' && row.note ? { note: row.note } : {}) });
  }
  if (localized.size !== tips.length) throw new Error(`Incomplete Meta country course translation: ${code}/${language}`);
  return tips.map((tip) => ({ ...tip, ...localized.get(tip.id)! }));
}

const sourceLoads = new Map<string, Promise<MetaCountryCourseTip[]>>();
const courseLoads = new Map<string, Promise<MetaCountryCourseTip[]>>();

export function loadMetaCountryCourse(code: string, language: SupportedLanguage = 'en'): Promise<MetaCountryCourseTip[]> {
  const summary = META_ALL_COURSES.find((course) => course.code === code);
  if (!summary) return Promise.reject(new Error(`Unknown Meta country course: ${code}`));
  const cacheKey = `${code}:${language}`;
  const base = import.meta.env?.BASE_URL || '/';
  const directory = summary.sourceUrl ? 'meta-topics' : 'meta-courses';
  let loaded = courseLoads.get(cacheKey);
  if (!loaded) {
    let source = sourceLoads.get(code);
    if (!source) {
      source = fetch(`${base}${directory}/${encodeURIComponent(code)}.json`)
        .then((response) => {
          if (!response.ok) throw new Error(`Could not load Meta country course: ${code}`);
          return response.json();
        })
        .then((value) => {
          const tips = normalizeMetaCountryCourse(code, value);
          if (tips.length !== summary.lessonCount) throw new Error(`Invalid Meta country course data: ${code}`);
          return tips.map((tip) => tip.image?.startsWith('meta-courses/')
            ? { ...tip, image: `${base}${tip.image}` }
            : tip);
        })
        .catch((error) => {
          sourceLoads.delete(code);
          throw error;
        });
      sourceLoads.set(code, source);
    }
    loaded = (language === 'en' ? source : source.then(async (tips) => {
      const filename = summary.sourceUrl ? code : code.toLowerCase();
      const response = await fetch(`${base}${directory}/${encodeURIComponent(filename)}.${language}.json`);
      if (!response.ok) throw new Error(`Could not load Meta country course translation: ${code}/${language}`);
      return localizeMetaCountryCourse(code, language, tips, await response.json());
    }))
      .catch((error) => {
        courseLoads.delete(cacheKey);
        throw error;
      });
    courseLoads.set(cacheKey, loaded);
  }
  return loaded;
}

export function savedMetaCountryLesson(tip: MetaCountryCourseTip, fallback?: MetaMapView): MetaLesson {
  const view = viewFromGoogleMapsUrl(tip.mapUrl) || fallback;
  return { id: tip.id, panoId: view?.panoId || '', lat: view?.lat || 0, lng: view?.lng || 0, heading: view?.heading || 0, pitch: view?.pitch || 0, imageUrl: tip.image || '', text: tip.text, note: tip.note, section: tip.section, mapUrl: tip.mapUrl, temporallySensitive: tip.temporallySensitive };
}

export async function loadSavedMetaCountryLessons(code: string, language: SupportedLanguage): Promise<MetaLesson[]> {
  const [tips, views] = await Promise.all([loadMetaCountryCourse(code, language), loadMetaCountryViews(code)]);
  return tips.map((tip) => savedMetaCountryLesson(tip, views.get(tip.id)));
}
