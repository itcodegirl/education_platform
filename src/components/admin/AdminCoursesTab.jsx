// ═══════════════════════════════════════════════
// ADMIN COURSES TAB — Two sections:
//   1. Completion funnel (5-stage dropoff per course)
//   2. Per-course lesson completion tables with visual bars
//
// The funnel stages are computed here (not in the parent) because
// they're only used on this tab. Each stage counts the number of
// users whose completion count crosses a threshold.
// ═══════════════════════════════════════════════

function computeFunnelStages(course, courseStats, progress) {
  const courseProgress = progress.filter((p) => p.lesson_key.startsWith(course.label));
  const lessonCountByUser = {};
  courseProgress.forEach((p) => {
    lessonCountByUser[p.user_id] = (lessonCountByUser[p.user_id] || 0) + 1;
  });
  const lessonCounts = Object.values(lessonCountByUser);
  const thresholds = [0.25, 0.5, 0.75];
  const stages = [
    { label: 'Started', count: course.uniqueUsers },
    ...thresholds.map((t) => ({
      label: `${t * 100}%+`,
      count: lessonCounts.filter((n) => n >= Math.ceil(course.totalLessons * t)).length,
    })),
    { label: 'Completed', count: course.completedUsers },
  ];
  return stages.map((s) => ({
    ...s,
    pct: course.uniqueUsers > 0 ? Math.round((s.count / course.uniqueUsers) * 100) : 0,
  }));
}

export function AdminCoursesTab({ courseStats, progress }) {
  return (
    <>
      <div className="admin-section">
        <h3 className="admin-section-title">📊 Course Completion Funnel</h3>
        <div className="admin-course-grid">
          {courseStats.map((c) => {
            const stages = computeFunnelStages(c, courseStats, progress);
            return (
              <div key={c.id} className="admin-course-card">
                <div className="admin-course-header">
                  <span>{c.icon} {c.label}</span>
                  <span className="admin-course-accent" style={{ color: c.accent }}>
                    {c.uniqueUsers} learners
                  </span>
                </div>
                <div className="admin-course-stats">
                  {stages.map((s, i) => (
                    <div key={i}>
                      <div className="admin-stat-row">
                        <span>{s.label}</span>
                        <span className="admin-stat-val">{s.count} ({s.pct}%)</span>
                      </div>
                      <div className="admin-progress-bar">
                        <div
                          className="admin-progress-fill"
                          style={{ width: `${s.pct}%`, background: c.accent }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {courseStats.map((c) => (
        <div key={c.id} className="admin-section">
          <h3 className="admin-section-title" style={{ color: c.accent }}>
            {c.icon} {c.label} — Lesson Completions
          </h3>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Lesson</th>
                  <th>Completions</th>
                  <th>Bar</th>
                </tr>
              </thead>
              <tbody>
                {c.modules.flatMap((m) =>
                  m.lessons.map((l) => {
                    const key = `${c.label}|${m.title}|${l.title}`;
                    const count = c.lessonCounts[key] || 0;
                    const maxCount = Math.max(...Object.values(c.lessonCounts), 1);
                    return (
                      <tr key={key}>
                        <td className="admin-lesson-name">
                          <span className="admin-lesson-mod" aria-hidden="true">{m.emoji}</span>
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
                  }),
                )}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </>
  );
}
