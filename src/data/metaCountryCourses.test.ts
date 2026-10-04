import assert from 'node:assert/strict';
import test from 'node:test';
import { loadMetaCountryCourse, localizeMetaCountryCourse, META_COUNTRY_COURSES, normalizeMetaCountryCourse } from './metaCountryCourses';

test('country course catalog excludes non-countries and rejects malformed or duplicate tips', () => {
  assert.equal(META_COUNTRY_COURSES.length, 131);
  assert.equal(META_COUNTRY_COURSES.reduce((sum, course) => sum + course.lessonCount, 0), 4542);
  assert.ok(META_COUNTRY_COURSES.every(({ code, name, lessonCount }) => /^[A-Z]{2}$/.test(code) && name && lessonCount > 0));

  const valid = { id: 'US-a1', section: 'Road signs', mapUrl: 'https://maps.google.com/x', text: 'Look for this sign.' };
  assert.deepEqual(normalizeMetaCountryCourse('US', { code: 'US', tips: [valid, valid, { ...valid, id: 'US-b2', image: 'file://image' }, { ...valid, id: 'US-b3', image: 'https://www.plonkit.net/image.png' }, null] }), [valid]);
  assert.deepEqual(normalizeMetaCountryCourse('US', { code: 'US', tips: [{ ...valid, image: 'meta-courses/images/abc.webp' }] }), [{ ...valid, image: 'meta-courses/images/abc.webp' }]);
  assert.deepEqual(normalizeMetaCountryCourse('US', null), []);
  assert.deepEqual(localizeMetaCountryCourse('US', 'es', [valid], { code: 'US', language: 'es', tips: [{ id: 'a1', section: 'Señales', text: 'Mira la señal.' }] }), [{ ...valid, section: 'Señales', text: 'Mira la señal.' }]);
  assert.throws(() => localizeMetaCountryCourse('US', 'es', [valid], { code: 'US', language: 'es', tips: [] }), /Incomplete/);
});

test('missing country translation rejects without caching an English fallback and can retry', async () => {
  const course = META_COUNTRY_COURSES[0];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (input) => String(input).endsWith(`/${course.code}.json`)
    ? new Response(JSON.stringify({ code: course.code, tips: Array.from({ length: course.lessonCount }, (_, index) => ({ id: `${course.code}-${index}`, section: 'Roads', mapUrl: 'https://maps.google.com/maps', text: `Clue ${index}` })) }))
    : new Response('', { status: 404 });
  try {
    await assert.rejects(loadMetaCountryCourse(course.code, 'fr'), /Could not load.*translation/);
    globalThis.fetch = async () => new Response(JSON.stringify({ code: course.code, language: 'fr', tips: Array.from({ length: course.lessonCount }, (_, index) => ({ id: `${course.code}-${index}`, section: 'Routes', text: `Indice ${index}` })) }));
    const tips = await loadMetaCountryCourse(course.code, 'fr');
    assert.equal(tips.length, course.lessonCount);
    assert.equal(tips[0].text, 'Indice 0');
  } finally { globalThis.fetch = originalFetch; }
});
