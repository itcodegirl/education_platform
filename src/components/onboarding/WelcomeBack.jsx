// ═══════════════════════════════════════════════
// WELCOME BACK — Premium glassmorphism greeting
// Motivational, action-focused, warm.
// Stats celebrate progress, not shame zeros.
// ═══════════════════════════════════════════════

import { useEffect, useState, useRef } from 'react';
import { useProgress } from '../../providers';
import { getLevel, getXPInLevel, XP_PER_LEVEL, DAILY_GOAL } from '../../utils/helpers';
import { useFocusTrap } from '../../hooks/useFocusTrap';

const MOTIVATIONS = {
  newUser: [
    "Your coding journey starts now",
    "Every expert was once a beginner",
    "The hardest step is the first one — and you already took it",
  ],
  lowStreak: [
    "You're building something real",
    "Every line of code is a step forward",
    "Consistency beats perfection — keep showing up",
  ],
  midStreak: [
    "Look at you go!",
    "Your dedication is paying off",
    "You're proving you belong here",
  ],
  highStreak: [
    "You're unstoppable right now",
    "This streak is on fire — don't stop",
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
  }, [isOpen]);

  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });

  if (!isOpen) return null;

  const timeAgo = lastPosition.time ? formatTimeAgo(lastPosition.time) : '';
  const greeting = getGreeting();
  const level = getLevel(xpTotal);
  const modPct = moduleLessonsTotal > 0
    ? Math.round((moduleLessonsDone / moduleLessonsTotal) * 100)
    : 0;

  return (
    <div className="welcome-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className={`welcome-card ${show ? 'show' : ''}`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="welcome-back-title"
        tabIndex={-1}
      >

        {/* ─── Greeting ─── */}
        <div className="wb-greeting">
          <h2 id="welcome-back-title" className="wb-hello">
            {greeting}, <span className="wb-name">{displayName || 'Learner'}</span>
          </h2>
          <p className="wb-motivation">{motivation}</p>
        </div>

        {/* ─── Resume Hero Card ─── */}
        {lastPosition.les && (
          <button type="button" className="wb-hero" onClick={onResume}>
            <div className="wb-hero-glow" aria-hidden="true" />
            <div className="wb-hero-content">
              <span className="wb-hero-label">Continue where you left off</span>
              <div className="wb-hero-path">
                {lastPosition.course} <span className="wb-sep">›</span> {lastPosition.mod}
              </div>
              <div className="wb-hero-lesson">{lastPosition.les}</div>
              {timeAgo && <span className="wb-hero-time">{timeAgo}</span>}

              {moduleLessonsTotal > 0 && (
                <div className="wb-hero-progress">
                  <div className="wb-hero-track">
                    <div className="wb-hero-fill" style={{ width: `${modPct}%` }} />
                  </div>
                  <span className="wb-hero-pct">{moduleLessonsDone}/{moduleLessonsTotal}</span>
                </div>
              )}
            </div>
            <span className="wb-hero-arrow">→</span>
          </button>
        )}

        {/* ─── Stat Pills (celebration, not report card) ─── */}
        <div className="wb-pills">
          {streak > 0 ? (
            <span className="wb-pill wb-pill-accent">
              {streak} day streak {streak >= 3 ? '🔥' : ''}
            </span>
          ) : (
            <span className="wb-pill">Start your first streak today</span>
          )}
          <span className="wb-pill">
            Lv {level}
          </span>
          {completedCount > 0 ? (
            <span className="wb-pill">
              {completedCount} lessons done
            </span>
          ) : (
            <span className="wb-pill wb-pill-warm">
              Your journey begins now
            </span>
          )}
          {dailyCount > 0 && dailyCount < DAILY_GOAL && (
            <span className="wb-pill">
              {DAILY_GOAL - dailyCount} more for today's goal
            </span>
          )}
          {dailyCount >= DAILY_GOAL && (
            <span className="wb-pill wb-pill-accent">
              Daily goal crushed!
            </span>
          )}
        </div>

        {/* ─── Secondary action ─── */}
        <button type="button" className="wb-fresh" onClick={onClose}>
          or start fresh
        </button>
      </div>
    </div>
  );
}
