import { useRef } from 'react';
import { useProgressData } from '../../providers';
import { COURSE_CATALOG } from '../../data/reference/course-catalog';
import { useFocusTrap } from '../../hooks/useFocusTrap';
import { getCourseCompletedLessonCount, hasLessonCompletion } from '../../utils/lessonKeys';
import { getCourseReadiness } from '../../utils/learningPath';

export function RoadmapPanel({ onClose, onNavigate, currentCourseIdx, currentModuleIdx = -1 }) {
  const { completedSet = new Set() } = useProgressData();
  const modalRef = useRef(null);

  useFocusTrap(modalRef, { enabled: true, onEscape: onClose });

  return (
    <div className="panel-overlay" onClick={onClose}>
      <div
        ref={modalRef}
        className="panel roadmap-panel"
        onClick={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Your learning roadmap"
        tabIndex={-1}
      >
        <div className="panel-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Whole-platform view</p>
            <h2 className="panel-title">Your Learning Roadmap</h2>
          </div>
          <button type="button" className="panel-close" onClick={onClose} aria-label="Close roadmap">
            ×
          </button>
        </div>

        <div className="roadmap-body">
          <p className="panel-meta">
            See how the courses build on each other, what each stage proves, and where your next useful
            evidence should come from.
          </p>

          {COURSE_CATALOG.map((course, courseIndex) => {
            const totalLessons = course.modules.reduce((sum, module) => sum + module.lessons.length, 0);
            const doneLessons = getCourseCompletedLessonCount(completedSet, course);
            const percent = totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0;
            const isCurrent = courseIndex === currentCourseIdx;
            const isComplete = doneLessons === totalLessons && totalLessons > 0;
            const readiness = getCourseReadiness({
              courseId: course.id,
              doneLessons,
              totalLessons,
              isCurrent,
            });

            return (
              <div
                key={course.id}
                className={`rm-course ${isCurrent ? 'rm-current' : ''} ${isComplete ? 'rm-complete' : ''}`}
              >
                <div className="rm-course-head">
                  <div className="rm-course-info">
                    <span className="rm-course-icon">{course.icon}</span>
                    <div>
                      <span className="rm-course-label" style={{ color: course.accent }}>
                        {course.label}
                      </span>
                      <span className="rm-course-count">
                        {doneLessons}/{totalLessons} lessons
                      </span>
                    </div>
                  </div>
                  <div className="rm-course-status">
                    <span className={`rm-course-readiness rm-course-readiness-${readiness.tone}`}>
                      {readiness.label}
                    </span>
                    <span className="rm-course-pct" style={{ color: course.accent }}>
                      {isComplete ? 'Done' : `${percent}%`}
                    </span>
                  </div>
                </div>

                <div className="rm-course-learning-frame">
                  <span className="rm-course-stage">
                    {readiness.pathway.stage}: {readiness.pathway.role}
                  </span>
                  <p>{readiness.pathway.outcome}</p>
                  <p className="rm-course-evidence">Evidence target: {readiness.pathway.evidence}</p>
                  <p className="rm-course-next">Next useful step: {readiness.nextAction}</p>
                </div>

                <div className="rm-bar">
                  <div
                    className="rm-bar-fill"
                    style={{ width: `${percent}%`, background: course.accent }}
                  />
                </div>

                <div className="rm-modules">
                  {course.modules.map((module, moduleIndex) => {
                    const moduleDone = module.lessons.filter((lesson) =>
                      hasLessonCompletion(completedSet, course, module, lesson),
                    ).length;
                    const moduleComplete = moduleDone === module.lessons.length;
                    const moduleStarted = moduleDone > 0 && !moduleComplete;
                    const isCurrentModule = isCurrent && moduleIndex === currentModuleIdx;
                    const moduleStatus = moduleComplete
                      ? 'Complete'
                      : isCurrentModule
                        ? 'Current'
                        : moduleStarted
                          ? 'In progress'
                          : 'Upcoming';

                    return (
                      <button
                        key={module.id}
                        type="button"
                        className={`rm-mod ${moduleComplete ? 'done' : moduleStarted ? 'partial' : ''} ${isCurrentModule ? 'current' : ''}`}
                        style={moduleComplete ? { borderColor: course.accent } : undefined}
                        onClick={async () => {
                          await onNavigate(courseIndex, moduleIndex);
                          onClose();
                        }}
                        title={`${module.title} (${moduleStatus}, ${moduleDone}/${module.lessons.length})`}
                      >
                        <span className="rm-mod-emoji">{moduleComplete ? '✓' : module.emoji}</span>
                        <span className="rm-mod-name">{module.title}</span>
                        <span className="rm-mod-status">{moduleStatus}</span>
                        <span className="rm-mod-count">
                          {moduleDone}/{module.lessons.length}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {courseIndex < COURSE_CATALOG.length - 1 && (
                  <div className="rm-connector" aria-hidden="true">
                    <span>↓</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
