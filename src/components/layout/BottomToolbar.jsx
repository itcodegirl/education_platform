import { memo, useEffect, useRef, useState, useCallback } from "react";
import { useProgress } from "../../providers";

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
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const triggerRef = useRef(null);

  const closeMenu = useCallback((restoreFocus) => {
    setIsMenuOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!isMenuOpen) return undefined;
    const handlePointerDown = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) closeMenu(false);
    };
    const handleEscape = (event) => {
      if (event.key === "Escape") closeMenu(true);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen, closeMenu]);

  const closeMenuAndRun = (action) => {
    closeMenu(true);
    action();
  };

  return (
    <div
      className="bottom-tools"
      role="toolbar"
      aria-label="Quick learning tools"
    >
      <button
        type="button"
        className="tool-btn"
        title="Your Stats"
        aria-label="Open your stats"
        onClick={onStats}
        data-label="Stats"
      >
        📊
      </button>

      <button
        type="button"
        className="tool-btn"
        title="Bookmarks"
        aria-label={`Open bookmarks${bookmarks.length > 0 ? `, ${bookmarks.length} saved` : ''}`}
        onClick={onBookmarks}
        data-label="Bookmarks"
      >
        ★
        {bookmarks.length > 0 && (
          <span className="badge-notif bk-notif" aria-hidden="true">{bookmarks.length}</span>
        )}
      </button>

      <button
        type="button"
        className="tool-btn"
        title="Glossary"
        aria-label="Open glossary"
        onClick={onGlossary}
        data-label="Glossary"
      >
        📖
      </button>

      <button
        type="button"
        className="tool-btn"
        title="Code Challenges"
        aria-label="Open code challenges"
        onClick={onChallenges}
        data-label="Challenges"
      >
        🏋️
      </button>

      <div className="tool-menu-wrap" ref={menuRef}>
        <button
          ref={triggerRef}
          type="button"
          className={`tool-btn ${isMenuOpen ? "active" : ""}`}
          title="More tools"
          aria-label="More tools"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          onClick={() => setIsMenuOpen((open) => !open)}
          data-label="More"
        >
          ⋯
        </button>

        {isMenuOpen && (
          <div className="tool-menu" role="menu" aria-label="More tools">
            <button
              type="button"
              className="tool-menu-item"
              role="menuitem"
              onClick={() => closeMenuAndRun(onBadges)}
            >
              🏆 Badges
            </button>
            <button
              type="button"
              className="tool-menu-item"
              role="menuitem"
              onClick={() => closeMenuAndRun(onSR)}
            >
              🔄 Review Queue
              {dueCount > 0 && (
                <span className="tool-menu-count" aria-label={`${dueCount} cards due`}>{dueCount}</span>
              )}
            </button>
            <button
              type="button"
              className="tool-menu-item"
              role="menuitem"
              onClick={() => closeMenuAndRun(onCheatsheet)}
            >
              📋 Cheat Sheets
            </button>
            <button
              type="button"
              className="tool-menu-item"
              role="menuitem"
              onClick={() => closeMenuAndRun(onProjects)}
            >
              🔨 Build Projects
            </button>
            <button
              type="button"
              className="tool-menu-item"
              role="menuitem"
              onClick={() => closeMenuAndRun(() => window.print())}
            >
              🖨️ Print / PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
