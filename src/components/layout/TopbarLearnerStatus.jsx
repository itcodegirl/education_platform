import { memo } from 'react';
import { PROGRESS_SYNC_SHORT } from '../../constants/progressCopy';

const LEVEL_SCOPE_TITLE = `Practice level rises as you earn XP from quizzes and challenges. It tracks effort, not mastery. ${PROGRESS_SYNC_SHORT}`;
const STREAK_SCOPE_TITLE = `Days in a row with at least one completed lesson. ${PROGRESS_SYNC_SHORT}`;
const DAILY_SCOPE_TITLE = `Lessons you have marked done today. ${PROGRESS_SYNC_SHORT}`;

export const TopbarLearnerStatus = memo(function TopbarLearnerStatus({
  learnerName,
  readTime,
  showModQuiz,
  xpTotal,
  level,
  coursePct,
  streak,
  pausedStreak,
  dailyCount,
}) {
  return (
    <div className="topbar-status" aria-label="Current learning status">
      <span className="topbar-greeting">
        {learnerName ? `Continue learning, ${learnerName}.` : 'Continue learning.'}
      </span>
      {!showModQuiz && (
        <span
          className="topbar-pill"
          aria-label={`Estimated read time: ${readTime}`}
          title="Roughly how long this lesson takes to read through"
        >
          {readTime} read
        </span>
      )}
      {xpTotal > 0 && (
        <span
          className="topbar-pill"
          aria-label={`Level ${level}`}
          title={LEVEL_SCOPE_TITLE}
        >
          Lv {level}
        </span>
      )}
      {coursePct > 0 && (
        <span
          className="topbar-pill"
          aria-label={`Course completion ${coursePct} percent`}
          title="Share of this course's lessons you've marked done"
        >
          {coursePct}% course
        </span>
      )}
      {streak > 0 ? (
        <span
          className="topbar-pill streak"
          aria-label={`${streak} day streak`}
          title={STREAK_SCOPE_TITLE}
        >
          Streak: {streak} day{streak === 1 ? '' : 's'}
        </span>
      ) : pausedStreak ? (
        <span
          className="topbar-pill paused"
          aria-label={`${pausedStreak.days} day streak paused`}
          title={`Pick up your streak with one more lesson today. ${PROGRESS_SYNC_SHORT}`}
        >
          Streak paused: {pausedStreak.days} day{pausedStreak.days === 1 ? '' : 's'}
        </span>
      ) : null}
      {dailyCount > 0 && (
        <span
          className="topbar-pill warm"
          aria-label={`Lessons done today: ${dailyCount}`}
          title={DAILY_SCOPE_TITLE}
        >
          {dailyCount} lesson{dailyCount === 1 ? '' : 's'} today
        </span>
      )}
    </div>
  );
});
