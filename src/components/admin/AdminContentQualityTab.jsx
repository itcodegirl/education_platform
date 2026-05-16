import { useEffect, useMemo, useState } from 'react';
import { COURSE_METADATA, loadCourse } from '../../data';
import {
  buildContentQualityActionPlan,
  buildContentQualityCsv,
  buildContentQualityReport,
  getContentQualitySignalLabel,
} from '../../utils/contentQualityReport';
import {
  buildContentQualitySnapshot,
  compareContentQualitySnapshots,
  saveContentQualitySnapshot,
} from '../../utils/contentQualitySnapshots';

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

  const report = useMemo(
    () => buildContentQualityReport(state.courseEntries),
    [state.courseEntries],
  );
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
  onChange,
  onClear,
}) {
  return (
    <section className="admin-section" aria-labelledby="content-quality-filters-title">
      <div className="admin-quality-filter-head">
        <h3 id="content-quality-filters-title" className="admin-section-title">
          Report Filters
        </h3>
        <span className="admin-quality-filter-count">{resultCount} matching fixes</span>
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
