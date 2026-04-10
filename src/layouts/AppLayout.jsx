// ═══════════════════════════════════════════════
// APP LAYOUT — Main platform shell
// Sidebar + Topbar + Content + Toolbar + Panels
// ═══════════════════════════════════════════════

import { useCallback, useMemo, useEffect, useState } from "react";
import { COURSES } from "../data";
import { useTheme, useAuth, useProgress } from "../providers";
import { useNavigation } from "../hooks/useNavigation";
import { usePanels } from "../hooks/usePanels";
import { useKeyboardNav } from "../hooks/useKeyboardNav";
import { useLearning } from "../hooks/useLearning";
import { useIsMobile } from "../hooks/useIsMobile";
import { estimateReadingTime } from "../utils/helpers";

// Layout components
import { Sidebar } from "../components/layout/Sidebar";
import { Breadcrumb } from "../components/layout/Breadcrumb";
import { ThemeToggle } from "../components/layout/ThemeToggle";
import { BottomToolbar } from "../components/layout/BottomToolbar";
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

export function AppLayout() {
  const { theme } = useTheme();
  const { profile } = useAuth();
  const {
    completed = [],
    completedSet = new Set(),
    savePosition,
    trackCourseVisit,
    dataLoaded,
    lastPosition,
  } = useProgress();

  const nav = useNavigation();
  const panels = usePanels({ dataLoaded, user: true, lastPosition });
  const learn = useLearning();
  const isMobile = useIsMobile(901);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("chw-sidebar-collapsed") === "true";
  });

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
  const [marking, setMarking] = useState(false);
  const isSidebarOpen = isMobile ? panels.sidebar : true;

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(false);
    }
  }, [isMobile]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("chw-sidebar-collapsed", String(sidebarCollapsed));
  }, [sidebarCollapsed]);

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

  const toolbarHandlers = useMemo(
    () => ({
      onCheatsheet: () => panels.setPanel("cheatsheet"),
      onGlossary: () => panels.setPanel("glossary"),
      onProjects: () => panels.setPanel("projects"),
      onBadges: () => panels.setPanel("badges"),
      onSR: () => panels.setPanel("sr"),
      onBookmarks: () => panels.setPanel("bookmarks"),
      onChallenges: () => panels.setPanel("challenges"),
      onStats: () => panels.setPanel("stats"),
    }),
    [panels.setPanel],
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
  return (
    <div className={`shell ${theme}`} data-course={course.id}>
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
      />

      <main className="mn" ref={mainRef}>
        <div className="topbar">
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
            <div className="topbar-actions">
              {!showModQuiz && (
                <span className="read-time">
                  <span className="rt-icon">⏱</span>
                  {readTime} min
                </span>
              )}
              <button
                type="button"
                className="search-trigger"
                onClick={() => panels.setPanel("search")}
                aria-label="Open lesson search"
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
        </div>

        <div className="lv-wrap">
          {showModQuiz && moduleQuiz ? (
            <div className="lv">
              <div className="lv-head">
                <span className="lv-emoji">📝</span>
                <h2 className="lv-title">{mod.title} — Module Quiz</h2>
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

        <div className="nav-row">
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
        </div>
      </main>

      <ThemeToggle />
      <BottomToolbar {...toolbarHandlers} />
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
    </div>
  );
}
