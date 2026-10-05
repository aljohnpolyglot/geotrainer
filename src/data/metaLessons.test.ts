import assert from 'node:assert/strict';
import test from 'node:test';
import { filterMetaLessonsByCompletion, hasRemainingMetaLessons, localizeMetaLesson, META_LESSONS, metaReviewAid, nextMetaLesson, normalizeMetaLessons, savedMetaLessonIds, selectMetaLesson } from './metaLessons';
import translations from './metaLessonTranslations.json';

test('Meta lessons reject malformed input and avoid the current lesson', () => {
  assert.deepEqual(normalizeMetaLessons([{ id: 'broken' }, null]), []);
  assert.equal(META_LESSONS.length, 359);
  const next = nextMetaLesson(META_LESSONS[0].id, () => 0);
  assert.ok(next);
  assert.notEqual(next.id, META_LESSONS[0].id);
});

test('every Beginner lesson has a real text translation in all eight supported languages', () => {
  const languages = ['en', 'es', 'pt', 'fr', 'de', 'it', 'ru', 'sv'] as const;
  const catalog = translations as Record<string, Record<string, string>>;
  const knownIds = new Set(META_LESSONS.map(({ id }) => id));
  assert.equal(META_LESSONS.length, 359);
  assert.deepEqual(Object.keys(catalog).sort(), [...knownIds].sort());
  for (const lesson of META_LESSONS) for (const language of languages) {
    const localized = localizeMetaLesson(lesson, language);
    const translation = language === 'en' ? lesson.text : catalog[lesson.id]?.[language];
    assert.ok(translation?.trim(), `${lesson.id}:${language} is empty`);
    assert.equal(localized.text, translation, `${lesson.id}:${language} must render its stored translation`);
    assert.doesNotMatch(localized.text, /\b(?:copy|copie|copier|copia|cópia|kopiera)\b\.?\s*$/i, `${lesson.id}:${language} has a leaked copy artifact`);
    assert.doesNotMatch(localized.text, /\\u[0-9a-f]{4}|\\x[0-9a-f]{2}|Ã[\u0080-\u00ff]|Â[\u0080-\u00ff]|\uFFFD/i, `${lesson.id}:${language} has escaped or corrupted text`);
    const sourceUrls = [...lesson.text.matchAll(/https?:\/\/[^\s)]+/g)].map(([url]) => url);
    const translatedUrls = [...localized.text.matchAll(/https?:\/\/[^\s)]+/g)].map(([url]) => url);
    assert.deepEqual(translatedUrls, sourceUrls, `${lesson.id}:${language} must preserve URLs`);
    const sourceNumbers = [...lesson.text.matchAll(/\b\d+(?:[.,]\d+)?\b/g)].map(([number]) => number);
    const translatedNumbers = [...localized.text.matchAll(/\b\d+(?:[.,]\d+)?\b/g)].map(([number]) => number);
    assert.deepEqual(translatedNumbers, sourceNumbers, `${lesson.id}:${language} must preserve numeric details`);
  }
});

test('Beginner localization fails visibly instead of silently showing English', () => {
  const catalog = translations as Record<string, Record<string, string>>;
  const lesson = META_LESSONS[0];
  const spanish = catalog[lesson.id].es;
  delete catalog[lesson.id].es;
  try {
    assert.throws(() => localizeMetaLesson(lesson, 'es'), /Missing es translation for Beginner lesson/);
  } finally {
    catalog[lesson.id].es = spanish;
  }
});

test('already-localized country-course lessons pass through unchanged', () => {
  const countryLesson = { ...META_LESSONS[0], id: 'US-course-tip-1', text: 'Conseil déjà traduit.' };
  assert.equal(localizeMetaLesson(countryLesson, 'fr'), countryLesson);
});

test('Meta lessons enter My Clues only after an explicit Study save', () => {
  const ids = savedMetaLessonIds([{ source: 'review', metaLessonId: 'opened-only' }, { source: 'study', metaLessonId: 'saved' }, { source: 'study' }]);
  assert.deepEqual([...ids], ['saved']);
});

test('learner-opened Review Meta shows its full explanation before a guess', () => {
  const lesson = META_LESSONS[0];
  const aid = metaReviewAid(lesson.id, false, 'en');
  assert.equal(aid?.text, lesson.text);
  assert.equal(aid?.imageUrl, lesson.imageUrl);
});

test('completed Meta lessons are excluded and the catalog reports exhaustion', () => {
  const completed = new Set(META_LESSONS.map((lesson) => lesson.id));
  assert.equal(nextMetaLesson(undefined, () => 0, completed), undefined);
  assert.equal(hasRemainingMetaLessons(META_LESSONS.map((lesson) => ({ source: 'study' as const, metaLessonId: lesson.id }))), false);
});

test('a browsed Meta lesson can reopen when completed while a stale selection falls back', () => {
  const requested = META_LESSONS[2];
  assert.equal(selectMetaLesson(requested.id)?.id, requested.id);
  assert.equal(selectMetaLesson(requested.id, new Set([requested.id]), () => 0)?.id, requested.id);
  assert.notEqual(selectMetaLesson('missing-lesson', new Set([requested.id]), () => 0)?.id, requested.id);
});

test('Meta browse filters all, unfinished, and completed lessons', () => {
  const sample = META_LESSONS.slice(0, 3);
  const completed = new Set([sample[1].id]);
  assert.deepEqual(filterMetaLessonsByCompletion(sample, completed, 'all'), sample);
  assert.deepEqual(filterMetaLessonsByCompletion(sample, completed, 'unfinished').map((lesson) => lesson.id), [sample[0].id, sample[2].id]);
  assert.deepEqual(filterMetaLessonsByCompletion(sample, completed, 'completed').map((lesson) => lesson.id), [sample[1].id]);
});

test('time-sensitive imagery meta is explicitly marked without changing durable clues', () => {
  const temporal = META_LESSONS.filter((lesson) => lesson.temporallySensitive);
  assert.equal(temporal.length, 32);
  assert.ok(temporal.some((lesson) => /Google|Street ?View|trekker|coverage|rift|car/i.test(lesson.text)));
  assert.equal(META_LESSONS.find((lesson) => lesson.id === '3979a45f07a6c4e3')?.temporallySensitive, undefined);
});
