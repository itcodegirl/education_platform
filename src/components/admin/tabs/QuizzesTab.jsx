// ═══════════════════════════════════════════════
// QUIZZES TAB — Attempt count and average score
// for every quiz, sorted by popularity.
// ═══════════════════════════════════════════════

export function QuizzesTab({ quizStats }) {
  const entries = Object.entries(quizStats).sort((a, b) => b[1].attempts - a[1].attempts);

  return (
    <div className="admin-section">
      <h3 className="admin-section-title">📝 Quiz Performance</h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr><th>Quiz</th><th>Attempts</th><th>Avg Score</th></tr>
          </thead>
          <tbody>
            {entries.map(([key, stats]) => {
              const avg = stats.scores.length > 0
                ? Math.round(stats.scores.reduce((a, b) => a + b, 0) / stats.scores.length * 100)
                : 0;
              return (
                <tr key={key}>
                  <td>{key}</td>
                  <td>{stats.attempts}</td>
                  <td>
                    <span className={`admin-score ${avg >= 80 ? 'good' : avg >= 50 ? 'ok' : 'low'}`}>
                      {avg}%
                    </span>
                  </td>
                </tr>
              );
            })}
            {entries.length === 0 && (
              <tr><td colSpan={3} className="admin-empty">No quiz data yet</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
