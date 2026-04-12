// ═══════════════════════════════════════════════
// MARKDOWN RENDERER — Converts lesson content to JSX
// Supports: **bold**, *italic*, `code`, numbered lists, bullets
//
// Output is sanitized with DOMPurify before being injected into the DOM
// to prevent XSS from any dynamic or user-authored lesson content.
// ═══════════════════════════════════════════════

import DOMPurify from 'dompurify';

// Only allow the tags/attributes we actually emit below.
const SANITIZE_CONFIG = {
  ALLOWED_TAGS: ['strong', 'em', 'code', 'br'],
  ALLOWED_ATTR: ['class'],
};

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function renderMarkdown(text) {
  return text.split('\n\n').map((block, i) => {
    // Escape first so raw HTML in the source is rendered as text, not markup.
    const escaped = escapeHtml(block);
    const html = escaped
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="ic">$1</code>')
      .replace(/\n(\d+)\.\s/g, '<br/>$1. ')
      .replace(/\n-\s/g, '<br/>• ');
    const clean = DOMPurify.sanitize(html, SANITIZE_CONFIG);
    return <p key={i} className="lp" dangerouslySetInnerHTML={{ __html: clean }} />;
  });
}
