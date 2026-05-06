import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const triggerRef = useRef(null);

  const closeMenu = useCallback((restoreFocus) => {
    setIsMenuOpen(false);
    if (restoreFocus) triggerRef.current?.focus();
  }, []);

  const primaryTools = useMemo(
    () => [
      {
        key: "bookmarks",
        label: "Saved",
        title: "Saved lessons",
        ariaLabel: "Open saved lessons",
        icon: "★",
        onClick: onBookmarks,
        badge: bookmarks.length > 0 ? (
          <span className="badge-notif bk-notif">{bookmarks.length}</span>
        ) : null,
      },
      {
        key: "stats",
        label: "Progress",
        title: "Your progress",
        ariaLabel: "Open your progress",
        icon: "↗",
        onClick: onStats,
      },
    ],
    [bookmarks.length, onBookmarks, onStats],
  );

  const secondaryTools = useMemo(
    () => [
      {
        key: "sr",
        label: "Review queue",
        onClick: onSR,
        count: dueCount > 0 ? dueCount : null,
      },
      {
        key: "badges",
        label: "Badges",
        onClick: onBadges,
      },
      {
        key: "challenges",
        label: "Challenges",
        onClick: onChallenges,
      },
      {
        key: "cheatsheet",
        label: "Cheat sheets",
        onClick: onCheatsheet,
      },
      {
        key: "glossary",
        label: "Glossary",
        onClick: onGlossary,
      },
      {
        key: "projects",
        label: "Build projects",
        onClick: onProjects,
      },
      {
        key: "print",
        label: "Print / PDF",
        onClick: () => window.print(),
      },
    ],
    [dueCount, onBadges, onChallenges, onCheatsheet, onGlossary, onProjects, onSR],
  );

  const isSecondaryPanelActive = secondaryTools.some(
    (tool) => tool.key !== "print" && tool.key === activePanel,
  );

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

  useEffect(() => {
    setIsMenuOpen(false);
  }, [activePanel]);

  const closeMenuAndRun = (action) => {
    closeMenu(true);
    action();
  };

  return (
    <div
      className="bottom-tools"
      role="toolbar"
      aria-label="Learning tools"
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
          ref={triggerRef}
          type="button"
          className={`tool-btn ${isMenuOpen || isSecondaryPanelActive ? "active" : ""}`}
          title="Learning tools"
          aria-label="Open learning tools"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          onClick={() => setIsMenuOpen((open) => !open)}
          data-label="Tools"
        >
          +
        </button>

        {isMenuOpen && (
          <div className="tool-menu" role="menu" aria-label="Learning tools">
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
