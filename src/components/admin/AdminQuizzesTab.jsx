// ═══════════════════════════════════════════════
// ADMIN QUIZZES TAB — Aggregate quiz performance table.
// Shows attempts and average score per quiz_key, sorted
// by popularity. Color-codes the average (good/ok/low).
// ═══════════════════════════════════════════════

function computeQuizStats(quizScores) {
  const stats = {};
  quizScores.forEach((qs) => {
    if (!stats[qs.quiz_key]) stats[qs.quiz_key] = { attempts: 0, scores: [] };
    stats[qs.quiz_key].attempts += 1;
    const [got, total] = (qs.score || '0/0').split('/').map(Number);
    if (total > 0) stats[qs.quiz_key].scores.push(got / total);
  });
  return stats;
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
            </tr>
          </thead>
          <tbody>
            {rows.map(([key, stats]) => {
              const avg =
                stats.scores.length > 0
                  ? Math.round(
                      (stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length) * 100,
                    )
                  : 0;
              const tier = avg >= 80 ? 'good' : avg >= 50 ? 'ok' : 'low';
              return (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{stats.attempts}</td>
                  <td>
                    <span className={`admin-score ${tier}`}>{avg}%</span>
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="admin-empty">No quiz data yet</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
