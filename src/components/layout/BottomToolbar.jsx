import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSR } from "../../providers";
import {
  getLearningToolCopy,
  isLearningToolAvailable,
} from "../../constants/learningTools";

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
  hasCompletedProgress = true,
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

  const getMenuItems = useCallback(() => {
    if (!menuRef.current) return [];
    return Array.from(
      menuRef.current.querySelectorAll('[role="menuitem"], [role="menuitemcheckbox"]'),
    );
  }, []);

  const focusMenuItem = useCallback((index) => {
    const items = getMenuItems();
    if (items.length === 0) return;
    const nextIndex = (index + items.length) % items.length;
    items[nextIndex]?.focus();
  }, [getMenuItems]);

  const primaryTools = useMemo(
    () => [
      {
        key: "bookmarks",
        label: getLearningToolCopy("bookmarks").shortLabel,
        title: getLearningToolCopy("bookmarks").bottomTitle,
        ariaLabel: getLearningToolCopy("bookmarks").bottomAriaLabel,
        icon: "★",
        onClick: onBookmarks,
        badge: bookmarks.length > 0 ? (
          <span className="badge-notif bk-notif">{bookmarks.length}</span>
        ) : null,
      },
      {
        key: "stats",
        label: getLearningToolCopy("stats").label,
        title: getLearningToolCopy("stats").bottomTitle,
        ariaLabel: getLearningToolCopy("stats").bottomAriaLabel,
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
        label: getLearningToolCopy("sr").label,
        onClick: onSR,
        count: dueCount > 0 ? dueCount : null,
      },
      {
        key: "badges",
        label: getLearningToolCopy("badges").label,
        onClick: onBadges,
      },
      {
        key: "challenges",
        label: getLearningToolCopy("challenges").label,
        onClick: onChallenges,
      },
      {
        key: "cheatsheet",
        label: getLearningToolCopy("cheatsheet").label,
        onClick: onCheatsheet,
      },
      {
        key: "glossary",
        label: getLearningToolCopy("glossary").label,
        onClick: onGlossary,
      },
      {
        key: "projects",
        label: getLearningToolCopy("projects").label,
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

  const visibleSecondaryTools = useMemo(
    () => secondaryTools.filter((tool) =>
      tool.key === "print" || isLearningToolAvailable(tool.key, hasCompletedProgress),
    ),
    [hasCompletedProgress, secondaryTools],
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
    if (!isMenuOpen) return;
    focusMenuItem(0);
  }, [focusMenuItem, isMenuOpen]);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [activePanel]);

  const closeMenuAndRun = (action) => {
    closeMenu(true);
    action();
  };

  const handleMenuBlur = useCallback((event) => {
    if (!menuRef.current?.contains(event.relatedTarget)) {
      closeMenu(false);
    }
  }, [closeMenu]);

  const handleMenuKeyDown = useCallback((event) => {
    const items = getMenuItems();
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu(true);
      return;
    }

    if (items.length === 0) return;

    const currentIndex = items.indexOf(document.activeElement);
    const moveFocus = (nextIndex) => {
      event.preventDefault();
      focusMenuItem(nextIndex);
    };

    switch (event.key) {
      case "ArrowDown":
      case "ArrowRight":
        moveFocus(currentIndex + 1);
        break;
      case "ArrowUp":
      case "ArrowLeft":
        moveFocus(currentIndex <= 0 ? items.length - 1 : currentIndex - 1);
        break;
      case "Home":
        moveFocus(0);
        break;
      case "End":
        moveFocus(items.length - 1);
        break;
      default:
        break;
    }
  }, [closeMenu, focusMenuItem, getMenuItems]);

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

      <div className="tool-menu-wrap" ref={menuRef} onBlur={handleMenuBlur}>
        <button
          ref={triggerRef}
          type="button"
          className={`tool-btn ${isMenuOpen || isSecondaryPanelActive ? "active" : ""}`}
          title="Learning tools"
          aria-label={isMenuOpen ? "Close learning tools" : "Open learning tools"}
          aria-controls="learning-tools-menu"
          aria-expanded={isMenuOpen}
          aria-haspopup="menu"
          onClick={() => setIsMenuOpen((open) => !open)}
          data-label="Tools"
        >
          +
        </button>

        {isMenuOpen && (
          <div
            id="learning-tools-menu"
            className="tool-menu"
            role="menu"
            aria-label="Learning tools"
            onKeyDown={handleMenuKeyDown}
          >
            {visibleSecondaryTools.map((tool) => {
              const isPanelTool = tool.key !== "print";
              const isActive = activePanel === tool.key;

              return (
                <button
                  key={tool.key}
                  type="button"
                  className={`tool-menu-item ${isActive ? "active" : ""}`}
                  role={isPanelTool ? "menuitemcheckbox" : "menuitem"}
                  aria-checked={isPanelTool ? isActive : undefined}
                  onClick={() => closeMenuAndRun(tool.onClick)}
                >
                  {tool.label}
                  {tool.count ? (
                    <span className="tool-menu-count">{tool.count}</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
});
