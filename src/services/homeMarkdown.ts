export type GuideBlock = { type: 'paragraph' | 'quote' | 'ordered' | 'unordered' | 'table'; text?: string; items?: string[]; headers?: string[]; rows?: string[][] };
export type InlinePart = { text: string; href?: string; strong?: boolean };
export type GuideSubsection = { id: string; title: string; blocks: GuideBlock[] };
export type GuideSection = { id: string; title: string; blocks: GuideBlock[]; subsections: GuideSubsection[] };
export type HomeGuide = { title: string; introduction: GuideBlock[]; sections: GuideSection[] };

export function arrangeGuideSections<T extends { title: string }>(sections: T[], placements: Array<[string, string]>, endings: string[]): T[] {
  const ordered = placements.reduce((items, [title, after]) => {
    const from = items.findIndex((item) => item.title === title); if (from < 0) return items;
    const [section] = items.splice(from, 1); const target = items.findIndex((item) => item.title === after); items.splice(target < 0 ? items.length : target + 1, 0, section); return items;
  }, [...sections]);
  return [...ordered.filter((item) => !endings.includes(item.title)), ...endings.flatMap((title) => ordered.filter((item) => item.title === title))];
}

const id = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

export function parseInlineMarkdown(value: string): InlinePart[] {
  return value.split(/(\[[^\]]+\]\(https?:\/\/[^)]+\)|\*\*[^*]+\*\*)/g).filter(Boolean).map((part) => {
    const link = part.match(/^\[([^\]]+)\]\((https?:\/\/[^)]+)\)$/);
    return link ? { text: link[1], href: link[2] } : part.startsWith('**') && part.endsWith('**') ? { text: part.slice(2, -2), strong: true } : { text: part };
  });
}

export function parseHomeMarkdown(markdown: string): HomeGuide {
  const guide: HomeGuide = { title: '', introduction: [], sections: [] };
  let section: GuideSection | undefined;
  let subsection: GuideSubsection | undefined;
  let paragraph: string[] = [];
  let list: { type: 'ordered' | 'unordered'; items: string[] } | undefined;
  let table: { headers: string[]; rows: string[][] } | undefined;
  const blocks = () => subsection?.blocks || section?.blocks || guide.introduction;
  const flush = () => {
    if (paragraph.length) blocks().push({ type: 'paragraph', text: paragraph.join(' ') });
    if (list) blocks().push({ type: list.type, items: list.items });
    if (table) blocks().push({ type: 'table', headers: table.headers, rows: table.rows });
    paragraph = [];
    list = undefined;
    table = undefined;
  };

  for (const raw of `${markdown}\n`.split('\n')) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line === '---') { flush(); continue; }
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
    if (line.startsWith('|') && line.endsWith('|')) {
      if (paragraph.length || list) flush();
      const cells = line.slice(1, -1).split('|').map((cell) => cell.trim());
      if (!table) table = { headers: cells, rows: [] };
      else if (!cells.every((cell) => /^:?-{3,}:?$/.test(cell))) table.rows.push(cells);
      continue;
    }
    if (line.startsWith('> ')) { if (paragraph.length || list || table) flush(); blocks().push({ type: 'quote', text: line.slice(2) }); continue; }
    if (table) flush();
    paragraph.push(line);
  }
  if (!guide.title) throw new Error('Home guide needs a level-one heading.');
  return guide;
}
