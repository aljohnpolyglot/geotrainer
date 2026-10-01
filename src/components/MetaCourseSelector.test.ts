import assert from 'node:assert/strict';
import test from 'node:test';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MetaCourseSelector } from './MetaCourseSelector';
import { MetaCourseCard } from './MetaCourseCard';

test('Meta course setup shows selected country progress and a lesson without a hosted image stays readable', () => {
  const chooser = renderToStaticMarkup(createElement(MetaCourseSelector, {
    selectedCourseId: 'BW', onSelect: () => {}, completedByCourse: { beginner: 3, BW: 16 }, beginnerTotal: 359,
  }));
  assert.match(chooser, /Botswana/);
  assert.match(chooser, /16 \/ 32 lessons/);
  assert.match(chooser, /50%/);
  const lesson = renderToStaticMarkup(createElement(MetaCourseCard, {
    tip: { id: 'BW-test', section: 'Regional clues', mapUrl: 'https://goo.gl/maps/example', text: 'Look for **white sand**.', note: 'Compare the nearby hills.' },
    courseId: 'BW', position: 2, total: 32,
  }));
  assert.match(lesson, /white sand/);
  assert.match(lesson, /Compare the nearby hills/);
  assert.match(lesson, /https:\/\/goo.gl\/maps\/example/);
});
