// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// APP LAYOUT â€” Main platform shell
// Sidebar + Topbar + Content + Toolbar + Panels
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

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
import {
  getCourseCompletedLessonCount,
  getLessonKeyVariants,
  hasLessonCompletion,
} from "../utils/lessonKeys";

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
  // ('html') on mount â€” this effect keeps it in sync as the user
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

  const { stable: stableLessonKey, legacy: legacyLessonKey } = getLessonKeyVariants(course, mod, les);
  const isDone = hasLessonCompletion(completedSet, course, mod, les);
  const readTime = useMemo(
    () => estimateReadingTime(les.content + les.code),
    [les.content, les.code],
  );
  const level = useMemo(() => getLevel(xpTotal), [xpTotal]);
  const hasProgress = completed.length > 0 || Number(lastPosition?.time) > 0;
  const showStarterGuide = !hasProgress && !showModQuiz;
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

  // â”€â”€â”€ Dynamic page title â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    const title = showModQuiz
      ? `${mod.title} Quiz â€” Cinova`
      : `${les.title} â€” Cinova`;
    document.title = title;
    return () => { document.title = 'Cinova â€” Learn. Build. Ship.'; };
  }, [les.title, mod.title, showModQuiz]);

  // â”€â”€â”€ Save position on navigation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (dataLoaded) {
      savePosition({
        course: `${course.icon} ${course.label}`,
        mod: `${mod.emoji} ${mod.title}`,
        les: showModQuiz ? "ðŸ“ Module Quiz" : les.title,
      });
      trackCourseVisit(course.id);
    }
  }, [
    course.icon,
    course.id,
    course.label,
    dataLoaded,
    les.title,
    mod.emoji,
    mod.title,
    savePosition,
    showModQuiz,
    trackCourseVisit,
  ]);

  // â”€â”€â”€ Milestone + course completion â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    panels.checkMilestone(completed.length);
  }, [completed.length, panels]);

  const courseDone = getCourseCompletedLessonCount(completedSet, course);
  const coursePct = courseTotal > 0 ? Math.round((courseDone / courseTotal) * 100) : 0;
  const isCourseComplete = courseDone === courseTotal && courseTotal > 0;

  // Prev/next lesson title previews for the nav buttons.
  const prevTitle = (() => {
    if (isFirst || showModQuiz) return null;
    if (nav.lesIdx > 0) return nav.mod.lessons[nav.lesIdx - 1]?.title || null;
    if (nav.modIdx > 0) {
      const prevMod = nav.modules[nav.modIdx - 1];
      const lastLesson = prevMod?.lessons?.[prevMod.lessons.length - 1];
      return lastLesson?.title || null;
    }
    return null;
  })();

  const nextTitle = (() => {
    if (nav.isLast) return null;
    if (nav.isLastLesson && nav.moduleQuiz && !showModQuiz) return `${nav.mod.title} Quiz`;
    if (showModQuiz) {
      const nextMod = nav.modules[nav.modIdx + 1];
      return nextMod?.lessons?.[0]?.title || null;
    }
    if (nav.lesIdx < nav.mod.lessons.length - 1) return nav.mod.lessons[nav.lesIdx + 1]?.title || null;
    const nextMod = nav.modules[nav.modIdx + 1];
    return nextMod?.lessons?.[0]?.title || null;
  })();

  const lessonPosition = showModQuiz
    ? `Module quiz for ${mod.title}`
    : `Lesson ${nav.lesIdx + 1} of ${mod.lessons.length}`;

  const nextStepHint = (() => {
    if (isLast) return "Track complete. Pick another course or review key lessons.";
    if (showModQuiz) return "Finish this quiz to move into the next module.";
    if (!isDone) return "Mark this lesson done, then continue to the next lesson.";
    return "Nice progress. Continue when you are ready.";
  })();

  useEffect(() => {
    if (isCourseComplete && isDone) {
      panels.triggerCourseComplete();
    }
  }, [isCourseComplete, isDone, panels]);

  // â”€â”€â”€ Actions â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const handleMarkDone = useCallback(async () => {
    if (marking) return;
    setMarking(true);
    try {
      const keyToToggle = completedSet.has(stableLessonKey)
        ? stableLessonKey
        : completedSet.has(legacyLessonKey)
          ? legacyLessonKey
          : stableLessonKey;
      learn.toggleLessonDone(keyToToggle);
    } finally {
      setMarking(false);
    }
  }, [completedSet, legacyLessonKey, marking, stableLessonKey, learn]);

  const handleOpenTool = useCallback(
    (tool) => panels.togglePanel(tool),
    [panels],
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
    [panels],
  );

  // â”€â”€â”€ Keyboard â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

  // â”€â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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
              {activeCourseMeta?.icon || '[]'}
            </span>
            <p className="course-skeleton-label">
              Loading {activeCourseMeta?.label || 'course'}...
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
              {isMobile ? "â˜°" : sidebarCollapsed ? "Â»" : "Â«"}
            </button>
            <Breadcrumb
              course={course}
              mod={mod}
              lesTitle={les.title}
              showModQuiz={showModQuiz}
              lessonPosition={lessonPosition}
            />
            <div className="topbar-status" aria-label="Current learning status">
              <span className="topbar-greeting">Keep building, {learnerName}.</span>
              {!showModQuiz && (
                <span className="topbar-pill" aria-label={`Estimated read time: ${readTime}`}>
                  {readTime} read
                </span>
              )}
              <span className="topbar-pill" aria-label={`Level ${level}`}>Lv {level}</span>
              <span className="topbar-pill" aria-label={`Course completion ${coursePct} percent`}>
                {coursePct}% track
              </span>
              {streak > 0 && (
                <span className="topbar-pill streak" aria-label={`${streak} day streak`}>
                  ðŸ”¥ {streak} day streak
                </span>
              )}
              {dailyCount > 0 && (
                <span className="topbar-pill warm" aria-label={`Lessons done today: ${dailyCount}`}>
                  {dailyCount} lesson{dailyCount === 1 ? '' : 's'} today
                </span>
              )}
            </div>
            <div className="topbar-actions">
              <button
                type="button"
                className={`search-trigger ui-btn ui-btn-secondary ${panels.panel === "search" ? "active" : ""}`}
                onClick={() => panels.togglePanel("search")}
                aria-label="Open lesson search"
                aria-pressed={panels.panel === "search"}
              >
                <span>ðŸ”</span>
                <span className="search-trigger-label">Search</span>
                <span className="search-trigger-mobile-hint">Tap to search</span>
                <kbd>âŒ˜K</kbd>
              </button>
              {!showModQuiz && (
              <button
                type="button"
                className={`mark-btn ui-btn ui-btn-secondary ${isDone ? "dn" : ""}`}
                onClick={handleMarkDone}
                disabled={marking}
                aria-label={marking ? "Saving lesson completion" : isDone ? "Mark lesson as not done" : "Mark lesson complete"}
                aria-pressed={isDone}
              >
                {marking ? "Saving..." : isDone ? "Completed" : "Mark complete"}
              </button>
              )}
            </div>
          </div>
        </header>

        <div className="lv-wrap">
          {showModQuiz && moduleQuiz ? (
            <div className="lv">
              <div className="lv-head">
                <span className="lv-emoji">ðŸ“</span>
                <h1 className="lv-title">{mod.title} â€” Module Quiz</h1>
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
              {showStarterGuide && (
                <section className="first-run-guide" aria-label="Getting started">
                  <div className="frg-content">
                    <p className="frg-kicker">First login</p>
                    <h2 className="frg-title">
                      Welcome to your learning path, {learnerName}.
                    </h2>
                    <p className="frg-copy">
                      You are on the first lesson to set your pace. Read this lesson,
                      complete it, then hit <strong>Mark Done</strong> to unlock the next one.
                    </p>
                    <p className="frg-sub">Pick a course track anytime in the lesson sidebar.</p>
                  </div>
                  <div className="frg-courses" aria-label="Course options">
                    {COURSES.map((entry, index) => (
                      <button
                        key={entry.id}
                        type="button"
                        className={`frg-course ${index === nav.courseIdx ? 'frg-course-active' : ''}`}
                        onClick={() => {
                          if (index !== nav.courseIdx) {
                            nav.switchCourse(index);
                          }
                        }}
                        aria-pressed={index === nav.courseIdx}
                        aria-label={`Go to ${entry.label} course`}
                      >
                        <span aria-hidden="true">{entry.icon}</span>
                        <span>{entry.label}</span>
                      </button>
                    ))}
                  </div>
                </section>
              )}
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
            className="nav-btn ui-btn ui-btn-secondary"
            onClick={nav.prev}
            disabled={isFirst}
            aria-label={prevTitle ? `Previous lesson: ${prevTitle}` : 'Previous lesson'}
          >
            <span className="nav-btn-dir" aria-hidden="true">â†</span>
            <span className="nav-btn-text">
              {prevTitle ? (
                <>
                  <span className="nav-btn-label">Previous lesson</span>
                  <span className="nav-btn-title">{prevTitle}</span>
                </>
              ) : 'Previous lesson'}
            </span>
          </button>
          <button
            type="button"
            className="nav-btn nx ui-btn ui-btn-primary"
            onClick={nav.next}
            disabled={isLast}
            style={{ background: course.accent }}
            aria-label={
              isLast ? 'Course complete' :
              nextTitle ? `Next: ${nextTitle}` : 'Next lesson'
            }
          >
            <span className="nav-btn-text">
              {isLast ? (
                'Track complete'
              ) : nextTitle ? (
                <>
                  <span className="nav-btn-label">Up next</span>
                  <span className="nav-btn-title">{nextTitle}</span>
                </>
              ) : 'Next lesson'}
            </span>
            <span className="nav-btn-dir" aria-hidden="true">â†’</span>
          </button>
        </nav>
        <p className="nav-guidance" role="status" aria-live="polite">
          {nextStepHint}
        </p>
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
          lessonPosition={lessonPosition}
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

