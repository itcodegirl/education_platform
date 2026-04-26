// ═══════════════════════════════════════════════
// SIDEBAR — Navigation-first glassmorphism design
// Stats moved to ProfilePopover (avatar click)
// ═══════════════════════════════════════════════

import { useState, memo, useMemo, useEffect, useRef, useCallback } from 'react';
import { useProgressData, useAuth } from '../../providers';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { QUIZ_MAP } from '../../data';
import { ProfilePopover } from './ProfilePopover';
import { Logo } from '../shared/Logo';
import { getCourseCompletedLessonCount, hasLessonCompletion } from '../../utils/lessonKeys';

const POPUP_MENU_ITEM_SELECTOR = '[role="menuitem"]';

function isLessonUnlocked(course, modules, mi, li, completedSet) {
  if (mi === 0 && li === 0) return true;

  if (li > 0) {
    const prevLesson = modules[mi].lessons[li - 1];
    return hasLessonCompletion(completedSet, course, modules[mi], prevLesson);
  }

  if (mi > 0) {
    const prevMod = modules[mi - 1];
    const lastLesson = prevMod.lessons[prevMod.lessons.length - 1];
    return hasLessonCompletion(completedSet, course, prevMod, lastLesson);
  }

  return true;
}


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
}) {
  const isDesktopCollapsed = !isMobile && isCollapsed;
  const { completed = [] } = useProgressData();
  const { user } = useAuth();
  const [lockMode, setLockMode] = useLocalStorage('chw-lock-mode', false);
  const [popoverOpen, setPopoverOpen] = useState(false);
  // `activePopout` replaces the old `courseDropdownOpen` — a single
  // state for the Courses + Resources tab bar. Only one popout can be
  // open at a time; clicking a tab while the other is open switches.
  const [activePopout, setActivePopout] = useState(null); // 'courses' | 'resources' | null
  // Desktop: popout is `position: fixed` and flies out to the right of
  // the sidebar. Mobile: we dock it inline under the tabs to avoid iOS
  // fixed-position jumps during drawer transforms.
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

  // Shared position calculator so the same logic runs on initial open
  // and on every window resize. Returns null if the tab bar ref isn't
  // mounted yet (shouldn't happen once the sidebar is rendered).
  //
  // Popout width matches .sidebar-tab-flyout in CSS (~240px). We try to
  // place it to the RIGHT of the tab bar so it flies out of the
  // sidebar. If that would overflow the viewport (narrow windows,
  // mobile drawer) OR if the tab bar itself is still animating in
  // from off-screen-left (drawer mid-transition), flip it BELOW the
  // tab bar instead, clamped to the viewport on both sides so it
  // stays fully visible.
  const computePopoutPos = useCallback(() => {
    if (isMobile) {
      return { mode: 'docked' };
    }
    if (!tabsRef.current) return null;
    const rect = tabsRef.current.getBoundingClientRect();
    const POPOUT_WIDTH = 240;
    const PADDING = 8;
    const vw = window.innerWidth;
    const wantLeft = rect.right + PADDING;
    const fitsRight =
      wantLeft >= PADDING &&
      wantLeft + POPOUT_WIDTH <= vw - PADDING;
    const belowLeft = Math.max(
      PADDING,
      Math.min(rect.left, vw - POPOUT_WIDTH - PADDING),
    );
    return fitsRight
      ? { mode: 'fixed', top: rect.top, left: wantLeft }
      : { mode: 'fixed', top: rect.bottom + PADDING, left: belowLeft };
  }, [isMobile]);

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
        setPopoutPos(next ? computePopoutPos() : null);
        if (next && focusTarget) {
          focusPopoutItem(focusTarget);
        }
        return next;
      });
    },
    [computePopoutPos, focusPopoutItem],
  );

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
    if (!isDesktopCollapsed || !activePopout) return;
    closePopout(false);
  }, [activePopout, closePopout, isDesktopCollapsed]);

  useEffect(() => {
    const navElement = document.getElementById('course-sidebar');
    if (!navElement) return undefined;

    const focusableElements = Array.from(
      navElement.querySelectorAll('a[href], button, input, select, textarea, [tabindex]'),
    );

    if (isDesktopCollapsed) {
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
  }, [isDesktopCollapsed]);

  // While a popout is active, close it on click-outside or Escape,
  // and REPOSITION (not close) it on window resize so users who
  // drag the browser edge to test responsiveness don't see the
  // popout disappear on the first resize event.
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
    const handleResize = () => {
      // Recompute instead of close. If the tab bar is no longer in
      // the DOM (hot-reload edge case), fall back to closing.
      const nextPos = computePopoutPos();
      if (nextPos) setPopoutPos(nextPos);
      else {
        setActivePopout(null);
        setPopoutPos(null);
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('resize', handleResize);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('resize', handleResize);
    };
  }, [activePopout, computePopoutPos]);

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

  // Mobile drawer: trap focus inside the <nav> while it is open,
  // restore focus to the trigger on close, lock body scroll, and
  // close on Escape. Extracted into a reusable hook because we
  // apply the same pattern to every modal panel in the app.
  useFocusTrap(asideRef, {
    enabled: isMobile && isOpen,
    onEscape: onClose,
    lockBodyScroll: true,
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
        tabIndex={isMobile ? -1 : undefined}
      >
      <nav
        id="course-sidebar"
        className={`sidebar ${isOpen ? 'open' : ''} ${!isMobile && isCollapsed ? 'collapsed' : ''}`}
        aria-label="Course navigation"
        aria-hidden={isDesktopCollapsed ? 'true' : undefined}
        inert={isDesktopCollapsed ? '' : undefined}
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

        {/* ─── Tab bar: Courses + Resources ─── */}
        {/* Two tabs side-by-side. Each opens a small popout card that
            flies out to the RIGHT of the sidebar (position: fixed, so
            it escapes the sidebar's overflow: hidden).
            Courses: switches between course tracks (HTML/CSS/JS/React/Python).
            Resources: opens a quick-launcher for the learning tools
            (cheat sheets, glossary, bookmarks, review queue, challenges, badges).
            Click-outside, Escape, and window resize close the active popout. */}
        <div className="sidebar-tabs" ref={tabsRef} aria-label="Sidebar navigation">
          <button
            id="sidebar-tab-courses"
            ref={coursesTabRef}
            type="button"
            className={`sidebar-tab ${activePopout === 'courses' ? 'active' : ''}`}
            onClick={() => openPopout('courses')}
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
            onClick={() => openPopout('resources')}
            onKeyDown={handleTabKeyDown('resources')}
            aria-haspopup="menu"
            aria-expanded={activePopout === 'resources'}
            aria-controls="sidebar-tab-panel-resources"
          >
            <span className="sidebar-tab-icon" aria-hidden="true">📋</span>
            <span className="sidebar-tab-label">Resources</span>
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

        {/* Popout card — rendered OUTSIDE .sidebar-tabs so it can escape the
            sidebar's overflow:hidden via position:fixed. Position is
            computed from the tab bar's bounding rect in openPopout(). */}
        {activePopout && popoutPos && (
          <div
            ref={popoutRef}
            id={`sidebar-tab-panel-${activePopout}`}
            className={`sidebar-tab-flyout sidebar-tab-flyout-${activePopout} ${popoutPos.mode === 'docked' ? 'docked' : ''}`}
            role="menu"
            aria-orientation="vertical"
            aria-labelledby={activePopout === 'courses' ? 'sidebar-tab-courses' : 'sidebar-tab-resources'}
            aria-label={activePopout === 'courses' ? 'Select course' : 'Open a learning tool'}
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
                  onClick={() => {
                    onSelectCourse(ci);
                    setActivePopout(null);
                    setPopoutPos(null);
                  }}
                  style={{ '--cs-accent': c.accent }}
                  aria-label={`Switch to ${c.label} course`}
                >
                  <span className="cs-option-icon" aria-hidden="true">{c.icon}</span>
                  <span className="cs-option-label">{c.label}</span>
                  {ci === courseIdx && <span className="cs-option-check" aria-hidden="true">✓</span>}
                </button>
              ))}

            {activePopout === 'resources' &&
              [
                { key: 'cheatsheet', icon: '📋', label: 'Cheat Sheets' },
                { key: 'glossary',   icon: '📖', label: 'Glossary'     },
                { key: 'bookmarks',  icon: '⭐', label: 'Bookmarks'    },
                { key: 'sr',         icon: '🔄', label: 'Review'       },
                { key: 'challenges', icon: '🏋️', label: 'Challenges'   },
                { key: 'badges',     icon: '🏆', label: 'Badges'       },
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="menuitem"
                  className={`sidebar-tab-opt ${activePanel === t.key ? 'active' : ''}`}
                  aria-pressed={activePanel === t.key}
                  onClick={() => {
                    onOpenTool(t.key);
                    setActivePopout(null);
                    setPopoutPos(null);
                  }}
                  aria-label={`Open ${t.label} panel`}
                >
                  <span className="sidebar-tab-opt-icon" aria-hidden="true">{t.icon}</span>
                  <span className="sidebar-tab-opt-label">{t.label}</span>
                </button>
              ))}
          </div>
        )}

        {/* ─── Module/Lesson Tree ─── */}
        <div className="sidebar-scroll">
          <div className="sidebar-map-header">
            <span className="sidebar-map-title">Modules</span>
            <button
              type="button"
              className={`sidebar-roadmap-btn ${activePanel === 'roadmap' ? 'active' : ''}`}
              onClick={() => onOpenTool('roadmap')}
              aria-label="Open full learning roadmap"
              title="Full roadmap"
            >
              🗺️
            </button>
          </div>
          {/* The outer <nav aria-label="Course navigation"> already exposes
              this region as a landmark — this inner list doesn't need its
              own nested <nav> (would be noisy for screen readers). */}
          <div className="sidebar-nav">
            {modules.map((module, mi) => {
              const modDone = module.lessons.filter((lesson) =>
                hasLessonCompletion(completedSet, course, module, lesson),
              ).length;
              const isModUnlocked = !lockMode || isLessonUnlocked(course, modules, mi, 0, completedSet);

              const isExpanded = expandedMod === mi;

              return (
                <div key={module.id} className={`module-group ${mi === modIdx ? 'act' : ''} ${isExpanded ? 'expanded' : ''} ${!isModUnlocked ? 'locked' : ''}`}>
                  <button
                    type="button"
                    className="module-group-btn"
                    onClick={() => {
                      if (!isModUnlocked) return;
                      // Toggle expand/collapse; if collapsing the current, just collapse
                      setExpandedMod(isExpanded ? -1 : mi);
                    }}
                    disabled={!isModUnlocked}
                    aria-expanded={isExpanded}
                  aria-label={`${module.title} module${isModUnlocked ? `, ${modDone}/${module.lessons.length} lessons completed` : ', locked by sequence mode'}`}
                  >
                    <span className="module-group-emoji" aria-hidden="true">{isModUnlocked ? module.emoji : '🔒'}</span>
                    <div className="module-group-info">
                      <span className="module-group-name">{module.title}</span>
                      <span className="module-group-sub">{modDone}/{module.lessons.length}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="lesson-list">
                      {module.lessons.map((lesson, li) => {
                        const isDone = hasLessonCompletion(completedSet, course, module, lesson);
                        const unlocked = !lockMode || isLessonUnlocked(course, modules, mi, li, completedSet);
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            className={`lesson-list-btn ${mi === modIdx && li === lesIdx && !showModQuiz ? 'act' : ''} ${isDone ? 'dn' : ''} ${!unlocked ? 'locked' : ''}`}
                            onClick={() => unlocked && onSelectLesson(mi, li)}
                            disabled={!unlocked}
                            aria-label={`${lesson.title} lesson${isDone ? ', completed' : ''}${!unlocked ? ', locked' : ''}`}
                            aria-current={mi === modIdx && li === lesIdx && !showModQuiz ? 'page' : undefined}
                          >
                            <span className="lesson-list-chk" aria-hidden="true">{isDone ? '✓' : unlocked ? '○' : '🔒'}</span>
                            <span>{lesson.title}</span>
                            {mi === modIdx && li === lesIdx && !showModQuiz && <span className="lesson-list-robot" aria-hidden="true">🤖</span>}
                          </button>
                        );
                      })}
                      {QUIZ_MAP.has(`m:${course.id}:${module.id}`) && (
                        <button
                          type="button"
                          className={`lesson-list-btn lesson-list-quiz ${showModQuiz && mi === modIdx ? 'act' : ''}`}
                          onClick={() => onSelectModQuiz(mi)}
                          aria-label={`Open module quiz for ${module.title}`}
                        >
                          <span className="lesson-list-chk" aria-hidden="true">📝</span>
                          <span>Module Quiz</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* The Tools grid was moved into the Resources popout at the
              top of the sidebar (see .sidebar-tabs above). */}

          {/* ─── Lock toggle ─── */}
          <div className="sidebar-lock-row">
            <label className="lock-label">
            <input
              type="checkbox"
              checked={lockMode}
              onChange={(e) => setLockMode(e.target.checked)}
              aria-label="Toggle sequential lock mode"
            />
            <span className="lock-text">{lockMode ? '🔒 Sequential' : '🔓 Free roam'}</span>
            </label>
          </div>
        </div>
      </nav>
      </div>
    </>
  );
});

