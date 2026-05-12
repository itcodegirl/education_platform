import {
  getLessonEvidenceItems,
  getLessonEvidenceSummary,
  getLessonLearningContract,
} from '../../utils/lessonEvidence';

export function LessonEvidencePanel({
  lesson,
  isLessonDone,
  masteryStatus,
  syncStatus,
}) {
  const items = getLessonEvidenceItems({
    lesson,
    isLessonDone,
    masteryStatus,
    syncStatus,
  });
  const summary = getLessonEvidenceSummary({ isLessonDone, masteryStatus });
  const contract = getLessonLearningContract({ lesson });

  return (
    <section className="lesson-evidence-panel" aria-labelledby="lesson-evidence-title">
      <div className="lesson-evidence-head">
        <p className="lesson-evidence-kicker">Learning evidence</p>
        <h2 id="lesson-evidence-title" className="lesson-evidence-title">
          What counts as progress here
        </h2>
        <p className="lesson-evidence-summary">{summary}</p>
      </div>
      <dl className="lesson-contract-list" aria-label="Lesson learning contract">
        {contract.map((item) => (
          <div key={item.key} className="lesson-contract-item">
            <dt className="lesson-contract-label">{item.label}</dt>
            <dd className="lesson-contract-detail">{item.detail}</dd>
          </div>
        ))}
      </dl>
      <ol className="lesson-evidence-list">
        {items.map((item) => (
          <li
            key={item.key}
            className={`lesson-evidence-item lesson-evidence-item-${item.tone}`}
          >
            <span className="lesson-evidence-label">{item.label}</span>
            <strong className="lesson-evidence-state">{item.state}</strong>
            <span className="lesson-evidence-detail">{item.detail}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
