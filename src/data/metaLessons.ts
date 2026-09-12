import rawLessons from './metaLessons.json';
import rawTranslations from './metaLessonTranslations.json';
import type { Attempt, MetaLesson, SupportedLanguage } from '../types';

export const normalizeMetaLessons = (value: unknown): MetaLesson[] => Array.isArray(value) ? value.filter((item): item is MetaLesson => {
  if (!item || typeof item !== 'object') return false;
  const lesson = item as Partial<MetaLesson>;
  return typeof lesson.id === 'string' && typeof lesson.panoId === 'string' && Number.isFinite(lesson.lat) && Number.isFinite(lesson.lng)
    && Number.isFinite(lesson.heading) && typeof lesson.text === 'string' && typeof lesson.imageUrl === 'string';
}) : [];

export const META_LESSONS = normalizeMetaLessons(rawLessons);

export const metaLessonById = (id?: string) => id ? META_LESSONS.find((lesson) => lesson.id === id) : undefined;
export const localizeMetaLesson = (lesson: MetaLesson, language: SupportedLanguage): MetaLesson => ({ ...lesson, text: (rawTranslations as Record<string, Partial<Record<SupportedLanguage, string>>>)[lesson.id]?.[language] || lesson.text });

export const savedMetaLessonIds = (attempts: Pick<Attempt, 'source' | 'metaLessonId'>[]) => new Set(attempts.flatMap((attempt) => attempt.source === 'study' && attempt.metaLessonId ? [attempt.metaLessonId] : []));

export const metaReviewAid = (id: string | undefined, answerVisible: boolean, language: SupportedLanguage = 'en') => {
  const lesson = metaLessonById(id);
  if (!lesson) return undefined;
  const localized = localizeMetaLesson(lesson, language);
  return answerVisible ? { id: localized.id, imageUrl: localized.imageUrl, text: localized.text, note: localized.note, temporallySensitive: localized.temporallySensitive } : { id: localized.id, imageUrl: localized.imageUrl, temporallySensitive: localized.temporallySensitive };
};

export const nextMetaLesson = (currentId?: string, random = Math.random): MetaLesson | undefined => {
  const choices = currentId && META_LESSONS.length > 1 ? META_LESSONS.filter((lesson) => lesson.id !== currentId) : META_LESSONS;
  return choices[Math.floor(random() * choices.length)];
};
