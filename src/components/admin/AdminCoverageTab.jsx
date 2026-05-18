import { useMemo, useState } from 'react';
import { getChallengesForCourse } from '../../data/challenges';
import { getQuizVariants } from '../../data';
import {
  REVIEW_STATUS,
  buildCurriculumCoverage,
  coverageToCsv,
  formatCoverageStatus,
  formatGapLabel,
} from '../../utils/curriculumCoverage';

const FILTERS = [
  { id: 'all', label: 'All content' },
  { id: REVIEW_STATUS.missingAssessment, label: 'Missing assessment' },
  { id: REVIEW_STATUS.needsReview, label: 'Needs review' },
  { id: REVIEW_STATUS.complete, label: 'Complete' },
];

export function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 100);
}

export function filterRows(rows, filter) {
  if (filter === 'all') return rows;
  return rows.filter((row) => row.status === filter);
}

function downloadCsv(matrix) {
  const blob = new Blob([coverageToCsv(matrix)], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `codeherway-curriculum-coverage-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function CoverageMetric({ label, value, detail, tone = '' }) {
  return (
    <div className={`admin-coverage-metric ${tone}`}>
      <div className="admin-coverage-metric-value">{value}</div>
      <div className="admin-coverage-metric-label">{label}</div>
      {detail && <div className="admin-coverage-metric-detail">{detail}</div>}
    </div>
  );
}

function StatusPill({ status }) {
  return (
    <span className={`admin-coverage-status ${status}`}>
      {formatCoverageStatus(status)}
    </span>
  );
}

function CountCell({ value, total, label }) {
  return (
    <span className="admin-coverage-count">
      <strong>{value}</strong>
      {typeof total === 'number' && <span>/{total}</span>}
      {label && <small>{label}</small>}
    </span>
  );
}

function GapList({ gaps }) {
  if (!gaps.length) {
    return <span className="admin-coverage-ok">Complete</span>;
  }

  return (
    <div className="admin-gap-list" aria-label="Coverage gaps">
      {gaps.map((gap) => (
        <span key={gap} className="admin-gap-chip">
          {formatGapLabel(gap)}
        </span>
      ))}
    </div>
  );
}

export function AdminCoverageTab({ courses }) {
  const [filter, setFilter] = useState('all');
  const matrix = useMemo(
    () => buildCurriculumCoverage(courses, { getQuizVariants, getChallengesForCourse }),
    [courses],
  );
  const filteredLessons = filterRows(matrix.lessonRows, filter);

  return (
    <>
      <div className="admin-coverage-toolbar">
        <div className="admin-coverage-filters" role="group" aria-label="Coverage review filters">
          {FILTERS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`admin-filter-btn ${filter === item.id ? 'active' : ''}`}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <div className="admin-coverage-actions">
          <button type="button" className="admin-action-btn" onClick={() => downloadCsv(matrix)}>
            Export CSV
          </button>
          <button type="button" className="admin-action-btn" onClick={() => window.print()}>
            Print / PDF
          </button>
        </div>
      </div>

      <div className="admin-coverage-summary" aria-label="Curriculum coverage summary">
        <CoverageMetric
          label="Lessons audited"
          value={matrix.totals.totalLessons}
          detail={`${matrix.totals.modules} modules across ${matrix.totals.courses} courses`}
        />
        <CoverageMetric
          label="Complete"
          value={matrix.totals.complete}
          detail={`${pct(matrix.totals.complete, matrix.totals.totalLessons)}% ready`}
          tone="complete"
        />
        <CoverageMetric
          label="Needs review"
          value={matrix.totals.needsReview}
          detail="Quality gaps, but assessment exists"
          tone="review"
        />
        <CoverageMetric
          label="Missing assessment"
          value={matrix.totals.missingAssessment}
          detail="No mapped quiz questions"
          tone="missing"
        />
      </div>

      <div className="admin-section">
        <h3 className="admin-section-title">Course Coverage Summary</h3>
        <div className="admin-table-wrap">
          <table className="admin-table admin-coverage-table">
            <thead>
              <tr>
                <th>Course</th>
                <th>Lessons</th>
                <th>Quiz coverage</th>
                <th>Projects</th>
                <th>Rubrics</th>
                <th>Objectives</th>
                <th>Review status</th>
              </tr>
            </thead>
            <tbody>
              {matrix.courseRows.map((course) => (
                <tr key={course.id}>
                  <td className="admin-coverage-title">
                    <span className="admin-coverage-course-icon" aria-hidden="true">{course.icon}</span>
                    {course.label}
                    <span className="admin-coverage-subtle">
                      {course.moduleCount} modules, {course.courseChallengeCount} code challenges
                    </span>
                  </td>
                  <td><CountCell value={course.lessonCount} /></td>
                  <td>
                    <CountCell value={course.lessonQuizCount} total={course.lessonCount} label={`${pct(course.lessonQuizCount, course.lessonCount)}%`} />
                  </td>
                  <td><CountCell value={course.projectCount} total={course.lessonCount} /></td>
                  <td><CountCell value={course.rubricCount} total={course.lessonCount} /></td>
                  <td><CountCell value={course.objectiveCount} total={course.lessonCount} /></td>
                  <td><StatusPill status={course.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section">
        <h3 className="admin-section-title">Module Coverage Matrix</h3>
        <div className="admin-table-wrap">
          <table className="admin-table admin-coverage-table">
            <thead>
              <tr>
                <th>Course / Module</th>
                <th>Lessons</th>
                <th>Lesson quizzes</th>
                <th>Module quiz</th>
                <th>Projects</th>
                <th>Rubrics</th>
                <th>Objectives</th>
                <th>Support</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {matrix.moduleRows.map((moduleRow) => (
                <tr key={moduleRow.id}>
                  <td className="admin-coverage-title">
                    {moduleRow.courseLabel}
                    <span className="admin-coverage-subtle">{moduleRow.moduleTitle}</span>
                  </td>
                  <td><CountCell value={moduleRow.lessonCount} /></td>
                  <td>
                    <CountCell value={moduleRow.lessonQuizCount} total={moduleRow.lessonCount} />
                  </td>
                  <td>
                    {moduleRow.moduleQuiz.hasQuiz
                      ? <CountCell value={moduleRow.moduleQuiz.questionCount} label="questions" />
                      : <span className="admin-coverage-muted">None</span>}
                  </td>
                  <td><CountCell value={moduleRow.projectCount} total={moduleRow.lessonCount} /></td>
                  <td><CountCell value={moduleRow.rubricCount} total={moduleRow.lessonCount} /></td>
                  <td><CountCell value={moduleRow.objectiveCount} total={moduleRow.lessonCount} /></td>
                  <td><CountCell value={moduleRow.supportCount} total={moduleRow.lessonCount} /></td>
                  <td><StatusPill status={moduleRow.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-section">
        <h3 className="admin-section-title">Lesson Coverage Matrix</h3>
        <p className="admin-coverage-note">
          Showing {filteredLessons.length} of {matrix.lessonRows.length} lessons for the selected review filter.
        </p>
        <div className="admin-table-wrap">
          <table className="admin-table admin-coverage-table admin-lesson-coverage-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>Course</th>
                <th>Module</th>
                <th>Lesson</th>
                <th>Quiz</th>
                <th>Project</th>
                <th>Rubric</th>
                <th>Objectives</th>
                <th>Practice</th>
                <th>Support/A11y</th>
                <th>Gaps</th>
              </tr>
            </thead>
            <tbody>
              {filteredLessons.map((row) => (
                <tr key={row.id}>
                  <td><StatusPill status={row.status} /></td>
                  <td>{row.courseLabel}</td>
                  <td className="admin-coverage-module">{row.moduleTitle}</td>
                  <td className="admin-coverage-lesson">
                    <span>{row.lessonTitle}</span>
                    <span className="admin-coverage-subtle">{row.lessonId}</span>
                  </td>
                  <td>
                    {row.quiz.hasQuiz
                      ? <CountCell value={row.quiz.questionCount} label={`${row.quiz.count} quiz${row.quiz.count === 1 ? '' : 'zes'}`} />
                      : <span className="admin-coverage-missing-text">Missing</span>}
                  </td>
                  <td>
                    {row.project.hasProject
                      ? <span className="admin-coverage-compact">{row.project.title}</span>
                      : <span className="admin-coverage-missing-text">Missing</span>}
                  </td>
                  <td>
                    {row.rubric.hasRubric
                      ? <CountCell value={row.rubric.criteriaCount} label="criteria" />
                      : <span className="admin-coverage-missing-text">Missing</span>}
                  </td>
                  <td>
                    {row.objectives.hasExplicitObjectives ? (
                      <CountCell value={row.objectives.explicitCount} label="explicit" />
                    ) : (
                      <span className="admin-coverage-missing-text">
                        {row.objectives.inferredCount > 0 ? `${row.objectives.inferredCount} inferred` : 'Missing'}
                      </span>
                    )}
                  </td>
                  <td><CountCell value={row.practice.count} /></td>
                  <td>
                    {row.support.hasSupportOrAccessibility ? (
                      <span className="admin-coverage-compact">
                        {row.support.hasAccessibilitySignal ? 'A11y' : 'Support'}
                      </span>
                    ) : (
                      <span className="admin-coverage-missing-text">Missing</span>
                    )}
                  </td>
                  <td><GapList gaps={row.gaps} /></td>
                </tr>
              ))}
              {filteredLessons.length === 0 && (
                <tr>
                  <td colSpan={11} className="admin-empty">No lessons match this review filter.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
