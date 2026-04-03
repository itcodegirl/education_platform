// ═══════════════════════════════════════════════
// SEARCH INDEX — Cross-course search with concept indexing
// Indexes: lesson titles, module titles, concepts, code, tasks
// ═══════════════════════════════════════════════

import { COURSES } from '../index';

export function buildSearchIndex() {
  const entries = [];

  COURSES.forEach((course, ci) => {
    course.modules.forEach((mod, mi) => {
      mod.lessons.forEach((les, li) => {
        // Build keywords from all available lesson data
        const parts = [
          les.title,
          mod.title,
          les.content || '',
        ];

        // Index rich format concepts
        if (les.concepts?.length) {
          parts.push(les.concepts.join(' '));
        }

        // Index tasks
        if (les.tasks?.length) {
          parts.push(les.tasks.join(' '));
        }

        // Index challenge text
        if (les.challenge) {
          parts.push(les.challenge);
        }

        // Index code keywords (strip syntax, keep identifiers)
        if (les.code) {
          parts.push(les.code.replace(/[<>{}()\[\]\/\\;:'"`,=+\-*&|!?#]/g, ' '));
        }

        // Index output
        if (les.output) {
          parts.push(les.output);
        }

        const keywords = parts.join(' ')
          .toLowerCase()
          .replace(/\s+/g, ' ')
          .slice(0, 500); // cap to prevent huge index

        entries.push({
          title: les.title,
          module: mod.title,
          course: course.label,
          icon: course.icon,
          keywords,
          courseIdx: ci,
          modIdx: mi,
          lesIdx: li,
        });
      });
    });
  });

  return entries;
}
