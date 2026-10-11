import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { LANGUAGE_OPTIONS } from '../services/language';
import { localizeMetaCountryCourse, META_TOPIC_COURSES, metaCourseForLesson, normalizeMetaCountryCourse } from './metaCountryCourses';
import { viewFromGoogleMapsUrl } from './metaCountryViews';

test('all GeoCoach topic lessons and their eight-language snapshots are local and playable', () => {
  assert.equal(META_TOPIC_COURSES.length, 9);
  assert.equal(META_TOPIC_COURSES.reduce((count, course) => count + course.lessonCount, 0), 375);
  for (const course of META_TOPIC_COURSES) {
    assert.match(course.sourceUrl || '', /^https:\/\/www\.geocoach\.me\/maps\//);
    assert.ok(course.creator);
    assert.ok(existsSync(`public/meta-courses/thumbnails/${course.code}.webp`));
    const source = normalizeMetaCountryCourse(course.code, JSON.parse(readFileSync(`public/meta-topics/${course.code}.json`, 'utf8')));
    assert.equal(source.length, course.lessonCount);
    for (const tip of source) {
      assert.equal(metaCourseForLesson(tip.id)?.code, course.code);
      assert.ok(viewFromGoogleMapsUrl(tip.mapUrl), `${tip.id}: missing panorama view`);
      assert.doesNotMatch(`${tip.section} ${tip.text}`, /�|<[^>]+>|https?:\/\/|\*\*/);
    }
    for (const { code } of LANGUAGE_OPTIONS) {
      if (code === 'en') continue;
      const value = JSON.parse(readFileSync(`public/meta-topics/${course.code}.${code}.json`, 'utf8'));
      const sourceHash = createHash('sha256').update(JSON.stringify(source.map(({ id, section, text }) => ({ id, section, text })))).digest('hex');
      assert.equal(value.sourceHash, sourceHash, `${course.code}/${code}: stale translation`);
      assert.deepEqual(value.tips.map((tip: { id: string }) => tip.id), source.map((tip) => tip.id));
      const localized = localizeMetaCountryCourse(course.code, code, source, value);
      assert.equal(localized.length, source.length);
      for (const tip of localized) assert.doesNotMatch(`${tip.section} ${tip.text}`, /�|\\u[0-9a-f]{4}|<[^>]+>/i);
    }
  }
});
