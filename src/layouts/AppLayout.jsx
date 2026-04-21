// ═══════════════════════════════════════════════
// APP LAYOUT — Main platform shell
// Sidebar + Topbar + Content + Toolbar + Panels
// ═══════════════════════════════════════════════

import { useCallback, useMemo, useEffect, useState } from "react";
import { COURSES } from "../data";
import { useTheme, useAuth, useProgressData, useXP, useCourseContent } from "../providers";
import { useNavigation } from "../hooks/useNavigation";
import { usePanels } from "../hooks/usePanels";
import { useKeyboardNav } from "../hooks/useKeyboardNav";
import { useLearning } from "../hooks/useLearning";
import { useIsMobile } from "../hooks/useIsMobile";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { estimateReadingTime, getLevel } from "../utils/helpers";

// Layout components
import { Sidebar } from "../components/layout/Sidebar";
import { Breadcrumb } from "../components/layout/Breadcrumb";
import { ThemeToggle } from "../components/layout/ThemeToggle";
import { BottomToolbar } from "../components/layout/BottomToolbar";
import { LessonNavBar } from "../components/layout/LessonNavBar";
import { OfflineIndicator } from "../components/layout/OfflineIndicator";

// Learning components
import { LessonView } from "../components/learning/LessonView";
import { QuizView } from "../components/learning/QuizView";

// Gamification (small, always visible)
import { XPPopup } from "../components/gamification/XPPopup";
import { BadgeUnlock } from "../components/gamification/BadgeUnlock";

// Lazy panels + overlays
import { PanelManager } from "../components/PanelManager";
import { WhatsNew } from "../components/shared/WhatsNew";
import { EmailVerifyBanner } from "../components/shared/EmailVerifyBanner";
import { BreakPrompt } from "../components/shared/BreakPrompt";

