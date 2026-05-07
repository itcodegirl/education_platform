// ===============================================
// APP LAYOUT - Main platform shell
// Sidebar + Topbar + Content + Toolbar + Panels
// ===============================================

import { useCallback, useMemo, useEffect, useState } from "react";
import { useFetcher } from "react-router-dom";
import { COURSES } from "../data";
import { useTheme, useAuth, useProgressData, useXP, useCourseContent } from "../providers";
import { useNavigation } from "../hooks/useNavigation";
import { usePanels } from "../hooks/usePanels";
import { useKeyboardNav } from "../hooks/useKeyboardNav";
import { useLearning } from "../hooks/useLearning";
import { useIsMobile } from "../hooks/useIsMobile";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useFetcherSyncFailure } from "../hooks/useFetcherSyncFailure";
import { useLessonViewTracking } from "../hooks/useLessonViewTracking";
import { useLessonMarkDone } from "../hooks/useLessonMarkDone";
import { estimateReadingTime, getLevel } from "../utils/helpers";
import { trackEvent } from "../lib/analytics";
import {
  getCourseCompletedLessonCount,
  getLessonKeyVariants,
  hasLessonCompletion,
} from "../utils/lessonKeys";
import {
  getLessonPositionLabel,
  getNextLessonTitle,
  getNextStepHint,
  getPrevLessonTitle,
} from "../utils/lessonNavCopy";
import { getSyncStatusCopy } from "../utils/syncStatusCopy";

