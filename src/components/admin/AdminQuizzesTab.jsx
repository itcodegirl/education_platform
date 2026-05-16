// ═══════════════════════════════════════════════
// ADMIN QUIZZES TAB — Aggregate quiz performance table.
// Shows attempts and average score per quiz_key, sorted
// by popularity. Color-codes the average (good/ok/low).
// ═══════════════════════════════════════════════

const QUIZ_PASS_PERCENT = 80;

function toQuizPercent(score) {
  const [got, total] = String(score || '0/0').split('/').map(Number);
  if (!Number.isFinite(got) || !Number.isFinite(total) || total <= 0) return null;
  return Math.round((got / total) * 100);
}

function computeQuizStats(quizScores = []) {
  const stats = {};
  quizScores.forEach((qs) => {
    const key = qs.quiz_key || 'unknown';
    if (!stats[key]) {
      stats[key] = {
        attempts: 0,
        scores: [],
        passCount: 0,
        needsReview: 0,
      };
    }

    stats[key].attempts += 1;
    const percent = toQuizPercent(qs.score);
    if (percent === null) return;

    stats[key].scores.push(percent);
    if (percent >= QUIZ_PASS_PERCENT) {
      stats[key].passCount += 1;
    } else {
      stats[key].needsReview += 1;
    }
  });
  return stats;
}

function getAveragePercent(scores) {
  if (!scores.length) return 0;
  return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
}

function getReviewPriority(stats, avg) {
  if (!stats.scores.length) return { label: 'No scored data', tone: 'ok' };
  if (avg < 50 || stats.needsReview >= 3) return { label: 'High', tone: 'low' };
  if (avg < QUIZ_PASS_PERCENT || stats.needsReview > 0) return { label: 'Watch', tone: 'ok' };
  return { label: 'Stable', tone: 'good' };
}

export function AdminQuizzesTab({ quizScores }) {
  const quizStats = computeQuizStats(quizScores);
  const rows = Object.entries(quizStats).sort((a, b) => b[1].attempts - a[1].attempts);

  return (
    <div className="admin-section">
      <h3 className="admin-section-title">📝 Quiz Performance</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Quiz</th>
              <th>Attempts</th>
              <th>Avg Score</th>
              <th>80%+ Passes</th>
              <th>Review Need</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([key, stats]) => {
              const avg = getAveragePercent(stats.scores);
              const tier = avg >= 80 ? 'good' : avg >= 50 ? 'ok' : 'low';
              const scoredAttempts = stats.scores.length;
              const passLabel = scoredAttempts > 0
                ? `${stats.passCount}/${scoredAttempts}`
                : '0/0';
              const priority = getReviewPriority(stats, avg);
              return (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{stats.attempts}</td>
                  <td>
                    <span className={`admin-score ${tier}`}>{avg}%</span>
                  </td>
                  <td>{passLabel}</td>
                  <td>
                    <span className={`admin-score ${priority.tone}`}>{priority.label}</span>
                    {stats.needsReview > 0 && (
                      <span className="admin-review-count">
                        {stats.needsReview} below 80%
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty">No quiz data yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
