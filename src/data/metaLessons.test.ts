import assert from 'node:assert/strict';
import test from 'node:test';
import { localizeMetaLesson, META_LESSONS, nextMetaLesson, normalizeMetaLessons, savedMetaLessonIds } from './metaLessons';
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

test('time-sensitive imagery meta is explicitly marked without changing durable clues', () => {
  const temporal = META_LESSONS.filter((lesson) => lesson.temporallySensitive);
  assert.equal(temporal.length, 32);
  assert.ok(temporal.some((lesson) => /Google|Street ?View|trekker|coverage|rift|car/i.test(lesson.text)));
  assert.equal(META_LESSONS.find((lesson) => lesson.id === '3979a45f07a6c4e3')?.temporallySensitive, undefined);
});
