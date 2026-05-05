import { useEffect, useRef, useState } from 'react';
import { useXP } from '../../providers';
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
    'You are rewriting your future, one lesson at a time',
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
  const { xpTotal = 0, streak = 0, pausedStreak = null, dailyCount = 0 } = useXP();
  const [show, setShow] = useState(false);
  const [motivation] = useState(() => getMotivation(streak, completedCount));
  const modalRef = useRef(null);
  const headingRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    }

    setShow(false);
    return undefined;
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && show && headingRef.current) {
      headingRef.current.focus();
    }
  }, [isOpen, show]);

  useFocusTrap(modalRef, {
    enabled: isOpen,
    onEscape: onClose,
    initialFocus: 'first-tabbable',
  });

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

  return (
    <div className="welcome-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`welcome-card ${show ? 'show' : ''}`}
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-back-title"
        aria-describedby="welcome-back-context welcome-back-snapshot"
        tabIndex={-1}
      >
        <div className="wb-greeting">
          <span className="wb-overline">Back in the build studio</span>
          <h2
            id="welcome-back-title"
            className="wb-hello"
            ref={headingRef}
            tabIndex={-1}
          >
            {greeting}, <span className="wb-name">{displayName || 'Learner'}</span>
          </h2>
          <p className="wb-motivation" aria-live="polite" role="status">
            {motivation}
          </p>
          <p id="welcome-back-context" className="wb-context">
            You are building through <strong>{courseLabel}</strong>
            {moduleTitle ? ` and currently moving through ${moduleTitle}.` : '.'}
          </p>
        </div>

        {lastPosition.les && (
          <button type="button" className="wb-hero" onClick={onResume} aria-label={`Resume lesson: ${lastPosition.les}`}>
            <div className="wb-hero-glow" aria-hidden="true" />
            <div className="wb-hero-content">
              <span className="wb-hero-label">Resume your build</span>
              <div className="wb-hero-path">
                {lastPosition.course} <span className="wb-sep">&gt;</span> {lastPosition.mod}
              </div>
              <div className="wb-hero-lesson">{lastPosition.les}</div>
              <div className="wb-hero-meta">
                {timeAgo && <span className="wb-hero-time">Last active {timeAgo}</span>}
                <span className="wb-hero-kicker">
                  Pick up with the next honest step, not from scratch.
                </span>
              </div>

              {moduleLessonsTotal > 0 && (
                <div
                  className="wb-hero-progress"
                  role="progressbar"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={modulePct}
                  aria-label="Current module progress"
                >
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

        <section id="welcome-back-snapshot" className="wb-stat-grid">
          <article className="wb-stat-card" aria-label="Module progress">
            <span className="wb-stat-label">Module progress</span>
            <strong className="wb-stat-value">{modulePct}%</strong>
            <span className="wb-stat-copy">
              {moduleLessonsDone}/{moduleLessonsTotal || 0} lessons completed
            </span>
          </article>
          <article className="wb-stat-card" aria-label="Course progress">
            <span className="wb-stat-label">Track progress</span>
            <strong className="wb-stat-value">{coursePct}%</strong>
            <span className="wb-stat-copy">
              {courseLessonsDone}/{courseLessonsTotal || 0} lessons across this course
            </span>
          </article>
          <article className="wb-stat-card" aria-label="Learning momentum">
            <span className="wb-stat-label">Momentum</span>
            <strong className="wb-stat-value">Lv {level}</strong>
            <span className="wb-stat-copy">{levelLabel}</span>
          </article>
        </section>

        <div className="wb-pills" aria-label="Current progress pills">
          {streak > 0 ? (
            <span className="wb-pill wb-pill-accent">
              {streak} day streak {streak >= 3 ? '🔥' : ''}
            </span>
          ) : pausedStreak ? (
            // Streak just lapsed. Surface the previous run as a
            // recovery target instead of pretending the streak
            // never happened. Sentence is intentionally short so
            // the pill row stays visually balanced.
            <span className="wb-pill wb-pill-warm">
              {pausedStreak.days} day streak paused — pick it back up
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
            <span className="wb-pill">{DAILY_GOAL - dailyCount} more for today's goal</span>
          )}

          {dailyCount >= DAILY_GOAL && (
            <span className="wb-pill wb-pill-accent">Daily goal completed</span>
          )}
        </div>

        <p className="wb-momentum-note">{momentumLabel}</p>

        <button type="button" className="wb-fresh" onClick={onClose}>
          Start fresh
        </button>
      </div>
    </div>
  );
}
