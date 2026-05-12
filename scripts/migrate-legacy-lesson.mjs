/* global console */
// ═══════════════════════════════════════════════
// LEGACY LESSON MIGRATION SCAFFOLD
//
// Reads a legacy React module file (the `RichLessonBody` shape:
// `concepts` / `code` / `output` / `tasks` / `challenge` / `devFession`)
// and emits a *starter* structured-format JSON module (the
// `StructuredLessonBody` shape: `hook` / `do` / `understand` / `build` /
// `challenge` / `summary` / `bridge`) with the obvious mappings filled in
// and every gap marked `TODO: …`.
//
// This is a STARTING POINT, not a finished migration. The structured
// shape demands curriculum content that does not exist in the legacy
// lessons (named concepts with analogies, step-by-step `do` instructions
// with proof requirements, a `build` codeComparison diff, a `challenge`
// requirements checklist, a `summary.capabilities` list, a `bridge`
// preview). A curriculum owner must fill in the TODOs by hand — see
// docs/handoff-deferred-risks.md (Risk A). The emitted file intentionally
// still contains `TODO:` strings, so it will NOT pass the content audits
// or render correctly until those are replaced.
//
// Usage:
//   node scripts/migrate-legacy-lesson.mjs <legacy-module-file> [exportName] [--out path] [--force]
//
// Examples:
//   node scripts/migrate-legacy-lesson.mjs src/data/react/modules/what-react-is.js module1
//   node scripts/migrate-legacy-lesson.mjs src/data/react/modules/react-router.js module13 \
//     --out src/data/react/modules/react-router.json
//
// With no exportName the script picks the first export whose value looks
// like a course module (`{ lessons: [...] }`). With no --out it prints to
// stdout.
// ═══════════════════════════════════════════════

import process from 'node:process';
import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const TODO = (hint) => `TODO: ${hint}`;

function parseArgs(argv) {
  const positional = [];
  let out = null;
  let force = false;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--out') {
      out = argv[i + 1];
      i += 1;
    } else if (arg === '--force') {
      force = true;
    } else {
      positional.push(arg);
    }
  }

  return { file: positional[0], exportName: positional[1], out, force };
}

function looksLikeCourseModule(value) {
  return Boolean(value && typeof value === 'object' && Array.isArray(value.lessons));
}

function splitConcept(text) {
  // Many legacy concepts read "Name: explanation" — split on the first
  // colon when the part before it is short enough to be a label.
  const idx = text.indexOf(':');
  if (idx > 0 && idx <= 40) {
    const name = text.slice(0, idx).trim();
    const definition = text.slice(idx + 1).trim();
    if (name && definition) return { name, definition };
  }
  return { name: TODO('name this concept'), definition: text.trim() };
}

