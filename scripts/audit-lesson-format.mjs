/* global console */
// ═══════════════════════════════════════════════
// LESSON FORMAT AUDIT
//
// CodeHerWay renders lessons through two paths:
//   - StructuredLessonBody — `hook` / `do` / `understand` / `build` /
//     `challenge` / `summary` / `bridge` (the standard going forward)
//   - RichLessonBody       — legacy `concepts` / `code` / `output` /
//     `tasks` / `challenge` / `devFession`
//
// LessonView.jsx picks the renderer with:
//   const isStructured = !!(lesson.hook || lesson.do || lesson.understand);
//
// This audit mirrors that check. It walks every lesson in every active
// course and fails if a NEW legacy-shape lesson has shipped — i.e. one
// that is not in scripts/lesson-format-allowlist.json. The allowlist is
// the explicit, shrinking inventory of grandfathered legacy lessons
// (today: the React course). Convert a module to the structured shape,
// drop its lessons from the allowlist, and the gate stays green.
//
// Run `node scripts/audit-lesson-format.mjs --update` to regenerate the
// allowlist after an intentional, reviewed change.
//
// See docs/handoff-deferred-risks.md (Risk A) for the migration plan.
// ═══════════════════════════════════════════════

import process from 'node:process';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { withViteAuditRuntime } from './vite-audit-runtime.mjs';

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const ALLOWLIST_PATH = join(SCRIPT_DIR, 'lesson-format-allowlist.json');

function isStructuredLesson(lesson) {
  return Boolean(lesson && (lesson.hook || lesson.do || lesson.understand));
}

function lessonKey(courseId, moduleId, lessonId) {
  return `${courseId}/${moduleId}/${lessonId}`;
}

async function collectLessons() {
  return withViteAuditRuntime(async ({ importModule }) => {
    const { COURSE_METADATA } = await importModule('/src/data/metadata.js');
    const { loadCourse } = await importModule('/src/data/loaders.js');

    const lessons = [];
    for (const courseMeta of COURSE_METADATA) {
      const data = await loadCourse(courseMeta.id);
      (data?.modules || []).forEach((moduleData, moduleIndex) => {
        const moduleId =
          moduleData?.id ?? moduleData?.moduleId ?? `module-${moduleIndex + 1}`;
        (moduleData?.lessons || []).forEach((lesson, lessonIndex) => {
          const lessonId = lesson?.id ?? `lesson-${lessonIndex + 1}`;
          lessons.push({
            courseId: courseMeta.id,
            moduleId: String(moduleId),
            lessonId: String(lessonId),
            title: lesson?.title || '',
            structured: isStructuredLesson(lesson),
          });
        });
      });
    }
    return lessons;
  });
}

function readAllowlist() {
  try {
    const raw = JSON.parse(readFileSync(ALLOWLIST_PATH, 'utf8'));
    if (Array.isArray(raw?.legacyLessons)) {
      return new Set(raw.legacyLessons.map(String));
    }
  } catch {
    // No allowlist yet — treat as empty.
  }
  return new Set();
}

function writeAllowlist(legacyKeys) {
  const payload = {
    description:
      'Grandfathered legacy-format lessons (RichLessonBody shape). New course content must ship in the structured format. Shrink this list as React modules are migrated; run `node scripts/audit-lesson-format.mjs --update` after a reviewed change.',
    legacyLessons: [...legacyKeys].sort(),
  };
  writeFileSync(ALLOWLIST_PATH, `${JSON.stringify(payload, null, 2)}\n`);
}

async function main() {
  const update = process.argv.includes('--update');
  const lessons = await collectLessons();

  const legacyKeys = new Set(
    lessons
      .filter((lesson) => !lesson.structured)
      .map((lesson) => lessonKey(lesson.courseId, lesson.moduleId, lesson.lessonId)),
  );

  if (update) {
    writeAllowlist(legacyKeys);
    console.log(
      `Updated ${ALLOWLIST_PATH} — ${legacyKeys.size} legacy lesson(s) grandfathered.`,
    );
    return;
  }

  const allowlist = readAllowlist();
  const newLegacy = [...legacyKeys].filter((key) => !allowlist.has(key)).sort();
  const staleAllowlist = [...allowlist].filter((key) => !legacyKeys.has(key)).sort();

  const structuredCount = lessons.filter((lesson) => lesson.structured).length;
  console.log(
    `Lesson format audit: ${lessons.length} lessons — ${structuredCount} structured, ${legacyKeys.size} legacy (allowlisted: ${allowlist.size}).`,
  );

  if (staleAllowlist.length > 0) {
    console.log('\nAllowlist entries no longer needed (consider trimming with --update):');
    staleAllowlist.forEach((key) => console.log(`  - ${key}`));
  }

  if (newLegacy.length > 0) {
    console.error(
      '\nERROR: new legacy-format lesson(s) detected — convert to the structured shape (hook/do/understand) or, for an intentional and reviewed exception, run `node scripts/audit-lesson-format.mjs --update`:',
    );
    newLegacy.forEach((key) => console.error(`  - ${key}`));
    process.exitCode = 1;
    return;
  }

  console.log('\nOK — no new legacy-format lessons.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
