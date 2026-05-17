import { useEffect, useMemo, useState } from 'react';
import { COURSE_METADATA, loadCourse } from '../../data';
import { PROJECTS } from '../../data/reference/projects';
import {
  buildCurriculumCoverageCsv,
  buildCurriculumCoverageReport,
  getCurriculumCoverageStatusLabel,
} from '../../utils/curriculumCoverageReport';
import {
  buildContentQualityActionPlan,
  buildContentQualityCsv,
  buildContentQualityFixCsv,
  buildContentQualityReport,
  getContentQualitySignalLabel,
} from '../../utils/contentQualityReport';
import {
  buildContentQualitySnapshot,
  compareContentQualitySnapshots,
  saveContentQualitySnapshot,
} from '../../utils/contentQualitySnapshots';
import {
  buildQuizInventoryCsv,
  buildQuizInventoryReport,
  getQuizInventoryStatusLabel,
} from '../../utils/quizInventoryReport';

const MAX_ROWS = 16;
const DEFAULT_FILTERS = Object.freeze({
  courseId: 'all',
  type: 'all',
  signal: 'all',
  query: '',
});

export function AdminContentQualityTab() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    courseEntries: [],
  });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [snapshots, setSnapshots] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function loadReportData() {
      setState({ loading: true, error: '', courseEntries: [] });
      try {
        const courseEntries = await Promise.all(
          COURSE_METADATA.map(async (courseMeta) => ({
            courseMeta,
            data: await loadCourse(courseMeta.id),
          })),
        );
        if (!cancelled) {
          setState({ loading: false, error: '', courseEntries });
        }
      } catch (error) {
        if (!cancelled) {
          setState({
            loading: false,
            error: error?.message || 'Content quality report could not load.',
            courseEntries: [],
          });
        }
      }
    }

    loadReportData();
    return () => {
      cancelled = true;
    };
  }, []);

  const { report, quizInventory, curriculumCoverage } = useMemo(() => ({
    report: buildContentQualityReport(state.courseEntries),
    quizInventory: buildQuizInventoryReport(state.courseEntries),
    curriculumCoverage: buildCurriculumCoverageReport(state.courseEntries, { projectsByCourse: PROJECTS }),
  }), [state.courseEntries]);
  const actionPlan = useMemo(
    () => buildContentQualityActionPlan(report),
    [report],
  );
  const csvHref = useMemo(
    () => `data:text/csv;charset=utf-8,${encodeURIComponent(buildContentQualityCsv(report))}`,
    [report],
  );
  const currentSnapshot = useMemo(
    () => buildContentQualitySnapshot(report),
    [report],
  );
  const previousSnapshot = useMemo(
    () => snapshots.find((snapshot) => snapshot.signature !== currentSnapshot.signature) || null,
    [currentSnapshot.signature, snapshots],
  );
  const progress = useMemo(
    () => compareContentQualitySnapshots(currentSnapshot, previousSnapshot),
    [currentSnapshot, previousSnapshot],
  );
  const courseOptions = report.warningsByCourse;
  const signalOptions = report.missingSignals.map((entry) => ({
    value: entry.name,
    label: getContentQualitySignalLabel(entry.name),
  }));
  const allFixes = useMemo(
    () => actionPlan.allFixes || actionPlan.nextFixes || [],
    [actionPlan.allFixes, actionPlan.nextFixes],
  );
  const filteredFixes = useMemo(
    () => allFixes.filter((row) => matchesQualityFilters(row, filters)),
    [allFixes, filters],
  );
  const filteredQuizGaps = useMemo(
    () => report.quizGaps.filter((row) => matchesQualityFilters(row, filters, 'quiz')),
    [filters, report.quizGaps],
  );
  const filteredLessonGaps = useMemo(
    () => report.lessonGaps.filter((row) => matchesQualityFilters(row, filters, 'lesson')),
    [filters, report.lessonGaps],
  );
  const filteredFixCsvHref = useMemo(
    () => `data:text/csv;charset=utf-8,${encodeURIComponent(buildContentQualityFixCsv(filteredFixes))}`,
    [filteredFixes],
  );
  const quizInventoryCsvHref = useMemo(
    () => `data:text/csv;charset=utf-8,${encodeURIComponent(buildQuizInventoryCsv(quizInventory))}`,
    [quizInventory],
  );
  const curriculumCoverageCsvHref = useMemo(
    () => `data:text/csv;charset=utf-8,${encodeURIComponent(buildCurriculumCoverageCsv(curriculumCoverage))}`,
    [curriculumCoverage],
  );

  useEffect(() => {
    if (state.loading || state.error) return;
    setSnapshots(saveContentQualitySnapshot(report));
  }, [report, state.error, state.loading]);

  function updateFilter(name, value) {
    setFilters((current) => ({ ...current, [name]: value }));
  }

  if (state.loading) {
    return (
      <div className="admin-loading" role="status" aria-live="polite">
        Loading content quality report...
      </div>
    );
  }

  if (state.error) {
    return (
      <div className="admin-denied" role="alert" aria-live="assertive">
        <h2>Content report unavailable</h2>
        <p>{state.error}</p>
      </div>
    );
  }

  return (
    <>
      <section className="admin-section" aria-labelledby="content-quality-title">
        <div className="admin-quality-toolbar">
          <h3 id="content-quality-title" className="admin-section-title">
            Content Quality
          </h3>
          <a
            className="admin-export-link"
            href={csvHref}
            download="codeherway-content-quality-report.csv"
          >
            Export CSV
          </a>
        </div>
        <div className="admin-grid admin-quality-grid">
          <QualityMetric label="Report-only warnings" value={report.warningCount} />
          <QualityMetric label="Quiz rubric gaps" value={report.quizGapCount} />
          <QualityMetric label="Lesson rubric gaps" value={report.lessonGapCount} />
          <QualityMetric
            label="Top missing signal"
            value={report.missingSignals[0]?.name || 'Clear'}
          />
        </div>
      </section>

      <section className="admin-section" aria-labelledby="content-quality-courses-title">
        <h3 id="content-quality-courses-title" className="admin-section-title">
          Warnings by Course
        </h3>
        <div className="admin-quality-pills" aria-label="Content warnings by course">
          {report.warningsByCourse.map((entry) => (
            <span key={entry.name} className="admin-quality-pill">
              <strong>{entry.name.toUpperCase()}</strong>
              {entry.count}
            </span>
          ))}
        </div>
      </section>

      <section className="admin-section" aria-labelledby="content-quality-progress-title">
        <h3 id="content-quality-progress-title" className="admin-section-title">
          QA Progress
        </h3>
        <div className="admin-grid admin-quality-grid">
          <ProgressMetric
            label="Warnings since previous scan"
            value={currentSnapshot.warningCount}
            delta={progress.warningDelta}
            hasPrevious={progress.hasPrevious}
          />
          <ProgressMetric
            label="Quiz gaps"
            value={currentSnapshot.quizGapCount}
            delta={progress.quizGapDelta}
            hasPrevious={progress.hasPrevious}
          />
          <ProgressMetric
            label="Lesson gaps"
            value={currentSnapshot.lessonGapCount}
            delta={progress.lessonGapDelta}
            hasPrevious={progress.hasPrevious}
          />
        </div>
      </section>

      <QuizInventorySection report={quizInventory} csvHref={quizInventoryCsvHref} />

      <CurriculumCoverageSection
        report={curriculumCoverage}
        csvHref={curriculumCoverageCsvHref}
      />

      <section className="admin-section" aria-labelledby="content-quality-sprint-title">
        <h3 id="content-quality-sprint-title" className="admin-section-title">
          Suggested Next Sprint
        </h3>
        <div className="admin-quality-action-grid">
          {actionPlan.sprintFocus.map((item) => (
            <article key={item.courseId} className="admin-quality-action-card">
              <div className="admin-quality-action-head">
                <span className="admin-quality-action-course">{item.courseLabel}</span>
                <span className="admin-quality-action-count">{item.totalGaps} gaps</span>
              </div>
              <p className="admin-quality-action-focus">
                Focus: {item.topSignalLabel} ({item.topSignalCount})
              </p>
              <p className="admin-quality-action-detail">
                {item.lessonGaps} lesson gaps, {item.quizGaps} quiz gaps
              </p>
              <p className="admin-quality-action-step">{item.suggestedNextStep}</p>
            </article>
          ))}
          {actionPlan.sprintFocus.length === 0 && (
            <p className="admin-empty">No sprint actions needed from the current report.</p>
          )}
        </div>
      </section>

      <QualityFilters
        filters={filters}
        courseOptions={courseOptions}
        signalOptions={signalOptions}
        resultCount={filteredFixes.length}
        filteredFixCsvHref={filteredFixCsvHref}
        onChange={updateFilter}
        onClear={() => setFilters(DEFAULT_FILTERS)}
      />

      <ActionTable rows={filteredFixes.slice(0, MAX_ROWS)} totalCount={filteredFixes.length} />

      <GapTable
        title="Quiz Rubric Gaps"
        rows={filteredQuizGaps.slice(0, MAX_ROWS)}
        emptyText="Every quiz has misconception, reasoning, and application coverage."
        getName={(row) => `${row.courseLabel} - ${row.target}`}
      />

      <GapTable
        title="Lesson Rubric Gaps"
        rows={filteredLessonGaps.slice(0, MAX_ROWS)}
        emptyText="Every lesson has enough quality rubric coverage."
        getName={(row) => `${row.courseLabel} - ${row.lessonTitle}`}
      />
    </>
  );
}

