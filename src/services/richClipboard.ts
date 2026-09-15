const clean = (value: string) => value
  .replace(/\u00a0/g, ' ')
  .replace(/[ \t]+\n/g, '\n')
  .replace(/\n{3,}/g, '\n\n')
  .trim();

export function richNodeToMarkdown(node: Node): string {
  if (node.nodeType === 3) return node.nodeValue || '';
  const content = Array.from(node.childNodes, richNodeToMarkdown).join('');
  const name = node.nodeName.toUpperCase();
  if (name === 'BR') return '\n';
  if (name === 'B' || name === 'STRONG') return `**${content.trim()}**`;
  if (/^H[1-3]$/.test(name)) return `${'#'.repeat(Number(name[1]))} ${content.trim()}\n\n`;
  if (name === 'LI') return `- ${content.trim()}\n`;
  if (['P', 'DIV', 'UL', 'OL'].includes(name)) return `${content.trim()}\n\n`;
  return content;
}

export function richClipboardHtmlToMarkdown(html: string): string {
  const document = new DOMParser().parseFromString(html, 'text/html');
  return clean(richNodeToMarkdown(document.body));
}
