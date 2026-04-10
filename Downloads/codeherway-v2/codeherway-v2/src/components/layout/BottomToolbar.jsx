// ═══════════════════════════════════════════════
// BOTTOM TOOLBAR — Floating tool buttons (memoized)
// ═══════════════════════════════════════════════

import { memo } from 'react';
import { useProgress } from '../../context/ProgressContext';

export const BottomToolbar = memo(function BottomToolbar({ onCheatsheet, onGlossary, onProjects, onBadges, onSR, onBookmarks, onChallenges, onStats }) {
  const { getDueSRCards, bookmarks } = useProgress();
  const dueCount = getDueSRCards().length;

  return (
    <nav className="bottom-tools" aria-label="Learning tools">
      <button type="button" className="tool-btn" title="Your Stats" aria-label="Your Stats" onClick={onStats}>📊</button>
      <button type="button" className="tool-btn" title="Bookmarks" aria-label={`Bookmarks${bookmarks.length > 0 ? ` (${bookmarks.length})` : ''}`} onClick={onBookmarks}>
        ★
        {bookmarks.length > 0 && <span className="badge-notif bk-notif" aria-hidden="true">{bookmarks.length}</span>}
      </button>
      <button type="button" className="tool-btn" title="Badges" aria-label="Badges" onClick={onBadges}>🏆</button>
      <button type="button" className="tool-btn" title="Code Challenges" aria-label="Code Challenges" onClick={onChallenges}>🏋️</button>
      <button type="button" className="tool-btn" title="Review Queue" aria-label={`Review Queue${dueCount > 0 ? ` (${dueCount} due)` : ''}`} onClick={onSR}>
        🔄
        {dueCount > 0 && <span className="badge-notif" aria-hidden="true">{dueCount}</span>}
      </button>
      <button type="button" className="tool-btn" title="Cheat Sheets" aria-label="Cheat Sheets" onClick={onCheatsheet}>📋</button>
      <button type="button" className="tool-btn" title="Glossary" aria-label="Glossary" onClick={onGlossary}>📖</button>
      <button type="button" className="tool-btn" title="Build Projects" aria-label="Build Projects" onClick={onProjects}>🔨</button>
      <button type="button" className="tool-btn" title="Print / PDF" aria-label="Print or save as PDF" onClick={() => window.print()}>🖨️</button>
    </nav>
  );
});
