import { marked } from 'marked'
import DOMPurify from 'dompurify'

// Configure marked: no pedantic, gfm enabled (tables, strikethrough, etc.)
marked.setOptions({ gfm: true, breaks: true })

function renderMarkdown(text) {
  if (typeof window === 'undefined') return null
  const raw = marked.parse(text || '')
  return DOMPurify.sanitize(raw, {
    ALLOWED_TAGS: [
      'p', 'br', 'strong', 'em', 'b', 'i', 's', 'del',
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'ul', 'ol', 'li',
      'blockquote', 'pre', 'code',
      'a', 'hr',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
    ],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel', 'class'],
    FORCE_BODY: true,
  })
}

export default function MarkdownContent({ text, className }) {
  const html = renderMarkdown(text)

  // SSR fallback: plain text
  if (html === null) {
    return <div className={className} style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{text}</div>
  }

  return (
    <div
      className={`md-content ${className ?? ''}`}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  )
}
