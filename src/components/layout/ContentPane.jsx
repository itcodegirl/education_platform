import { LessonView } from '../learning/LessonView';
import { QuizView } from '../learning/QuizView';

export function ContentPane({
  showModQuiz,
  moduleQuiz,
  mod,
  course,
  les,
  lessonKey,
  lessonQuiz,
  learnerName,
  showStarterGuide,
  courses,
  courseIdx,
  onSwitchCourse,
  isFirst,
  isLast,
  prevTitle,
  nextTitle,
  onPrev,
  onNext,
  nextStepHint,
}) {
  return (
    <>
      <div className="lesson-container">
        {showModQuiz && moduleQuiz ? (
          <div className="lesson-surface">
            <div className="lesson-head">
              <span className="lesson-emoji">📝</span>
              <h1 className="lesson-title">{mod.title} - Module Quiz</h1>
            </div>
            <p className="lp">
              Test your knowledge of <strong>{mod.title}</strong>.
            </p>
            <QuizView
              quiz={moduleQuiz}
              accent={course.accent}
              label={`${mod.title} Quiz`}
              quizKey={`m:${mod.id}`}
            />
          </div>
        ) : (
          <>
            {showStarterGuide && (
              <section className="first-run-guide" aria-label="Getting started">
                <div className="frg-content">
                  <p className="frg-kicker">First login</p>
                  <h2 className="frg-title">
                    Welcome to your learning path, {learnerName}.
                  </h2>
                  <p className="frg-copy">
                    You are on the first lesson to set your pace. Read this lesson,
                    complete it, then hit <strong>Mark done</strong> to unlock the next one.
                  </p>
                  <p className="frg-sub">Pick a course track anytime in the lesson sidebar.</p>
                </div>
                <div className="frg-courses" aria-label="Course options">
                  {courses.map((entry, index) => (
                    <button
                      key={entry.id}
                      type="button"
                      className={`frg-course ${index === courseIdx ? 'frg-course-active' : ''}`}
                      onClick={() => {
                        if (index !== courseIdx) {
                          onSwitchCourse(index);
                        }
                      }}
                      aria-pressed={index === courseIdx}
                      aria-label={`Go to ${entry.label} course`}
                    >
                      <span aria-hidden="true">{entry.icon}</span>
                      <span>{entry.label}</span>
                    </button>
                  ))}
                </div>
              </section>
            )}
            <LessonView
              lesson={les}
              emoji={mod.emoji}
              lang={course.id}
              lessonKey={lessonKey}
              courseId={course.id}
              moduleTitle={mod.title}
            />
            {lessonQuiz && (
              <div className="lesson-quiz-wrap">
                <QuizView
                  quiz={lessonQuiz}
                  accent={course.accent}
                  label="Quick Check"
                  quizKey={`l:${les.id}`}
                />
              </div>
            )}
          </>
        )}
      </div>

      <nav className="nav-row" aria-label="Lesson pagination">
        <button
          type="button"
          className="nav-btn ui-btn ui-btn-secondary"
          onClick={onPrev}
          disabled={isFirst}
          aria-label={prevTitle ? `Previous lesson: ${prevTitle}` : 'Previous lesson'}
        >
          <span className="nav-btn-dir" aria-hidden="true">←</span>
          <span className="nav-btn-text">
            {prevTitle ? (
              <>
                <span className="nav-btn-label">Previous lesson</span>
                <span className="nav-btn-title">{prevTitle}</span>
              </>
            ) : 'Previous lesson'}
          </span>
        </button>
        <button
          type="button"
          className="nav-btn nx ui-btn ui-btn-primary"
          onClick={onNext}
          disabled={isLast}
          style={{ background: course.accent }}
          aria-label={
            isLast ? 'Course complete' :
            nextTitle ? `Next: ${nextTitle}` : 'Next lesson'
          }
        >
          <span className="nav-btn-text">
            {isLast ? (
              'Track complete'
            ) : nextTitle ? (
              <>
                <span className="nav-btn-label">Up next</span>
                <span className="nav-btn-title">{nextTitle}</span>
              </>
            ) : 'Next lesson'}
          </span>
          <span className="nav-btn-dir" aria-hidden="true">→</span>
        </button>
      </nav>
      <p className="nav-guidance" role="status" aria-live="polite">
        {nextStepHint}
      </p>
    </>
  );
}