// Layout components
import { Sidebar } from "../components/layout/Sidebar";
import { Breadcrumb } from "../components/layout/Breadcrumb";
import { ThemeToggle } from "../components/layout/ThemeToggle";
import { BottomToolbar } from "../components/layout/BottomToolbar";
import { LessonNavBar } from "../components/layout/LessonNavBar";
import { MobileToolsSheet } from "../components/layout/MobileToolsSheet";
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
    loadError,
    syncFailed = 0,
    pendingSyncWrites = 0,
    syncRetryInFlight = false,
    markSyncFailed = () => {},
    enqueuePendingSyncWrite = () => false,
  } = useProgressData();
  const { xpTotal = 0, streak = 0, pausedStreak = null, dailyCount = 0 } = useXP();

  const nav = useNavigation();
  const panels = usePanels({ dataLoaded, user, lastPosition });
  const learn = useLearning();
  const isMobile = useIsMobile(901);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
    "chw-sidebar-collapsed",
    false,
  );
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  // Lazy-load the currently-selected course's lesson content. The
  // CourseContentProvider caches loads and auto-fetches the default
  // ('html') on mount - this effect keeps it in sync as the user
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
  const goNextLesson = nav.next;

  const { stable: stableLessonKey, legacy: legacyLessonKey } = getLessonKeyVariants(course, mod, les);
  const isDone = hasLessonCompletion(completedSet, course, mod, les);
  const readTime = useMemo(
    () => estimateReadingTime((les.content || '') + (les.code || '')),
    [les.content, les.code],
  );
  const level = useMemo(() => getLevel(xpTotal), [xpTotal]);
  const hasProgress = completed.length > 0 || Number(lastPosition?.time) > 0;
  const showStarterGuide = !hasProgress && !showModQuiz;
  // "Builder" was the previous fallback. It's well-meaning but
  // reads as scripted. "there" reads as a normal greeting when no
  // display name is set ("Keep building, there.") and avoids
  // gendered or jargon-y framing.
  const learnerName =
    profile?.display_name ||
    user?.user_metadata?.display_name ||
    user?.email?.split("@")[0] ||
    "there";
  const isSidebarOpen = isMobile ? panels.sidebar : true;

  useEffect(() => {
    if (isMobile) {
      setSidebarCollapsed(false);
    }
  }, [isMobile, setSidebarCollapsed]);

  useEffect(() => {
    if (!isMobile) {
      setMobileToolsOpen(false);
    }
  }, [isMobile]);

  // --- Dynamic page title -------------------
  useDocumentTitle(showModQuiz ? `${mod.title} Quiz` : les.title);

  // --- Save position on navigation ----------
  useEffect(() => {
    if (dataLoaded) {
      savePosition({
        course: `${course.icon} ${course.label}`,
        mod: `${mod.emoji} ${mod.title}`,
        les: showModQuiz ? "Module Quiz" : les.title,
        courseId: course.id,
        moduleId: mod.id,
        lessonId: les.id,
        isModuleQuiz: showModQuiz,
      });
      trackCourseVisit(course.id);
    }
  }, [
    course.icon,
    course.id,
    course.label,
    dataLoaded,
    les.id,
    les.title,
    mod.emoji,
    mod.id,
    mod.title,
    savePosition,
    showModQuiz,
    trackCourseVisit,
  ]);

  // --- Milestone + course completion --------
  useEffect(() => {
    panels.checkMilestone(completed.length);
  }, [completed.length, panels]);

  const courseDone = getCourseCompletedLessonCount(completedSet, course);
  const coursePct = courseTotal > 0 ? Math.round((courseDone / courseTotal) * 100) : 0;
  const isCourseComplete = courseDone === courseTotal && courseTotal > 0;

  // Prev/next lesson title previews for the nav buttons. The
  // pure helpers in utils/lessonNavCopy.js own the gnarly
  // boundary conditions so this layout file stays readable.
  const prevTitle = getPrevLessonTitle({
    isFirst,
    showModQuiz,
    modIdx: nav.modIdx,
    lesIdx: nav.lesIdx,
    mod: nav.mod,
    modules: nav.modules,
  });
  const nextTitle = getNextLessonTitle({
    isLast,
    isLastLesson: nav.isLastLesson,
    moduleQuiz: nav.moduleQuiz,
    showModQuiz,
    modIdx: nav.modIdx,
    lesIdx: nav.lesIdx,
    mod: nav.mod,
    modules: nav.modules,
  });
  const lessonPosition = getLessonPositionLabel({
    showModQuiz,
    modTitle: mod.title,
    lesIdx: nav.lesIdx,
    lessonsLength: mod.lessons.length,
  });
  const mutationActionPath = `/learn/${encodeURIComponent(course.id)}/${encodeURIComponent(
    mod.id,
  )}/${encodeURIComponent(showModQuiz ? 'quiz' : les.id)}`;

  const nextStepHint = getNextStepHint({ isLast, showModQuiz, isDone });
  const currentStepTitle = showModQuiz
    ? 'Take the module quiz'
    : isDone
      ? 'Continue when ready'
      : 'Read, then complete lesson';
  const currentStepCopy = showModQuiz
    ? 'Answer the questions, then move into the next lesson when you are ready.'
    : isDone
      ? nextTitle
        ? `Lesson complete here. Up next: ${nextTitle}.`
        : 'Lesson complete here. Pick another course or revisit lessons that need another pass.'
      : 'Focus on the lesson first. When the idea clicks, use Complete lesson to save this step.';

  // --- Lesson view analytics ----------------
  const lessonViewStartRef = useLessonViewTracking({
    courseId: course.id,
    moduleId: mod.id,
    lessonId: les.id,
    courseIndex: nav.courseIdx,
    moduleIndex: nav.modIdx,
    lessonIndex: nav.lesIdx,
    showModQuiz,
  });

  useEffect(() => {
    if (isCourseComplete && isDone) {
      panels.triggerCourseComplete();
    }
  }, [isCourseComplete, isDone, panels]);

  // --- Actions ------------------------------
  const progressMutation = useFetcher();
  useFetcherSyncFailure(
    progressMutation,
    { markSyncFailed, enqueuePendingSyncWrite },
    'lesson progress',
  );
  const { marking, handleMarkDone } = useLessonMarkDone({
    completedSet,
    stableLessonKey,
    legacyLessonKey,
    courseId: course.id,
    moduleId: mod.id,
    lessonId: les.id,
    mutationActionPath,
    progressMutation,
    toggleLessonDone: learn.toggleLessonDone,
    lessonViewStartRef,
  });
  const syncStatus = getSyncStatusCopy({
    user,
    dataLoaded,
    loadError,
    pendingSyncWrites,
    syncFailed,
    syncRetryInFlight,
    marking,
    mutationState: progressMutation.state,
  });

  const handleNextLesson = useCallback(() => {
    trackEvent('lesson_next_clicked', {
      courseId: course.id,
      moduleId: mod.id,
      lessonId: les.id,
      isModuleQuiz: showModQuiz,
      isLastLesson,
      hasModuleQuiz: Boolean(moduleQuiz),
    });
    goNextLesson();
  }, [course.id, goNextLesson, isLastLesson, les.id, mod.id, moduleQuiz, showModQuiz]);

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
  const mobileTools = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        helper: "Find a lesson",
        onSelect: () => panels.togglePanel("search"),
      },
      {
        key: "bookmarks",
        label: "Saved",
        helper: "Saved lessons",
        onSelect: toolbarHandlers.onBookmarks,
      },
      {
        key: "stats",
        label: "Progress",
        helper: "Course status",
        onSelect: toolbarHandlers.onStats,
      },
      {
        key: "sr",
        label: "Review",
        helper: "Spaced practice",
        onSelect: toolbarHandlers.onSR,
      },
      {
        key: "challenges",
        label: "Challenges",
        helper: "Hands-on builds",
        onSelect: toolbarHandlers.onChallenges,
      },
      {
        key: "cheatsheet",
        label: "Cheat sheets",
        helper: "Quick references",
        onSelect: toolbarHandlers.onCheatsheet,
      },
      {
        key: "glossary",
        label: "Glossary",
        helper: "Term lookup",
        onSelect: toolbarHandlers.onGlossary,
      },
      {
        key: "projects",
        label: "Projects",
        helper: "Build ideas",
        onSelect: toolbarHandlers.onProjects,
      },
      {
        key: "badges",
        label: "Badges",
        helper: "In-app milestones",
        onSelect: toolbarHandlers.onBadges,
      },
    ],
    [panels, toolbarHandlers],
  );

  useEffect(() => {
    setMobileToolsOpen(false);
  }, [panels.panel]);

  // --- Keyboard -----------------------------
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

  // --- Render -------------------------------
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
        <main id="main-content" className="main-shell course-skeleton" tabIndex={-1} aria-busy="true" aria-live="polite">
          <div className="course-skeleton-inner">
            <span className="course-skeleton-emoji" aria-hidden="true">
              {activeCourseMeta?.icon || '📚'}
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
        onSelectLesson={(mi, li) => {
          nav.go(mi, li);
          if (isMobile) panels.setSidebar(false);
        }}
        onSelectModQuiz={(mi) => {
          nav.goToModQuiz(mi);
          panels.setSidebar(false);
        }}
        onOpenTool={handleOpenTool}
        activePanel={panels.panel}
      />

      <main className="main-shell" ref={mainRef} id="main-content" tabIndex={-1}>
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
              <span className="ham-glyph" aria-hidden="true">
                {isMobile ? '☰' : sidebarCollapsed ? '›' : '‹'}
              </span>
              <span className="ham-label">
                {isMobile ? 'Menu' : sidebarCollapsed ? 'Expand' : 'Collapse'}
              </span>
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
              {/* Hide the level + completion pills entirely until the
                  learner has earned something. A first-run learner
                  used to see "Lv 1 · 0% track" before they'd done
                  anything, which read as "you have achieved
                  nothing" instead of a status. */}
              {xpTotal > 0 && (
                <span className="topbar-pill" aria-label={`Level ${level}`}>Lv {level}</span>
              )}
              {coursePct > 0 && (
                <span className="topbar-pill" aria-label={`Course completion ${coursePct} percent`}>
                  {coursePct}% track
                </span>
              )}
              {streak > 0 ? (
                <span className="topbar-pill streak" aria-label={`${streak} day streak`}>
                  Streak: {streak} day{streak === 1 ? '' : 's'}
                </span>
              ) : pausedStreak ? (
                /* Streak just lapsed. Surface the prior run as a
                   subtle recovery cue so the topbar doesn't simply
                   forget the streak existed. Click goes to the
                   profile so the learner can see history; intent is
                   visible signaling, not nagging. */
                <span
                  className="topbar-pill paused"
                  aria-label={`${pausedStreak.days} day streak paused`}
                  title="Pick up your streak with one more lesson today"
                >
                  Streak paused: {pausedStreak.days} day{pausedStreak.days === 1 ? '' : 's'}
                </span>
              ) : null}
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
                <span className="search-trigger-label">Search</span>
                <span className="search-trigger-mobile-hint">Tap to search</span>
                <kbd>Ctrl+K</kbd>
              </button>
              {!showModQuiz && (
              <button
                  type="button"
                  className={`mark-btn ${isDone ? "dn" : ""}`}
                  onClick={handleMarkDone}
                  disabled={marking}
                  aria-label={marking ? "Saving lesson progress" : isDone ? "Mark lesson as incomplete" : "Complete lesson and save progress"}
                  aria-pressed={isDone}
                >
                  {marking ? "Saving…" : isDone ? "✓ Complete" : "Complete lesson"}
                </button>
              )}
            </div>
          </div>
        </header>

        <div className="lesson-container">
          {showModQuiz && moduleQuiz ? (
            <div className="lesson-surface">
              <div className="lesson-head">
                <span className="lesson-emoji" aria-hidden="true">Q</span>
                <h1 className="lesson-title">{mod.title} - Module Quiz</h1>
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
                      complete it, then use <strong>Complete lesson</strong> to save this step.
                    </p>
                    <p className="frg-sub">Course switching is in the sidebar when you are ready.</p>
                  </div>
                  <ol className="frg-steps" aria-label="First session steps">
                    <li>Read the learning frame.</li>
                    <li>Build the example and check the result.</li>
                    <li>Mark complete, then take the quick check.</li>
                  </ol>
                </section>
              )}
              <section className="lesson-focus-strip" aria-label="Current lesson step">
                <span className="lesson-focus-eyebrow">{lessonPosition}</span>
                <strong>{currentStepTitle}</strong>
                <span>{currentStepCopy}</span>
                <span
                  className={`lesson-sync-status lesson-sync-status-${syncStatus.tone}`}
                  role="status"
                  aria-live="polite"
                  aria-atomic="true"
                >
                  <span className="lesson-sync-dot" aria-hidden="true" />
                  <span className="lesson-sync-copy">
                    <span className="lesson-sync-label">{syncStatus.label}</span>
                    <span className="lesson-sync-detail">{syncStatus.detail}</span>
                  </span>
                </span>
              </section>
              <LessonView
                lesson={les}
                emoji={mod.emoji}
                lang={course.id}
                lessonKey={lessonKey}
                courseId={course.id}
                moduleTitle={mod.title}
                nextTitle={nextTitle}
              />
              {lessonQuiz && (
                <div className="lesson-quiz-wrap">
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
            <span className="nav-btn-dir" aria-hidden="true">←</span>
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
            onClick={handleNextLesson}
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
            <span className="nav-btn-dir" aria-hidden="true">→</span>
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
          onNext={handleNextLesson}
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
          onOpenTools={() => setMobileToolsOpen((open) => !open)}
          toolsOpen={mobileToolsOpen}
        />
      ) : (
        <BottomToolbar activePanel={panels.panel} {...toolbarHandlers} />
      )}
      <MobileToolsSheet
        isOpen={isMobile && mobileToolsOpen}
        onClose={() => setMobileToolsOpen(false)}
        tools={mobileTools}
        activePanel={panels.panel}
      />
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





