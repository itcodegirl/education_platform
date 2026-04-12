// ═══════════════════════════════════════════════
// SIDEBAR — Navigation-first glassmorphism design
// Stats moved to ProfilePopover (avatar click)
// ═══════════════════════════════════════════════

import { useState, memo, useMemo, useEffect, useRef, useCallback } from 'react';
import { useProgress, useAuth } from '../../providers';
import { QUIZ_MAP } from '../../data';
import { ProfilePopover } from './ProfilePopover';

function isLessonUnlocked(course, modules, mi, li, completed) {
  if (mi === 0 && li === 0) return true;

  if (li > 0) {
    const prevLesson = modules[mi].lessons[li - 1];
    const prevKey = `${course.label}|${modules[mi].title}|${prevLesson.title}`;
    return completed.includes(prevKey);
  }

  if (mi > 0) {
    const prevMod = modules[mi - 1];
    const lastLesson = prevMod.lessons[prevMod.lessons.length - 1];
    const lastKey = `${course.label}|${prevMod.title}|${lastLesson.title}`;
    return completed.includes(lastKey);
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
}) {
  const { completed = [] } = useProgress();
  const { user } = useAuth();
  const [lockMode, setLockMode] = useState(() => localStorage.getItem('chw-lock-mode') === 'true');
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [expandedMod, setExpandedMod] = useState(modIdx);
  const asideRef = useRef(null);
  const course = courses[courseIdx];
  const modules = course.modules;

  // Sync expanded module when active module changes
  useEffect(() => { setExpandedMod(modIdx); }, [modIdx]);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Coder';
  const userInitial = displayName.trim().charAt(0).toUpperCase() || 'C';

  const { total, courseDone, pct } = useMemo(() => {
    const totalLessons = modules.reduce((sum, m) => sum + m.lessons.length, 0);
    const completedLessons = completed.filter((k) => k.startsWith(course.label)).length;
    const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return { total: totalLessons, courseDone: completedLessons, pct: progressPct };
  }, [modules, completed, course.label]);

  const togglePopover = useCallback(() => setPopoverOpen((v) => !v), []);
  const closePopover = useCallback(() => setPopoverOpen(false), []);

  // Mobile: lock body scroll, Escape to close
  useEffect(() => {
    if (!isMobile || !isOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    asideRef.current?.focus();
    const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => { document.body.style.overflow = prev; window.removeEventListener('keydown', handleKey); };
  }, [isMobile, isOpen, onClose]);

  return (
    <>
      {isMobile && isOpen && <div className="overlay" onClick={onClose} aria-hidden="true" />}
      <aside
        ref={asideRef}
        id="course-sidebar"
        className={`sb ${isOpen ? 'open' : ''} ${!isMobile && isCollapsed ? 'collapsed' : ''}`}
        aria-label="Course navigation sidebar"
        aria-hidden={isMobile ? !isOpen : false}
        aria-modal={isMobile && isOpen ? 'true' : undefined}
        role={isMobile ? 'dialog' : 'complementary'}
        tabIndex={isMobile ? -1 : undefined}
      >
        {/* ─── Brand + Avatar row ─── */}
        <div className="sb-head">
          <div className="brand">
            <span className="brand-bolt" aria-hidden="true">⚡</span>
            <h1 className="brand-name">CodeHerWay</h1>
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
        </div>

        {/* ─── Profile Popover ─── */}
        <ProfilePopover isOpen={popoverOpen} onClose={closePopover} isMobile={isMobile} />

        {/* ─── Course Switcher (horizontal pills) ─── */}
        <div className="cs-strip">
          {courses.map((c, ci) => (
            <button
              key={c.id}
              type="button"
              className={`cs-pill ${ci === courseIdx ? 'on' : ''}`}
              onClick={() => onSelectCourse(ci)}
              style={{ '--cs-accent': c.accent }}
              aria-label={`Switch to ${c.label} course`}
              aria-current={ci === courseIdx ? 'true' : undefined}
            >
              <span className="cs-pill-icon">{c.icon}</span>
              <span className="cs-pill-label">{c.label}</span>
            </button>
          ))}
        </div>

        {/* ─── Course progress (compact) ─── */}
        <div className="sb-progress-mini">
          <span className="sb-pm-text">{courseDone}/{total}</span>
          <div className="sb-pm-track">
            <div className="sb-pm-fill" style={{ width: `${pct}%`, background: course.accent }} />
          </div>
          <span className="sb-pm-pct">{pct}%</span>
        </div>

        {/* ─── Module/Lesson Tree ─── */}
        <div className="sb-scroll">
          <div className="sb-map-header">
            <span className="sb-map-title">Modules</span>
            <button
              type="button"
              className="sb-roadmap-btn"
              onClick={() => onOpenTool('roadmap')}
              aria-label="Open full learning roadmap"
              title="Full roadmap"
            >
              🗺️
            </button>
          </div>
          <nav className="sb-nav" aria-label="Course modules and lessons">
            {modules.map((module, mi) => {
              const modDone = module.lessons.filter((l) =>
                completed.includes(`${course.label}|${module.title}|${l.title}`),
              ).length;
              const isModUnlocked = !lockMode || isLessonUnlocked(course, modules, mi, 0, completed);

              const isExpanded = expandedMod === mi;

              return (
                <div key={module.id} className={`mg ${mi === modIdx ? 'act' : ''} ${isExpanded ? 'expanded' : ''} ${!isModUnlocked ? 'locked' : ''}`}>
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
                  >
                    <span className="mg-emoji">{isModUnlocked ? module.emoji : '🔒'}</span>
                    <div className="mg-info">
                      <span className="mg-name">{module.title}</span>
                      <span className="mg-sub">{modDone}/{module.lessons.length}</span>
                    </div>
                  </button>

                  {isExpanded && (
                    <div className="lg">
                      {module.lessons.map((lesson, li) => {
                        const key = `${course.label}|${module.title}|${lesson.title}`;
                        const isDone = completed.includes(key);
                        const unlocked = !lockMode || isLessonUnlocked(course, modules, mi, li, completed);
                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            className={`lg-btn ${mi === modIdx && li === lesIdx && !showModQuiz ? 'act' : ''} ${isDone ? 'dn' : ''} ${!unlocked ? 'locked' : ''}`}
                            onClick={() => unlocked && onSelectLesson(mi, li)}
                            disabled={!unlocked}
                          >
                            <span className="lg-chk">{isDone ? '✓' : unlocked ? '○' : '🔒'}</span>
                            <span>{lesson.title}</span>
                          </button>
                        );
                      })}
                      {QUIZ_MAP.has(`m:${module.id}`) && (
                        <button
                          type="button"
                          className={`lg-btn lg-quiz ${showModQuiz && mi === modIdx ? 'act' : ''}`}
                          onClick={() => onSelectModQuiz(mi)}
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
          </nav>

          {/* ─── Lock toggle ─── */}
          <div className="sb-lock-row">
            <label className="lock-label">
            <input
              type="checkbox"
              checked={lockMode}
              onChange={(e) => { setLockMode(e.target.checked); localStorage.setItem('chw-lock-mode', e.target.checked); }}
              aria-label="Toggle sequential lock mode"
            />
            <span className="lock-text">{lockMode ? '🔒 Sequential' : '🔓 Free roam'}</span>
            </label>
          </div>
        </div>
      </aside>
    </>
  );
});
