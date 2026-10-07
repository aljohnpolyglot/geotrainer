import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MetaCourseSelector } from './MetaCourseSelector';
import { MetaCourseCard } from './MetaCourseCard';
import { MetaLessonBrowser } from './MetaLessonBrowser';
import { MetaAttribution } from './MetaAttribution';

test('Meta course setup shows selected country progress and a lesson without a hosted image stays readable', () => {
  const chooser = renderToStaticMarkup(createElement(MetaCourseSelector, {
    selectedCourseId: 'BW', onSelect: () => {}, completedByCourse: { beginner: 3, BW: 16 }, beginnerTotal: 359,
  }));
  assert.match(chooser, /Botswana/);
  assert.match(chooser, /16 \/ 32 lessons/);
  assert.match(chooser, /50%/);
  assert.match(chooser, /Most lessons/);
  assert.match(chooser, /Most complete/);
  const lesson = renderToStaticMarkup(createElement(MetaCourseCard, {
    tip: { id: 'BW-test', section: 'Regional clues', mapUrl: 'https://goo.gl/maps/example', text: 'Look for **white sand**.', note: 'Compare the nearby hills.' },
    courseId: 'BW', position: 2, total: 32,
  }));
  assert.match(lesson, /white sand/);
  assert.match(lesson, /Compare the nearby hills/);
  assert.match(lesson, /https:\/\/goo.gl\/maps\/example/);
});

test('Meta lesson browser supports localized country-course lesson choices', () => {
  const browser = renderToStaticMarkup(createElement(MetaLessonBrowser, {
    completed: new Set<string>(),
    selectedId: 'SE-1',
    onSelect: () => {},
    lessons: [{ id: 'SE-1', section: 'Road signs', text: 'Compare the sign shape.', note: 'Check the border.' }],
  }));
  assert.match(browser, /Road signs/);
  assert.match(browser, /Compare the sign shape/);
  assert.match(browser, /Check the border/);
  assert.match(browser, /aria-selected="true"/);
  const completed = renderToStaticMarkup(createElement(MetaLessonBrowser, { completed: new Set(['SE-1']), selectedId: 'SE-1', onSelect: () => {}, lessons: [{ id: 'SE-1', text: 'Seen clue' }] }));
  assert.match(completed, /aria-selected="true"/);
  assert.doesNotMatch(completed, /aria-disabled/);
});

test('Meta attribution names the correct external guides for each course', () => {
  const beginner = renderToStaticMarkup(createElement(MetaAttribution, { countryCourse: false }));
  const country = renderToStaticMarkup(createElement(MetaAttribution, { countryCourse: true }));
  assert.match(beginner, /geometas\.com/);
  assert.doesNotMatch(beginner, /openguessr\.com/);
  assert.doesNotMatch(beginner, /plonkit\.net/);
  assert.match(country, /plonkit\.net/);
  assert.doesNotMatch(country, /geometas\.com/);
  assert.match(country, /GeoTrainer is independent/);
});
