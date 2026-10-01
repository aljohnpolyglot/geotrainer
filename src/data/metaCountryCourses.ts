import manifest from './metaCountryCoursesManifest.json';
import type { SupportedLanguage } from '../types';

export interface MetaCountryCourseSummary {
  code: string;
  name: string;
  lessonCount: number;
}

export interface MetaCountryCourseTip {
  id: string;
  section: string;
  mapUrl: string;
  image?: string;
  text: string;
  note?: string;
}

export const META_COUNTRY_COURSES = manifest as MetaCountryCourseSummary[];

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
      || (tip.note !== undefined && typeof tip.note !== 'string')) return [];
    seen.add(tip.id);
    return [{ id: tip.id, section: tip.section, mapUrl: tip.mapUrl, ...(tip.image ? { image: tip.image } : {}), text: tip.text, ...(tip.note ? { note: tip.note } : {}) }];
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
  const summary = META_COUNTRY_COURSES.find((course) => course.code === code);
  if (!summary) return Promise.reject(new Error(`Unknown Meta country course: ${code}`));
  const cacheKey = `${code}:${language}`;
  const base = import.meta.env?.BASE_URL || '/';
  let loaded = courseLoads.get(cacheKey);
  if (!loaded) {
    let source = sourceLoads.get(code);
    if (!source) {
      source = fetch(`${base}meta-courses/${encodeURIComponent(code)}.json`)
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
      try {
        const response = await fetch(`${base}meta-courses/${encodeURIComponent(code.toLowerCase())}.${language}.json`);
        if (!response.ok) return tips;
        return localizeMetaCountryCourse(code, language, tips, await response.json());
      } catch { return tips; }
    }))
      .catch((error) => {
        courseLoads.delete(cacheKey);
        throw error;
      });
    courseLoads.set(cacheKey, loaded);
  }
  return loaded;
}
