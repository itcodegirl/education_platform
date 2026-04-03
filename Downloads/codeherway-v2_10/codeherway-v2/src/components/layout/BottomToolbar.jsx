// ═══════════════════════════════════════════════
// BOTTOM TOOLBAR — Floating tool buttons (memoized)
// ═══════════════════════════════════════════════

import { memo } from 'react';
import { useProgress } from '../../context/ProgressContext';

export const BottomToolbar = memo(function BottomToolbar({ onCheatsheet, onGlossary, onProjects, onBadges, onSR, onBookmarks, onChallenges, onStats }) {
  const { getDueSRCards, bookmarks } = useProgress();
  const dueCount = getDueSRCards().length;

  return (
    <div className="bottom-tools">
      <button type="button" className="tool-btn" title="Your Stats" onClick={onStats}>📊</button>
      <button type="button" className="tool-btn" title="Bookmarks" onClick={onBookmarks}>
        ★
        {bookmarks.length > 0 && <span className="badge-notif bk-notif">{bookmarks.length}</span>}
      </button>
      <button type="button" className="tool-btn" title="Badges" onClick={onBadges}>🏆</button>
      <button type="button" className="tool-btn" title="Code Challenges" onClick={onChallenges}>🏋️</button>
      <button type="button" className="tool-btn" title="Review Queue" onClick={onSR}>
        🔄
        {dueCount > 0 && <span className="badge-notif">{dueCount}</span>}
      </button>
      <button type="button" className="tool-btn" title="Cheat Sheets" onClick={onCheatsheet}>📋</button>
      <button type="button" className="tool-btn" title="Glossary" onClick={onGlossary}>📖</button>
      <button type="button" className="tool-btn" title="Build Projects" onClick={onProjects}>🔨</button>
      <button type="button" className="tool-btn" title="Print / PDF" onClick={() => window.print()}>🖨️</button>
    </div>
  );
});
