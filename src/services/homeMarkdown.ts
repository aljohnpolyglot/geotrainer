export type GuideBlock = { type: 'paragraph' | 'ordered' | 'unordered'; text?: string; items?: string[] };
export type InlinePart = { text: string; href?: string };
export type GuideSubsection = { id: string; title: string; blocks: GuideBlock[] };
export type GuideSection = { id: string; title: string; blocks: GuideBlock[]; subsections: GuideSubsection[] };
export type HomeGuide = { title: string; introduction: GuideBlock[]; sections: GuideSection[] };

const id = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function parseInlineMarkdown(value: string): InlinePart[] {
  return value.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\))/g).filter(Boolean).map((part) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    return link ? { text: link[1], href: link[2] } : { text: part };
  });
}

export function parseHomeMarkdown(markdown: string): HomeGuide {
  const guide: HomeGuide = { title: '', introduction: [], sections: [] };
  let section: GuideSection | undefined;
  let subsection: GuideSubsection | undefined;
  let paragraph: string[] = [];
  let list: { type: 'ordered' | 'unordered'; items: string[] } | undefined;
  const blocks = () => subsection?.blocks || section?.blocks || guide.introduction;
  const flush = () => {
    if (paragraph.length) blocks().push({ type: 'paragraph', text: paragraph.join(' ') });
    if (list) blocks().push({ type: list.type, items: list.items });
    paragraph = [];
    list = undefined;
  };

  for (const raw of `${markdown}\n`.split('\n')) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith('# ')) { flush(); guide.title = line.slice(2).trim(); continue; }
    if (line.startsWith('## ')) {
      flush();
      const title = line.slice(3).trim();
      section = { id: id(title), title, blocks: [], subsections: [] };
      guide.sections.push(section);
      subsection = undefined;
      continue;
    }
    if (line.startsWith('### ') && section) {
      flush();
      const title = line.slice(4).trim();
      subsection = { id: `${section.id}-${id(title)}`, title, blocks: [] };
      section.subsections.push(subsection);
      continue;
    }
    const item = line.match(/^(\d+\.|[-*])\s+(.+)$/);
    if (item) {
      if (paragraph.length) flush();
      const type = item[1].endsWith('.') ? 'ordered' : 'unordered';
      if (list?.type !== type) { flush(); list = { type, items: [] }; }
      list.items.push(item[2]);
      continue;
    }
    paragraph.push(line);
  }
  if (!guide.title) throw new Error('Home guide needs a level-one heading.');
  return guide;
}
