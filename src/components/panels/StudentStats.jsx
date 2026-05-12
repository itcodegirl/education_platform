import { useEffect, useMemo, useRef, useState } from 'react';
import { useProgressData, useXP, useSR, BADGE_DEFS } from '../../providers';
import {
  areChallengesLoaded,
  getChallengesForCourse,
  loadAllChallenges,
} from '../../data/challenges';
import { COURSE_CATALOG } from '../../data/reference/course-catalog';
import { getLevel, getXPInLevel, XP_PER_LEVEL } from '../../utils/helpers';
import { getCourseCompletedLessonCount } from '../../utils/lessonKeys';
import { findQuizEntityTitle, quizKeyBelongsToCourse } from '../../utils/quizCourseOwnership';
import { summarizeMasteryEvidence } from '../../utils/masteryProgress';
import { summarizeModuleMasteryEvidence } from '../../utils/moduleMasteryEvidence';
import { getProgressSnapshotItems } from '../../utils/progressDashboard';
import { buildLearnerTranscriptSummary } from '../../utils/learnerTranscript';
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
  const { completed, quizScores, challengeCompletions = [] } = useProgressData();
  const { xpTotal, streak, pausedStreak = null, dailyCount, earnedBadges } = useXP();
  const { srCards, bookmarks, notes } = useSR();
  const [challengeCatalogReady, setChallengeCatalogReady] = useState(
    () => COURSE_CATALOG.every((course) => areChallengesLoaded(course.id)),
  );
  const [showFullBreakdown, setShowFullBreakdown] = useState(false);
  const modalRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    if (!isOpen) return () => {
      cancelled = true;
    };

    const alreadyLoaded = COURSE_CATALOG.every((course) => areChallengesLoaded(course.id));
    setChallengeCatalogReady(alreadyLoaded);

    if (alreadyLoaded) {
      return () => {
        cancelled = true;
      };
    }

    void loadAllChallenges()
      .then(() => {
        if (!cancelled) {
          setChallengeCatalogReady(true);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setChallengeCatalogReady(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [isOpen]);

  const stats = useMemo(() => {
    const level = getLevel(xpTotal);
    const xpInLevel = getXPInLevel(xpTotal);
    const xpPercent = Math.round((xpInLevel / XP_PER_LEVEL) * 100);
    const completedSet = new Set(completed);
    const quizEntries = Object.entries(quizScores || {});
    const completedChallengeIds = new Set(challengeCompletions);
    const allChallenges = COURSE_CATALOG.flatMap((course) =>
      getChallengesForCourse(course.id).map((challenge) => ({
        ...challenge,
        courseId: course.id,
      })),
    );

    const courseStats = COURSE_CATALOG.map((course) => {
      const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
      const done = getCourseCompletedLessonCount(completedSet, course);
      const percent = totalLessons > 0 ? Math.round((done / totalLessons) * 100) : 0;
      const courseChallenges = getChallengesForCourse(course.id);
      const completedChallenges = courseChallenges.filter((challenge) =>
        completedChallengeIds.has(challenge.id),
      ).length;

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
        challengeTotal: courseChallenges.length,
        challengeDone: completedChallenges,
      };
    });

    const ownedQuizEntries = quizEntries.filter(([key]) =>
      COURSE_CATALOG.some((course) => quizKeyBelongsToCourse(key, course)),
    );
    const allResults = ownedQuizEntries.map(toQuizResult).filter(Boolean);

    const overallQuizPercent = allResults.length > 0
      ? Math.round(allResults.reduce((sum, result) => sum + result.percent, 0) / allResults.length)
      : null;

    const sorted = [...allResults].sort((left, right) => left.percent - right.percent);
    const weakest = sorted.slice(0, 3).filter((result) => result.percent < 80);
    const strongest = sorted.slice(-3).reverse().filter((result) => result.percent >= 80);

    const totalLessons = courseStats.reduce((sum, course) => sum + course.totalLessons, 0);
    const totalDone = courseStats.reduce((sum, course) => sum + course.done, 0);
    const totalPercent = totalLessons > 0 ? Math.round((totalDone / totalLessons) * 100) : 0;
    const masteryEvidence = summarizeMasteryEvidence({
      quizResults: allResults,
      completedLessonCount: totalDone,
      challengeCompletions,
      challenges: allChallenges,
      srCards,
    });
    const moduleEvidence = summarizeModuleMasteryEvidence({
      courses: COURSE_CATALOG,
      completedSet,
      quizResults: allResults,
      challengeCompletions,
      getChallengesForCourse,
      srCards,
    });
    const transcript = buildLearnerTranscriptSummary({
      completedLessons: totalDone,
      totalLessons,
      quizChecksPassed: masteryEvidence.quizChecksPassed,
      quizChecksAttempted: masteryEvidence.quizChecksAttempted,
      quizChecksNeedsReview: masteryEvidence.quizChecksNeedsReview,
      completedChallenges: masteryEvidence.completedChallenges,
      totalChallenges: masteryEvidence.totalChallenges,
      dueReviewCards: masteryEvidence.dueReviewCards,
      totalReviewCards: masteryEvidence.totalReviewCards,
    });

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
      masteryEvidence,
      moduleEvidence,
      transcript,
      strongest,
      weakest,
      streak,
      pausedStreak,
      dailyCount,
      badgeCount: Object.keys(earnedBadges).length,
      totalBadges: BADGE_DEFS.length,
      srDue,
      srTotal: srCards.length,
      bookmarkCount: bookmarks.length,
      noteCount: Object.keys(notes).length,
      transcript,
      snapshotItems: getProgressSnapshotItems({
        totalDone,
        totalLessons,
        quizzesTaken: allResults.length,
        masteryEvidence,
        srDue,
      }),
    };
  }, [bookmarks, challengeCompletions, completed, earnedBadges, notes, quizScores, srCards, streak, pausedStreak, dailyCount, xpTotal]);

  useFocusTrap(modalRef, {
    enabled: isOpen,
    onEscape: onClose,
    initialFocus: 'first-tabbable',
  });

  if (!isOpen) return null;

  const quizColor = (percent) => {
    if (percent >= 80) return '#10b981';
    if (percent >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const findLessonTitle = (quizKey) => findQuizEntityTitle(quizKey, COURSE_CATALOG);
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
        title: 'Turn this course into a portfolio piece',
        body: 'Choose one saved idea or challenge and shape it into something you can show.',
      };
    }

    return {
      title: 'Continue the next lesson',
      body: 'Keep the session simple: read the goal, try the build, save progress, then move on.',
    };
  })();
  // For a brand-new learner the detailed breakdown is mostly zeros, so it
  // stays collapsed until they ask for it (or they complete a lesson).
  const detailVisible = stats.totalDone > 0 || showFullBreakdown;

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
            <h2 className="ss-title">Progress snapshot</h2>
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
          {!challengeCatalogReady && (
            <p className="panel-meta" aria-live="polite">
              Loading challenge history across all courses so the mastery snapshot stays accurate.
            </p>
          )}

          <section className="ss-snapshot" aria-label="Progress snapshot summary">
            {stats.snapshotItems.map((item) => (
              <div
                key={item.key}
                className={`ss-snapshot-item ss-snapshot-item-${item.tone}`}
              >
                <span className="ss-snapshot-label">{item.label}</span>
                <strong className="ss-snapshot-value">{item.value}</strong>
                <span className="ss-snapshot-detail">{item.detail}</span>
              </div>
            ))}
          </section>

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

          <section className="ss-transcript" aria-labelledby="ss-transcript-title">
            <div className="ss-section-heading-row">
              <div>
                <h3 id="ss-transcript-title" className="ss-section-title">Learning transcript</h3>
                <p className="ss-section-copy">
                  A private readiness snapshot that separates completed lessons from proof of understanding.
                </p>
              </div>
              <span className={`ss-transcript-status ss-transcript-status-${stats.transcript.status.tone}`}>
                {stats.transcript.status.label}
              </span>
            </div>
            <p className="ss-evidence-next">{stats.transcript.status.detail}</p>
            <div className="ss-transcript-grid">
              {stats.transcript.items.map((item) => (
                <div key={item.key} className={`ss-transcript-card ss-transcript-card-${item.tone}`}>
                  <span className="ss-transcript-value">{item.value}</span>
                  <span className="ss-transcript-label">{item.label}</span>
                  <span className="ss-transcript-detail">{item.detail}</span>
                </div>
              ))}
            </div>
            <p className="ss-transcript-note">
              Transcript signals are learning evidence, not a verified credential.
            </p>
          </section>

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
                    <span className="ss-course-signals">
                      {course.averageQuizPercent !== null && (
                        <span className="ss-quiz-badge" style={{ color: quizColor(course.averageQuizPercent) }}>
                          Quiz avg: {course.averageQuizPercent}%
                        </span>
                      )}
                      {challengeCatalogReady && course.challengeTotal > 0 && (
                        <span className="ss-challenge-badge">
                          Challenges: {course.challengeDone}/{course.challengeTotal}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {!detailVisible && (
            <button
              type="button"
              className="ss-show-breakdown"
              onClick={() => setShowFullBreakdown(true)}
            >
              Show full breakdown
            </button>
          )}

          {detailVisible && (
          <>
          {stats.moduleEvidence.focusModules.length > 0 && (
            <div className="ss-section ss-module-evidence-section">
              <div className="ss-section-heading-row">
                <h3 className="ss-section-title">Module Evidence</h3>
                <span className="ss-mastery-status">
                  {stats.moduleEvidence.modulesWithEvidence}/{stats.moduleEvidence.modules.length} modules have quiz or challenge proof
                </span>
              </div>
              <p className="ss-section-copy">
                Module evidence helps separate reading progress from usable understanding, so the next
                step is based on proof instead of XP alone.
              </p>
              <div className="ss-module-evidence-list">
                {stats.moduleEvidence.focusModules.map((moduleEvidence) => (
                  <article
                    key={`${moduleEvidence.courseId}:${moduleEvidence.moduleId}`}
                    className={`ss-module-evidence-row ss-module-evidence-${moduleEvidence.statusTone}`}
                  >
                    <div className="ss-module-evidence-main">
                      <span className="ss-module-course">{moduleEvidence.courseLabel}</span>
                      <h4 className="ss-module-title">{moduleEvidence.moduleTitle}</h4>
                      <p className="ss-module-action">{moduleEvidence.nextAction}</p>
                    </div>
                    <div className="ss-module-status-block">
                      <span className="ss-module-status">{moduleEvidence.statusLabel}</span>
                      <span className="ss-module-lessons">
                        {moduleEvidence.lessonDone}/{moduleEvidence.lessonTotal} lessons
                      </span>
                    </div>
                    <dl className="ss-module-signals" aria-label={`${moduleEvidence.moduleTitle} evidence signals`}>
                      <div>
                        <dt>Checks</dt>
                        <dd>{moduleEvidence.quizPassed}/{moduleEvidence.quizAttempted}</dd>
                      </div>
                      <div>
                        <dt>Builds</dt>
                        <dd>{challengeCatalogReady ? `${moduleEvidence.challengeDone}/${moduleEvidence.challengeTotal}` : '...'}</dd>
                      </div>
                      <div>
                        <dt>Due</dt>
                        <dd>{moduleEvidence.reviewDue}</dd>
                      </div>
                    </dl>
                  </article>
                ))}
              </div>
            </div>
          )}

          <div className="ss-section ss-mastery-section">
            <div className="ss-section-heading-row">
              <h3 className="ss-section-title">Mastery Evidence</h3>
              <span className={`ss-mastery-status ss-mastery-status-${stats.masteryEvidence.stage}`}>
                {stats.masteryEvidence.stageLabel}
              </span>
            </div>
            <p className="ss-section-copy">
              Lesson completion shows exposure. Mastery evidence comes from quick checks, applied
              challenges, and review cards that bring weak spots back later.
            </p>
            <p className="ss-evidence-next">
              {stats.masteryEvidence.nextEvidenceAction}
            </p>
            <div className="ss-mastery-grid">
              <div className="ss-mastery-card">
                <span className="ss-mastery-value">
                  {stats.masteryEvidence.quizChecksPassed}/{stats.masteryEvidence.quizChecksAttempted}
                </span>
                <span className="ss-mastery-label">Quiz checks at 80%+</span>
                <span className="ss-mastery-sub">
                  {stats.masteryEvidence.quizChecksNeedsReview} need another pass
                </span>
              </div>
              <div className="ss-mastery-card">
                <span className="ss-mastery-value">
                  {challengeCatalogReady
                    ? `${stats.masteryEvidence.completedChallenges}/${stats.masteryEvidence.totalChallenges}`
                    : '...'}
                </span>
                <span className="ss-mastery-label">Applied challenges</span>
                <span className="ss-mastery-sub">
                  {challengeCatalogReady ? 'Tests passed in this browser' : 'Loading challenge history'}
                </span>
              </div>
              <div className="ss-mastery-card">
                <span className="ss-mastery-value">{stats.masteryEvidence.dueReviewCards}</span>
                <span className="ss-mastery-label">Review due now</span>
                <span className="ss-mastery-sub">
                  {stats.masteryEvidence.totalReviewCards} cards in rotation
                </span>
              </div>
              <div className="ss-mastery-card">
                <span className="ss-mastery-value">{stats.masteryEvidence.evidenceCoverage}%</span>
                <span className="ss-mastery-label">Evidence coverage</span>
                <span className="ss-mastery-sub">Signals compared with completed lessons</span>
              </div>
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
          </>
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
