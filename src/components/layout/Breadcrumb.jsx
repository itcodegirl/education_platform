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
        className="breadcrumb-course"
        style={{ color: course.accent }}
        title={`${course.icon} ${course.label}`}
      >
        {course.icon} {course.label}
      </span>
      <span className="breadcrumb-sep">&gt;</span>
      <span className="breadcrumb-mod" title={`${mod.emoji} ${mod.title}`}>
        {mod.emoji} {mod.title}
      </span>
      <span className="breadcrumb-sep">&gt;</span>
      <span className="breadcrumb-les" title={currentLesson} aria-current="page">
        {currentLesson}
      </span>
      {lessonPosition && (
        <span className="breadcrumb-progress ui-chip" aria-label={lessonPosition}>
          {lessonPosition}
        </span>
      )}
    </nav>
  );
});

