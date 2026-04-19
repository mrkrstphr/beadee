import { marked } from 'marked';
import './MarkdownContent.css';
import DOMPurify from 'dompurify';

function renderMarkdown(text: string): string | null {
  if (typeof window === 'undefined') return null;
  const raw = marked.parse(text || '', { gfm: true, breaks: true }) as string;
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'b',
      'i',
      's',
      'del',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'ul',
      'ol',
      'li',
      'blockquote',
      'pre',
      'code',
      'a',
      'hr',
      'table',
      'thead',
      'tbody',
      'tr',
      'th',
      'td',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
    FORCE_BODY: true,
  });
}

interface MarkdownContentProps {
  text: string;
  className?: string;
}

export default function MarkdownContent({ text, className }: MarkdownContentProps) {
  const html = renderMarkdown(text);

  if (html === null) {
    return (
      <div className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
        {text}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @eslint-react/dom-no-dangerously-set-innerhtml
    <div className={`md-content ${className ?? ''}`} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
