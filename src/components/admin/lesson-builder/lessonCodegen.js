// ═══════════════════════════════════════════════
// lessonCodegen — pure helpers for emitting a
// CodeHerWay lesson module file from the LessonBuilder
// admin form. Extracted from LessonBuilder.jsx so the
// generation logic is testable in isolation and
// stylistic/encoding bugs surface in unit tests rather
// than via "the downloaded file looks weird".
// ═══════════════════════════════════════════════

export function slugify(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Escape a value to embed inside a single-quoted JS string literal.
// Backslashes have to come first so we don't double-escape the
// backslashes the other replacements introduce.
export function escapeJS(str) {
  return (str || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/\n/g, '\\n');
}

function formatPrereqs(rawPrereqs) {
  if (!rawPrereqs) return '[]';
  const parts = rawPrereqs
    .split(',')
    .map((p) => `'${p.trim()}'`)
    .filter((p) => p !== "''");
  return `[${parts.join(', ')}]`;
}

function formatStringList(values) {
  return (values || [])
    .filter(Boolean)
    .map((v) => `      '${escapeJS(v)}',`)
    .join('\n');
}

function formatLesson(lesson) {
  const prereqs = formatPrereqs(lesson.prereqs);
  const concepts = formatStringList(lesson.concepts);
  const tasks = formatStringList(lesson.tasks);
  const scaffoldingLine =
    lesson.scaffolding && lesson.scaffolding !== 'full'
      ? ` scaffolding: '${lesson.scaffolding}',`
      : '';

  // Code is emitted inside a backtick template literal so multi-line
  // snippets stay readable in the generated file. Escape backticks and
  // ${ to keep the generated source valid.
  const safeCode = (lesson.code || '').replace(/`/g, '\\`').replace(/\$/g, '\\$');

  return `    {
      id: '${escapeJS(lesson.id)}',${scaffoldingLine}
      title: '${escapeJS(lesson.title)}',
      prereqs: ${prereqs},
      difficulty: '${lesson.difficulty}',
      duration: '${escapeJS(lesson.duration)}',
      concepts: [
${concepts}
      ],
      code: \`${safeCode}\`,
      output: '${escapeJS(lesson.output)}',
      tasks: [
${tasks}
      ],
      challenge: '${escapeJS(lesson.challenge)}',
      devFession: '${escapeJS(lesson.devFession)}',
    }`;
}

export function generateModuleCode({ moduleInfo, lessons }) {
  const lessonsCode = (lessons || []).map(formatLesson).join(',\n');

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