function scaffoldLesson(lesson, nextLessonId) {
  const concepts = Array.isArray(lesson.concepts) ? lesson.concepts : [];
  const tasks = Array.isArray(lesson.tasks) ? lesson.tasks : [];

  const metadata = {
    estimatedTime: Number.parseInt(String(lesson.duration || ''), 10) || TODO('minutes (number)'),
    difficulty: lesson.difficulty || 'beginner',
    conceptsCount: concepts.length || TODO('number of concepts'),
    tasksCount: tasks.length || TODO('number of tasks'),
  };

  return {
    id: lesson.id || TODO('stable lesson id'),
    title: lesson.title || TODO('lesson title'),
    prereqs: Array.isArray(lesson.prereqs) ? lesson.prereqs : [],
    difficulty: lesson.difficulty || 'beginner',
    duration: lesson.duration || TODO('e.g. "20 min"'),
    metadata,
    hook: {
      accomplishments:
        tasks.length > 0
          ? tasks.slice(0, 3).map((t) => `${TODO('rewrite as "what you will be able to do"')} (was task: ${t})`)
          : [TODO('what the learner will be able to do after this lesson (2-3 items)')],
    },
    do: {
      title: TODO('a single concrete "do this now" headline'),
      steps: tasks.length > 0 ? tasks : [TODO('numbered hands-on steps')],
      code: typeof lesson.code === 'string' ? lesson.code : TODO('starter/example code'),
      result: typeof lesson.output === 'string' ? lesson.output : TODO('what the learner should see / understand after the steps'),
      proofRequired: TODO('what artifact proves the step was done (e.g. a screenshot)'),
    },
    understand: {
      concepts:
        concepts.length > 0
          ? concepts.map((text) => {
              const { name, definition } = splitConcept(text);
              return { name, definition, analogy: TODO('a concrete, beginner-friendly analogy for this concept') };
            })
          : [{ name: TODO('concept name'), definition: TODO('plain-language definition'), analogy: TODO('analogy') }],
      keyTakeaway: typeof lesson.output === 'string' ? lesson.output : TODO('the one-sentence takeaway'),
    },
    build: {
      goal: TODO('a small extension of the example the learner builds next'),
      codeComparison: {
        old: TODO('the relevant slice of code before the change'),
        new: TODO('the same slice after the change'),
      },
      hint: TODO('a hint that unblocks the common mistake'),
    },
    challenge: {
      title: TODO('challenge title'),
      mission: typeof lesson.challenge === 'string' ? lesson.challenge : TODO('one-sentence challenge mission'),
      requirements: [TODO('checklist item 1'), TODO('checklist item 2')],
      starterCode: TODO('starter code for the challenge'),
      bonusChallenge: TODO('optional stretch goal'),
    },
    summary: {
      capabilities: [TODO('skill the learner now has 1'), TODO('skill the learner now has 2')],
    },
    bridge: {
      preview: TODO('1-2 sentences previewing the next lesson'),
      nextLessonId: nextLessonId || TODO('next lesson id'),
    },
    ...(typeof lesson.devFession === 'string'
      ? { _legacyDevFession: `${lesson.devFession} (TODO: weave this into the lesson voice or drop it)` }
      : {}),
  };
}

function scaffoldModule(mod) {
  const lessons = Array.isArray(mod.lessons) ? mod.lessons : [];
  return {
    _migrationNote:
      'Scaffolded from a legacy RichLessonBody module by scripts/migrate-legacy-lesson.mjs. Replace every "TODO:" string with real curriculum content before importing this file. See docs/handoff-deferred-risks.md (Risk A).',
    id: mod.id || TODO('stable module id'),
    emoji: mod.emoji || TODO('module emoji'),
    title: mod.title || TODO('module title'),
    tagline: mod.tagline || TODO('module tagline'),
    difficulty: mod.difficulty || 'beginner',
    lessons: lessons.map((lesson, i) => scaffoldLesson(lesson, lessons[i + 1]?.id ?? null)),
  };
}

async function main() {
  const { file, exportName, out, force } = parseArgs(process.argv.slice(2));

  if (!file) {
    console.error('Usage: node scripts/migrate-legacy-lesson.mjs <legacy-module-file> [exportName] [--out path] [--force]');
    process.exitCode = 1;
    return;
  }

  const absFile = resolve(process.cwd(), file);
  if (!existsSync(absFile)) {
    console.error(`File not found: ${absFile}`);
    process.exitCode = 1;
    return;
  }

  const moduleNamespace = await import(pathToFileURL(absFile).href);

  let mod;
  if (exportName) {
    mod = moduleNamespace[exportName];
    if (!looksLikeCourseModule(mod)) {
      console.error(`Export "${exportName}" in ${file} does not look like a course module ({ lessons: [...] }).`);
      process.exitCode = 1;
      return;
    }
  } else {
    const found = Object.entries(moduleNamespace).find(([, value]) => looksLikeCourseModule(value));
    if (!found) {
      console.error(`No export in ${file} looks like a course module ({ lessons: [...] }). Pass an explicit export name.`);
      process.exitCode = 1;
      return;
    }
    mod = found[1];
    console.error(`(using export "${found[0]}")`);
  }

  const scaffold = scaffoldModule(mod);
  const json = `${JSON.stringify(scaffold, null, 2)}\n`;

  if (out) {
    const absOut = resolve(process.cwd(), out);
    if (existsSync(absOut) && !force) {
      console.error(`Refusing to overwrite existing file: ${absOut} (pass --force to override).`);
      process.exitCode = 1;
      return;
    }
    writeFileSync(absOut, json);
    console.error(`Wrote scaffold to ${absOut}. Replace every "TODO:" before importing it.`);
  } else {
    process.stdout.write(json);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
