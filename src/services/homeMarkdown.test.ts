import assert from 'node:assert/strict';
import test from 'node:test';
import { arrangeGuideSections, parseHomeMarkdown, parseInlineMarkdown } from './homeMarkdown';

test('home Markdown creates navigation sections and keeps ordered steps', () => {
  const guide = parseHomeMarkdown('# Guide\n\nIntro text.\n\n## Active Recall\n\nA paragraph.\n\n### Practice\n\n- Study\n- Review');
  assert.equal(guide.title, 'Guide');
  assert.deepEqual(guide.sections, [{ id: 'active-recall', title: 'Active Recall', blocks: [{ type: 'paragraph', text: 'A paragraph.' }], subsections: [{ id: 'active-recall-practice', title: 'Practice', blocks: [{ type: 'unordered', items: ['Study', 'Review'] }] }] }]);
});

test('inline Markdown keeps external references clickable without accepting unsafe schemes', () => {
  assert.deepEqual(parseInlineMarkdown('Use [Plonk It](https://www.plonkit.net/) and [bad](javascript:alert(1)).'), [
    { text: 'Use ' }, { text: 'Plonk It', href: 'https://www.plonkit.net/' }, { text: ' and [bad](javascript:alert(1)).' },
  ]);
});

test('inline Markdown renders bold learner guidance without enabling raw HTML', () => {
  assert.deepEqual(parseInlineMarkdown('Use **visible evidence**.'), [{ text: 'Use ' }, { text: 'visible evidence', strong: true }, { text: '.' }]);
});

test('home Markdown preserves comparison tables', () => {
  const guide = parseHomeMarkdown('# Guide\n\n## Coaches\n\n| Coach | Best for |\n|---|---|\n| Quick | Play |');
  assert.deepEqual(guide.sections[0].blocks[0], { type: 'table', headers: ['Coach', 'Best for'], rows: [['Quick', 'Play']] });
});

test('guide sections keep topical placements while resources, FAQ, and contact stay last', () => {
  const sections = ['FAQ', 'Coach styles', 'Contact', 'Study', 'Resources', 'Coach'].map((title) => ({ title }));
  assert.deepEqual(arrangeGuideSections(sections, [['Coach styles', 'Coach']], ['Resources', 'FAQ', 'Contact']).map(({ title }) => title), ['Study', 'Coach', 'Coach styles', 'Resources', 'FAQ', 'Contact']);
});
