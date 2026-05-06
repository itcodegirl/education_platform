/* global console */
//
// Lesson Label Guard
//
// Persisted progress (saved positions, completion keys, bookmarks) is
// indexed by lesson title strings. Until the stable lesson ID migration
// (C2) lands, renaming a lesson title silently breaks the lookup for any
// learner whose row was written under the old title.
//
// This script captures a snapshot of every active courseId →
// moduleId → lessonId → title triple and fails on any title change for
// an existing (courseId, moduleId, lessonId) tuple. New lessons (new
// IDs) are allowed; deletions are flagged so they're not done by
// accident.
//
// To intentionally rename a lesson, ship a paired migration that
// rewrites persisted progress rows AND run:
//
//     node scripts/check-lesson-labels.mjs --update
//
// to refresh the snapshot in the same PR.

import process from 'node:process';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { createServer } from 'vite';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SNAPSHOT_PATH = path.join(__dirname, 'lesson-label-snapshot.json');

const args = new Set(process.argv.slice(2));
const updateMode = args.has('--update');

async function loadAllCourseData() {
  const viteServer = await createServer({
    logLevel: 'silent',
    server: { middlewareMode: true },
    appType: 'custom',
  });

  try {
    const { COURSE_METADATA } = await viteServer.ssrLoadModule('/src/data/metadata.js');
    const { loadCourse } = await viteServer.ssrLoadModule('/src/data/loaders.js');

    const loaded = [];
    for (const courseMeta of COURSE_METADATA) {
      const data = await loadCourse(courseMeta.id);
      loaded.push({ courseMeta, data });
    }
    return loaded;
  } finally {
    await viteServer.close();
  }
}

function buildLabelMap(loaded) {
  const map = {};
  for (const { courseMeta, data } of loaded) {
    const courseEntry = {};
    for (const moduleData of data?.modules || []) {
      const moduleEntry = {};
      for (const lesson of moduleData?.lessons || []) {
        if (!lesson?.id) continue;
        moduleEntry[String(lesson.id)] = String(lesson.title ?? '');
      }
      if (Object.keys(moduleEntry).length > 0) {
        courseEntry[String(moduleData.id)] = moduleEntry;
      }
    }
    map[courseMeta.id] = courseEntry;
  }
  return map;
}

async function readSnapshot() {
  try {
    const raw = await readFile(SNAPSHOT_PATH, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
}

function diffSnapshots(previous, current) {
  const renamed = [];
  const removed = [];
  const added = [];

  for (const [courseId, prevModules] of Object.entries(previous)) {
    const curModules = current[courseId] || {};
    for (const [moduleId, prevLessons] of Object.entries(prevModules)) {
      const curLessons = curModules[moduleId] || {};
      for (const [lessonId, prevTitle] of Object.entries(prevLessons)) {
        if (!(lessonId in curLessons)) {
          removed.push({ courseId, moduleId, lessonId, title: prevTitle });
          continue;
        }
        if (curLessons[lessonId] !== prevTitle) {
          renamed.push({
            courseId,
            moduleId,
            lessonId,
            from: prevTitle,
            to: curLessons[lessonId],
          });
        }
      }
    }
  }

  for (const [courseId, curModules] of Object.entries(current)) {
    const prevModules = previous[courseId] || {};
    for (const [moduleId, curLessons] of Object.entries(curModules)) {
      const prevLessons = prevModules[moduleId] || {};
      for (const [lessonId, curTitle] of Object.entries(curLessons)) {
        if (!(lessonId in prevLessons)) {
          added.push({ courseId, moduleId, lessonId, title: curTitle });
        }
      }
    }
  }

  return { renamed, removed, added };
}

function formatList(items, formatter) {
  return items.map((item) => `    - ${formatter(item)}`).join('\n');
}

async function main() {
  console.log('Lesson Label Guard');
  const loaded = await loadAllCourseData();
  const current = buildLabelMap(loaded);

  if (updateMode) {
    await writeFile(SNAPSHOT_PATH, `${JSON.stringify(current, null, 2)}\n`, 'utf8');
    console.log(`  snapshot written: ${path.relative(process.cwd(), SNAPSHOT_PATH)}`);
    process.exitCode = 0;
    return;
  }

  const previous = await readSnapshot();
  if (!previous) {
    console.error('  no snapshot found; run with --update to create one.');
    process.exitCode = 1;
    return;
  }

  const { renamed, removed, added } = diffSnapshots(previous, current);

  if (added.length) {
    console.log(`  added lessons (${added.length}):`);
    console.log(
      formatList(added, (a) => `${a.courseId}/${a.moduleId}/${a.lessonId} → "${a.title}"`),
    );
  }

  const hasRegressions = renamed.length > 0 || removed.length > 0;

  if (renamed.length) {
    console.error(`  renamed lessons (${renamed.length}) — BLOCKED until C2 migration lands:`);
    console.error(
      formatList(
        renamed,
        (r) => `${r.courseId}/${r.moduleId}/${r.lessonId}: "${r.from}" → "${r.to}"`,
      ),
    );
  }
  if (removed.length) {
    console.error(`  removed lessons (${removed.length}) — confirm intentional:`);
    console.error(
      formatList(removed, (r) => `${r.courseId}/${r.moduleId}/${r.lessonId} ("${r.title}")`),
    );
  }

  if (hasRegressions) {
    console.error(
      '\n  Lesson titles drive persisted progress lookups today. To rename or remove a lesson,',
    );
    console.error(
      '  pair the change with a progress migration AND refresh the snapshot in the same PR:',
    );
    console.error('      node scripts/check-lesson-labels.mjs --update');
    process.exitCode = 1;
    return;
  }

  console.log('  no rename or removal regressions.');
}

main().catch((err) => {
  console.error('Lesson label guard failed:', err);
  process.exitCode = 1;
});
