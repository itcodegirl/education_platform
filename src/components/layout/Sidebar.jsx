// ═══════════════════════════════════════════════
// SIDEBAR — Navigation-first glassmorphism design
// Stats moved to ProfilePopover (avatar click)
// ═══════════════════════════════════════════════

import { useState, memo, useMemo, useEffect, useRef, useCallback } from 'react';
import { useProgressData, useAuth } from '../../providers';
import { useLearnerLocalStorage } from '../../hooks/useLearnerLocalStorage';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { ProfilePopover } from './ProfilePopover';
import { Logo } from '../shared/Logo';
import { SidebarModuleList } from './SidebarModuleList';
import { SidebarLockToggle } from './SidebarLockToggle';
import { getCourseCompletedLessonCount } from '../../utils/lessonKeys';
import { logNavigationDiagnostic } from '../../utils/navigationDiagnostics';
import { getLearningToolCopy, isLearningToolAvailable } from '../../constants/learningTools';

const POPUP_MENU_ITEM_SELECTOR = '[role="menuitem"]';


export const Sidebar = memo(function Sidebar({
  courses,
  courseIdx,
  modIdx,
  lesIdx,
  showModQuiz,
  isOpen,
  isMobile,
  isCollapsed,
  onClose,
  onToggleCollapse,
  onSelectCourse,
  onSelectLesson,
  onSelectModQuiz,
  onOpenTool,
  activePanel,
  hasCompletedProgress = true,
}) {
  const isDesktopCollapsed = !isMobile && isCollapsed;
  const isNavInteractionHidden = isDesktopCollapsed || (isMobile && !isOpen);
  const { completed = [] } = useProgressData();
  const { user } = useAuth();
  const [lockMode, setLockMode] = useLearnerLocalStorage('chw-lock-mode', false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  // `activePopout` replaces the old `courseDropdownOpen` — a single
  // state for the Courses + Tools tab bar. Only one popout can be
  // open at a time; clicking a tab while the other is open switches.
  const [activePopout, setActivePopout] = useState(null); // 'courses' | 'resources' (tools tab) | null
  // Keep tab content docked inside the sidebar. Fixed flyouts can be
  // clipped by the sidebar's glass/overflow stack and look non-responsive.
  const [popoutPos, setPopoutPos] = useState(null);
  const [expandedMod, setExpandedMod] = useState(modIdx);
  const tabsRef = useRef(null);
  const popoutRef = useRef(null);
  const asideRef = useRef(null);
  const coursesTabRef = useRef(null);
  const resourcesTabRef = useRef(null);
  const course = courses[courseIdx];
  const modules = course.modules;
  const completedSet = useMemo(() => new Set(completed), [completed]);

  // Sync expanded module when active module changes
  useEffect(() => { setExpandedMod(modIdx); }, [modIdx]);

  // Shared position calculator kept for the existing tab-open flow. It now
  // always docks content inline on both desktop and mobile.
  const computePopoutPos = useCallback(() => {
    return { mode: 'docked' };
  }, []);

  const getPopoutItems = useCallback(() => {
    if (!popoutRef.current) return [];
    return Array.from(popoutRef.current.querySelectorAll(POPUP_MENU_ITEM_SELECTOR));
  }, []);

  const focusPopoutItem = useCallback((target = 'first') => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        const items = getPopoutItems();
        if (!items.length) return;
        const nextIndex = target === 'last' ? items.length - 1 : 0;
        items[nextIndex].focus();
      });
    });
  }, [getPopoutItems]);

  const closePopout = useCallback((restoreFocus = false, source = activePopout) => {
    setActivePopout(null);
    setPopoutPos(null);

    if (!restoreFocus || !source) return;

    window.requestAnimationFrame(() => {
      if (source === 'courses') {
        coursesTabRef.current?.focus();
        return;
      }
      resourcesTabRef.current?.focus();
    });
  }, [activePopout]);

  const openPopout = useCallback(
    (which, focusTarget = null) => {
      setActivePopout((prev) => {
        const next = prev === which ? null : which;
        const nextPos = next ? computePopoutPos() : null;
        setPopoutPos(nextPos);
        logNavigationDiagnostic('sidebar-tab-state-updated', {
          targetTab: which,
          previousTab: prev || '',
          activeTab: next || '',
          mode: nextPos?.mode || 'closed',
        });
        if (next && focusTarget) {
          focusPopoutItem(focusTarget);
        }
        return next;
      });
    },
    [computePopoutPos, focusPopoutItem],
  );

  const handleSidebarTabClick = useCallback((which) => {
    logNavigationDiagnostic('sidebar-tab-click-fired', {
      targetTab: which,
      activeTab: activePopout || '',
    });
    openPopout(which);
  }, [activePopout, openPopout]);

  const focusPopoutByOffset = useCallback((offset) => {
    const items = getPopoutItems();
    if (!items.length) return;
    const activeElementIndex = items.findIndex((item) => item === document.activeElement);
    const startIndex = activeElementIndex < 0 ? 0 : activeElementIndex;
    const nextIndex = (startIndex + offset + items.length) % items.length;
    items[nextIndex].focus();
  }, [getPopoutItems]);

  const handleTabKeyDown = useCallback((which) => (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (activePopout === which) {
        focusPopoutByOffset(1);
      } else {
        openPopout(which, 'first');
      }
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (activePopout === which) {
        focusPopoutByOffset(-1);
      } else {
        openPopout(which, 'last');
      }
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      if (activePopout === which) {
        closePopout(true, which);
      } else {
        openPopout(which, 'first');
      }
      return;
    }

    if (event.key === 'Escape' && activePopout === which) {
      event.preventDefault();
      closePopout(true, which);
    }
  }, [activePopout, closePopout, focusPopoutByOffset, openPopout]);

  const handlePopoutKeyDown = useCallback((event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      focusPopoutByOffset(1);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      focusPopoutByOffset(-1);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusPopoutItem('first');
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusPopoutItem('last');
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closePopout(true);
      return;
    }

    if (event.key === 'Tab') {
      closePopout(false);
    }
  }, [closePopout, focusPopoutByOffset, focusPopoutItem]);

  useEffect(() => {
    if (!isNavInteractionHidden || !activePopout) return;
    closePopout(false);
  }, [activePopout, closePopout, isNavInteractionHidden]);

  useEffect(() => {
    if (!(isMobile && !isOpen)) return;
    setActivePopout(null);
    setPopoutPos(null);
    setPopoverOpen(false);
  }, [isMobile, isOpen]);

  useEffect(() => {
    if (!isMobile || isOpen) return;
    setPopoverOpen(false);
    closePopout(false);
  }, [closePopout, isMobile, isOpen]);

  useEffect(() => {
    const navElement = document.getElementById('course-sidebar');
    if (!navElement) return undefined;

    const focusableElements = Array.from(
      navElement.querySelectorAll('a[href], button, input, select, textarea, [tabindex]'),
    );

    if (isNavInteractionHidden) {
      focusableElements.forEach((element) => {
        if (!element.hasAttribute('data-prev-tabindex')) {
          const previousTabIndex = element.getAttribute('tabindex');
          element.setAttribute('data-prev-tabindex', previousTabIndex ?? '__none__');
        }
        element.setAttribute('tabindex', '-1');
      });
      return undefined;
    }

    focusableElements.forEach((element) => {
      const previousTabIndex = element.getAttribute('data-prev-tabindex');
      if (previousTabIndex === null) return;
      if (previousTabIndex === '__none__') {
        element.removeAttribute('tabindex');
      } else {
        element.setAttribute('tabindex', previousTabIndex);
      }
      element.removeAttribute('data-prev-tabindex');
    });

    return undefined;
  }, [isNavInteractionHidden]);

  // While tab content is active, close it on click-outside or Escape.
  useEffect(() => {
    if (!activePopout) return undefined;
    const handlePointerDown = (e) => {
      const inTabs = tabsRef.current && tabsRef.current.contains(e.target);
      const inPopout = popoutRef.current && popoutRef.current.contains(e.target);
      if (!inTabs && !inPopout) {
        setActivePopout(null);
        setPopoutPos(null);
      }
    };
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setActivePopout(null);
        setPopoutPos(null);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [activePopout]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Coder';
  const userInitial = displayName.trim().charAt(0).toUpperCase() || 'C';

  const { total, courseDone, pct } = useMemo(() => {
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = getCourseCompletedLessonCount(completedSet, course);
    const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return { total: totalLessons, courseDone: completedLessons, pct: progressPct };
  }, [modules, completedSet, course]);

  const togglePopover = useCallback(() => setPopoverOpen((v) => !v), []);
  const closePopover = useCallback(() => setPopoverOpen(false), []);
  const handleCourseSelect = useCallback((nextCourseIndex) => {
    onSelectCourse(nextCourseIndex);
    setActivePopout(null);
    setPopoutPos(null);
    if (isMobile) onClose();
  }, [isMobile, onClose, onSelectCourse]);

  const handleToolSelect = useCallback((toolKey) => {
    onOpenTool(toolKey);
    setActivePopout(null);
    setPopoutPos(null);
    if (isMobile) onClose();
  }, [isMobile, onClose, onOpenTool]);

  const handleLessonSelect = useCallback((module, lesson, mi, li, unlocked) => {
    logNavigationDiagnostic('lesson-click-fired', {
      targetLessonId: lesson?.id || '',
      targetModuleId: module?.id || '',
      targetModuleIndex: mi,
      targetLessonIndex: li,
      unlocked,
      lockMode,
    });

    if (!unlocked) return;
    onSelectLesson(mi, li);
  }, [lockMode, onSelectLesson]);

  // Mobile drawer: trap focus inside the <nav> while it is open,
  // restore focus to the trigger on close, lock body scroll, and
  // close on Escape. Extracted into a reusable hook because we
  // apply the same pattern to every modal panel in the app.
  useFocusTrap(asideRef, {
    enabled: isMobile && isOpen,
    onEscape: onClose,
    lockBodyScroll: true,
    initialFocus: 'first-tabbable',
  });

  return (
    <>
      {isMobile && isOpen && <div className="overlay overlay-open" onClick={onClose} aria-hidden="true" />}
      {/* Mobile drawer wrapper carries the dialog semantics; the inner
          navigation remains a semantic <nav> landmark in every mode. */}
      <div
        ref={asideRef}
        className="sidebar-shell"
        role={isMobile && isOpen ? 'dialog' : undefined}
        aria-modal={isMobile && isOpen ? 'true' : undefined}
        aria-label={isMobile && isOpen ? 'Course navigation' : undefined}
        aria-hidden={isMobile ? !isOpen : undefined}
        inert={isMobile && !isOpen ? true : undefined}
        tabIndex={isMobile ? -1 : undefined}
      >
      <nav
        id="course-sidebar"
        className={`sidebar ${isOpen ? 'open' : ''} ${!isMobile && isCollapsed ? 'collapsed' : ''}`}
        aria-label="Course navigation"
        aria-hidden={isNavInteractionHidden ? 'true' : undefined}
        inert={isNavInteractionHidden ? true : undefined}
      >
        {/* ─── Brand + Avatar row ─── */}
        <header className="sidebar-head">
          <div className="brand">
            <Logo size="sm" />
            <span className="brand-robot" aria-hidden="true">🤖</span>
            <Logo size="icon" className="brand-icon-only" />
          </div>
          <div className="sidebar-head-actions">
            <button
              type="button"
              className={`sidebar-avatar ${popoverOpen ? 'active' : ''}`}
              onClick={togglePopover}
              aria-label="Open profile and stats"
              aria-expanded={popoverOpen}
              title={displayName}
            >
              {userInitial}
            </button>
            {!isMobile && (
              <button
                type="button"
                className="sidebar-collapse"
                onClick={onToggleCollapse}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? '»' : '«'}
              </button>
            )}
            <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close sidebar">✕</button>
          </div>
        </header>

        {/* ─── Profile Popover ─── */}
        <ProfilePopover isOpen={popoverOpen} onClose={closePopover} isMobile={isMobile} />

        {/* ─── Tab bar: Courses + Tools ─── */}
        {/* Two tabs side-by-side. Each opens a small docked panel inside
            the sidebar so overflow/glass layers cannot clip the content.
            Courses: switches between course tracks (HTML/CSS/JS/React).
            Tools: opens a quick-launcher for the learning tools
            (cheat sheets, glossary, bookmarks, review queue, challenges, badges).
            Click-outside and Escape close the active panel. */}
        <div className="sidebar-tabs" ref={tabsRef} aria-label="Sidebar navigation">
          <button
            id="sidebar-tab-courses"
            ref={coursesTabRef}
            type="button"
            className={`sidebar-tab ${activePopout === 'courses' ? 'active' : ''}`}
            onClick={() => handleSidebarTabClick('courses')}
            onKeyDown={handleTabKeyDown('courses')}
            aria-haspopup="menu"
            aria-expanded={activePopout === 'courses'}
            aria-controls="sidebar-tab-panel-courses"
          >
            <span className="sidebar-tab-icon" aria-hidden="true">📚</span>
            <span className="sidebar-tab-label">Courses</span>
            <span className="sidebar-tab-arrow" aria-hidden="true">▸</span>
          </button>

          <button
            id="sidebar-tab-resources"
            ref={resourcesTabRef}
            type="button"
            className={`sidebar-tab ${activePopout === 'resources' ? 'active' : ''}`}
            onClick={() => handleSidebarTabClick('resources')}
            onKeyDown={handleTabKeyDown('resources')}
            aria-haspopup="menu"
            aria-expanded={activePopout === 'resources'}
            aria-controls="sidebar-tab-panel-resources"
          >
            <span className="sidebar-tab-icon" aria-hidden="true">📋</span>
            <span className="sidebar-tab-label">Tools</span>
            <span className="sidebar-tab-arrow" aria-hidden="true">▸</span>
          </button>

          {/* Active-course context strip — shows which course you're in
              and its progress, now that the course name isn't the trigger label. */}
          <div className="sidebar-tabs-context" style={{ '--cs-accent': course.accent }}>
            <span className="sidebar-tabs-context-icon" aria-hidden="true">{course.icon}</span>
            <span className="sidebar-tabs-context-label">{course.label}</span>
            <span className="sidebar-tabs-context-meta">{courseDone}/{total}</span>
            <div className="sidebar-tabs-context-progress">
              <div
                className="sidebar-tabs-context-fill"
                style={{ width: `${pct}%`, background: course.accent }}
              />
            </div>
          </div>
        </div>

        {/* Docked tab card rendered outside .sidebar-tabs so it can span the
            sidebar body while staying inside the sidebar's hit area. */}
        {activePopout && popoutPos && (
          <div
            ref={popoutRef}
            id={`sidebar-tab-panel-${activePopout}`}
            className={`sidebar-tab-flyout sidebar-tab-flyout-${activePopout} ${popoutPos.mode === 'docked' ? 'docked' : ''}`}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby={activePopout === 'courses' ? 'sidebar-tab-courses' : 'sidebar-tab-resources'}
            aria-label={activePopout === 'courses' ? 'Select course' : 'Open learning tools'}
            onKeyDown={handlePopoutKeyDown}
            style={popoutPos.mode === 'fixed' ? { top: popoutPos.top, left: popoutPos.left } : undefined}
          >
            {activePopout === 'courses' &&
              courses.map((c, ci) => (
                <button
                  key={c.id}
                  type="button"
                  role="menuitem"
                  className={`cs-option ${ci === courseIdx ? 'active' : ''}`}
                  onClick={() => handleCourseSelect(ci)}
                  style={{ '--cs-accent': c.accent }}
                  aria-label={`Switch to ${c.label} course`}
                  aria-current={ci === courseIdx ? 'page' : undefined}
                >
                  <span className="cs-option-icon" aria-hidden="true">{c.icon}</span>
                  <span className="cs-option-label">{c.label}</span>
                  {ci === courseIdx && <span className="cs-option-check" aria-hidden="true">✓</span>}
                </button>
              ))}

            {activePopout === 'resources' && (
              <div className="sidebar-tool-intro" role="presentation">
                <span className="sidebar-tool-intro-label">Use when needed</span>
                <span className="sidebar-tool-intro-copy">
                  Stay with the lesson unless one of these removes friction.
                </span>
              </div>
            )}

            {activePopout === 'resources' &&
              [
                {
                  key: 'bookmarks',
                  icon: '★',
                },
                {
                  key: 'sr',
                  icon: '↻',
                },
                {
                  key: 'glossary',
                  icon: 'Aa',
                },
                {
                  key: 'cheatsheet',
                  icon: '{}',
                },
                {
                  key: 'projects',
                  icon: '<>',
                },
                {
                  key: 'challenges',
                  icon: '✓',
                },
                {
                  key: 'badges',
                  icon: '☆',
                },
              ].filter((t) =>
                isLearningToolAvailable(t.key, hasCompletedProgress),
              ).map((t) => {
                const copy = getLearningToolCopy(t.key);
                const label = copy.label || t.label;
                const hint = copy.sidebarHint || t.hint;
                return (
                <button
                  key={t.key}
                  type="button"
                  role="menuitem"
                  className={`sidebar-tab-opt ${activePanel === t.key ? 'active' : ''}`}
                  aria-pressed={activePanel === t.key}
                  onClick={() => handleToolSelect(t.key)}
                  aria-label={`Open ${label}`}
                >
                  <span className="sidebar-tab-opt-icon" aria-hidden="true">{t.icon}</span>
                  <span className="sidebar-tab-opt-copy">
                    <span className="sidebar-tab-opt-label">{label}</span>
                    <span className="sidebar-tab-opt-hint">{hint}</span>
                  </span>
                </button>
                );
              })}
            {activePopout === 'resources' && !hasCompletedProgress && (
              <p className="sidebar-tool-unlock" role="presentation">
                Practice tools unlock after your first completed lesson so the first session stays focused.
              </p>
            )}
          </div>
        )}

        {/* ─── Module/Lesson Tree ─── */}
        <div className="sidebar-scroll">
          <SidebarModuleList
            course={course}
            modules={modules}
            modIdx={modIdx}
            lesIdx={lesIdx}
            showModQuiz={showModQuiz}
            completedSet={completedSet}
            expandedMod={expandedMod}
            onToggleExpand={setExpandedMod}
            lockMode={lockMode}
            onLessonSelect={handleLessonSelect}
            onSelectModQuiz={onSelectModQuiz}
            activePanel={activePanel}
            onOpenRoadmap={() => handleToolSelect('roadmap')}
          />
          <SidebarLockToggle lockMode={lockMode} onToggle={setLockMode} />
        </div>
      </nav>
      </div>
    </>
  );
});

