// ═══════════════════════════════════════════════
// APP — Root layout orchestrator
//
// Zero useState (state lives in contexts)
// Zero fetch/supabase (data loading in contexts)
// Zero lazy imports (panels in PanelManager)
//
// Responsibilities:
//   1. Auth gate (loading → login → disabled → app)
//   2. Layout (sidebar + main + toolbar)
//   3. Wire hooks to components via props
// ═══════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';

// Data + hooks
import { COURSES } from './data';
import { useTheme } from './context/ThemeContext';
import { useAuth } from './context/AuthContext';
import { useProgress } from './context/ProgressContext';
import { useNavigation } from './hooks/useNavigation';
import { usePanels } from './hooks/usePanels';
import { useKeyboardNav } from './hooks/useKeyboardNav';
import { useSwipeNav } from './hooks/useSwipeNav';
import { estimateReadingTime, XP_VALUES } from './utils/helpers';

// Layout
import { AuthPage } from './components/auth/AuthPage';
import { Sidebar } from './components/layout/Sidebar';
import { ThemeToggle } from './components/layout/ThemeToggle';
import { BottomToolbar } from './components/layout/BottomToolbar';
import { OfflineIndicator } from './components/layout/OfflineIndicator';

// Learning
import { LessonView } from './components/learning/LessonView';
import { QuizView } from './components/learning/QuizView';

// Gamification (tiny — always loaded)
import { XPPopup } from './components/gamification/XPPopup';
import { BadgeUnlock } from './components/gamification/BadgeUnlock';

// Shared
import { LessonSkeleton, ConnectionError } from './components/shared/SkeletonLoader';
import { NotFound } from './components/shared/NotFound';
import { KeyboardShortcuts } from './components/shared/KeyboardShortcuts';

// Lazy panels + overlays (all managed in one file)
import { PanelManager, LazyAdminDashboard } from './components/PanelManager';

import './styles/index.css';

// ═══════════════════════════════════════════════

