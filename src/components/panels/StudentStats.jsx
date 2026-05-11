import { useEffect, useMemo, useRef } from 'react';
import { useProgressData, useXP, useSR, BADGE_DEFS, useCourseContent } from '../../providers';
import { COURSES } from '../../data';
import { getLevel, getXPInLevel, XP_PER_LEVEL } from '../../utils/helpers';
import { getCourseCompletedLessonCount } from '../../utils/lessonKeys';
import { findQuizEntityTitle, quizKeyBelongsToCourse } from '../../utils/quizCourseOwnership';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { PROGRESS_SYNC_COPY } from '../../constants/progressCopy';
import { parseQuizScore } from '../../services/rewardPolicy';

function toQuizResult([key, scoreValue]) {
  const parsed = parseQuizScore(scoreValue);
  if (!parsed) return null;
  return {
    key,
    got: parsed.score,
    total: parsed.total,
    percent: parsed.pct,
  };
}

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

    const courseStats = COURSES.map((course) => {
      const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
      const done = getCourseCompletedLessonCount(completedSet, course);
      const percent = totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;

      const quizResults = quizEntries
        .filter(([key]) => quizKeyBelongsToCourse(key, course))
        .map(toQuizResult)
        .filter(Boolean);

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

    const allResults = quizEntries.map(toQuizResult).filter(Boolean);

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
  const reviewTarget = stats.weakest[0] ? findLessonTitle(stats.weakest[0].key) : '';
  const nextAction = (() => {
    if (stats.srDue > 0) {
      return {
        title: 'Review what is due, then continue',
        body: `${stats.srDue} review card${stats.srDue === 1 ? '' : 's'} need attention. Keep it short, then return to the current lesson.`,
      };
    }

    if (reviewTarget) {
      return {
        title: `Revisit ${reviewTarget}`,
        body: 'One focused review pass will make the next build feel less crowded.',
      };
    }

    if (stats.totalPercent >= 100) {
      return {
        title: 'Turn this track into a portfolio artifact',
        body: 'Choose one saved idea or challenge and shape it into something you can show.',
      };
    }

    return {
      title: 'Continue the next lesson',
      body: 'Keep the session simple: read the goal, try the build, save progress, then move on.',
    };
  })();

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
            <p className="panel-kicker">Learning progress</p>
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
            Use this snapshot to choose the next honest step. Lessons, bookmarks, and notes can sync to your account when the cloud is reachable.
          </p>
          )}
          <p className="panel-meta">{PROGRESS_SYNC_COPY}</p>

          {stats.totalDone > 0 && (
            <section className="ss-next-step" aria-label="Recommended next step">
              <span className="ss-next-kicker">Recommended next step</span>
              <h3 className="ss-next-title">{nextAction.title}</h3>
              <p className="ss-next-body">{nextAction.body}</p>
              <button type="button" className="ss-next-action" onClick={onClose}>
                Back to current lesson
              </button>
            </section>
          )}

          <div className="ss-cards" style={stats.totalDone === 0 ? { opacity: 0.4, pointerEvents: 'none' } : undefined}>
            <div className="ss-card">
              <span className="ss-card-value">{stats.level}</span>
              <span className="ss-card-label">Learning level</span>
              <div className="ss-mini-bar">
                <div className="ss-mini-fill" style={{ width: `${stats.xpPercent}%` }} />
              </div>
              <span className="ss-card-sub">{stats.xpInLevel}/{XP_PER_LEVEL} practice XP to next</span>
            </div>
            <div className="ss-card">
              <span className="ss-card-value">{stats.xpTotal.toLocaleString()}</span>
              <span className="ss-card-label">Practice XP</span>
            </div>
            <div className="ss-card">
              {stats.streak > 0 ? (
                <>
                  <span className="ss-card-value">{stats.streak}</span>
                  <span className="ss-card-label">Learning streak</span>
                  <span className="ss-card-sub">
                    {stats.streak >= 7 ? 'You have a steady weekly rhythm.' : stats.streak >= 3 ? 'A steady rhythm is forming.' : 'One more lesson keeps it going.'}
                  </span>
                </>
              ) : stats.pausedStreak ? (
                <>
                  <span className="ss-card-value">{stats.pausedStreak.days}</span>
                  <span className="ss-card-label">Streak paused</span>
                  <span className="ss-card-sub">One lesson today resumes it.</span>
                </>
              ) : (
                <>
                  <span className="ss-card-value">0</span>
                  <span className="ss-card-label">Learning streak</span>
                  <span className="ss-card-sub">Start with one lesson today.</span>
                </>
              )}
            </div>
            <div className="ss-card">
              <span className="ss-card-value">{stats.totalPercent}%</span>
              <span className="ss-card-label">Lessons complete</span>
              <span className="ss-card-sub">{stats.totalDone}/{stats.totalLessons} lessons</span>
            </div>
          </div>

          <div className="ss-section">
            <h3 className="ss-section-title">Course progress</h3>
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
              <h3 className="ss-section-title">Quiz confidence</h3>
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
              <h3 className="ss-section-title">Review focus</h3>
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
            <h3 className="ss-section-title">Saved work</h3>
            <div className="ss-activity-grid">
              <div className="ss-activity-item">
                <span className="ss-activity-icon">🏆</span>
                <span className="ss-activity-value">{stats.badgeCount}/{stats.totalBadges}</span>
                <span className="ss-activity-label">Progress markers</span>
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
