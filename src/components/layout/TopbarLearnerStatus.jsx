import { memo } from 'react';

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
      <span className="topbar-greeting">Continue learning, {learnerName}.</span>
      {!showModQuiz && (
        <span className="topbar-pill" aria-label={`Estimated read time: ${readTime}`}>
          {readTime} read
        </span>
      )}
      {xpTotal > 0 && (
        <span className="topbar-pill" aria-label={`Level ${level}`}>Lv {level}</span>
      )}
      {coursePct > 0 && (
        <span className="topbar-pill" aria-label={`Course completion ${coursePct} percent`}>
          {coursePct}% track
        </span>
      )}
      {streak > 0 ? (
        <span className="topbar-pill streak" aria-label={`${streak} day streak`}>
          Streak: {streak} day{streak === 1 ? '' : 's'}
        </span>
      ) : pausedStreak ? (
        <span
          className="topbar-pill paused"
          aria-label={`${pausedStreak.days} day streak paused`}
          title="Pick up your streak with one more lesson today"
        >
          Streak paused: {pausedStreak.days} day{pausedStreak.days === 1 ? '' : 's'}
        </span>
      ) : null}
      {dailyCount > 0 && (
        <span className="topbar-pill warm" aria-label={`Lessons done today: ${dailyCount}`}>
          {dailyCount} lesson{dailyCount === 1 ? '' : 's'} today
        </span>
      )}
    </div>
  );
});

