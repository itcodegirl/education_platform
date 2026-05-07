import { useEffect, useMemo, useRef } from 'react';
import { useProgressData, useXP, useSR, BADGE_DEFS, useCourseContent } from '../../providers';
import { COURSES } from '../../data';
import { getLevel, getXPInLevel, XP_PER_LEVEL } from '../../utils/helpers';
import { getCourseCompletedLessonCount } from '../../utils/lessonKeys';
import { findQuizEntityTitle, quizKeyBelongsToCourse } from '../../utils/quizCourseOwnership';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { PROGRESS_SYNC_COPY } from '../../constants/progressCopy';

export function StudentStats({ isOpen, onClose }) {
  const { completed, quizScores } = useProgressData();
  const { xpTotal, streak, pausedStreak = null, dailyCount, earnedBadges } = useXP();
  const { srCards, bookmarks, notes } = useSR();
  const { ensureAllLoaded } = useCourseContent();
  const modalRef = useRef(null);

  useEffect(() => {
    ensureAllLoaded();
  }, [ensureAllLoaded]);

  const stats = useMemo(() => {
    const level = getLevel(xpTotal);
    const xpInLevel = getXPInLevel(xpTotal);
    const xpPercent = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
    const completedSet = new Set(completed);
    const quizEntries = Object.entries(quizScores || {});
    const toQuizResult = ([key, scoreValue]) => {
      const [got, total] = String(scoreValue || '0/0').split('/').map(Number);
      const safeGot = Number.isFinite(got) ? got : 0;
      const safeTotal = Number.isFinite(total) ? total : 0;

      return {
        key,
        got: safeGot,
        total: safeTotal,
        percent: safeTotal > 0 ? Math.round((safeGot / safeTotal) * 100) : 0,
      };
    };

    const courseStats = COURSES.map((course) => {
      const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
      const done = getCourseCompletedLessonCount(completedSet, course);
      const percent = totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;

      const quizResults = quizEntries
        .filter(([key]) => quizKeyBelongsToCourse(key, course))
        .map(toQuizResult);

      const averageQuizPercent = quizResults.length > 0
        ? Math.round(quizResults.reduce((sum, result) => sum + result.percent, 0) / quizResults.length)
        : null;

      return {
        id: course.id,
        label: course.label,
        icon: course.icon,
        accent: course.accent,
        totalLessons,
        done,
        percent,
        quizzesTaken: quizResults.length,
        averageQuizPercent,
      };
    });

    const allResults = quizEntries.map(toQuizResult);

    const overallQuizPercent = allResults.length > 0
      ? Math.round(allResults.reduce((sum, result) => sum + result.percent, 0) / allResults.length)
      : null;

    const sorted = [...allResults].sort((left, right) => left.percent - right.percent);
    const weakest = sorted.slice(0, 3).filter((result) => result.percent < 80);
    const strongest = sorted.slice(-3).reverse().filter((result) => result.percent >= 80);

    const totalLessons = courseStats.reduce((sum, course) => sum + course.totalLessons, 0);
    const totalDone = courseStats.reduce((sum, course) => sum + course.done, 0);
    const totalPercent = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0;

    return {
      level,
      xpTotal,
      xpInLevel,
      xpPercent,
      totalDone,
      totalLessons,
      totalPercent,
      courseStats,
      overallQuizPercent,
      quizzesTaken: allResults.length,
      strongest,
      weakest,
      streak,
      pausedStreak,
      dailyCount,
      badgeCount: Object.keys(earnedBadges).length,
      totalBadges: BADGE_DEFS.length,
      srDue: srCards.filter((card) => card.nextReview <= Date.now()).length,
      srTotal: srCards.length,
      bookmarkCount: bookmarks.length,
      noteCount: Object.keys(notes).length,
    };
  }, [bookmarks, completed, earnedBadges, notes, quizScores, srCards, streak, pausedStreak, dailyCount, xpTotal]);

  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });

  if (!isOpen) return null;

  const quizColor = (percent) => {
    if (percent >= 80) return '#10b981';
    if (percent >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const findLessonTitle = (quizKey) => findQuizEntityTitle(quizKey, COURSES);

  return (
    <div className="search-overlay" onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <div
        ref={modalRef}
        className="search-modal ss-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Your progress"
        tabIndex={-1}
      >
        <div className="ss-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Momentum snapshot</p>
            <h2 className="ss-title">Your Progress</h2>
          </div>
          <button type="button" className="cheatsheet-close" onClick={onClose} aria-label="Close progress panel">
            ×
          </button>
        </div>

        <div className="ss-body">
          {stats.totalDone === 0 ? (
            <div className="ss-empty-state">
              <span className="ss-empty-icon" aria-hidden="true">✓</span>
              <h3 className="ss-empty-title">No completed lessons yet</h3>
              <p className="ss-empty-body">
                Read the lesson in front of you first. When the idea clicks, use Complete lesson
                to start your progress dashboard.
              </p>
              <button type="button" className="ss-empty-cta" onClick={onClose}>
                Back to current lesson
              </button>
            </div>
          ) : (
          <p className="panel-meta">
            Track motivational XP, quiz confidence, review load, and the parts of the curriculum that need the next rep.
            Lessons, bookmarks, and notes can sync to your account when the cloud is reachable; rewards stay on this device today.
          </p>
          )}
          <p className="panel-meta">{PROGRESS_SYNC_COPY}</p>

          <div className="ss-cards" style={stats.totalDone === 0 ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
            <div className="ss-card">
              <span className="ss-card-value">{stats.level}</span>
              <span className="ss-card-label">Level</span>
              <div className="ss-mini-bar">
                <div className="ss-mini-fill" style={{ width: `${stats.xpPercent}%` }} />
              </div>
              <span className="ss-card-sub">{stats.xpInLevel}/{XP_PER_LEVEL} motivational XP to next</span>
            </div>
            <div className="ss-card">
              <span className="ss-card-value">{stats.xpTotal.toLocaleString()}</span>
              <span className="ss-card-label">Motivational XP</span>
            </div>
            <div className="ss-card">
              {stats.streak > 0 ? (
                <>
                  <span className="ss-card-value">{stats.streak}</span>
                  <span className="ss-card-label">Day Streak</span>
                  <span className="ss-card-sub">
                    {stats.streak >= 7 ? 'On fire this week.' : stats.streak >= 3 ? 'Momentum is building.' : 'Stack one more win today.'}
                  </span>
                </>
              ) : stats.pausedStreak ? (
                <>
                  <span className="ss-card-value">{stats.pausedStreak.days}</span>
                  <span className="ss-card-label">Streak paused</span>
                  <span className="ss-card-sub">Pick it back up — one lesson today resumes it.</span>
                </>
              ) : (
                <>
                  <span className="ss-card-value">0</span>
                  <span className="ss-card-label">Day Streak</span>
                  <span className="ss-card-sub">Stack one more win today.</span>
                </>
              )}
            </div>
            <div className="ss-card">
              <span className="ss-card-value">{stats.totalPercent}%</span>
              <span className="ss-card-label">Complete</span>
              <span className="ss-card-sub">{stats.totalDone}/{stats.totalLessons} lessons</span>
            </div>
          </div>

          <div className="ss-section">
            <h3 className="ss-section-title">Course Progress</h3>
            <div className="ss-course-list">
              {stats.courseStats.map((course) => (
                <div key={course.id} className="ss-course-row">
                  <div className="ss-course-info">
                    <span className="ss-course-icon">{course.icon}</span>
                    <span className="ss-course-name">{course.label}</span>
                    <span className="ss-course-count">{course.done}/{course.totalLessons}</span>
                  </div>
                  <div className="ss-progress-bar">
                    <div className="ss-progress-fill" style={{ width: `${course.percent}%`, background: course.accent }} />
                  </div>
                  <div className="ss-course-meta">
                    <span className="ss-course-pct">{course.percent}%</span>
                    {course.averageQuizPercent !== null && (
                      <span className="ss-quiz-badge" style={{ color: quizColor(course.averageQuizPercent) }}>
                        Quiz avg: {course.averageQuizPercent}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {stats.quizzesTaken > 0 && (
            <div className="ss-section">
              <h3 className="ss-section-title">Quiz Accuracy</h3>
              <div className="ss-quiz-overview">
                <div className="ss-quiz-donut">
                  <svg viewBox="0 0 36 36" className="ss-donut-svg">
                    <path className="ss-donut-bg" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" />
                    <path
                      className="ss-donut-fill"
                      strokeDasharray={`${stats.overallQuizPercent}, 100`}
                      style={{ stroke: quizColor(stats.overallQuizPercent) }}
                      d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                  </svg>
                  <span className="ss-donut-label">{stats.overallQuizPercent}%</span>
                </div>
                <div className="ss-quiz-detail">
                  <p className="ss-quiz-total">{stats.quizzesTaken} quizzes completed</p>
                  {stats.srTotal > 0 && (
                    <p className="ss-quiz-sr">Review queue: {stats.srDue} due now, {stats.srTotal} total cards.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {(stats.strongest.length > 0 || stats.weakest.length > 0) && (
            <div className="ss-section">
              <h3 className="ss-section-title">Strengths & Areas to Review</h3>
              <div className="ss-strength-grid">
                {stats.strongest.length > 0 && (
                  <div className="ss-strength-col">
                    <span className="ss-col-label ss-strong">Strongest</span>
                    {stats.strongest.map((result) => (
                      <div key={result.key} className="ss-topic-item ss-topic-strong">
                        <span className="ss-topic-score" style={{ color: quizColor(result.percent) }}>{result.percent}%</span>
                        <span className="ss-topic-name">{findLessonTitle(result.key)}</span>
                      </div>
                    ))}
                  </div>
                )}
                {stats.weakest.length > 0 && (
                  <div className="ss-strength-col">
                    <span className="ss-col-label ss-weak">Needs Review</span>
                    {stats.weakest.map((result) => (
                      <div key={result.key} className="ss-topic-item ss-topic-weak">
                        <span className="ss-topic-score" style={{ color: quizColor(result.percent) }}>{result.percent}%</span>
                        <span className="ss-topic-name">{findLessonTitle(result.key)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="ss-section">
            <h3 className="ss-section-title">Activity</h3>
            <div className="ss-activity-grid">
              <div className="ss-activity-item">
                <span className="ss-activity-icon">🏆</span>
                <span className="ss-activity-value">{stats.badgeCount}/{stats.totalBadges}</span>
                <span className="ss-activity-label">Badges earned</span>
              </div>
              <div className="ss-activity-item">
                <span className="ss-activity-icon">★</span>
                <span className="ss-activity-value">{stats.bookmarkCount}</span>
                <span className="ss-activity-label">Bookmarks</span>
              </div>
              <div className="ss-activity-item">
                <span className="ss-activity-icon">✏️</span>
                <span className="ss-activity-value">{stats.noteCount}</span>
                <span className="ss-activity-label">Notes</span>
              </div>
              <div className="ss-activity-item">
                <span className="ss-activity-icon">🔄</span>
                <span className="ss-activity-value">{stats.srTotal}</span>
                <span className="ss-activity-label">Review cards</span>
              </div>
            </div>
          </div>

          <p className="panel-meta">
            Daily pace: {stats.dailyCount} lesson{stats.dailyCount === 1 ? '' : 's'} today.
            If sync is interrupted, queued updates stay in this browser until retry.
          </p>
        </div>
      </div>
    </div>
  );
}
