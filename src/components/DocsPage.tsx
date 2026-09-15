import { useEffect, useState } from 'react';
import { ArrowLeft, MapPinned, Search } from 'lucide-react';
import { useLanguagePreferences } from '../services/useLanguagePreferences';
import { arrangeGuideSections, parseHomeMarkdown, parseInlineMarkdown } from '../services/homeMarkdown';
import type { GuideBlock } from '../services/homeMarkdown';
import { translate } from '../services/language';
import type { SupportedLanguage } from '../types';
import en from '../content/home/en.md?raw';
import es from '../content/home/es.md?raw';
import pt from '../content/home/pt.md?raw';
import fr from '../content/home/fr.md?raw';
import de from '../content/home/de.md?raw';
import it from '../content/home/it.md?raw';
import ru from '../content/home/ru.md?raw';
import sv from '../content/home/sv.md?raw';
import coachStyles from '../content/coach/AI_COACH_STYLES_GUIDE.md?raw';

const detailedCoachGuide = coachStyles.split('\n').map((line) => line.startsWith('### ') ? `**${line.slice(4)}**` : line.startsWith('## ') ? `### ${line.slice(3)}` : line.startsWith('# ') ? `### ${line.slice(2)}` : line).join('\n');
const guides = { en: en.replace('\n## Saved clues', `\n${detailedCoachGuide}\n\n## Saved clues`), es, pt, fr, de, it, ru, sv };
const placements: Record<SupportedLanguage, Array<[string, string]>> = {
  en: [['Learn, Meta, and Notebook', 'Study mode']], de: [['Lernen, Meta und Notizbuch', 'Lernmodus'], ['KI-Coach-Stile und Erklärungstiefe', 'KI-Coach']],
  es: [['Aprender, Meta y Cuaderno', 'Modo Estudio'], ['Estilos y profundidad del Coach de IA', 'Entrenador de IA y pistas']], pt: [['Aprender, Meta e Caderno', 'Modo Estudo'], ['Estilos e profundidade do Coach de IA', 'Coach de IA e pistas']],
  fr: [['Apprendre, Méta et Carnet', 'Mode Étude'], ['Styles et profondeur du Coach IA', 'Coach IA et indices']], it: [['Impara, Meta e Taccuino', 'Modalità Studio'], ['Stili e profondità del Coach IA', 'Coach IA e indizi']],
  ru: [['Обучение, мета и блокнот', 'Режим изучения'], ['Стили и глубина ИИ-тренера', 'ИИ-тренер и подсказки']], sv: [['Lär, Meta och Anteckningsbok', 'Lär'], ['AI-coachstilar och förklaringsdjup', 'AI-coach och ledtrådar']],
};
const endings: Record<SupportedLanguage, string[]> = {
  en: ['Learning resources', 'Frequently asked questions', 'Suggestions and bug reports'], de: ['Lernressourcen', 'Häufige Fragen', 'Vorschläge und Fehlermeldungen'],
  es: ['Recursos de aprendizaje', 'Preguntas frecuentes', 'Sugerencias e informes de errores'], pt: ['Recursos de aprendizagem', 'Perguntas frequentes', 'Sugestões e relatos de erros'],
  fr: ['Ressources d’apprentissage', 'Questions fréquentes', 'Suggestions et signalements de bugs'], it: ['Risorse di apprendimento', 'Domande frequenti', 'Suggerimenti e segnalazioni di bug'],
  ru: ['Учебные материалы', 'Частые вопросы', 'Предложения и сообщения об ошибках'], sv: ['Lärresurser', 'Vanliga frågor', 'Förslag och felrapporter'],
};
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
  const orderedSections = arrangeGuideSections(guide.sections, placements[ui], endings[ui]);
  const visibleSections = normalizedQuery ? orderedSections.filter((section) => [section.title, ...section.subsections.map((item) => item.title)].some((value) => value.toLocaleLowerCase(ui).includes(normalizedQuery))) : orderedSections;
  useEffect(() => { document.documentElement.lang = ui; }, [ui]);
  return <main className="docs-page">
    <aside>
      <a className="docs-home" href={import.meta.env.BASE_URL}><MapPinned size={20} /><strong>GeoTrainer</strong></a>
      <label className="docs-search"><Search size={15} /><input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Search guide')} aria-label={t('Search guide')} /></label>
      <nav aria-label={t('Guide contents')}>{visibleSections.map((section) => <div className="docs-nav-group" key={section.id}><a href={`#${section.id}`}><b>{orderedSections.indexOf(section) + 1}.</b>{section.title}</a>{section.subsections.map((subsection) => <a className="docs-nav-sub" href={`#${subsection.id}`} key={subsection.id}>{subsection.title}</a>)}</div>)}</nav>
      {!visibleSections.length && <p className="docs-no-results">{t('No matching chapters')}</p>}
    </aside>
    <article>
      <a className="docs-back" href={import.meta.env.BASE_URL}><ArrowLeft size={17} />GeoTrainer</a>
      <header><h1>{guide.title}</h1><Blocks blocks={guide.introduction} /></header>
      {orderedSections.map((section) => <section id={section.id} key={section.id}><h2>{section.title}</h2><Blocks blocks={section.blocks} />{section.subsections.map((subsection) => <div className="docs-subsection" id={subsection.id} key={subsection.id}><h3>{subsection.title}</h3><Blocks blocks={subsection.blocks} /></div>)}</section>)}
    </article>
  </main>;
}
