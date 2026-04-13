// ═══════════════════════════════════════════════
// COURSE METADATA — the sync, lightweight shell of
// every course. Split out of src/data/index.js so that
// the main bundle can render the landing page + course
// picker without pulling in all 5 courses' lesson content.
//
// The actual lesson modules + quizzes + challenges live
// in src/data/{id}/{course,quizzes,challenges}.js and
// are lazy-loaded by CourseContentProvider on demand.
//
// Keep this file TINY — every byte here is on the critical
// path for first paint.
// ═══════════════════════════════════════════════

export const COURSE_METADATA = [
  { id: 'html',   label: 'HTML',   icon: '🧱', accent: '#ff6b9d' },
  { id: 'css',    label: 'CSS',    icon: '🎨', accent: '#4ecdc4' },
  { id: 'js',     label: 'JS',     icon: '⚡', accent: '#ffa726' },
  { id: 'react',  label: 'React',  icon: '⚛️', accent: '#a78bfa' },
  { id: 'python', label: 'Python', icon: '🐍', accent: '#3b82f6' },
];

export const COURSE_IDS = COURSE_METADATA.map((c) => c.id);

export function getCourseMetadata(id) {
  return COURSE_METADATA.find((c) => c.id === id) || null;
}
