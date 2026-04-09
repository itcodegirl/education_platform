import { useState, memo, useMemo, useEffect, useRef } from 'react';
import { useProgress, useAuth } from '../../providers';
import { getLevel, getXPInLevel, XP_PER_LEVEL, DAILY_GOAL } from '../../utils/helpers';
import { QUIZ_MAP } from '../../data';

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
  onClose,
  onSelectCourse,
  onSelectLesson,
  onSelectModQuiz,
}) {
  const { completed = [], xpTotal = 0, streak = 0, dailyCount = 0 } = useProgress();
  const { user, signOut } = useAuth();
  const [lockMode, setLockMode] = useState(() => localStorage.getItem('chw-lock-mode') === 'true');
  const asideRef = useRef(null);
  const course = courses[courseIdx];
  const modules = course.modules;

  const { total, courseDone, pct } = useMemo(() => {
    const totalLessons = modules.reduce((sum, module) => sum + module.lessons.length, 0);
    const completedLessons = completed.filter((key) => key.startsWith(course.label)).length;
    const progressPct = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;
    return { total: totalLessons, courseDone: completedLessons, pct: progressPct };
  }, [modules, completed, course.label]);

  const level = getLevel(xpTotal);
  const inLevel = getXPInLevel(xpTotal);
  const xpPct = Math.round((inLevel / XP_PER_LEVEL) * 100);
  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Coder';
  const userInitial = displayName.trim().charAt(0).toUpperCase() || 'C';

  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    asideRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {isOpen && <div className="overlay" onClick={onClose} aria-hidden="true" />}
      <aside
        ref={asideRef}
        id="course-sidebar"
        className={`sb ${isOpen ? 'open' : ''}`}
        aria-label="Course navigation sidebar"
        aria-hidden={!isOpen}
        aria-modal={isOpen ? 'true' : undefined}
        role="dialog"
        tabIndex={-1}
      >
        <div className="sb-head">
          <div className="brand">
            <span className="brand-bolt">⚡</span>
            <div className="brand-copy">
              <h1 className="brand-name">CodeHerWay</h1>
              <span className="brand-sub">Learn. Build. Ship.</span>
            </div>
          </div>
          <button type="button" className="sb-close" onClick={onClose} aria-label="Close sidebar">✕</button>
        </div>

        <div className="user-info">
          <div className="user-avatar">{userInitial}</div>
          <div className="user-details">
            <span className="user-name">{displayName}</span>
            <span className="user-level">Level {level}</span>
          </div>
          <button type="button" className="user-logout" onClick={signOut} title="Sign out" aria-label="Sign out">↗</button>
        </div>

        <div className="course-switcher">
          {courses.map((courseOption, ci) => (
            <button
              key={courseOption.id}
              type="button"
              className={`cs-btn ${ci === courseIdx ? 'on' : ''}`}
              onClick={() => onSelectCourse(ci)}
              style={ci === courseIdx ? { '--cs-accent': courseOption.accent } : undefined}
            >
              <span className="cs-icon">{courseOption.icon}</span>
              <span className="cs-label">{courseOption.label}</span>
            </button>
          ))}
        </div>

        <div className="prog">
          <div className="prog-info">
            <span>{courseDone}/{total} lessons</span>
            <span className="prog-pct">{pct}%</span>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{ width: `${pct}%`, background: course.accent }} />
          </div>
        </div>

        <div className="stats-panel">
          <div className="stats-row">
            <div className="stat-card">
              <div className="stat-num">{completed.length}</div>
              <div className="stat-label">Done</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{streak}🔥</div>
              <div className="stat-label">Streak</div>
            </div>
            <div className="stat-card">
              <div className="stat-num">{Math.floor(completed.length * 3 / 60)}h</div>
              <div className="stat-label">Time</div>
            </div>
          </div>
        </div>

        <div className="xp-bar-wrap">
          <div className="xp-info">
            <span className="xp-level">Level <span className="lvl-num">{level}</span></span>
            <span className="xp-amount">{inLevel}/{XP_PER_LEVEL} XP</span>
          </div>
          <div className="xp-track"><div className="xp-fill" style={{ width: `${xpPct}%` }} /></div>
        </div>

        <div className="daily-goal">
          <div className="dg-head">
            <span className="dg-label">Daily Goal</span>
            <span className="dg-count">{dailyCount}/{DAILY_GOAL} {dailyCount >= DAILY_GOAL ? '✅' : ''}</span>
          </div>
          <div className="dg-dots">
            {Array.from({ length: DAILY_GOAL }, (_, index) => (
              <div key={index} className={`dg-dot ${index < dailyCount ? 'filled' : ''}`} />
            ))}
          </div>
        </div>

        <div className="sb-scroll">
          <nav className="sb-nav">
            {modules.map((module, mi) => {
              const moduleCompletedCount = module.lessons.filter((lesson) =>
                completed.includes(`${course.label}|${module.title}|${lesson.title}`)
              ).length;
              const isModuleUnlocked = !lockMode || isLessonUnlocked(course, modules, mi, 0, completed);

              return (
                <div key={module.id} className={`mg ${mi === modIdx ? 'act' : ''} ${!isModuleUnlocked ? 'locked' : ''}`}>
                  <button
                    type="button"
                    className="mg-btn"
                    onClick={() => isModuleUnlocked && onSelectLesson(mi, 0)}
                    disabled={!isModuleUnlocked}
                  >
                    <span className="mg-emoji">{isModuleUnlocked ? module.emoji : '🔒'}</span>
                    <div className="mg-info">
                      <span className="mg-name">{module.title}</span>
                      <span className="mg-sub">{moduleCompletedCount}/{module.lessons.length}</span>
                    </div>
                  </button>

                  {mi === modIdx && (
                    <div className="lg">
                      {module.lessons.map((lesson, li) => {
                        const lessonKey = `${course.label}|${module.title}|${lesson.title}`;
                        const isDone = completed.includes(lessonKey);
                        const unlocked = !lockMode || isLessonUnlocked(course, modules, mi, li, completed);

                        return (
                          <button
                            key={lesson.id}
                            type="button"
                            className={`lg-btn ${li === lesIdx && !showModQuiz ? 'act' : ''} ${isDone ? 'dn' : ''} ${!unlocked ? 'locked' : ''}`}
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
        </div>

        <div className="sb-lock-toggle">
          <label className="lock-label">
            <input
              type="checkbox"
              checked={lockMode}
              onChange={(event) => {
                setLockMode(event.target.checked);
                localStorage.setItem('chw-lock-mode', event.target.checked);
              }}
            />
            <span className="lock-text">{lockMode ? '🔒 Sequential' : '🔓 Free roam'}</span>
          </label>
        </div>
      </aside>
    </>
  );
});
