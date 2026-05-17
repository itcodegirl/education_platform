/* global console, process */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { withViteAuditRuntime } from './vite-audit-runtime.mjs';

const DEFAULT_OUT_DIR = 'reports/generated';
const DEFAULT_TOP_GAP_LIMIT = 12;

export function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    summary: false,
    outDir: '',
    strict: false,
    maxGaps: 0,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === '--summary') {
      options.summary = true;
    } else if (arg === '--strict') {
      options.strict = true;
    } else if (arg === '--out') {
      options.outDir = argv[index + 1] || DEFAULT_OUT_DIR;
      index += 1;
    } else if (arg.startsWith('--out=')) {
      options.outDir = arg.slice('--out='.length) || DEFAULT_OUT_DIR;
    } else if (arg === '--max-gaps') {
      options.maxGaps = Number(argv[index + 1]) || 0;
      index += 1;
    } else if (arg.startsWith('--max-gaps=')) {
      options.maxGaps = Number(arg.slice('--max-gaps='.length)) || 0;
    }
  }

  return options;
}

export async function loadCurriculumCoverageReport() {
  return withViteAuditRuntime(async ({ importModule }) => {
    const { COURSE_METADATA } = await importModule('/src/data/metadata.js');
    const { loadCourse } = await importModule('/src/data/loaders.js');
    const { PROJECTS } = await importModule('/src/data/reference/projects.js');
    const {
      buildCurriculumCoverageCsv,
      buildCurriculumCoverageReport,
    } = await importModule('/src/utils/curriculumCoverageReport.js');

    const courseEntries = [];
    for (const courseMeta of COURSE_METADATA) {
      courseEntries.push({
        courseMeta,
        data: await loadCourse(courseMeta.id),
      });
    }

    const generatedAt = new Date().toISOString();
    const report = buildCurriculumCoverageReport(courseEntries, {
      projectsByCourse: PROJECTS,
    });

    return {
      generatedAt,
      report,
      csv: buildCurriculumCoverageCsv(report, generatedAt),
    };
  });
}

export async function writeCoverageReportFiles({ outDir = DEFAULT_OUT_DIR } = {}) {
  const absoluteOutDir = path.resolve(outDir || DEFAULT_OUT_DIR);
  const result = await loadCurriculumCoverageReport();
  const jsonPath = path.join(absoluteOutDir, 'curriculum-coverage-report.json');
  const csvPath = path.join(absoluteOutDir, 'curriculum-coverage-gaps.csv');

  await mkdir(absoluteOutDir, { recursive: true });
  await writeFile(csvPath, result.csv, 'utf8');
  await writeFile(
    jsonPath,
    `${JSON.stringify({
      generatedAt: result.generatedAt,
      totals: result.report.totals,
      gapsByType: result.report.gapsByType,
      courses: result.report.courses.map((course) => ({
        courseId: course.courseId,
        courseLabel: course.courseLabel,
        moduleCount: course.moduleCount,
        lessonCount: course.lessonCount,
        readyLessonCount: course.readyLessonCount,
        gapCount: course.gapCount,
        lessonCoveragePercent: course.lessonCoveragePercent,
        quizCoveragePercent: course.quizCoveragePercent,
        practiceCoveragePercent: course.practiceCoveragePercent,
        projectEvidenceCoveragePercent: course.projectEvidenceCoveragePercent,
        lessonRubricCoveragePercent: course.lessonRubricCoveragePercent,
        quizRubricCoveragePercent: course.quizRubricCoveragePercent,
        modulesWithProjectEvidence: course.modulesWithProjectEvidence,
        projectIdeaCount: course.projectIdeaCount,
      })),
      gapRows: result.report.gapRows,
    }, null, 2)}\n`,
    'utf8',
  );

  return {
    ...result,
    csvPath,
    jsonPath,
  };
}

function printCountRows(title, rows = []) {
  if (rows.length === 0) return;

  console.log(`\n${title}:`);
  rows.forEach((row) => {
    console.log(`  - ${row.label || row.name}: ${row.count}`);
  });
}

function printTopGaps(gapRows = []) {
  if (gapRows.length === 0) return;

  console.log('\nTop coverage gaps:');
  gapRows.slice(0, DEFAULT_TOP_GAP_LIMIT).forEach((row) => {
    const signals = row.relatedSignals?.length
      ? ` (${row.relatedSignals.join(', ')})`
      : '';
    console.log(`  - ${row.courseLabel} / ${row.lessonTitle}: ${row.gapLabel}${signals}`);
  });
  if (gapRows.length > DEFAULT_TOP_GAP_LIMIT) {
    console.log(`  - ... +${gapRows.length - DEFAULT_TOP_GAP_LIMIT} more`);
  }
}

function printSummary(report) {
  console.log('\nActionable summary:');
  console.log(`  courses: ${report.totals.courseCount}`);
  console.log(`  modules: ${report.totals.moduleCount}`);
  console.log(`  lessons: ${report.totals.lessonCount}`);
  console.log(`  quizzes: ${report.totals.quizCount}`);
  console.log(`  challenges: ${report.totals.challengeCount}`);
  console.log(`  project ideas: ${report.totals.projectIdeaCount}`);
  console.log(`  fully covered lessons: ${report.totals.readyLessonCount}/${report.totals.lessonCount}`);
  console.log(`  curriculum coverage gaps: ${report.totals.coverageGapCount}`);
  console.log(`  modules with challenge/project evidence: ${report.totals.modulesWithProjectEvidence}/${report.totals.moduleCount}`);

  printCountRows('Gaps by type', report.gapsByType);
  printTopGaps(report.gapRows);
}

const isCliRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCliRun) {
  const options = parseArgs();
  const result = options.outDir
    ? await writeCoverageReportFiles({ outDir: options.outDir })
    : await loadCurriculumCoverageReport();

  console.log('Curriculum Coverage Audit');

  if (options.outDir) {
    console.log(`Coverage CSV: ${path.relative(process.cwd(), result.csvPath)}`);
    console.log(`Coverage JSON: ${path.relative(process.cwd(), result.jsonPath)}`);
  }

  if (options.summary || !options.outDir) {
    printSummary(result.report);
  }

  if (options.strict && result.report.totals.coverageGapCount > options.maxGaps) {
    console.log(
      `\nStrict coverage budget exceeded: ` +
      `${result.report.totals.coverageGapCount} gaps > ${options.maxGaps} allowed.`,
    );
    process.exitCode = 1;
  }
}