export default function App() {
  const { theme } = useTheme();
  const { user, profile, loading: authLoading, signOut } = useAuth();
  const {
    progress, toggleLesson,
    awardXP, recordDailyActivity,
    savePosition, trackCourseVisit,
    dataLoaded, lastPosition, loadError, syncError,
  } = useProgress();

  const routerNavigate = useNavigate();
  const nav = useNavigation();
  const panels = usePanels({ dataLoaded, user, lastPosition });
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [donePulse, setDonePulse] = useState(false);
  const [miniConfetti, setMiniConfetti] = useState(false);
  const [lessonAnnounce, setLessonAnnounce] = useState('');

  const {
    course, modules, mod, les,
    lessonKey, lessonQuiz, moduleQuiz,
    courseTotal, isFirst, isLast, isLastLesson,
    mainRef, showModQuiz,
  } = nav;

  const isDone = progress.completed.includes(lessonKey);
  const readTime = estimateReadingTime(les.content + les.code);
  const courseDone = progress.completed.filter((k) => k.startsWith(course.label)).length;
  const isCourseComplete = courseDone === courseTotal && courseTotal > 0;

  // ─── Side effects (minimal — just wiring) ─────
  useEffect(() => {
    panels.checkMilestone(progress.completed.length);
  }, [progress.completed.length]);

  useEffect(() => {
    if (isCourseComplete && isDone) panels.triggerCourseComplete();
  }, [isCourseComplete]);

  useEffect(() => {
    if (user && dataLoaded) {
      savePosition({
        course: `${course.icon} ${course.label}`,
        mod: `${mod.emoji} ${mod.title}`,
        les: showModQuiz ? '📝 Module Quiz' : les.title,
      });
      trackCourseVisit(course.id);
    }
  }, [nav.courseIdx, nav.modIdx, nav.lesIdx, showModQuiz, user, dataLoaded]);

  // ─── Announce lesson changes for screen readers ─
  useEffect(() => {
    setLessonAnnounce(`Now viewing: ${les.title}`);
  }, [les.title]);

  // ─── Reading progress bar ──────────────────────
  useEffect(() => {
    const el = mainRef;
    const node = el?.current;
    if (!node) return;
    const onScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = node;
      const pct = scrollHeight <= clientHeight ? 100 : Math.round((scrollTop / (scrollHeight - clientHeight)) * 100);
      setScrollPct(pct);
    };
    node.addEventListener('scroll', onScroll, { passive: true });
    return () => node.removeEventListener('scroll', onScroll);
  }, [mainRef]);

  // ─── Resume from saved position ────────────────
  const handleResume = useCallback(() => {
    if (!lastPosition.course) return;
    // Extract label from saved format "🧱 HTML" → "HTML"
    const courseLabel = lastPosition.course.replace(/^\S+\s/, '');
    const ci = COURSES.findIndex(c => c.label === courseLabel);
    if (ci === -1) return;
    const crs = COURSES[ci];
    // Extract module title from "⚡ What HTML Actually Is" → "What HTML Actually Is"
    const modTitle = lastPosition.mod.replace(/^\S+\s/, '');
    const mi = crs.modules.findIndex(m => m.title === modTitle);
    if (mi === -1) { nav.switchCourse(ci); return; }
    // Find lesson
    const li = crs.modules[mi].lessons.findIndex(l => l.title === lastPosition.les);
    if (li === -1) { nav.goToSearch(ci, mi, 0); return; }
    nav.goToSearch(ci, mi, li);
  }, [lastPosition, nav]);

  // ─── Callbacks ────────────────────────────────
  const handleMarkDone = useCallback(() => {
    toggleLesson(lessonKey);
    if (!isDone) {
      awardXP(XP_VALUES.lesson, 'Lesson completed');
      recordDailyActivity();
      setDonePulse(true);
      setMiniConfetti(true);
      setTimeout(() => setDonePulse(false), 600);
      setTimeout(() => setMiniConfetti(false), 2000);
    }
  }, [lessonKey, isDone, toggleLesson, awardXP, recordDailyActivity]);

  const toolbarHandlers = useMemo(() => ({
    onCheatsheet: () => panels.setPanel('cheatsheet'),
    onGlossary: () => panels.setPanel('glossary'),
    onProjects: () => panels.setPanel('projects'),
    onBadges: () => panels.setPanel('badges'),
    onSR: () => panels.setPanel('sr'),
    onBookmarks: () => panels.setPanel('bookmarks'),
    onChallenges: () => panels.setPanel('challenges'),
    onStats: () => panels.setPanel('stats'),
  }), [panels.setPanel]);

  useSwipeNav({ onNext: nav.next, onPrev: nav.prev, ref: mainRef });

  useKeyboardNav({
    onNext: nav.next, onPrev: nav.prev, onMarkDone: handleMarkDone,
    onSearch: () => panels.togglePanel('search'),
    onSwitchCourse: nav.switchCourse,
    onToggleSidebar: () => panels.setSidebar((s) => !s),
    onShowShortcuts: () => setShowShortcuts((s) => !s),
  });

  // ═══════════════════════════════════════════════
  // RENDER GATES
  // ═══════════════════════════════════════════════

  if (authLoading) {
    return (
      <div className={`loading-screen ${theme}`}>
        <div className="loading-pulse">
          <span className="loading-bolt">⚡</span>
          <p>Loading CodeHerWay...</p>
        </div>
      </div>
    );
  }

  if (!user) return <AuthPage />;

  if (profile?.is_disabled) {
    return (
      <div className={`loading-screen ${theme}`}>
        <div className="disabled-screen">
          <span className="disabled-icon">🚫</span>
          <h2 className="disabled-title">Account Disabled</h2>
          <p className="disabled-msg">Your account has been disabled. Contact support if this is a mistake.</p>
          <a href="mailto:hello@codeherway.com" className="disabled-link">Contact Support</a>
          <button type="button" className="disabled-logout" onClick={() => signOut()}>Log Out</button>
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={`loading-screen ${theme}`}>
        <ConnectionError onRetry={() => window.location.reload()} />
      </div>
    );
  }

  if (!dataLoaded) {
    return (
      <div className={`shell ${theme}`}>
        <div className="sb sk-sidebar-wrap">
          <div className="sk-brand-area"><div className="sk-line sk-w60 sk-h16"></div></div>
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="sk-module">
              <div className="sk-line sk-w80 sk-h14"></div>
              <div className="sk-line sk-w50 sk-h10"></div>
            </div>
          ))}
        </div>
        <div className="mn">
          <div className="topbar"><div className="sk-line sk-w40 sk-h14"></div></div>
          <div className="lv-wrap"><LessonSkeleton /></div>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════
  // MAIN APP LAYOUT
  // ═══════════════════════════════════════════════

  const mainLayout = (
    <div className={`shell ${theme}`} data-course={course.id}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <div aria-live="polite" aria-atomic="true" className="sr-only">{lessonAnnounce}</div>
      <OfflineIndicator />
      {syncError && (
        <div className="sync-warning">
          Changes may not be saved — check your connection
        </div>
      )}

      <Sidebar
        courses={COURSES}
        courseIdx={nav.courseIdx} modIdx={nav.modIdx} lesIdx={nav.lesIdx}
        showModQuiz={showModQuiz} isOpen={panels.sidebar}
        onClose={() => panels.setSidebar(false)}
        onSelectCourse={nav.switchCourse}
        onSelectLesson={nav.go}
        onSelectModQuiz={(mi) => { nav.goToModQuiz(mi); panels.setSidebar(false); }}
      />

      <main className="mn" ref={mainRef} id="main-content">
        {/* Reading progress */}
        {!showModQuiz && <div className="reading-progress" style={{ width: `${scrollPct}%`, background: course.accent }} />}
        {/* Topbar */}
        <div className="topbar">
          <button type="button" className="ham" onClick={() => panels.setSidebar(true)} aria-label="Open sidebar menu">☰</button>
          <div className="bc">
            <span className="bc-course" style={{ color: course.accent }}>{course.icon} {course.label}</span>
            <span className="bc-sep">›</span>
            <span className="bc-mod">{mod.emoji} {mod.title}</span>
            <span className="bc-sep">›</span>
            <span className="bc-les">{showModQuiz ? '📝 Module Quiz' : les.title}</span>
          </div>
          {!showModQuiz && <span className="read-time"><span className="rt-icon">⏱</span>{readTime} min</span>}
          <button type="button" className="search-trigger" onClick={() => panels.setPanel('search')} aria-label="Search lessons (Cmd+K)">
            <span aria-hidden="true">🔍</span><span>Search</span><kbd aria-hidden="true">⌘K</kbd>
          </button>
          {!showModQuiz && (
            <button type="button" className={`mark-btn ${isDone ? 'dn' : ''} ${donePulse ? 'pulse' : ''}`} onClick={handleMarkDone}>
              {isDone ? '✓ Done' : 'Mark Done'}
            </button>
          )}
        </div>

        {/* Content */}
        <div className="lv-wrap">
          {showModQuiz && moduleQuiz ? (
            <div className="lv">
              <div className="lv-head">
                <span className="lv-emoji">📝</span>
                <h2 className="lv-title">{mod.title} — Module Quiz</h2>
              </div>
              <p className="lp">Test your knowledge of <strong>{mod.title}</strong>.</p>
              <QuizView quiz={moduleQuiz} accent={course.accent} label={`${mod.title} Quiz`} quizKey={`m:${mod.id}`} />
            </div>
          ) : (
            <>
              <LessonView
                lesson={les} emoji={mod.emoji} lang={course.id}
                lessonKey={lessonKey} courseId={course.id} moduleTitle={mod.title}
              />
              {/* Module completion summary */}
              {isLastLesson && moduleQuiz && !showModQuiz && isDone && (
                <div className="module-summary">
                  <span className="module-summary-icon">🎯</span>
                  <div>
                    <strong>Module complete!</strong> You've finished all lessons in <em>{mod.title}</em>. Ready for the quiz?
                  </div>
                </div>
              )}
              {lessonQuiz && (
                <div className="lv-quiz-wrap">
                  <QuizView quiz={lessonQuiz} accent={course.accent} label="Quick Check" quizKey={`l:${les.id}`} onNext={!isLast ? nav.next : undefined} />
                </div>
              )}
            </>
          )}
        </div>

        {/* Navigation */}
        <div className="nav-row">
          <button type="button" className="nav-btn" onClick={nav.prev} disabled={isFirst}>← Previous</button>
          <button type="button" className="nav-btn nx" onClick={nav.next} disabled={isLast} style={{ background: course.accent }}>
            {isLast ? 'Course Complete! 🎉' : isLastLesson && moduleQuiz && !showModQuiz ? 'Module Quiz →' : 'Next →'}
          </button>
        </div>

        {/* Next lesson preview */}
        {!isLast && !showModQuiz && (() => {
          const nextMi = lesIdx < mod.lessons.length - 1 ? nav.modIdx : nav.modIdx + 1;
          const nextLi = lesIdx < mod.lessons.length - 1 ? lesIdx + 1 : 0;
          const nextMod = modules[nextMi];
          const nextLes = nextMod?.lessons[nextLi];
          if (!nextLes) return null;
          return (
            <div className="next-preview" onClick={nav.next}>
              <span className="next-preview-label">Up next</span>
              <span className="next-preview-title">{nextLes.title}</span>
              {nextLes.difficulty && <span className={`lv-diff lv-diff-${nextLes.difficulty}`}>{nextLes.difficulty}</span>}
            </div>
          );
        })()}

        {/* Mini confetti on lesson complete */}
        {miniConfetti && <div className="mini-confetti" aria-hidden="true" />}
      </main>

      {/* Floating UI */}
      <ThemeToggle />
      <BottomToolbar {...toolbarHandlers} />
      <XPPopup />
      <BadgeUnlock />

      {/* All panels + overlays (lazy-loaded via PanelManager) */}
      <PanelManager
        panels={panels} nav={nav} course={course}
        profile={profile} progress={progress}
        lastPosition={lastPosition} courseTotal={courseTotal}
        onResume={handleResume}
      />
      <KeyboardShortcuts isOpen={showShortcuts} onClose={() => setShowShortcuts(false)} />
    </div>
  );

  return (
    <Routes>
      <Route path="/admin" element={
        <div className={theme}>
          <LazyAdminDashboard onClose={() => routerNavigate('/')} />
        </div>
      } />
      <Route path="/course/:courseId/:modIdx/:lesIdx" element={mainLayout} />
      <Route path="/course/:courseId" element={mainLayout} />
      <Route path="/" element={<Navigate to={`/course/${course.id}/0/0`} replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}
