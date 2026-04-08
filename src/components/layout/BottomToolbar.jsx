import { memo } from 'react';
import { useProgress } from '../../providers';

export const BottomToolbar = memo(function BottomToolbar({
  onCheatsheet,
  onGlossary,
  onProjects,
  onBadges,
  onSR,
  onBookmarks,
  onChallenges,
  onStats,
}) {
  const { getDueSRCards, bookmarks } = useProgress();
  const dueCount = getDueSRCards().length;

  return (
    <div className="bottom-tools">
      <button type="button" className="tool-btn" title="Your Stats" aria-label="Open your stats" onClick={onStats}>📊</button>
      <button type="button" className="tool-btn" title="Bookmarks" aria-label="Open bookmarks" onClick={onBookmarks}>
        ★
        {bookmarks.length > 0 && <span className="badge-notif bk-notif">{bookmarks.length}</span>}
      </button>
      <button type="button" className="tool-btn" title="Badges" aria-label="Open badges" onClick={onBadges}>🏆</button>
      <button type="button" className="tool-btn" title="Code Challenges" aria-label="Open code challenges" onClick={onChallenges}>🏋️</button>
      <button type="button" className="tool-btn" title="Review Queue" aria-label="Open review queue" onClick={onSR}>
        🔄
        {dueCount > 0 && <span className="badge-notif">{dueCount}</span>}
      </button>
      <button type="button" className="tool-btn" title="Cheat Sheets" aria-label="Open cheat sheets" onClick={onCheatsheet}>📋</button>
      <button type="button" className="tool-btn" title="Glossary" aria-label="Open glossary" onClick={onGlossary}>📖</button>
      <button type="button" className="tool-btn" title="Build Projects" aria-label="Open build projects" onClick={onProjects}>🔨</button>
      <button type="button" className="tool-btn" title="Print / PDF" aria-label="Print or save as PDF" onClick={() => window.print()}>🖨️</button>
    </div>
  );
});
