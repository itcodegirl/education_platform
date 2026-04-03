// ═══════════════════════════════════════════════
// SIDEBAR — Navigation, progress, stats
// ═══════════════════════════════════════════════

import { useProgress } from '../context/ProgressContext';
import { useAuth } from '../context/AuthContext';
import { getLevel, getXPInLevel, XP_PER_LEVEL, DAILY_GOAL } from '../utils/helpers';
import { QUIZ_MAP } from '../data';

export function Sidebar({
  courses, courseIdx, modIdx, lesIdx, showModQuiz, isOpen,
  onClose, onSelectCourse, onSelectLesson, onSelectModQuiz,
}) {
  const { completed, xpTotal, streak, dailyCount } = useProgress();
  const { user, signOut } = useAuth();
  const course = courses[courseIdx];
  const modules = course.modules;
  const total = modules.reduce((s, m) => s + m.lessons.length, 0);
  const courseDone = completed.filter(k => k.startsWith(course.label)).length;
  const pct = total > 0 ? Math.round((courseDone / total) * 100) : 0;

  const level = getLevel(xpTotal);
  const inLevel = getXPInLevel(xpTotal);
  const xpPct = Math.round((inLevel / XP_PER_LEVEL) * 100);

  const displayName = user?.user_metadata?.display_name || user?.email?.split('@')[0] || 'Coder';

  return (
    <>
      {isOpen && <div className="overlay" onClick={onClose} />}
      <aside className={`sb ${isOpen ? 'open' : ''}`}>
        {/* Brand */}
        <div className="sb-head">
          <div className="brand">
            <span className="brand-bolt">⚡</span>
            <div>
              <h1 className="brand-name">CodeHerWay</h1>
              <span className="brand-sub">Learn. Build. Ship.</span>
            </div>
          </div>
          <button className="sb-close" onClick={onClose}>✕</button>
        </div>

        {/* User Info */}
        <div className="user-info">
          <div className="user-avatar">{displayName[0].toUpperCase()}</div>
          <div className="user-details">
            <span className="user-name">{displayName}</span>
            <span className="user-level">Level {level}</span>
          </div>
          <button className="user-logout" onClick={signOut} title="Sign out">↗</button>
        </div>

        {/* Course Switcher */}
        <div className="course-switcher">
          {courses.map((c, ci) => (
            <button
              key={c.id}
              className={`cs-btn ${ci === courseIdx ? 'on' : ''}`}
              onClick={() => onSelectCourse(ci)}
              style={ci === courseIdx ? { '--cs-accent': c.accent } : undefined}
            >
              <span className="cs-icon">{c.icon}</span>
              <span className="cs-label">{c.label}</span>
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="prog">
          <div className="prog-info">
            <span>{courseDone}/{total} lessons</span>
            <span className="prog-pct">{pct}%</span>
          </div>
          <div className="prog-track">
            <div className="prog-fill" style={{ width: `${pct}%`, background: course.accent }} />
          </div>
        </div>

        {/* Stats Row */}
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

        {/* XP Bar */}
        <div className="xp-bar-wrap">
          <div className="xp-info">
            <span className="xp-level">Level <span className="lvl-num">{level}</span></span>
            <span className="xp-amount">{inLevel}/{XP_PER_LEVEL} XP</span>
          </div>
          <div className="xp-track"><div className="xp-fill" style={{ width: `${xpPct}%` }} /></div>
        </div>

        {/* Daily Goal */}
        <div className="daily-goal">
          <div className="dg-head">
            <span className="dg-label">Daily Goal</span>
            <span className="dg-count">{dailyCount}/{DAILY_GOAL} {dailyCount >= DAILY_GOAL ? '✅' : ''}</span>
          </div>
          <div className="dg-dots">
            {Array.from({ length: DAILY_GOAL }, (_, i) => (
              <div key={i} className={`dg-dot ${i < dailyCount ? 'filled' : ''}`} />
            ))}
          </div>
        </div>

        {/* Module/Lesson Navigation */}
        <div className="sb-scroll">
          <nav className="sb-nav">
            {modules.map((m, mi) => {
              const mc = m.lessons.filter(l =>
                completed.includes(`${course.label}|${m.title}|${l.title}`)
              ).length;
              return (
                <div key={m.id} className={`mg ${mi === modIdx ? 'act' : ''}`}>
                  <button className="mg-btn" onClick={() => onSelectLesson(mi, 0)}>
                    <span className="mg-emoji">{m.emoji}</span>
                    <div className="mg-info">
                      <span className="mg-name">{m.title}</span>
                      <span className="mg-sub">{mc}/{m.lessons.length}</span>
                    </div>
                  </button>
                  {mi === modIdx && (
                    <div className="lg">
                      {m.lessons.map((l, li) => {
                        const key = `${course.label}|${m.title}|${l.title}`;
                        const isDone = completed.includes(key);
                        return (
                          <button
                            key={l.id}
                            className={`lg-btn ${li === lesIdx && !showModQuiz ? 'act' : ''} ${isDone ? 'dn' : ''}`}
                            onClick={() => onSelectLesson(mi, li)}
                          >
                            <span className="lg-chk">{isDone ? '✓' : '○'}</span>
                            <span>{l.title}</span>
                          </button>
                        );
                      })}
                      {QUIZ_MAP.has(`m:${m.id}`) && (
                        <button
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
      </aside>
    </>
  );
}
