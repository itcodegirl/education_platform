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
      <button type="button" className="tool-btn" aria-label="Your Stats" onClick={onStats}>
        <span className="tool-icon">📊</span><span className="tool-label">Stats</span>
      </button>
      <button type="button" className="tool-btn" aria-label={`Bookmarks${bookmarks.length > 0 ? ` (${bookmarks.length})` : ''}`} onClick={onBookmarks}>
        <span className="tool-icon">★</span><span className="tool-label">Saved</span>
        {bookmarks.length > 0 && <span className="badge-notif bk-notif" aria-hidden="true">{bookmarks.length}</span>}
      </button>
      <button type="button" className="tool-btn" aria-label="Badges" onClick={onBadges}>
        <span className="tool-icon">🏆</span><span className="tool-label">Badges</span>
      </button>
      <button type="button" className="tool-btn" aria-label="Code Challenges" onClick={onChallenges}>
        <span className="tool-icon">🏋️</span><span className="tool-label">Challenges</span>
      </button>
      <button type="button" className="tool-btn" aria-label={`Review Queue${dueCount > 0 ? ` (${dueCount} due)` : ''}`} onClick={onSR}>
        <span className="tool-icon">🔄</span><span className="tool-label">Review</span>
        {dueCount > 0 && <span className="badge-notif" aria-hidden="true">{dueCount}</span>}
      </button>
      <button type="button" className="tool-btn" aria-label="Cheat Sheets" onClick={onCheatsheet}>
        <span className="tool-icon">📋</span><span className="tool-label">Sheets</span>
      </button>
      <button type="button" className="tool-btn" aria-label="Glossary" onClick={onGlossary}>
        <span className="tool-icon">📖</span><span className="tool-label">Glossary</span>
      </button>
      <button type="button" className="tool-btn" aria-label="Build Projects" onClick={onProjects}>
        <span className="tool-icon">🔨</span><span className="tool-label">Projects</span>
      </button>
      <button type="button" className="tool-btn" aria-label="Print or save as PDF" onClick={() => window.print()}>
        <span className="tool-icon">🖨️</span><span className="tool-label">Print</span>
      </button>
    </nav>
  );
});
