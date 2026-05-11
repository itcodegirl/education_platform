import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './shared/ErrorBoundary';
import { getCourseCompletedLessonCount, hasLessonCompletion } from '../utils/lessonKeys';
import { COURSES } from '../data';

function PanelError({ retry }) {
  return (
    <div className="panel-error-fallback" role="alert">
      <span aria-hidden="true">⚠︎</span>
      <p>This panel hit a snag. Your lesson stays open and progress is still safe.</p>
      <button type="button" className="ui-btn ui-btn-secondary ui-btn-compact" onClick={retry}>
        Reload panel
      </button>
    </div>
  );
}

function PanelLoading() {
  return (
    <div className="panel-loading-inline" role="status" aria-live="polite">
      <span className="panel-loading-dot" aria-hidden="true" />
      <span>Opening panel...</span>
    </div>
  );
}

const SearchPanel = lazy(() => import('./panels/SearchPanel').then((m) => ({ default: m.SearchPanel })));
const CheatsheetPanel = lazy(() => import('./panels/CheatsheetPanel').then((m) => ({ default: m.CheatsheetPanel })));
const GlossaryPanel = lazy(() => import('./panels/GlossaryPanel').then((m) => ({ default: m.GlossaryPanel })));
const ProjectsPanel = lazy(() => import('./panels/ProjectsPanel').then((m) => ({ default: m.ProjectsPanel })));
const BadgesPanel = lazy(() => import('./panels/BadgesPanel').then((m) => ({ default: m.BadgesPanel })));
const SRPanel = lazy(() => import('./panels/SRPanel').then((m) => ({ default: m.SRPanel })));
const BookmarksPanel = lazy(() => import('./panels/BookmarksPanel').then((m) => ({ default: m.BookmarksPanel })));
const ChallengesPanel = lazy(() => import('./panels/ChallengesPanel').then((m) => ({ default: m.ChallengesPanel })));
const StudentStats = lazy(() => import('./panels/StudentStats').then((m) => ({ default: m.StudentStats })));
const WelcomeBack = lazy(() => import('./onboarding/WelcomeBack').then((m) => ({ default: m.WelcomeBack })));
const Onboarding = lazy(() => import('./onboarding/Onboarding').then((m) => ({ default: m.Onboarding })));
const CourseComplete = lazy(() => import('./gamification/CourseComplete').then((m) => ({ default: m.CourseComplete })));
const Confetti = lazy(() => import('./gamification/Confetti').then((m) => ({ default: m.Confetti })));
const RoadmapPanel = lazy(() => import('./panels/RoadmapPanel').then((m) => ({ default: m.RoadmapPanel })));

const PANEL_REGISTRY = {
  search: ({ panels, nav }) => (
    <SearchPanel isOpen onClose={panels.closePanel} onNavigate={nav.goToSearch} />
  ),
  cheatsheet: ({ panels, course }) => (
    <CheatsheetPanel isOpen onClose={panels.closePanel} currentCourse={course.id} />
  ),
  glossary: ({ panels }) => (
    <GlossaryPanel isOpen onClose={panels.closePanel} />
  ),
  projects: ({ panels, course, hasCompletedProgress }) => (
    <ProjectsPanel
      isOpen
      onClose={panels.closePanel}
      currentCourse={course.id}
      hasCompletedProgress={hasCompletedProgress}
    />
  ),
  badges: ({ panels }) => (
    <BadgesPanel isOpen onClose={panels.closePanel} />
  ),
  sr: ({ panels }) => (
    <SRPanel isOpen onClose={panels.closePanel} />
  ),
  bookmarks: ({ panels, nav }) => (
    <BookmarksPanel isOpen onClose={panels.closePanel} onNavigate={nav.goToSearch} />
  ),
  challenges: ({ panels, course }) => (
    <ChallengesPanel courseId={course.id} lang={course.id} onClose={panels.closePanel} />
  ),
  stats: ({ panels }) => (
    <StudentStats isOpen onClose={panels.closePanel} />
  ),
  roadmap: ({ panels, nav }) => (
    <RoadmapPanel
      onClose={panels.closePanel}
      onNavigate={(ci, mi) => nav.goToCourseModule(ci, mi, 0)}
      currentCourseIdx={nav.courseIdx}
      currentModuleIdx={nav.modIdx}
    />
  ),
};

function ActivePanelBoundary({ panelName, context }) {
  const renderPanel = PANEL_REGISTRY[panelName];
  if (!renderPanel) return null;

  return (
    <ErrorBoundary
      resetKeys={[panelName]}
      fallback={({ retry }) => <PanelError retry={retry} />}
    >
      {renderPanel(context)}
    </ErrorBoundary>
  );
}

export function PanelManager({
  panels, nav, course, profile, completed, hasCompletedProgress = true, lastPosition, courseTotal,
}) {
  const moduleProgress = computeModuleProgress(course, lastPosition, completed);
  const panelContext = { panels, nav, course, hasCompletedProgress };

  return (
    <ErrorBoundary fallback={({ retry }) => <PanelError retry={retry} />}>
      <Suspense fallback={<PanelLoading />}>
        {panels.confetti && <Confetti />}

        <ActivePanelBoundary panelName={panels.panel} context={panelContext} />

        {panels.showWelcome && (
          <WelcomeBack
            isOpen
            onClose={() => panels.setShowWelcome(false)}
            onResume={() => {
              nav.resumeFromPosition(lastPosition);
              panels.setShowWelcome(false);
            }}
            displayName={profile?.display_name}
            lastPosition={lastPosition}
            completedCount={completed.length}
            moduleTitle={moduleProgress.moduleTitle}
            moduleLessonsDone={moduleProgress.moduleDone}
            moduleLessonsTotal={moduleProgress.moduleTotal}
            courseLabel={course.label}
            courseLessonsDone={moduleProgress.courseDone}
            courseLessonsTotal={courseTotal}
          />
        )}
        {panels.showOnboarding && (
          <Onboarding
            isOpen
            onClose={() => panels.setShowOnboarding(false)}
            displayName={profile?.display_name}
          />
        )}
        {panels.showCourseComplete && (
          <CourseComplete
            isOpen
            onClose={() => panels.setShowCourseComplete(false)}
            course={course}
            displayName={profile?.display_name}
            lessonCount={courseTotal}
            courses={COURSES}
            onSelectNextCourse={(nextCourseId) => {
              const idx = COURSES.findIndex((c) => c.id === nextCourseId);
              if (idx !== -1) nav.switchCourse(idx);
            }}
          />
        )}
      </Suspense>
    </ErrorBoundary>
  );
}

function computeModuleProgress(course, lastPosition, completed) {
  const result = { moduleTitle: '', moduleDone: 0, moduleTotal: 0, courseDone: 0 };
  if (!course || !lastPosition?.mod) return result;
  const completedSet = new Set(completed);

  result.courseDone = getCourseCompletedLessonCount(completedSet, course);

  const modLabel = lastPosition.mod.replace(/^\S+\s/, '');

  for (const mod of course.modules) {
    if (mod.title === modLabel) {
      result.moduleTitle = mod.title;
      result.moduleTotal = mod.lessons.length;
      result.moduleDone = mod.lessons.filter((l) =>
        hasLessonCompletion(completedSet, course, mod, l),
      ).length;
      break;
    }
  }

  return result;
}
