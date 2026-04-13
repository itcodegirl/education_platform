// ═══════════════════════════════════════════════
// MARKDOWN RENDERER — Converts lesson content to JSX
// Supports: **bold**, *italic*, `code`, numbered lists, bullets
//
// SECURITY: All input is HTML-escaped BEFORE any markdown
// replacements run, so user-supplied content (notes, AI
// output, future UGC) cannot inject <script> or event
// handlers. Only our own formatting tags are added after
// escaping, so they pass through as real HTML.
// ═══════════════════════════════════════════════

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[c]);
}

export function renderMarkdown(text) {
  return String(text ?? '').split('\n\n').map((block, i) => {
    // 1. Escape first — any raw HTML in `block` becomes inert text.
    // 2. Then apply our tiny markdown grammar to the already-escaped string.
    const html = escapeHtml(block)
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="ic">$1</code>')
      .replace(/\n(\d+)\.\s/g, '<br/>$1. ')
      .replace(/\n-\s/g, '<br/>• ');
    return <p key={i} className="lp" dangerouslySetInnerHTML={{ __html: html }} />;
  });
}