function QuizInventorySection({ report, csvHref }) {
  const { totals } = report;

  return (
    <section className="admin-section" aria-labelledby="quiz-inventory-title">
      <div className="admin-quality-toolbar">
        <h3 id="quiz-inventory-title" className="admin-section-title">
          Quiz Inventory
        </h3>
        <a
          className="admin-export-link"
          href={csvHref}
          download="codeherway-quiz-inventory.csv"
        >
          Export inventory CSV
        </a>
      </div>
      <div className="admin-grid admin-quality-grid admin-quiz-inventory-grid">
        <QualityMetric label="Active lesson gaps" value={totals.activeExpectedLessonsWithNoQuiz} />
        <QualityMetric
          label="Classified legacy/future quizzes"
          value={`${totals.classifiedOrphanLessonQuizzes}/${totals.orphanLessonQuizzes}`}
        />
        <QualityMetric
          label="Locked bonus groups"
          value={`${totals.intentionalLessonVariantGroups}/${totals.lessonVariantGroups}`}
        />
        <QualityMetric label="Blocking inventory issues" value={totals.blockingIssueCount} />
      </div>
      {totals.classificationSummary.length > 0 && (
        <div className="admin-quality-pills admin-quiz-inventory-pills" aria-label="Quiz inventory classifications">
          {totals.classificationSummary.map((entry) => (
            <span key={entry.name} className="admin-quality-pill">
              <strong>{entry.label}</strong>
              {entry.count}
            </span>
          ))}
        </div>
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Quizzes</th>
              <th>Active gaps</th>
              <th>Classified inventory</th>
              <th>Bonus groups</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {report.courses.map((course) => (
              <tr key={course.courseId}>
                <td>
                  <span className="admin-quality-item">{course.courseLabel}</span>
                  <span className="admin-quality-path">
                    {course.lessonCount} lessons / {course.moduleCount} modules
                  </span>
                </td>
                <td>{course.quizCount}</td>
                <td>{course.lessonsWithNoQuiz.length}</td>
                <td>
                  {course.classifiedOrphanLessonQuizCount}/{course.orphanLessonQuizzes.length}
                  {course.unclassifiedOrphanLessonQuizCount > 0 && (
                    <span className="admin-review-count">
                      {course.unclassifiedOrphanLessonQuizCount} unclassified
                    </span>
                  )}
                </td>
                <td>
                  {course.intentionalLessonVariantGroups.length}/{course.lessonVariantGroups.length}
                  {course.suspiciousLessonVariantGroups.length > 0 && (
                    <span className="admin-review-count">
                      {course.suspiciousLessonVariantGroups.length} to review
                    </span>
                  )}
                </td>
                <td>
                  <span
                    className={`admin-quality-status ${course.blockingIssueCount === 0 ? 'good' : 'attention'}`}
                  >
                    {getQuizInventoryStatusLabel(course.blockingIssueCount)}
                  </span>
                </td>
              </tr>
            ))}
            {report.courses.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-empty">No quiz inventory data found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function CurriculumCoverageSection({ report, csvHref }) {
  const { totals } = report;
  const topGaps = report.gapRows.slice(0, 8);

  return (
    <section className="admin-section" aria-labelledby="curriculum-coverage-title">
      <div className="admin-quality-toolbar">
        <h3 id="curriculum-coverage-title" className="admin-section-title">
          Curriculum Coverage
        </h3>
        <a
          className="admin-export-link"
          href={csvHref}
          download="codeherway-curriculum-coverage-gaps.csv"
        >
          Export coverage CSV
        </a>
      </div>
      <div className="admin-grid admin-quality-grid">
        <QualityMetric
          label="Fully covered lessons"
          value={`${totals.readyLessonCount}/${totals.lessonCount}`}
        />
        <QualityMetric label="Coverage gaps" value={totals.coverageGapCount} />
        <QualityMetric
          label="Modules with project evidence"
          value={`${totals.modulesWithProjectEvidence}/${totals.moduleCount}`}
        />
        <QualityMetric label="Project ideas" value={totals.projectIdeaCount} />
      </div>
      {report.gapsByType.length > 0 && (
        <div className="admin-quality-pills" aria-label="Curriculum coverage gaps by type">
          {report.gapsByType.map((entry) => (
            <span key={entry.name} className="admin-quality-pill">
              <strong>{entry.label}</strong>
              {entry.count}
            </span>
          ))}
        </div>
      )}
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Course</th>
              <th>Fully covered</th>
              <th>Quiz</th>
              <th>Practice</th>
              <th>Project evidence</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {report.courses.map((course) => (
              <tr key={course.courseId}>
                <td>
                  <span className="admin-quality-item">{course.courseLabel}</span>
                  <span className="admin-quality-path">
                    {course.moduleCount} modules / {course.lessonCount} lessons
                  </span>
                </td>
                <td>{course.readyLessonCount}/{course.lessonCount}</td>
                <td>{course.quizCoveragePercent}%</td>
                <td>{course.practiceCoveragePercent}%</td>
                <td>{course.projectEvidenceCoveragePercent}%</td>
                <td>
                  <span
                    className={`admin-quality-status ${course.gapCount === 0 ? 'good' : 'attention'}`}
                  >
                    {getCurriculumCoverageStatusLabel(course.gapCount)}
                  </span>
                </td>
              </tr>
            ))}
            {report.courses.length === 0 && (
              <tr>
                <td colSpan={6} className="admin-empty">No curriculum coverage data found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {topGaps.length > 0 && (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Top coverage gap</th>
                <th>Missing</th>
                <th>Suggested fix</th>
              </tr>
            </thead>
            <tbody>
              {topGaps.map((row) => (
                <tr key={row.id}>
                  <td>
                    <span className="admin-quality-item">
                      {row.courseLabel} - {row.lessonTitle}
                    </span>
                    <span className="admin-quality-path">{row.path}</span>
                  </td>
                  <td>
                    {row.gapLabel}
                    {row.relatedSignals.length > 0 && (
                      <span className="admin-review-count">
                        {row.relatedSignals.join(', ')}
                      </span>
                    )}
                  </td>
                  <td>{row.suggestion}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function matchesQualityFilters(row, filters, fallbackType = '') {
  const rowType = row.type || fallbackType;
  if (filters.courseId !== 'all' && row.courseId !== filters.courseId) return false;
  if (filters.type !== 'all' && rowType !== filters.type) return false;
  if (filters.signal !== 'all' && !(row.missing || []).includes(filters.signal)) return false;

  const query = filters.query.trim().toLowerCase();
  if (!query) return true;

  return [
    row.label,
    row.path,
    row.courseLabel,
    row.moduleTitle,
    row.lessonTitle,
    row.target,
    row.suggestion,
    ...(row.missingLabels || []),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(query));
}

function QualityFilters({
  filters,
  courseOptions,
  signalOptions,
  resultCount,
  filteredFixCsvHref,
  onChange,
  onClear,
}) {
  return (
    <section className="admin-section" aria-labelledby="content-quality-filters-title">
      <div className="admin-quality-filter-head">
        <h3 id="content-quality-filters-title" className="admin-section-title">
          Report Filters
        </h3>
        <div className="admin-quality-filter-actions">
          <span className="admin-quality-filter-count">{resultCount} matching fixes</span>
          <a
            className="admin-export-link"
            href={filteredFixCsvHref}
            download="codeherway-filtered-content-fixes.csv"
          >
            Export filtered fixes
          </a>
        </div>
      </div>
      <div className="admin-quality-filters">
        <label className="admin-quality-filter">
          <span>Course</span>
          <select
            aria-label="Filter by course"
            value={filters.courseId}
            onChange={(event) => onChange('courseId', event.target.value)}
          >
            <option value="all">All courses</option>
            {courseOptions.map((course) => (
              <option key={course.name} value={course.name}>
                {course.name.toUpperCase()}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-quality-filter">
          <span>Type</span>
          <select
            aria-label="Filter by type"
            value={filters.type}
            onChange={(event) => onChange('type', event.target.value)}
          >
            <option value="all">All types</option>
            <option value="lesson">Lessons</option>
            <option value="quiz">Quizzes</option>
          </select>
        </label>
        <label className="admin-quality-filter">
          <span>Signal</span>
          <select
            aria-label="Filter by signal"
            value={filters.signal}
            onChange={(event) => onChange('signal', event.target.value)}
          >
            <option value="all">All signals</option>
            {signalOptions.map((signal) => (
              <option key={signal.value} value={signal.value}>
                {signal.label}
              </option>
            ))}
          </select>
        </label>
        <label className="admin-quality-filter admin-quality-filter-search">
          <span>Search</span>
          <input
            aria-label="Search quality fixes"
            type="search"
            value={filters.query}
            onChange={(event) => onChange('query', event.target.value)}
          />
        </label>
        <button type="button" className="admin-quality-filter-clear" onClick={onClear}>
          Clear
        </button>
      </div>
    </section>
  );
}

function ActionTable({ rows, totalCount }) {
  return (
    <section className="admin-section" aria-labelledby="highest-priority-fixes">
      <div className="admin-quality-filter-head">
        <h3 id="highest-priority-fixes" className="admin-section-title">
          Highest Priority Fixes
        </h3>
        {totalCount > rows.length && (
          <span className="admin-quality-filter-count">Showing {rows.length} of {totalCount}</span>
        )}
      </div>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Type</th>
              <th>Missing</th>
              <th>Suggested fix</th>
              <th>Starter template</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const template = row.fixTemplates?.[0];
              return (
                <tr key={`${row.type}:${row.path}`}>
                  <td>
                    <span className="admin-quality-item">{row.label}</span>
                    <span className="admin-quality-path">{row.path}</span>
                  </td>
                  <td>{row.type}</td>
                  <td>{row.missingLabels.join(', ')}</td>
                  <td>{row.suggestion}</td>
                  <td>
                    {template ? (
                      <span className="admin-quality-template">
                        <strong>{template.title}</strong>
                        {template.template}
                      </span>
                    ) : (
                      'Add one learner-facing evidence prompt.'
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="admin-empty">No priority fixes found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDelta(delta, hasPrevious) {
  if (!hasPrevious) return 'No previous scan';
  if (delta === 0) return 'No change';
  return delta > 0 ? `+${delta}` : String(delta);
}

function getDeltaClass(delta, hasPrevious) {
  if (!hasPrevious || delta === 0) return 'neutral';
  return delta < 0 ? 'good' : 'attention';
}

function ProgressMetric({ label, value, delta, hasPrevious }) {
  return (
    <div className="admin-quality-metric">
      <span className="admin-quality-value">{value}</span>
      <span className="admin-quality-label">{label}</span>
      <span className={`admin-quality-delta ${getDeltaClass(delta, hasPrevious)}`}>
        {formatDelta(delta, hasPrevious)}
      </span>
    </div>
  );
}

function QualityMetric({ label, value }) {
  return (
    <div className="admin-quality-metric">
      <span className="admin-quality-value">{value}</span>
      <span className="admin-quality-label">{label}</span>
    </div>
  );
}

function GapTable({ title, rows, emptyText, getName }) {
  return (
    <section className="admin-section" aria-labelledby={title.toLowerCase().replaceAll(' ', '-')}>
      <h3 id={title.toLowerCase().replaceAll(' ', '-')} className="admin-section-title">
        {title}
      </h3>
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Missing</th>
              <th>Suggested fix</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.path}>
                <td>
                  <span className="admin-quality-item">{getName(row)}</span>
                  <span className="admin-quality-path">{row.path}</span>
                </td>
                <td>{row.missingLabels.join(', ')}</td>
                <td>{row.suggestion}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={3} className="admin-empty">{emptyText}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
