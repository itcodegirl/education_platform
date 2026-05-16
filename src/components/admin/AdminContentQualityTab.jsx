import { useEffect, useMemo, useState } from 'react';
import { COURSE_METADATA, loadCourse } from '../../data';
import {
  buildContentQualityCsv,
  buildContentQualityReport,
} from '../../utils/contentQualityReport';

const MAX_ROWS = 16;

export function AdminContentQualityTab() {
  const [state, setState] = useState({
    loading: true,
    error: '',
    courseEntries: [],
  });

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
  const csvHref = useMemo(
    () => `data:text/csv;charset=utf-8,${encodeURIComponent(buildContentQualityCsv(report))}`,
    [report],
  );

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

      <GapTable
        title="Quiz Rubric Gaps"
        rows={report.quizGaps.slice(0, MAX_ROWS)}
        emptyText="Every quiz has misconception, reasoning, and application coverage."
        getName={(row) => `${row.courseLabel} - ${row.target}`}
      />

      <GapTable
        title="Lesson Rubric Gaps"
        rows={report.lessonGaps.slice(0, MAX_ROWS)}
        emptyText="Every lesson has enough quality rubric coverage."
        getName={(row) => `${row.courseLabel} - ${row.lessonTitle}`}
      />
    </>
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
