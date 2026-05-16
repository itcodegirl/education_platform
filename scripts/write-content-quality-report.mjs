/* global console, process */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { withViteAuditRuntime } from './vite-audit-runtime.mjs';

const DEFAULT_OUT_DIR = 'reports/generated';

function parseArgs(argv = process.argv.slice(2)) {
  const options = {
    outDir: DEFAULT_OUT_DIR,
    summary: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === '--summary') {
      options.summary = true;
    } else if (arg === '--out') {
      options.outDir = argv[index + 1] || DEFAULT_OUT_DIR;
      index += 1;
    } else if (arg.startsWith('--out=')) {
      options.outDir = arg.slice('--out='.length) || DEFAULT_OUT_DIR;
    }
  }

  return options;
}

async function loadContentQualityReport() {
  return withViteAuditRuntime(async ({ importModule }) => {
    const { COURSE_METADATA } = await importModule('/src/data/metadata.js');
    const { loadCourse } = await importModule('/src/data/loaders.js');
    const {
      buildContentQualityActionPlan,
      buildContentQualityCsv,
      buildContentQualityReport,
    } = await importModule('/src/utils/contentQualityReport.js');

    const courseEntries = [];
    for (const courseMeta of COURSE_METADATA) {
      courseEntries.push({
        courseMeta,
        data: await loadCourse(courseMeta.id),
      });
    }

    const generatedAt = new Date().toISOString();
    const report = buildContentQualityReport(courseEntries);
    const actionPlan = buildContentQualityActionPlan(report, { limit: 10 });

    return {
      generatedAt,
      report,
      actionPlan,
      csv: buildContentQualityCsv(report, generatedAt),
    };
  });
}

async function writeReportFiles({ outDir }) {
  const absoluteOutDir = path.resolve(outDir || DEFAULT_OUT_DIR);
  const result = await loadContentQualityReport();
  const jsonPath = path.join(absoluteOutDir, 'content-quality-report.json');
  const csvPath = path.join(absoluteOutDir, 'content-quality-report.csv');

  await mkdir(absoluteOutDir, { recursive: true });
  await writeFile(csvPath, result.csv, 'utf8');
  await writeFile(
    jsonPath,
    `${JSON.stringify({
      generatedAt: result.generatedAt,
      summary: {
        warningCount: result.report.warningCount,
        quizGapCount: result.report.quizGapCount,
        lessonGapCount: result.report.lessonGapCount,
        warningsByCourse: result.report.warningsByCourse,
        missingSignals: result.report.missingSignals,
      },
      actionPlan: result.actionPlan,
      quizGaps: result.report.quizGaps,
      lessonGaps: result.report.lessonGaps,
    }, null, 2)}\n`,
    'utf8',
  );

  return {
    ...result,
    csvPath,
    jsonPath,
  };
}

export { loadContentQualityReport, parseArgs, writeReportFiles };

const isCliRun =
  process.argv[1] &&
  import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href;

if (isCliRun) {
  const options = parseArgs();
  const result = await writeReportFiles(options);

  console.log(`Content quality CSV: ${path.relative(process.cwd(), result.csvPath)}`);
  console.log(`Content quality JSON: ${path.relative(process.cwd(), result.jsonPath)}`);

  if (options.summary) {
    console.log(
      `Warnings: ${result.report.warningCount} ` +
      `(quiz ${result.report.quizGapCount}, lesson ${result.report.lessonGapCount})`,
    );
    const focus = result.actionPlan.sprintFocus[0];
    if (focus) {
      console.log(
        `Top sprint: ${focus.courseLabel} - ${focus.totalGaps} gaps, ` +
        `focus ${focus.topSignalLabel}`,
      );
    }
  }
}
