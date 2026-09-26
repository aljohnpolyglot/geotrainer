import assert from 'node:assert/strict';
import test from 'node:test';
import { filterMetaLessonsByCompletion, hasRemainingMetaLessons, localizeMetaLesson, META_LESSONS, nextMetaLesson, normalizeMetaLessons, savedMetaLessonIds, selectMetaLesson } from './metaLessons';
import translations from './metaLessonTranslations.json';

test('Meta lessons reject malformed input and avoid the current lesson', () => {
  assert.deepEqual(normalizeMetaLessons([{ id: 'broken' }, null]), []);
  assert.equal(META_LESSONS.length, 359);
  const next = nextMetaLesson(META_LESSONS[0].id, () => 0);
  assert.ok(next);
  assert.notEqual(next.id, META_LESSONS[0].id);
});

test('every Meta lesson has localized text in all supported non-English languages', () => {
  for (const lesson of META_LESSONS) for (const language of ['es', 'pt', 'fr', 'de', 'it', 'ru', 'sv'] as const) {
    const localized = localizeMetaLesson(lesson, language);
    assert.ok(localized.text.trim());
    assert.ok((translations as Record<string, Record<string, string>>)[lesson.id]?.[language], `${lesson.id}:${language}`);
  }
});

test('Meta lessons enter My Clues only after an explicit Study save', () => {
  const ids = savedMetaLessonIds([{ source: 'review', metaLessonId: 'opened-only' }, { source: 'study', metaLessonId: 'saved' }, { source: 'study' }]);
  assert.deepEqual([...ids], ['saved']);
});

test('completed Meta lessons are excluded and the catalog reports exhaustion', () => {
  const completed = new Set(META_LESSONS.map((lesson) => lesson.id));
  assert.equal(nextMetaLesson(undefined, () => 0, completed), undefined);
  assert.equal(hasRemainingMetaLessons(META_LESSONS.map((lesson) => ({ source: 'study' as const, metaLessonId: lesson.id }))), false);
});

test('a browsed unfinished Meta lesson starts exactly while a stale selection falls back', () => {
  const requested = META_LESSONS[2];
  assert.equal(selectMetaLesson(requested.id)?.id, requested.id);
  assert.notEqual(selectMetaLesson(requested.id, new Set([requested.id]), () => 0)?.id, requested.id);
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
