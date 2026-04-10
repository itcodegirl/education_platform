// ===============================================
// BREADCRUMB - Course > Module > Lesson trail
// ===============================================

import { memo } from "react";

export const Breadcrumb = memo(function Breadcrumb({
  course,
  mod,
  lesTitle,
  showModQuiz,
}) {
  const currentLesson = showModQuiz ? "📝 Module Quiz" : lesTitle;

  return (
    <nav className="bc" aria-label="Lesson breadcrumb">
      <span
        className="bc-course"
        style={{ color: course.accent }}
        title={`${course.icon} ${course.label}`}
      >
        {course.icon} {course.label}
      </span>
      <span className="bc-sep">›</span>
      <span className="bc-mod" title={`${mod.emoji} ${mod.title}`}>
        {mod.emoji} {mod.title}
      </span>
      <span className="bc-sep">›</span>
      <span className="bc-les" title={currentLesson}>
        {currentLesson}
      </span>
    </nav>
  );
});
