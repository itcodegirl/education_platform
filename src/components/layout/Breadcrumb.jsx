// ===============================================
// BREADCRUMB - Course > Module > Lesson trail
// ===============================================

import { memo } from "react";

export const Breadcrumb = memo(function Breadcrumb({
  course,
  mod,
  lesTitle,
  showModQuiz,
  lessonPosition,
}) {
  const currentLesson = showModQuiz ? "Module quiz" : lesTitle;

  return (
    <nav className="breadcrumb" aria-label="Lesson breadcrumb">
      <span
        className="bc-course"
        style={{ color: course.accent }}
        title={`${course.icon} ${course.label}`}
      >
        {course.icon} {course.label}
      </span>
      <span className="bc-sep">&gt;</span>
      <span className="bc-mod" title={`${mod.emoji} ${mod.title}`}>
        {mod.emoji} {mod.title}
      </span>
      <span className="bc-sep">&gt;</span>
      <span className="bc-les" title={currentLesson} aria-current="page">
        {currentLesson}
      </span>
      {lessonPosition && (
        <span className="bc-progress ui-chip" aria-label={lessonPosition}>
          {lessonPosition}
        </span>
      )}
    </nav>
  );
});
