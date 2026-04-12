// ═══════════════════════════════════════════════
// COURSES TAB — Completion funnel + per-lesson
// completion counts for every course.
// ═══════════════════════════════════════════════

export function CoursesTab({ courseStats, progressRows }) {
  return (
    <>
      {/* Completion Funnel */}
      <div className="admin-section">
        <h3 className="admin-section-title">📊 Course Completion Funnel</h3>
        <div className="admin-course-grid">
          {courseStats.map(c => {
            // Count users whose per-course lesson completions exceed each stage threshold.
            const userLessonCounts = {};
            progressRows
              .filter(p => p.lesson_key.startsWith(c.label))
              .forEach(p => {
                userLessonCounts[p.user_id] = (userLessonCounts[p.user_id] || 0) + 1;
              });
            const counts = Object.values(userLessonCounts);
            const atLeast = (threshold) =>
              counts.filter(n => n >= Math.ceil(c.totalLessons * threshold)).length;

            const stages = [
              { label: 'Started', count: c.uniqueUsers },
              { label: '25%+', count: atLeast(0.25) },
              { label: '50%+', count: atLeast(0.5) },
              { label: '75%+', count: atLeast(0.75) },
              { label: 'Completed', count: c.completedUsers },
            ].map(s => ({
              ...s,
              pct: c.uniqueUsers > 0 ? Math.round((s.count / c.uniqueUsers) * 100) : 0,
            }));

            return (
              <div key={c.id} className="admin-course-card">
                <div className="admin-course-header">
                  <span>{c.icon} {c.label}</span>
                  <span className="admin-course-accent" style={{ color: c.accent }}>{c.uniqueUsers} learners</span>
                </div>
                <div className="admin-course-stats">
                  {stages.map((s, i) => (
                    <div key={i}>
                      <div className="admin-stat-row">
                        <span>{s.label}</span>
                        <span className="admin-stat-val">{s.count} ({s.pct}%)</span>
                      </div>
                      <div className="admin-progress-bar">
                        <div className="admin-progress-fill" style={{ width: `${s.pct}%`, background: c.accent }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {courseStats.map(c => (
        <div key={c.id} className="admin-section">
          <h3 className="admin-section-title" style={{ color: c.accent }}>
            {c.icon} {c.label} — Lesson Completions
          </h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr><th>Lesson</th><th>Completions</th><th>Bar</th></tr>
              </thead>
              <tbody>
                {c.modules.flatMap(m =>
                  m.lessons.map(l => {
                    const key = `${c.label}|${m.title}|${l.title}`;
                    const count = c.lessonCounts[key] || 0;
                    const maxCount = Math.max(...Object.values(c.lessonCounts), 1);
                    return (
                      <tr key={key}>
                        <td className="admin-lesson-name">
                          <span className="admin-lesson-mod">{m.emoji}</span>
                          {l.title}
                        </td>
                        <td className="admin-lesson-count">{count}</td>
                        <td className="admin-lesson-bar-cell">
                          <div className="admin-lesson-bar">
                            <div
                              className="admin-lesson-bar-fill"
                              style={{ width: `${(count / maxCount) * 100}%`, background: c.accent }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}
