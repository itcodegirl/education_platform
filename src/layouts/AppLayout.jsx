// ===============================================
// APP LAYOUT - Main platform shell
// Sidebar + Topbar + Content + Toolbar + Panels
// ===============================================

import { useCallback, useMemo, useEffect, useState } from "react";
import { COURSES } from "../data";
import { useTheme, useAuth, useProgressData, useXP, useSR } from "../providers";
import { useNavigation } from "../hooks/useNavigation";
import { usePanels } from "../hooks/usePanels";
import { useKeyboardNav } from "../hooks/useKeyboardNav";
import { useLearning } from "../hooks/useLearning";
import { useActiveCourseReadiness } from "../hooks/useActiveCourseReadiness";
import { useIsMobile } from "../hooks/useIsMobile";
import { useMobileKeyboardOpen } from "../hooks/useMobileKeyboardOpen";
import { useLocalStorage } from "../hooks/useLocalStorage";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import { useLessonViewTracking } from "../hooks/useLessonViewTracking";
import { useMarkLessonDone } from "../hooks/useMarkLessonDone";
import { useLearningToolActions } from "../hooks/useLearningToolActions";
import { estimateReadingTime, getLevel } from "../utils/helpers";
import { trackEvent } from "../lib/analytics";
import {
  getCourseCompletedLessonCount,
  getLessonKeyVariants,
  hasLessonCompletion,
} from "../utils/lessonKeys";
import {
  buildLegacyQuizKey,
  buildStableQuizKey,
  getBestQuizScoreValue,
} from "../utils/quizKeys";
import {
  getCurrentStepCopy,
  getLessonPositionLabel,
  getNextLessonTitle,
  getNextStepHint,
  getPrevLessonTitle,
} from "../utils/lessonNavCopy";
import { getLessonCompletionActionCopy } from "../utils/lessonCompletionCopy";
import { getSyncStatusCopy } from "../utils/syncStatusCopy";
import { getLessonMasteryStatus } from "../utils/lessonMasteryStatus";
import { getDailyLearningLoopSteps } from "../utils/dailyLearningLoop";
import { getLearningLoopActionPayload } from "../utils/learningAnalyticsPayloads";
import { getResumeRecommendation } from "../utils/resumeRecommendation";
import { requestOfflineLessonCache } from "../utils/offlineLessonCache";

// Layout components
import { Sidebar } from "../components/layout/Sidebar";
import { LessonShellTopbar } from "../components/layout/LessonShellTopbar";
import { ThemeToggle } from "../components/layout/ThemeToggle";
import { BottomToolbar } from "../components/layout/BottomToolbar";
import { LessonNavBar } from "../components/layout/LessonNavBar";
import { LessonPagination } from "../components/layout/LessonPagination";
import { MobileToolsSheet } from "../components/layout/MobileToolsSheet";
import { OfflineIndicator } from "../components/layout/OfflineIndicator";
import { FirstRunGuide } from "../components/layout/FirstRunGuide";
import { LessonFocusStrip } from "../components/layout/LessonFocusStrip";
import { DailyLearningLoop } from "../components/layout/DailyLearningLoop";
import { ResumeNextPanel } from "../components/layout/ResumeNextPanel";

