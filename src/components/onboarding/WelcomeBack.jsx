// ═══════════════════════════════════════════════
// WELCOME BACK — Progress snapshot on return
// Shows streak, level, module progress, and daily
// goal so returning users see meaningful context.
// ═══════════════════════════════════════════════

import { useEffect, useState } from 'react';
import { useProgress } from '../../providers';
import { getLevel, getXPInLevel, XP_PER_LEVEL, DAILY_GOAL } from '../../utils/helpers';

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

  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => setShow(true), 100);
      return () => clearTimeout(timer);
    }
    setShow(false);
  }, [isOpen]);

  if (!isOpen) return null;

  const timeAgo = lastPosition.time ? formatTimeAgo(lastPosition.time) : '';
  const greeting = getGreeting();
  const level = getLevel(xpTotal);
  const inLevel = getXPInLevel(xpTotal);
  const xpPct = Math.round((inLevel / XP_PER_LEVEL) * 100);
  const modPct = moduleLessonsTotal > 0
    ? Math.round((moduleLessonsDone / moduleLessonsTotal) * 100)
    : 0;
  const coursePct = courseLessonsTotal > 0
    ? Math.round((courseLessonsDone / courseLessonsTotal) * 100)
    : 0;

  return (
    <div className="welcome-overlay" onClick={onClose}>
      <div className={`welcome-card ${show ? 'show' : ''}`} onClick={(e) => e.stopPropagation()}>
        <div className="welcome-wave">👋</div>
        <h2 className="welcome-title">
          {greeting}, {displayName || 'Learner'}!
        </h2>
        <p className="welcome-sub">Welcome back to CodeHerWay</p>

        {/* ─── Progress Snapshot ─── */}
        <div className="wb-stats">
          <div className="wb-stat">
            <span className="wb-stat-value wb-streak">
              {streak}{streak > 0 ? '🔥' : ''}
            </span>
            <span className="wb-stat-label">day streak</span>
          </div>
          <div className="wb-stat">
            <span className="wb-stat-value">Lv {level}</span>
            <span className="wb-stat-label">{inLevel}/{XP_PER_LEVEL} XP</span>
          </div>
          <div className="wb-stat">
            <span className="wb-stat-value">{completedCount}</span>
            <span className="wb-stat-label">lessons done</span>
          </div>
          <div className="wb-stat">
            <span className="wb-stat-value">
              {dailyCount}/{DAILY_GOAL}{dailyCount >= DAILY_GOAL ? ' ✅' : ''}
            </span>
            <span className="wb-stat-label">today's goal</span>
          </div>
        </div>

        {/* ─── Resume Card with Module Progress ─── */}
        {lastPosition.les && (
          <div className="wb-resume">
            <div className="wb-resume-label">Pick up where you left off</div>
            <div className="wb-resume-path">
              <span>{lastPosition.course}</span>
              <span className="welcome-sep">›</span>
              <span>{lastPosition.mod}</span>
            </div>
            <div className="wb-resume-lesson">{lastPosition.les}</div>
            {timeAgo && <div className="wb-resume-time">{timeAgo}</div>}

            {/* Module progress bar */}
            {moduleLessonsTotal > 0 && (
              <div className="wb-progress">
                <div className="wb-progress-info">
                  <span className="wb-progress-label">Module progress</span>
                  <span className="wb-progress-pct">{modPct}%</span>
                </div>
                <div className="wb-progress-track">
                  <div className="wb-progress-fill" style={{ width: `${modPct}%` }} />
                </div>
                <div className="wb-progress-detail">
                  {moduleLessonsDone}/{moduleLessonsTotal} lessons
                </div>
              </div>
            )}

            {/* Course progress bar */}
            {courseLessonsTotal > 0 && (
              <div className="wb-progress wb-progress-course">
                <div className="wb-progress-info">
                  <span className="wb-progress-label">{courseLabel} overall</span>
                  <span className="wb-progress-pct">{coursePct}%</span>
                </div>
                <div className="wb-progress-track">
                  <div
                    className="wb-progress-fill wb-progress-fill-course"
                    style={{ width: `${coursePct}%` }}
                  />
                </div>
              </div>
            )}
          </div>
        )}

        <div className="welcome-actions">
          <button className="welcome-resume-btn" onClick={onResume}>
            Continue Learning →
          </button>
          <button className="welcome-dismiss" onClick={onClose}>
            Start fresh
          </button>
        </div>
      </div>
    </div>
  );
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
