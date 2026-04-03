// ═══════════════════════════════════════════════
// BREADCRUMB — Course › Module › Lesson navigation trail
// ═══════════════════════════════════════════════

import { memo } from 'react';

export const Breadcrumb = memo(function Breadcrumb({ course, mod, lesTitle, showModQuiz }) {
  return (
    <div className="bc">
      <span className="bc-course" style={{ color: course.accent }}>{course.icon} {course.label}</span>
      <span className="bc-sep">›</span>
      <span className="bc-mod">{mod.emoji} {mod.title}</span>
      <span className="bc-sep">›</span>
      <span className="bc-les">{showModQuiz ? '📝 Module Quiz' : lesTitle}</span>
    </div>
  );
});
