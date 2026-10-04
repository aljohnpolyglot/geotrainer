import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { LANGUAGE_OPTIONS } from '../services/language';
import { localizeMetaCountryCourse, META_COUNTRY_COURSES, normalizeMetaCountryCourse } from './metaCountryCourses';

test('every country lesson has complete text, notes, and headings in every app language', () => {
  const problems: string[] = [];
  let translated = 0;
  for (const course of META_COUNTRY_COURSES) {
    const source = normalizeMetaCountryCourse(course.code, JSON.parse(readFileSync(`public/meta-courses/${course.code}.json`, 'utf8')));
    assert.equal(source.length, course.lessonCount);
    for (const { code: language } of LANGUAGE_OPTIONS) {
      if (language === 'en') continue;
      const name = `${course.code.toLowerCase()}.${language}.json`;
      try {
        const value = JSON.parse(readFileSync(`public/meta-courses/${name}`, 'utf8'));
        const localized = localizeMetaCountryCourse(course.code, language, source, value);
        for (const tip of localized) {
          const text = `${tip.section}\n${tip.text}\n${tip.note || ''}`;
          assert.doesNotMatch(text, /\\u[0-9a-f]{4}|�|Ã[\u0080-\u00bf]|Â[\u0080-\u00bf]/i, `${name}:${tip.id}: encoding`);
          assert.doesNotMatch(text, /QXZKEEP\d+ZQX/, `${name}:${tip.id}: unresolved translation token`);
          const original = source.find((item) => item.id === tip.id)!;
          assert.notEqual(tip.text.trim(), original.text.trim(), `${name}:${tip.id}: untranslated explanation`);
          if (original.section !== 'Kampala') assert.notEqual(tip.section.trim(), original.section.trim(), `${name}:${tip.id}: untranslated heading`);
          const links = (body: string) => [...body.matchAll(/\]\((https?:\/\/[^)]+)\)/g)].map((match) => match[1]);
          assert.deepEqual(links(tip.text), links(original.text), `${name}:${tip.id}: text links`);
          assert.deepEqual(links(tip.note || ''), links(original.note || ''), `${name}:${tip.id}: note links`);
        }
        translated += localized.length;
      } catch (error) { problems.push(`${name}: ${error instanceof Error ? error.message.split('\n')[0] : 'invalid translation'}`); }
    }
  }
  assert.equal(problems.length, 0, `Missing or invalid Meta translation files (${problems.length}): ${problems.slice(0, 20).join(', ')}`);
  assert.equal(translated, META_COUNTRY_COURSES.reduce((total, course) => total + course.lessonCount, 0) * (LANGUAGE_OPTIONS.length - 1));
});
