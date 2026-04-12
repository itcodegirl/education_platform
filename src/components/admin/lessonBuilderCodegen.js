// ═══════════════════════════════════════════════
// LESSON BUILDER CODEGEN — Pure helpers that turn
// a module + lessons draft into a JS source string.
// Extracted from LessonBuilder.jsx so the string-
// building logic is easy to unit-test.
// ═══════════════════════════════════════════════

export function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function escapeJS(str) {
  return str.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n');
}

function formatPrereqs(raw) {
  if (!raw) return '[]';
  return `[${raw
    .split(',')
    .map((p) => `'${p.trim()}'`)
    .filter((p) => p !== "''")
    .join(', ')}]`;
}

function formatLesson(l) {
  const prereqs = formatPrereqs(l.prereqs);

  const concepts = l.concepts
    .filter(Boolean)
    .map((c) => `      '${escapeJS(c)}',`)
    .join('\n');

  const tasks = l.tasks
    .filter(Boolean)
    .map((t) => `      '${escapeJS(t)}',`)
    .join('\n');

  return `    {
      id: '${escapeJS(l.id)}',${l.scaffolding && l.scaffolding !== 'full' ? ` scaffolding: '${l.scaffolding}',` : ''}
      title: '${escapeJS(l.title)}',
      prereqs: ${prereqs},
      difficulty: '${l.difficulty}',
      duration: '${escapeJS(l.duration)}',
      concepts: [
${concepts}
      ],
      code: \`${l.code.replace(/`/g, '\\`').replace(/\$/g, '\\$')}\`,
      output: '${escapeJS(l.output)}',
      tasks: [
${tasks}
      ],
      challenge: '${escapeJS(l.challenge)}',
      devFession: '${escapeJS(l.devFession)}',
    }`;
}

export function generateModuleCode(moduleInfo, lessons) {
  const lessonsCode = lessons.map(formatLesson).join(',\n');

  return `export const module = {
  id: ${moduleInfo.id || 0},
  emoji: '${moduleInfo.emoji}',
  title: '${escapeJS(moduleInfo.title)}',
  tagline: '${escapeJS(moduleInfo.tagline)}',
  difficulty: '${moduleInfo.difficulty}',
  lessons: [
${lessonsCode},
  ],
};
`;
}

export function validateDraft(moduleInfo, lessons) {
  const issues = [];
  if (!moduleInfo.title) issues.push('Module title is required');
  if (!moduleInfo.id) issues.push('Module ID is required');
  lessons.forEach((l, i) => {
    const prefix = lessons.length > 1 ? `Lesson ${i + 1}: ` : '';
    if (!l.id) issues.push(`${prefix}Lesson ID is required`);
    if (!l.title) issues.push(`${prefix}Lesson title is required`);
    if (!l.concepts.filter(Boolean).length) {
      issues.push(`${prefix}At least one concept is required`);
    }
  });
  return issues;
}
