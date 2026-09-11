import assert from 'node:assert/strict';
import test from 'node:test';
import { parseHomeMarkdown, parseInlineMarkdown } from './homeMarkdown';

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
