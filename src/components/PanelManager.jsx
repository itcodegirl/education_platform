// ═══════════════════════════════════════════════
// PANEL MANAGER — Renders all lazy-loaded panels + overlays
// Extracts 14 lazy imports from App.jsx into one place
// ═══════════════════════════════════════════════

import { lazy, Suspense } from 'react';
import { ErrorBoundary } from './shared/ErrorBoundary';

// Compact inline fallback shown when a side panel crashes instead of
// taking down the whole app with an unguarded lazy-component error.
function PanelError({ retry }) {
  return (
    <div className="panel-error-fallback" role="alert">
      <span aria-hidden="true">⚠️</span>
      <p>This panel ran into a problem.</p>
      <button type="button" className="ui-btn ui-btn-secondary ui-btn-compact" onClick={retry}>Try again</button>
    </div>
  );
}

// ─── Lazy panels (download on demand) ───────
const SearchPanel = lazy(() => import('./panels/SearchPanel').then(m => ({ default: m.SearchPanel })));
const CheatsheetPanel = lazy(() => import('./panels/CheatsheetPanel').then(m => ({ default: m.CheatsheetPanel })));
const GlossaryPanel = lazy(() => import('./panels/GlossaryPanel').then(m => ({ default: m.GlossaryPanel })));
const ProjectsPanel = lazy(() => import('./panels/ProjectsPanel').then(m => ({ default: m.ProjectsPanel })));
const BadgesPanel = lazy(() => import('./panels/BadgesPanel').then(m => ({ default: m.BadgesPanel })));
const SRPanel = lazy(() => import('./panels/SRPanel').then(m => ({ default: m.SRPanel })));
const BookmarksPanel = lazy(() => import('./panels/BookmarksPanel').then(m => ({ default: m.BookmarksPanel })));
const ChallengesPanel = lazy(() => import('./panels/ChallengesPanel').then(m => ({ default: m.ChallengesPanel })));
const StudentStats = lazy(() => import('./panels/StudentStats').then(m => ({ default: m.StudentStats })));
const WelcomeBack = lazy(() => import('./onboarding/WelcomeBack').then(m => ({ default: m.WelcomeBack })));
const Onboarding = lazy(() => import('./onboarding/Onboarding').then(m => ({ default: m.Onboarding })));
const CourseComplete = lazy(() => import('./gamification/CourseComplete').then(m => ({ default: m.CourseComplete })));
const Confetti = lazy(() => import('./gamification/Confetti').then(m => ({ default: m.Confetti })));
const RoadmapPanel = lazy(() => import('./panels/RoadmapPanel').then(m => ({ default: m.RoadmapPanel })));

export function PanelManager({
  panels, nav, course, profile, completed, lastPosition, courseTotal,
}) {
  // Compute module + course progress for WelcomeBack
  const moduleProgress = computeModuleProgress(course, lastPosition, completed);

  return (
    <ErrorBoundary fallback={({ retry }) => <PanelError retry={retry} />}>
      <Suspense fallback={null}>
        {panels.confetti && <Confetti />}

        {/* Tool panels — each panel is wrapped with its own ErrorBoundary so a
            single panel crash doesn't close all other panels or the main app. */}
        {panels.panel === 'search' && (
          <ErrorBoundary fallback={({ retry }) => <PanelError retry={retry} />}>
            <SearchPanel isOpen onClose={panels.closePanel} onNavigate={nav.goToSearch} />
          </ErrorBoundary>
        )}
        {panels.panel === 'cheatsheet' && (
          <ErrorBoundary fallback={({ retry }) => <PanelError retry={retry} />}>
            <CheatsheetPanel isOpen onClose={panels.closePanel} currentCourse={course.id} />
          </ErrorBoundary>
        )}
        {panels.panel === 'glossary' && (
          <ErrorBoundary fallback={({ retry }) => <PanelError retry={retry} />}>
            <GlossaryPanel isOpen onClose={panels.closePanel} />
          </ErrorBoundary>
        )}
        {panels.panel === 'projects' && (
          <ErrorBoundary fallback={({ retry }) => <PanelError retry={retry} />}>
            <ProjectsPanel isOpen onClose={panels.closePanel} currentCourse={course.id} />
          </ErrorBoundary>
        )}
        {panels.panel === 'badges' && (
          <ErrorBoundary fallback={({ retry }) => <PanelError retry={retry} />}>
            <BadgesPanel isOpen onClose={panels.closePanel} />
          </ErrorBoundary>
        )}
        {panels.panel === 'sr' && (
          <ErrorBoundary fallback={({ retry }) => <PanelError retry={retry} />}>
            <SRPanel isOpen onClose={panels.closePanel} />
          </ErrorBoundary>
        )}
        {panels.panel === 'bookmarks' && (
          <ErrorBoundary fallback={({ retry }) => <PanelError retry={retry} />}>
            <BookmarksPanel isOpen onClose={panels.closePanel} onNavigate={nav.goToSearch} />
          </ErrorBoundary>
        )}
        {panels.panel === 'challenges' && (
          <ErrorBoundary fallback={({ retry }) => <PanelError retry={retry} />}>
            <ChallengesPanel courseId={course.id} lang={course.id} onClose={panels.closePanel} />
          </ErrorBoundary>
        )}
        {panels.panel === 'stats' && (
          <ErrorBoundary fallback={({ retry }) => <PanelError retry={retry} />}>
            <StudentStats isOpen onClose={panels.closePanel} />
          </ErrorBoundary>
        )}
        {panels.panel === 'roadmap' && (
          <ErrorBoundary fallback={({ retry }) => <PanelError retry={retry} />}>
            <RoadmapPanel
              onClose={panels.closePanel}
              onNavigate={(ci, mi) => { nav.switchCourse(ci); nav.go(mi, 0); }}
              currentCourseIdx={nav.courseIdx}
            />
          </ErrorBoundary>
        )}

        {/* Overlays */}
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
          />
        )}
      </Suspense>
    </ErrorBoundary>
  );
}

// Find the module the user was last in and count its completed lessons
function computeModuleProgress(course, lastPosition, completed) {
  const result = { moduleTitle: '', moduleDone: 0, moduleTotal: 0, courseDone: 0 };
  if (!course || !lastPosition?.mod) return result;

  result.courseDone = completed.filter((k) => k.startsWith(course.label)).length;

  // lastPosition.mod is like "⚡ What HTML Actually Is" — strip emoji prefix
  const modLabel = lastPosition.mod.replace(/^\S+\s/, '');

  for (const mod of course.modules) {
    if (mod.title === modLabel) {
      result.moduleTitle = mod.title;
      result.moduleTotal = mod.lessons.length;
      result.moduleDone = mod.lessons.filter((l) =>
        completed.includes(`${course.label}|${mod.title}|${l.title}`),
      ).length;
      break;
    }
  }

  return result;
}
