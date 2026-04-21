import { useEffect, useRef, useState } from 'react';
import { useProgress } from '../../providers';
import { DAILY_GOAL, XP_PER_LEVEL, getLevel, getXPInLevel } from '../../utils/helpers';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const MOTIVATIONS = {
  newUser: [
    'Your coding journey starts now',
    'Every expert was once a beginner',
    'The hardest step is the first one - and you already took it',
  ],
  lowStreak: [
    "You're building something real",
    'Every line of code is a step forward',
    "Consistency beats perfection - keep showing up",
  ],
  midStreak: [
    'Look at you go!',
    'Your dedication is paying off',
    "You're proving you belong here",
  ],
  highStreak: [
    "You're unstoppable right now",
    "This streak is on fire - don't stop",
    "You're rewriting your future, one lesson at a time",
  ],
};

function getMotivation(streak, completedCount) {
  let pool;

  if (completedCount === 0) pool = MOTIVATIONS.newUser;
  else if (streak <= 1) pool = MOTIVATIONS.lowStreak;
  else if (streak <= 5) pool = MOTIVATIONS.midStreak;
  else pool = MOTIVATIONS.highStreak;

  return pool[Math.floor(Math.random() * pool.length)];
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatTimeAgo(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);

  if (mins < 60) return `${mins}m ago`;

  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days} days ago`;
  return `${Math.floor(days / 7)}w ago`;
}

export function WelcomeBack({
  isOpen,
  onClose,
  onResume,
  displayName,
  lastPosition,
  completedCount,
  moduleTitle,
  moduleLessonsDone,
  moduleLessonsTotal,
  courseLabel,
  courseLessonsDone,
  courseLessonsTotal,
}) {
  const { xpTotal = 0, streak = 0, dailyCount = 0 } = useProgress();
  const [show, setShow] = useState(false);
  const [motivation] = useState(() => getMotivation(streak, completedCount));
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    }

    setShow(false);
    return undefined;
  }, [isOpen]);

  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });

  if (!isOpen) return null;

  const timeAgo = lastPosition.time ? formatTimeAgo(lastPosition.time) : '';
  const greeting = getGreeting();
  const level = getLevel(xpTotal);
  const xpIntoLevel = getXPInLevel(xpTotal);
  const modulePct =
    moduleLessonsTotal > 0 ? Math.round((moduleLessonsDone / moduleLessonsTotal) * 100) : 0;
  const coursePct =
    courseLessonsTotal > 0 ? Math.round((courseLessonsDone / courseLessonsTotal) * 100) : 0;
  const lessonsToGoal = Math.max(DAILY_GOAL - dailyCount, 0);
  const momentumLabel =
    dailyCount >= DAILY_GOAL
      ? 'Daily momentum locked in'
      : dailyCount > 0
        ? `${lessonsToGoal} more lesson${lessonsToGoal === 1 ? '' : 's'} for today's goal`
        : 'A short build session gets today moving';
  const levelLabel =
    xpIntoLevel > 0
      ? `${xpIntoLevel}/${XP_PER_LEVEL} XP into this level`
      : `Level ${level} starts with your next small win`;
  const overlineStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    minHeight: '28px',
    padding: '0 12px',
    marginBottom: '14px',
    borderRadius: '999px',
    border: '1px solid rgba(255,255,255,0.08)',
    background: 'rgba(255,255,255,0.04)',
    color: 'var(--text-muted)',
    fontFamily: "'Poppins', monospace",
    fontSize: '10px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
  };
  const contextStyle = {
    marginTop: '10px',
    color: 'var(--text-muted)',
    fontSize: '13px',
    lineHeight: 1.6,
  };
  const heroMetaStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginTop: '6px',
  };
  const heroKickerStyle = {
    color: 'var(--text-dim)',
    fontSize: '12px',
    lineHeight: 1.5,
  };
  const snapshotStyle = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
    gap: '10px',
    margin: '18px 0 16px',
  };
  const statCardStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    minWidth: 0,
    padding: '14px 14px 13px',
    borderRadius: '14px',
    border: '1px solid rgba(255,255,255,0.06)',
    background: 'linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.015))',
    textAlign: 'left',
  };
  const statLabelStyle = {
    color: 'var(--text-muted)',
    fontFamily: "'Poppins', monospace",
    fontSize: '10px',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  };
  const statValueStyle = {
    color: 'var(--text)',
    fontFamily: "'Poppins', monospace",
    fontSize: '19px',
    lineHeight: 1,
  };
  const statCopyStyle = {
    color: 'var(--text-dim)',
    fontSize: '12px',
    lineHeight: 1.5,
  };
  const momentumNoteStyle = {
    margin: '-4px 0 12px',
    color: 'var(--text-dim)',
    fontSize: '13px',
    lineHeight: 1.55,
    textAlign: 'center',
  };

  return (
    <div className="welcome-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`welcome-card ${show ? 'show' : ''}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-back-title"
        tabIndex={-1}
      >
        <div className="wb-greeting">
          <span style={overlineStyle}>Back in the build studio</span>
          <h2 id="welcome-back-title" className="wb-hello">
            {greeting}, <span className="wb-name">{displayName || 'Learner'}</span>
          </h2>
          <p className="wb-motivation">{motivation}</p>
          <p style={contextStyle}>
            You are building through <strong>{courseLabel}</strong>
            {moduleTitle ? ` and currently moving through ${moduleTitle}.` : '.'}
          </p>
        </div>

        {lastPosition.les && (
          <button type="button" className="wb-hero" onClick={onResume}>
            <div className="wb-hero-glow" aria-hidden="true" />
            <div className="wb-hero-content">
              <span className="wb-hero-label">Resume your build</span>
              <div className="wb-hero-path">
                {lastPosition.course} <span className="wb-sep">&rsaquo;</span> {lastPosition.mod}
              </div>
              <div className="wb-hero-lesson">{lastPosition.les}</div>
              <div style={heroMetaStyle}>
                {timeAgo && <span className="wb-hero-time">Last active {timeAgo}</span>}
                <span style={heroKickerStyle}>
                  Pick up with the next honest step, not from scratch.
                </span>
              </div>

              {moduleLessonsTotal > 0 && (
                <div className="wb-hero-progress">
                  <div className="wb-hero-track">
                    <div className="wb-hero-fill" style={{ width: `${modulePct}%` }} />
                  </div>
                  <span className="wb-hero-pct">
                    {moduleLessonsDone}/{moduleLessonsTotal}
                  </span>
                </div>
              )}
            </div>
            <span className="wb-hero-arrow" aria-hidden="true">
              &rarr;
            </span>
          </button>
        )}

        <div style={snapshotStyle} aria-label="Current learning snapshot">
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Module progress</span>
            <strong style={statValueStyle}>{modulePct}%</strong>
            <span style={statCopyStyle}>
              {moduleLessonsDone}/{moduleLessonsTotal || 0} lessons completed
            </span>
          </div>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Track progress</span>
            <strong style={statValueStyle}>{coursePct}%</strong>
            <span style={statCopyStyle}>
              {courseLessonsDone}/{courseLessonsTotal || 0} lessons across this course
            </span>
          </div>
          <div style={statCardStyle}>
            <span style={statLabelStyle}>Momentum</span>
            <strong style={statValueStyle}>Lv {level}</strong>
            <span style={statCopyStyle}>{levelLabel}</span>
          </div>
        </div>

        <div className="wb-pills">
          {streak > 0 ? (
            <span className="wb-pill wb-pill-accent">
              {streak} day streak {streak >= 3 ? '🔥' : ''}
            </span>
          ) : (
            <span className="wb-pill">Start your first streak today</span>
          )}

          <span className="wb-pill">Lv {level}</span>

          {completedCount > 0 ? (
            <span className="wb-pill">{completedCount} lessons done</span>
          ) : (
            <span className="wb-pill wb-pill-warm">Your journey begins now</span>
          )}

          {dailyCount > 0 && dailyCount < DAILY_GOAL && (
            <span className="wb-pill">{DAILY_GOAL - dailyCount} more for today&apos;s goal</span>
          )}

          {dailyCount >= DAILY_GOAL && (
            <span className="wb-pill wb-pill-accent">Daily goal crushed!</span>
          )}
        </div>

        <p style={momentumNoteStyle}>{momentumLabel}</p>

        <button type="button" className="wb-fresh" onClick={onClose}>
          Start fresh
        </button>
      </div>
    </div>
  );
}
