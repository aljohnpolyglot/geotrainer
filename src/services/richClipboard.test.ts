import assert from 'node:assert/strict';
import test from 'node:test';
import { richNodeToMarkdown } from './richClipboard';

const node = (nodeName: string, ...childNodes: Node[]) => ({ nodeType: 1, nodeName, nodeValue: null, childNodes }) as unknown as Node;
const text = (nodeValue: string) => ({ nodeType: 3, nodeName: '#text', nodeValue, childNodes: [] }) as unknown as Node;

test('converts pasted headings, bold text, and lists to safe Markdown', () => {
  const root = node('BODY',
    node('H2', text('Luxembourg evidence')),
    node('P', text('The '), node('STRONG', text('roof and dormer')), text(' carry the comparison.')),
    node('UL', node('LI', node('STRONG', text('Confuser:')), text(' Belgium')), node('LI', text('Check plate colour'))),
  );

  assert.equal(richNodeToMarkdown(root).trim(), '## Luxembourg evidence\n\nThe **roof and dormer** carry the comparison.\n\n- **Confuser:** Belgium\n- Check plate colour');
});
