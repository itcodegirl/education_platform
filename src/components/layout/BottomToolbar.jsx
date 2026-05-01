import { memo, useEffect, useMemo, useRef, useState } from "react";
import { useSR } from "../../providers";

export const BottomToolbar = memo(function BottomToolbar({
  activePanel,
  onCheatsheet,
  onGlossary,
  onProjects,
  onBadges,
  onSR,
  onBookmarks,
  onChallenges,
  onStats,
}) {
  const { getDueSRCards, bookmarks } = useSR();
  const dueCount = getDueSRCards().length;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const primaryTools = useMemo(
    () => [
      {
        key: "stats",
        label: "Stats",
        title: "Your Stats",
        ariaLabel: "Open your stats",
        icon: "📊",
        onClick: onStats,
      },
      {
        key: "bookmarks",
        label: "Bookmarks",
        title: "Bookmarks",
        ariaLabel: "Open bookmarks",
        icon: "★",
        onClick: onBookmarks,
        badge: bookmarks.length > 0 ? (
          <span className="badge-notif bk-notif">{bookmarks.length}</span>
        ) : null,
      },
      {
        key: "glossary",
        label: "Glossary",
        title: "Glossary",
        ariaLabel: "Open glossary",
        icon: "📖",
        onClick: onGlossary,
      },
      {
        key: "challenges",
        label: "Challenges",
        title: "Code challenges",
        ariaLabel: "Open code challenges",
        icon: "🏋️",
        onClick: onChallenges,
      },
    ],
    [bookmarks.length, onBookmarks, onChallenges, onGlossary, onStats],
  );

  const secondaryTools = useMemo(
    () => [
      {
        key: "badges",
        label: "🏆 Badges",
        onClick: onBadges,
      },
      {
        key: "sr",
        label: "🔄 Review Queue",
        onClick: onSR,
        count: dueCount > 0 ? dueCount : null,
      },
      {
        key: "cheatsheet",
        label: "📋 Cheat Sheets",
        onClick: onCheatsheet,
      },
      {
        key: "projects",
        label: "🔨 Build Projects",
        onClick: onProjects,
      },
      {
        key: "print",
        label: "🖨️ Print / PDF",
        onClick: () => window.print(),
      },
    ],
    [dueCount, onBadges, onCheatsheet, onProjects, onSR],
  );

  const isSecondaryPanelActive = secondaryTools.some(
    (tool) => tool.key !== "print" && tool.key === activePanel,
  );

  useEffect(() => {
    if (!isMenuOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!menuRef.current) return;
      if (!menuRef.current.contains(event.target)) setIsMenuOpen(false);
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") setIsMenuOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [activePanel]);

  const closeMenuAndRun = (action) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <div
      className="bottom-tools"
      role="toolbar"
      aria-label="Quick learning tools"
    >
      {primaryTools.map((tool) => (
        <button
          key={tool.key}
          type="button"
          className={`tool-btn ${activePanel === tool.key ? "active" : ""}`}
          title={tool.title}
          aria-label={tool.ariaLabel}
          aria-pressed={activePanel === tool.key}
          onClick={tool.onClick}
          data-label={tool.label}
        >
          {tool.icon}
          {tool.badge}
        </button>
      ))}

      <div className="tool-menu-wrap" ref={menuRef}>
        <button
          type="button"
          className={`tool-btn ${isMenuOpen || isSecondaryPanelActive ? "active" : ""}`}
          title="More tools"
          aria-label="Open more tools"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          onClick={() => setIsMenuOpen((open) => !open)}
          data-label="More"
        >
          ⋯
        </button>

        {isMenuOpen && (
          <div className="tool-menu" role="menu" aria-label="More tools">
            {secondaryTools.map((tool) => (
              <button
                key={tool.key}
                type="button"
                className={`tool-menu-item ${activePanel === tool.key ? "active" : ""}`}
                role="menuitem"
                aria-pressed={activePanel === tool.key}
                onClick={() => closeMenuAndRun(tool.onClick)}
              >
                {tool.label}
                {tool.count ? (
                  <span className="tool-menu-count">{tool.count}</span>
                ) : null}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
