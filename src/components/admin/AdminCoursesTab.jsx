import {
  getLessonKeyVariants,
  lessonKeyBelongsToCourse,
  resolveStableLessonKey,
} from '../../utils/lessonKeys';

function computeFunnelStages(course, progress) {
  const courseProgress = progress.filter((row) => lessonKeyBelongsToCourse(row.lesson_key, course));
  const lessonCountByUser = {};

  courseProgress.forEach((row) => {
    const stableLessonKey = resolveStableLessonKey(course, row.lesson_key);
    if (!stableLessonKey) return;

    if (!lessonCountByUser[row.user_id]) {
      lessonCountByUser[row.user_id] = new Set();
    }
    lessonCountByUser[row.user_id].add(stableLessonKey);
  });

  const lessonCounts = Object.values(lessonCountByUser).map((set) => set.size);
  const uniqueUsers = lessonCounts.length;
  const thresholds = [0.25, 0.5, 0.75];
  const stages = [
    { label: 'Started', count: uniqueUsers },
    ...thresholds.map((threshold) => ({
      label: `${threshold * 100}%+`,
      count: lessonCounts.filter((count) => count >= Math.ceil(course.totalLessons * threshold)).length,
    })),
    { label: 'Completed', count: course.completedUsers },
  ];

  return stages.map((stage) => ({
    ...stage,
    pct: uniqueUsers > 0 ? Math.round((stage.count / uniqueUsers) * 100) : 0,
  }));
}

export function AdminCoursesTab({ courseStats, progress }) {
  return (
    <>
      <div className="admin-section">
        <h3 className="admin-section-title">Course Completion Funnel</h3>
        <div className="admin-course-grid">
          {courseStats.map((course) => {
            const stages = computeFunnelStages(course, progress);
            return (
              <div key={course.id} className="admin-course-card">
                <div className="admin-course-header">
                  <span>{course.icon} {course.label}</span>
                  <span className="admin-course-accent" style={{ color: course.accent }}>
                    {course.uniqueUsers} learners
                  </span>
                </div>
                <div className="admin-course-stats">
                  {stages.map((stage, index) => (
                    <div key={index}>
                      <div className="admin-stat-row">
                        <span>{stage.label}</span>
                        <span className="admin-stat-val">{stage.count} ({stage.pct}%)</span>
                      </div>
                      <div className="admin-progress-bar">
                        <div
                          className="admin-progress-fill"
                          style={{ width: `${stage.pct}%`, background: course.accent }}
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

      {courseStats.map((course) => (
        <div key={course.id} className="admin-section">
          <h3 className="admin-section-title" style={{ color: course.accent }}>
            {course.icon} {course.label} - Lesson Completions
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
                {course.modules.flatMap((moduleData) =>
                  moduleData.lessons.map((lesson) => {
                    const { stable } = getLessonKeyVariants(course, moduleData, lesson);
                    const count = course.lessonCounts[stable] || 0;
                    const maxCount = Math.max(...Object.values(course.lessonCounts), 1);
                    return (
                      <tr key={stable}>
                        <td className="admin-lesson-name">
                          <span className="admin-lesson-mod" aria-hidden="true">{moduleData.emoji}</span>
                          {lesson.title}
                        </td>
                        <td className="admin-lesson-count">{count}</td>
                        <td className="admin-lesson-bar-cell">
                          <div className="admin-lesson-bar">
                            <div
                              className="admin-lesson-bar-fill"
                              style={{ width: `${(count / maxCount) * 100}%`, background: course.accent }}
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
