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
  const course = courses[courseIdx];
  const modules = course.modules;
  const completedSet = useMemo(() => new Set(completed), [completed]);

  // Sync expanded module when active module changes
  useEffect(() => { setExpandedMod(modIdx); }, [modIdx]);

  // Shared position calculator so the same logic runs on initial open
  // and on every window resize. Returns null if the tab bar ref isn't
  // mounted yet (shouldn't happen once the sidebar is rendered).
  //
  // Popout width matches .sb-tab-flyout in CSS (~240px). We try to
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

  const openPopout = useCallback(
    (which) => {
      setActivePopout((prev) => {
        const next = prev === which ? null : which;
        setPopoutPos(next ? computePopoutPos() : null);
        return next;
      });
    },
    [computePopoutPos],
  );

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
      {isMobile && isOpen && <div className="overlay" onClick={onClose} aria-hidden="true" />}
      {/* Semantic <nav> landmark for the course navigation tree.
          On mobile the same element flips into an off-canvas dialog
          (role="dialog" + aria-modal), which is why the role attribute
          is conditional — a <nav> inside a <dialog> role is fine and
          still exposes both landmarks to assistive tech. */}
      <nav
        ref={asideRef}
        id="course-sidebar"
        className={`sidebar sb ${isOpen ? 'open' : ''} ${!isMobile && isCollapsed ? 'collapsed' : ''}`}
        aria-label="Course navigation"
        aria-hidden={isMobile ? !isOpen : false}
        aria-modal={isMobile && isOpen ? 'true' : undefined}
        role={isMobile ? 'dialog' : undefined}
        tabIndex={isMobile ? -1 : undefined}
      >
        {/* ─── Brand + Avatar row ─── */}
        <header className="sb-head">
          <div className="brand">
            <Logo size="sm" />
            <span className="brand-robot" aria-hidden="true">🤖</span>
            <Logo size="icon" className="brand-icon-only" />
          </div>
          <div className="sb-head-actions">
            <button
              type="button"
              className={`sb-avatar ${popoverOpen ? 'active' : ''}`}
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
                className="sb-collapse"
                onClick={onToggleCollapse}
                aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              >
                {isCollapsed ? '»' : '«'}
              </button>
            )}
            <button type="button" className="sb-close" onClick={onClose} aria-label="Close sidebar">✕</button>
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
        <div className="sb-tabs" ref={tabsRef} role="tablist" aria-label="Sidebar navigation">
          <button
            id="sb-tab-courses"
            type="button"
            className={`sb-tab ${activePopout === 'courses' ? 'active' : ''}`}
            onClick={() => openPopout('courses')}
            aria-haspopup="true"
            aria-expanded={activePopout === 'courses'}
            aria-controls="sb-tab-panel-courses"
            aria-selected={activePopout === 'courses'}
            role="tab"
          >
            <span className="sb-tab-icon" aria-hidden="true">📚</span>
            <span className="sb-tab-label">Courses</span>
            <span className="sb-tab-arrow" aria-hidden="true">▸</span>
          </button>

          <button
            id="sb-tab-resources"
            type="button"
            className={`sb-tab ${activePopout === 'resources' ? 'active' : ''}`}
            onClick={() => openPopout('resources')}
            aria-haspopup="true"
            aria-expanded={activePopout === 'resources'}
            aria-controls="sb-tab-panel-resources"
            aria-selected={activePopout === 'resources'}
            role="tab"
          >
            <span className="sb-tab-icon" aria-hidden="true">📋</span>
            <span className="sb-tab-label">Resources</span>
            <span className="sb-tab-arrow" aria-hidden="true">▸</span>
          </button>

          {/* Active-course context strip — shows which course you're in
              and its progress, now that the course name isn't the trigger label. */}
          <div className="sb-tabs-context" style={{ '--cs-accent': course.accent }}>
            <span className="sb-tabs-context-icon">{course.icon}</span>
            <span className="sb-tabs-context-label">{course.label}</span>
            <span className="sb-tabs-context-meta">{courseDone}/{total}</span>
            <div className="sb-tabs-context-progress">
              <div
                className="sb-tabs-context-fill"
                style={{ width: `${pct}%`, background: course.accent }}
              />
            </div>
          </div>
        </div>

        {/* Popout card — rendered OUTSIDE .sb-tabs so it can escape the
            sidebar's overflow:hidden via position:fixed. Position is
            computed from the tab bar's bounding rect in openPopout(). */}
        {activePopout && popoutPos && (
          <div
            ref={popoutRef}
            id={`sb-tab-panel-${activePopout}`}
            className={`sb-tab-flyout sb-tab-flyout-${activePopout} ${popoutPos.mode === 'docked' ? 'docked' : ''}`}
            role="tabpanel"
            aria-labelledby={activePopout === 'courses' ? 'sb-tab-courses' : 'sb-tab-resources'}
            aria-label={activePopout === 'courses' ? 'Select course' : 'Open a learning tool'}
            style={popoutPos.mode === 'fixed' ? { top: popoutPos.top, left: popoutPos.left } : undefined}
          >
            {activePopout === 'courses' &&
              courses.map((c, ci) => (
                <button
                  key={c.id}
                  type="button"
                  className={`cs-option ${ci === courseIdx ? 'active' : ''}`}
                  onClick={() => {
                    onSelectCourse(ci);
                    setActivePopout(null);
                    setPopoutPos(null);
                  }}
                  style={{ '--cs-accent': c.accent }}
                  aria-label={`Switch to ${c.label} course`}
                >
                  <span className="cs-option-icon">{c.icon}</span>
                  <span className="cs-option-label">{c.label}</span>
                  {ci === courseIdx && <span className="cs-option-check">✓</span>}
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
                  className={`sb-tab-opt ${activePanel === t.key ? 'active' : ''}`}
                  aria-pressed={activePanel === t.key}
                  onClick={() => {
                    onOpenTool(t.key);
                    setActivePopout(null);
                    setPopoutPos(null);
                  }}
                  aria-label={`Open ${t.label} panel`}
                >
                  <span className="sb-tab-opt-icon" aria-hidden="true">{t.icon}</span>
                  <span className="sb-tab-opt-label">{t.label}</span>
                </button>
              ))}
          </div>
        )}

        {/* ─── Module/Lesson Tree ─── */}
        <div className="sb-scroll">
          <div className="sb-map-header">
            <span className="sb-map-title">Modules</span>
            <button
              type="button"
              className={`sb-roadmap-btn ${activePanel === 'roadmap' ? 'active' : ''}`}
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
          <div className="sb-nav">
            {modules.map((module, mi) => {
              const modDone = module.lessons.filter((lesson) =>
                hasLessonCompletion(completedSet, course, module, lesson),
              ).length;
              const isModUnlocked = !lockMode || isLessonUnlocked(course, modules, mi, 0, completedSet);

              const isExpanded = expandedMod === mi;

              return (
                <div key={module.id} className={`module-group mg ${mi === modIdx ? 'act' : ''} ${isExpanded ? 'expanded' : ''} ${!isModUnlocked ? 'locked' : ''}`}>
                  <button
                    type="button"
                    className="mg-btn"
                    onClick={() => {
                      if (!isModUnlocked) return;
                      // Toggle expand/collapse; if collapsing the current, just collapse
                      setExpandedMod(isExpanded ? -1 : mi);
                    }}
                    disabled={!isModUnlocked}
                    aria-expanded={isExpanded}
                    aria-label={`${module.title} module${isModUnlocked ? `, ${modDone}/${module.lessons.length} lessons completed` : ', locked by sequence mode'}`}
                  >
                    <span className="mg-emoji">{isModUnlocked ? module.emoji : '🔒'}</span>
                    <div className="mg-info">
                      <span className="mg-name">{module.title}</span>
                      <span className="mg-sub">{modDone}/{module.lessons.length}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="lesson-list lg">
                      {module.lessons.map((lesson, li) => {
                        const isDone = hasLessonCompletion(completedSet, course, module, lesson);
                        const unlocked = !lockMode || isLessonUnlocked(course, modules, mi, li, completedSet);
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            className={`lg-btn ${mi === modIdx && li === lesIdx && !showModQuiz ? 'act' : ''} ${isDone ? 'dn' : ''} ${!unlocked ? 'locked' : ''}`}
                            onClick={() => unlocked && onSelectLesson(mi, li)}
                            disabled={!unlocked}
                            aria-label={`${lesson.title} lesson${isDone ? ', completed' : ''}${!unlocked ? ', locked' : ''}`}
                            aria-current={mi === modIdx && li === lesIdx && !showModQuiz ? 'page' : undefined}
                          >
                            <span className="lg-chk">{isDone ? '✓' : unlocked ? '○' : '🔒'}</span>
                            <span>{lesson.title}</span>
                            {mi === modIdx && li === lesIdx && !showModQuiz && <span className="lg-robot" aria-hidden="true">🤖</span>}
                          </button>
                        );
                      })}
                      {QUIZ_MAP.has(`m:${module.id}`) && (
                        <button
                          type="button"
                          className={`lg-btn lg-quiz ${showModQuiz && mi === modIdx ? 'act' : ''}`}
                          onClick={() => onSelectModQuiz(mi)}
                          aria-label={`Open module quiz for ${module.title}`}
                        >
                          <span className="lg-chk">📝</span>
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
              top of the sidebar (see .sb-tabs above). */}

          {/* ─── Lock toggle ─── */}
          <div className="sb-lock-row">
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
    </>
  );
});
