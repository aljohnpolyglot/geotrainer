import { Fragment } from 'react';
import { parseInlineMarkdown } from '../services/homeMarkdown';

function Inline({ text }: { text: string }) {
  return <>{parseInlineMarkdown(text).map((part, index) => part.strong
    ? <strong key={index}>{part.text}</strong>
    : <Fragment key={index}>{part.text}</Fragment>)}</>;
}

export function CoachRichText({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  return <span className={`coach-rich-text ${className}`.trim()}>{lines.map((line, index) => {
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const label = line.match(/^([^:]{2,32}):\s*(.+)$/);
    if (heading) return <span className={`coach-rich-heading level-${heading[1].length}`} role="heading" aria-level={Math.min(6, heading[1].length + 3)} key={index}><Inline text={heading[2]} /></span>;
    if (/^[-•]\s+/.test(line)) return <span className="coach-rich-bullet" key={index}><Inline text={line.replace(/^[-•]\s+/, '')} /></span>;
    if (label) return <span className="coach-rich-line" key={index}><strong>{label[1]}:</strong> <Inline text={label[2]} /></span>;
    return <span className="coach-rich-line" key={index}><Inline text={line} /></span>;
  })}</span>;
}