// Learning components
import { ErrorBoundary } from "../components/shared/ErrorBoundary";
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
    quizScores = {},
    syncFailed = 0,
    pendingSyncWrites = 0,
    syncRetryInFlight = false,
    retryPendingSyncWrites = () => {},
  } = useProgressData();
  const { xpTotal = 0, streak = 0, pausedStreak = null, dailyCount = 0 } = useXP();
  const { srCards = [], bookmarks = [] } = useSR();

  const nav = useNavigation();
  const panels = usePanels({ dataLoaded, user, lastPosition });
  const learn = useLearning();
  const isMobile = useIsMobile(901);
  const mobileKeyboardOpen = useMobileKeyboardOpen(isMobile);
  const [sidebarCollapsed, setSidebarCollapsed] = useLocalStorage(
    "chw-sidebar-collapsed",
    false,
  );
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  const activeCourseMeta = COURSES[nav.courseIdx];
  // While the active course's modules are in flight we render a
  // minimal skeleton instead of the lesson view. Without this gate
  // useNavigation would briefly resolve to EMPTY_LESSON / EMPTY_MODULE
  // and flash undefined-looking UI.
  const activeCourseReady = useActiveCourseReadiness(activeCourseMeta);

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
  const goToCourseModule = nav.goToCourseModule;

  const { stable: stableLessonKey, legacy: legacyLessonKey } = getLessonKeyVariants(course, mod, les);
  const isDone = hasLessonCompletion(completedSet, course, mod, les);
  // Reading-time estimate is the prose path only. Including the
  // code block would inflate the figure (~200 wpm reading prose is
  // not the same as scanning code) and surface a misleading number
  // in the topbar pill.
  const readTime = useMemo(() => {
    const mins = estimateReadingTime(les.content || '');
    return `${mins} min`;
  }, [les.content]);
  const level = useMemo(() => getLevel(xpTotal), [xpTotal]);
  const hasProgress = completed.length > 0 || Number(lastPosition?.time) > 0;
  const hasCompletedProgress = completed.length > 0;
  const showStarterGuide = !hasProgress && !showModQuiz;
  // Resolved display name when one exists; null otherwise. Surfaces
  // that need a textual fallback ("Continue learning, there." reads
  // cold) decide locally how to handle the null case — the topbar
  // drops the salutation entirely; FirstRunGuide uses an open-form
  // sentence that doesn't require a name. This avoids cycling through
  // awkward placeholders ("Builder" / "there") that read as scripted.
  const learnerName =
    profile?.display_name?.trim() ||
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.display_name?.trim() ||
    null;
  const isSidebarOpen = isMobile ? panels.sidebar : true;
  const shellClassName = `shell ${theme}${mobileKeyboardOpen ? ' keyboard-open' : ''}`;

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

  useEffect(() => {
    if (!dataLoaded || showModQuiz) return;

    requestOfflineLessonCache({
      path: mutationActionPath,
      courseId: course.id,
      moduleId: mod.id,
      lessonId: les.id,
      title: les.title,
    });
  }, [
    course.id,
    dataLoaded,
    les.id,
    les.title,
    mod.id,
    mutationActionPath,
    showModQuiz,
  ]);

  const nextStepHint = getNextStepHint({ isLast, showModQuiz, isDone });
  const moduleQuizKey = buildStableQuizKey('m', course.id, mod.id);
  const legacyModuleQuizKey = buildLegacyQuizKey('m', mod.id);
  const lessonQuizKey = buildStableQuizKey('l', course.id, les.id);
  const legacyLessonQuizKey = buildLegacyQuizKey('l', les.id);
  const lessonQuizScore = getBestQuizScoreValue(quizScores, [
    lessonQuizKey,
    legacyLessonQuizKey,
  ]);
  const lessonMasteryStatus = getLessonMasteryStatus({
    hasLessonQuiz: Boolean(lessonQuiz),
    isLessonDone: isDone,
    scoreValue: lessonQuizScore,
  });
  const dueReviewCount = useMemo(() => {
    const now = Date.now();
    return srCards.filter((card) => Number(card?.nextReview || 0) <= now).length;
  }, [srCards]);
  const learningLoopSteps = getDailyLearningLoopSteps({
    isLessonDone: isDone,
    hasLessonQuiz: Boolean(lessonQuiz),
    masteryStatus: lessonMasteryStatus,
    dueReviewCount,
  });
  const resumeRecommendation = getResumeRecommendation({
    courses: COURSES,
    course,
    moduleData: mod,
    lesson: les,
    courseIndex: nav.courseIdx,
    moduleIndex: nav.modIdx,
    lessonIndex: nav.lesIdx,
    completedSet,
    hasLessonQuiz: Boolean(lessonQuiz),
    lessonQuizScore,
    dueReviewCount,
    bookmarks,
    lastPosition,
  });
  const { title: currentStepTitle, copy: currentStepCopy } = getCurrentStepCopy({
    isLast,
    showModQuiz,
    isDone,
    nextTitle,
  });

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
  const markDoneAnalyticsContext = useMemo(() => ({
    courseId: course.id,
    moduleId: mod.id,
    lessonId: les.id,
    lessonViewStartRef,
  }), [course.id, les.id, lessonViewStartRef, mod.id]);

  const { marking, handleMarkDone, mutationState } = useMarkLessonDone({
    completedSet,
    stableLessonKey,
    legacyLessonKey,
    mutationActionPath,
    toggleLessonDone: learn.toggleLessonDone,
    analyticsContext: markDoneAnalyticsContext,
  });
  const topbarCompletionCopy = getLessonCompletionActionCopy({
    isDone,
    marking,
    surface: 'topbar',
  });
  const syncStatus = getSyncStatusCopy({
    user,
    dataLoaded,
    loadError,
    pendingSyncWrites,
    syncFailed,
    syncRetryInFlight,
    marking,
    mutationState,
  });
  const handleRetrySync = useCallback(() => {
    retryPendingSyncWrites();
  }, [retryPendingSyncWrites]);

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

  const { handleOpenTool, toolbarHandlers, mobileTools } = useLearningToolActions({
    panels,
    hasCompletedProgress,
  });
  const [challengeTargetId, setChallengeTargetId] = useState('');
  const handleOpenLessonChallenge = useCallback((challengeId) => {
    setChallengeTargetId(String(challengeId || ''));
    if (panels.panel !== 'challenges') {
      handleOpenTool('challenges');
    }
  }, [handleOpenTool, panels.panel]);
  const handleChallengeTargetConsumed = useCallback(() => {
    setChallengeTargetId('');
  }, []);
  const handleLearningLoopAction = useCallback((action) => {
    trackEvent('learning_loop_action_clicked', getLearningLoopActionPayload({
      action,
      course,
      moduleData: mod,
      lesson: les,
      dueReviewCount,
      isLessonDone: isDone,
      hasLessonQuiz: Boolean(lessonQuiz),
      masteryStatus: lessonMasteryStatus,
    }));
  }, [course, dueReviewCount, isDone, les, lessonMasteryStatus, lessonQuiz, mod]);
  const handleResumeRecommendation = useCallback((recommendation) => {
    if (!recommendation) return;

    trackEvent('resume_next_action_clicked', {
      type: recommendation.type,
      action: recommendation.action,
      sourceCourseId: course.id,
      sourceModuleId: mod.id,
      sourceLessonId: les.id,
      targetCourseId: recommendation.courseId || '',
      targetModuleId: recommendation.moduleId || '',
      targetLessonId: recommendation.lessonId || '',
      dueReviewCount,
      path: recommendation.path || '',
    });

    if (recommendation.action === 'review') {
      handleOpenTool('sr');
      return;
    }

    if (recommendation.action === 'challenges') {
      handleOpenTool('challenges');
      return;
    }

    const scrollBehavior = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
      ? 'auto'
      : 'smooth';

    if (recommendation.action === 'quiz') {
      const quizElement = mainRef.current?.querySelector?.('.lesson-quiz-wrap');
      quizElement?.scrollIntoView?.({ behavior: scrollBehavior, block: 'start' });
      return;
    }

    if (recommendation.action === 'current') {
      mainRef.current?.scrollTo?.({ top: 0, behavior: scrollBehavior });
      mainRef.current?.focus?.({ preventScroll: true });
      return;
    }

    if (recommendation.action === 'lesson') {
      goToCourseModule(
        recommendation.courseIndex,
        recommendation.moduleIndex,
        recommendation.lessonIndex,
      );
    }
  }, [
    course.id,
    dueReviewCount,
    goToCourseModule,
    handleOpenTool,
    les.id,
    mainRef,
    mod.id,
  ]);

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
      <div className={shellClassName} data-course={activeCourseMeta?.id || 'html'}>
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
    <div className={shellClassName} data-course={course.id}>
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
        hasCompletedProgress={hasCompletedProgress}
      />

      <main className="main-shell" ref={mainRef} id="main-content" tabIndex={-1} inert={isMobile && panels.sidebar ? true : undefined}>
        <LessonShellTopbar
          isMobile={isMobile}
          sidebarCollapsed={sidebarCollapsed}
          isSidebarOpen={panels.sidebar}
          onHamburgerClick={() => {
            if (isMobile) {
              panels.setSidebar(true);
              return;
            }
            setSidebarCollapsed((value) => !value);
          }}
          course={course}
          mod={mod}
          les={les}
          showModQuiz={showModQuiz}
          lessonPosition={lessonPosition}
          learnerName={learnerName}
          readTime={readTime}
          xpTotal={xpTotal}
          level={level}
          coursePct={coursePct}
          streak={streak}
          pausedStreak={pausedStreak}
          dailyCount={dailyCount}
          isSearchActive={panels.panel === 'search'}
          onToggleSearch={() => panels.togglePanel('search')}
          isDone={isDone}
          marking={marking}
          onMarkDone={handleMarkDone}
          markDoneAriaLabel={topbarCompletionCopy.ariaLabel}
          markDoneLabel={topbarCompletionCopy.label}
          markDoneTitle={topbarCompletionCopy.title}
        />

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
                quizKey={moduleQuizKey}
                legacyQuizKeys={[legacyModuleQuizKey]}
              />
            </div>
          ) : (
            <>
              {showStarterGuide && <FirstRunGuide learnerName={learnerName} courseLabel={course.label} />}
              <LessonFocusStrip
                lessonPosition={lessonPosition}
                currentStepTitle={currentStepTitle}
                currentStepCopy={currentStepCopy}
                masteryStatus={lessonMasteryStatus}
                syncStatus={syncStatus}
                onRetrySync={syncStatus.actionLabel ? handleRetrySync : undefined}
              />
              <DailyLearningLoop
                steps={learningLoopSteps}
                onOpenReview={() => handleOpenTool('sr')}
                onOpenChallenges={() => handleOpenTool('challenges')}
                onAction={handleLearningLoopAction}
              />
              <ResumeNextPanel
                recommendation={resumeRecommendation}
                onAction={handleResumeRecommendation}
              />
              <ErrorBoundary
                resetKeys={[lessonKey]}
                fallback={({ retry }) => (
                  <div className="lesson-error-fallback" role="alert">
                    <p>This lesson hit a display error. Your progress is safe.</p>
                    <button type="button" className="ui-btn ui-btn-secondary ui-btn-compact" onClick={retry}>
                      Reload lesson
                    </button>
                  </div>
                )}
              >
                <LessonView
                  lesson={les}
                  emoji={mod.emoji}
                  lang={course.id}
                  lessonKey={lessonKey}
                  courseId={course.id}
                  moduleId={mod.id}
                  moduleTitle={mod.title}
                  nextTitle={nextTitle}
                  isLessonDone={isDone}
                  masteryStatus={lessonMasteryStatus}
                  syncStatus={syncStatus}
                  onOpenChallenge={handleOpenLessonChallenge}
                />
              </ErrorBoundary>
              {lessonQuiz && (
                // Wrapped in a labeled <section> so the lesson quiz
                // reads as a distinct checkpoint, not a competing CTA
                // alongside the lesson-nav row below. The divider +
                // eyebrow are pure visual hierarchy; QuizView itself
                // is unchanged.
                <section
                  className="lesson-quiz-wrap"
                  aria-labelledby="lesson-quiz-eyebrow"
                >
                  <p
                    id="lesson-quiz-eyebrow"
                    className="lesson-quiz-eyebrow"
                  >
                    Pause and check what stuck
                  </p>
                  <QuizView
                    quiz={lessonQuiz}
                    accent={course.accent}
                    label="Quick Check"
                    quizKey={lessonQuizKey}
                    legacyQuizKeys={[legacyLessonQuizKey]}
                  />
                </section>
              )}
            </>
          )}
        </div>

        <LessonPagination
          onPrev={nav.prev}
          onNext={handleNextLesson}
          prevTitle={prevTitle}
          nextTitle={nextTitle}
          isFirst={isFirst}
          isLast={isLast}
          accent={course.accent}
        />
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
          nextTitle={nextTitle}
          onOpenTools={() => setMobileToolsOpen((open) => !open)}
          toolsOpen={mobileToolsOpen}
        />
      ) : (
        <BottomToolbar
          activePanel={panels.panel}
          hasCompletedProgress={hasCompletedProgress}
          {...toolbarHandlers}
        />
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
        hasCompletedProgress={hasCompletedProgress}
        lastPosition={lastPosition}
        courseTotal={courseTotal}
        challengeTargetId={challengeTargetId}
        onChallengeTargetConsumed={handleChallengeTargetConsumed}
      />
      <WhatsNew />
      <BreakPrompt />
    </div>
  );
}