export function AppLayout() {
  const { theme } = useTheme();
  const { profile, user } = useAuth();
  const {
    completed = [],
    completedSet = new Set(),
    savePosition,
    trackCourseVisit,
    dataLoaded,
    lastPosition,
  } = useProgressData();
  const { xpTotal = 0, streak = 0, dailyCount = 0 } = useXP();

  const nav = useNavigation();
  const panels = usePanels({ dataLoaded, user: true, lastPosition });
  const learn = useLearning();
  const isMobile = useIsMobile(901);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
    "chw-sidebar-collapsed",
    false,
  );

  // Lazy-load the currently-selected course's lesson content. The
  // CourseContentProvider caches loads and auto-fetches the default
  // ('html') on mount — this effect keeps it in sync as the user
  // switches courses so we don't over-fetch.
  const {
    setActiveCourseId,
    isActiveCourseLoaded,
    isCourseLoaded,
  } = useCourseContent();
  const activeCourseMeta = COURSES[nav.courseIdx];
  useEffect(() => {
    if (activeCourseMeta?.id) {
      setActiveCourseId(activeCourseMeta.id);
    }
  }, [activeCourseMeta?.id, setActiveCourseId]);
  // While the active course's modules are in flight we render a
  // minimal skeleton instead of the lesson view. Without this gate
  // useNavigation would briefly resolve to EMPTY_LESSON / EMPTY_MODULE
  // and flash undefined-looking UI.
  const activeCourseReady =
    isActiveCourseLoaded ||
    (activeCourseMeta?.id && isCourseLoaded(activeCourseMeta.id));

  const {
    course,
    modules,
    mod,
    les,
    lessonKey,
    lessonQuiz,
    moduleQuiz,
    courseTotal,
    isFirst,
    isLast,
    isLastLesson,
    mainRef,
    showModQuiz,
  } = nav;

  const isDone = completedSet.has(lessonKey);
  const readTime = useMemo(
    () => estimateReadingTime(les.content + les.code),
    [les.content, les.code],
  );
  const level = useMemo(() => getLevel(xpTotal), [xpTotal]);
  const learnerName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "Builder";
  const [marking, setMarking] = useState(false);
  const isSidebarOpen = isMobile ? panels.sidebar : true;

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(false);
    }
  }, [isMobile, setSidebarCollapsed]);

  // ─── Dynamic page title ───────────────────
  useEffect(() => {
    const title = showModQuiz
      ? `${mod.title} Quiz — CodeHerWay`
      : `${les.title} — CodeHerWay`;
    document.title = title;
    return () => { document.title = 'CodeHerWay — Learn. Build. Ship.'; };
  }, [les.title, mod.title, showModQuiz]);

  // ─── Save position on navigation ──────────
  useEffect(() => {
    if (dataLoaded) {
      savePosition({
        course: `${course.icon} ${course.label}`,
        mod: `${mod.emoji} ${mod.title}`,
        les: showModQuiz ? "📝 Module Quiz" : les.title,
      });
      trackCourseVisit(course.id);
    }
  }, [nav.courseIdx, nav.modIdx, nav.lesIdx, showModQuiz, dataLoaded]);

  // ─── Milestone + course completion ────────
  useEffect(() => {
    panels.checkMilestone(completed.length);
  }, [completed.length]);

  const courseDone = completed.filter((k) => k.startsWith(course.label)).length;
  const coursePct = courseTotal > 0 ? Math.round((courseDone / courseTotal) * 100) : 0;
  const isCourseComplete = courseDone === courseTotal && courseTotal > 0;

  useEffect(() => {
    if (isCourseComplete && isDone) {
      panels.triggerCourseComplete();
    }
  }, [isCourseComplete, isDone]);

  // ─── Actions ──────────────────────────────
  const handleMarkDone = useCallback(async () => {
    if (marking) return;
    setMarking(true);
    try {
      learn.toggleLessonDone(lessonKey);
    } finally {
      setMarking(false);
    }
  }, [lessonKey, marking, learn]);

  const handleOpenTool = useCallback(
    (tool) => panels.togglePanel(tool),
    [panels.togglePanel],
  );

  const toolbarHandlers = useMemo(
    () => ({
      onCheatsheet: () => panels.togglePanel("cheatsheet"),
      onGlossary: () => panels.togglePanel("glossary"),
      onProjects: () => panels.togglePanel("projects"),
      onBadges: () => panels.togglePanel("badges"),
      onSR: () => panels.togglePanel("sr"),
      onBookmarks: () => panels.togglePanel("bookmarks"),
      onChallenges: () => panels.togglePanel("challenges"),
      onStats: () => panels.togglePanel("stats"),
    }),
    [panels.togglePanel],
  );

  // ─── Keyboard ─────────────────────────────
  useKeyboardNav({
    onNext: nav.next,
    onPrev: nav.prev,
    onMarkDone: handleMarkDone,
    onSearch: () => panels.togglePanel("search"),
    onSwitchCourse: nav.switchCourse,
    onToggleSidebar: () => {
      if (isMobile) {
        panels.setSidebar((s) => !s);
        return;
      }
      setSidebarCollapsed((value) => !value);
    },
  });

  // ─── Render ───────────────────────────────
  // If the active course's content hasn't finished lazy-loading,
  // show a minimal skeleton instead of the lesson UI. This is fast
  // (~100-300ms on a warm cache, once per course per session) and
  // prevents the hot path from rendering empty lesson data.
  if (!activeCourseReady) {
    return (
      <div className={`shell ${theme}`} data-course={activeCourseMeta?.id || 'html'}>
        <a className="skip-link" href="#main-content">Skip to main content</a>
        <EmailVerifyBanner />
        <OfflineIndicator />
        <main id="main-content" className="mn course-skeleton" aria-busy="true" aria-live="polite">
          <div className="course-skeleton-inner">
            <span className="course-skeleton-emoji" aria-hidden="true">
              {activeCourseMeta?.icon || '⚡'}
            </span>
            <p className="course-skeleton-label">
              Loading {activeCourseMeta?.label || 'course'}…
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className={`shell ${theme}`} data-course={course.id}>
      <a className="skip-link" href="#main-content">Skip to main content</a>
      <EmailVerifyBanner />
      <OfflineIndicator />
      <Sidebar
        courses={COURSES}
        courseIdx={nav.courseIdx}
        modIdx={nav.modIdx}
        lesIdx={nav.lesIdx}
        showModQuiz={showModQuiz}
        isOpen={isSidebarOpen}
        isMobile={isMobile}
        isCollapsed={sidebarCollapsed}
        onClose={() => panels.setSidebar(false)}
        onToggleCollapse={() => setSidebarCollapsed((value) => !value)}
        onSelectCourse={nav.switchCourse}
        onSelectLesson={nav.go}
        onSelectModQuiz={(mi) => {
          nav.goToModQuiz(mi);
          panels.setSidebar(false);
        }}
        onOpenTool={handleOpenTool}
        activePanel={panels.panel}
      />

      <main className="mn" ref={mainRef} id="main-content">
        <header className="topbar">
          <div className="topbar-inner">
            <button
              type="button"
              className="ham"
              onClick={() => {
                if (isMobile) {
                  panels.setSidebar(true);
                  return;
                }
                setSidebarCollapsed((value) => !value);
              }}
              aria-label={isMobile ? "Open course navigation" : sidebarCollapsed ? "Expand course navigation" : "Collapse course navigation"}
              aria-controls="course-sidebar"
              aria-expanded={isMobile ? panels.sidebar : !sidebarCollapsed}
            >
              {isMobile ? "☰" : sidebarCollapsed ? "»" : "«"}
            </button>
            <Breadcrumb
              course={course}
              mod={mod}
              lesTitle={les.title}
              showModQuiz={showModQuiz}
            />
            <div className="topbar-status" aria-label="Current learning status">
              <span className="topbar-greeting">Keep building, {learnerName}.</span>
              {!showModQuiz && <span className="topbar-pill">{readTime} read</span>}
              <span className="topbar-pill">Lv {level}</span>
              <span className="topbar-pill">{coursePct}% track</span>
              {streak > 0 && <span className="topbar-pill streak">🔥 {streak} day streak</span>}
              {dailyCount > 0 && <span className="topbar-pill warm">{dailyCount} lesson{dailyCount === 1 ? '' : 's'} today</span>}
            </div>
            <div className="topbar-actions">
              <button
                type="button"
                className={`search-trigger ${panels.panel === "search" ? "active" : ""}`}
                onClick={() => panels.togglePanel("search")}
                aria-label="Open lesson search"
                aria-pressed={panels.panel === "search"}
              >
                <span>🔍</span>
                <span>Search</span>
                <kbd>⌘K</kbd>
              </button>
              {!showModQuiz && (
                <button
                  type="button"
                  className={`mark-btn ${isDone ? "dn" : ""}`}
                  onClick={handleMarkDone}
                  disabled={marking}
                >
                  {marking ? "..." : isDone ? "✓ Done" : "Mark Done"}
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="lv-wrap">
          {showModQuiz && moduleQuiz ? (
            <div className="lv">
              <div className="lv-head">
                <span className="lv-emoji">📝</span>
                <h1 className="lv-title">{mod.title} — Module Quiz</h1>
              </div>
              <p className="lp">
                Test your knowledge of <strong>{mod.title}</strong>.
              </p>
              <QuizView
                quiz={moduleQuiz}
                accent={course.accent}
                label={`${mod.title} Quiz`}
                quizKey={`m:${mod.id}`}
              />
            </div>
          ) : (
            <>
              <LessonView
                lesson={les}
                emoji={mod.emoji}
                lang={course.id}
                lessonKey={lessonKey}
                courseId={course.id}
                moduleTitle={mod.title}
              />
              {lessonQuiz && (
                <div className="lv-quiz-wrap">
                  <QuizView
                    quiz={lessonQuiz}
                    accent={course.accent}
                    label="Quick Check"
                    quizKey={`l:${les.id}`}
                  />
                </div>
              )}
            </>
          )}
        </div>

        <nav className="nav-row" aria-label="Lesson pagination">
          <button
            type="button"
            className="nav-btn"
            onClick={nav.prev}
            disabled={isFirst}
          >
            ← Previous
          </button>
          <button
            type="button"
            className="nav-btn nx"
            onClick={nav.next}
            disabled={isLast}
            style={{ background: course.accent }}
          >
            {isLast
              ? "Course Complete! 🎉"
              : isLastLesson && moduleQuiz && !showModQuiz
                ? "Module Quiz →"
                : "Next →"}
          </button>
        </nav>
      </main>

      <ThemeToggle />
      {isMobile ? (
        <LessonNavBar
          onPrev={nav.prev}
          onNext={nav.next}
          onMarkDone={handleMarkDone}
          isFirst={isFirst}
          isLast={isLast}
          isLastLesson={isLastLesson}
          isDone={isDone}
          marking={marking}
          showModQuiz={showModQuiz}
          hasModuleQuiz={!!moduleQuiz}
          accent={course.accent}
        />
      ) : (
        <BottomToolbar activePanel={panels.panel} {...toolbarHandlers} />
      )}
      <XPPopup />
      <BadgeUnlock />
      <PanelManager
        panels={panels}
        nav={nav}
        course={course}
        profile={profile}
        completed={completed}
        lastPosition={lastPosition}
        courseTotal={courseTotal}
      />
      <WhatsNew />
      <BreakPrompt />
    </div>
  );
}
