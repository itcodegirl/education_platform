// ═══════════════════════════════════════════════
// MARKDOWN RENDERER — Converts lesson content to JSX
// Supports: **bold**, *italic*, `code`, numbered lists, bullets
// ═══════════════════════════════════════════════

export function renderMarkdown(text) {
  return text.split('\n\n').map((block, i) => {
    let html = block
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="ic">$1</code>')
      .replace(/\n(\d+)\.\s/g, '<br/>$1. ')
      .replace(/\n-\s/g, '<br/>• ');
    return <p key={i} className="lp" dangerouslySetInnerHTML={{ __html: html }} />;
  });
}
