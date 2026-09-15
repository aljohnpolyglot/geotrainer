import { useEffect, useState } from 'react';
import { ArrowLeft, MapPinned, Search } from 'lucide-react';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { parseHomeMarkdown, parseInlineMarkdown } from '../services/homeMarkdown';
import type { GuideBlock } from '../services/homeMarkdown';
import { translate } from '../services/language';
import en from '../content/home/en.md?raw';
import es from '../content/home/es.md?raw';
import pt from '../content/home/pt.md?raw';
import fr from '../content/home/fr.md?raw';
import de from '../content/home/de.md?raw';
import it from '../content/home/it.md?raw';
import ru from '../content/home/ru.md?raw';
import sv from '../content/home/sv.md?raw';
import coachStyles from '../content/coach/AI_COACH_STYLES_GUIDE.md?raw';

const detailedCoachGuide = coachStyles.split('\n').map((line) => line.startsWith('### ') ? `**${line.slice(4)}**` : line.startsWith('## ') ? `### ${line.slice(3)}` : line.startsWith('# ') ? `## ${line.slice(2)}` : line).join('\n');
const guides = { en: `${en}\n\n${detailedCoachGuide}`, es, pt, fr, de, it, ru, sv };
const InlineText = ({ text = '' }: { text?: string }) => <>{parseInlineMarkdown(text).map((part, index) => part.href ? <a href={part.href} target="_blank" rel="noreferrer" key={index}>{part.text}</a> : part.strong ? <strong key={index}>{part.text}</strong> : part.text)}</>;
const Blocks = ({ blocks }: { blocks: GuideBlock[] }) => <>{blocks.map((block, index) => block.type === 'paragraph'
  ? <p key={index}><InlineText text={block.text} /></p>
  : block.type === 'quote' ? <blockquote key={index}><InlineText text={block.text} /></blockquote>
  : block.type === 'ordered'
    ? <ol key={index}>{block.items?.map((item) => <li key={item}><InlineText text={item} /></li>)}</ol>
    : block.type === 'unordered'
      ? <ul key={index}>{block.items?.map((item) => <li key={item}><InlineText text={item} /></li>)}</ul>
      : <div className="docs-table" key={index}><table><thead><tr>{block.headers?.map((cell) => <th key={cell}><InlineText text={cell} /></th>)}</tr></thead><tbody>{block.rows?.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={cellIndex}><InlineText text={cell} /></td>)}</tr>)}</tbody></table></div>)}</>;

export function DocsPage() {
  const { ui } = useLanguagePreferences();
  const guide = parseHomeMarkdown(guides[ui]);
  const t = (key: string) => translate(ui, key);
  const [query, setQuery] = useState('');
  const normalizedQuery = query.trim().toLocaleLowerCase(ui);
  const visibleSections = normalizedQuery ? guide.sections.filter((section) => [section.title, ...section.subsections.map((item) => item.title)].some((value) => value.toLocaleLowerCase(ui).includes(normalizedQuery))) : guide.sections;
  useEffect(() => { document.documentElement.lang = ui; }, [ui]);
  return <main className="docs-page">
    <aside>
      <a className="docs-home" href={import.meta.env.BASE_URL}><MapPinned size={20} /><strong>GeoTrainer</strong></a>
      <label className="docs-search"><Search size={15} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search guide')} aria-label={t('Search guide')} /></label>
      <nav aria-label={t('Guide contents')}>{visibleSections.map((section) => <div className="docs-nav-group" key={section.id}><a href={`#${section.id}`}><b>{guide.sections.indexOf(section) + 1}.</b>{section.title}</a>{section.subsections.map((subsection) => <a className="docs-nav-sub" href={`#${subsection.id}`} key={subsection.id}>{subsection.title}</a>)}</div>)}</nav>
      {!visibleSections.length && <p className="docs-no-results">{t('No matching chapters')}</p>}
    </aside>
    <article>
      <a className="docs-back" href={import.meta.env.BASE_URL}><ArrowLeft size={17} />GeoTrainer</a>
      <header><h1>{guide.title}</h1><Blocks blocks={guide.introduction} /></header>
      {guide.sections.map((section) => <section id={section.id} key={section.id}><h2>{section.title}</h2><Blocks blocks={section.blocks} />{section.subsections.map((subsection) => <div className="docs-subsection" id={subsection.id} key={subsection.id}><h3>{subsection.title}</h3><Blocks blocks={subsection.blocks} /></div>)}</section>)}
    </article>
  </main>;
}
