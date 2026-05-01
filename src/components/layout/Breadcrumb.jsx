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
    <nav className="bc" aria-label="Breadcrumb">
      <ol className="bc-list">
        <li
          className="bc-course"
          style={{ color: course.accent }}
          title={`${course.icon} ${course.label}`}
        >
          {course.icon} {course.label}
        </li>
        <li className="bc-mod" title={`${mod.emoji} ${mod.title}`}>
          {mod.emoji} {mod.title}
        </li>
        <li className="bc-les" title={currentLesson} aria-current="page">
          {currentLesson}
        </li>
      </ol>
    </nav>
  );
});
