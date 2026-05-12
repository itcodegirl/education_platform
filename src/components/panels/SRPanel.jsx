import { useRef, useState } from "react";
import { useSR } from "../../providers";
import { generatePracticeCard } from "../../services/practiceService";
import { useFocusTrap } from "../../hooks/useFocusTrap";
import { PROGRESS_SYNC_COPY } from "../../constants/progressCopy";
import { getReviewLoadSummary } from "../../utils/reviewLoad";

const TOPICS = [
  { id: "html", label: "HTML" },
  { id: "css", label: "CSS" },
  { id: "js", label: "JS" },
  { id: "react", label: "React" },
];

export function SRPanel({ isOpen, onClose }) {
  const { getDueSRCards, updateSRCard, addToSRQueue, srCards = [] } = useSR();
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answered, setAnswered] = useState(null);
  const [sessionRight, setSessionRight] = useState(0);
  const [sessionWrong, setSessionWrong] = useState(0);
  const [genTopic, setGenTopic] = useState("html");
  const [genConcept, setGenConcept] = useState("");
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState("");
  const [genSuccess, setGenSuccess] = useState("");
  const modalRef = useRef(null);

  useFocusTrap(modalRef, {
    enabled: isOpen,
    onEscape: onClose,
    initialFocus: 'first-tabbable',
  });

  const queue = Array.isArray(srCards) ? srCards : [];
  const due = typeof getDueSRCards === "function" ? getDueSRCards() || [] : [];
  const currentCard = due[currentIdx] || null;
  const reviewLoad = getReviewLoadSummary({
    dueCount: due.length,
    totalCount: queue.length,
  });

  const handleGenerate = async (event) => {
    event.preventDefault();
    if (genLoading) return;

    const concept = genConcept.trim();
    if (!concept) {
      setGenError("Enter a concept first so we can generate a focused practice card.");
      return;
    }

    setGenLoading(true);
    setGenError("");
    setGenSuccess("");

    try {
      const card = await generatePracticeCard({ topic: genTopic, concept });
      if (typeof addToSRQueue === "function") {
        await addToSRQueue([card]);
      }
      setGenSuccess("Practice card added. It is now ready in your review queue.");
      setGenConcept("");
    } catch (err) {
      setGenError(err.message || "Could not generate a card right now. Try a narrower concept.");
    } finally {
      setGenLoading(false);
    }
  };

  const handleAnswer = (optionIndex) => {
    if (answered !== null || !currentCard) return;

    setAnswered(optionIndex);

    const correct = optionIndex === currentCard.correct;
    updateSRCard(currentCard.question, correct);

    if (correct) setSessionRight((count) => count + 1);
    else setSessionWrong((count) => count + 1);
  };

  const handleNextCard = () => {
    setAnswered(null);
    setCurrentIdx((idx) => idx + 1);
  };

  const resetSession = () => {
    setCurrentIdx(0);
    setAnswered(null);
    setSessionRight(0);
    setSessionWrong(0);
  };

  if (!isOpen) return null;

  return (
    <div
      className="search-overlay"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        ref={modalRef}
        className="search-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sr-panel-title"
        aria-describedby="sr-panel-description sr-panel-sync"
        tabIndex={-1}
      >
        <div className="cheatsheet-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Spaced repetition</p>
            <h2 id="sr-panel-title">🔄 Review ({due.length} due)</h2>
          </div>
          <button
            type="button"
            className="cheatsheet-close"
            onClick={onClose}
            aria-label="Close review queue"
          >
            ×
          </button>
        </div>

        <div className="cheatsheet-body">
          <p id="sr-panel-description" className="panel-meta">
            Keep tough concepts warm with short review bursts and AI-generated
            practice cards.
          </p>
          <p id="sr-panel-sync" className="panel-meta">{PROGRESS_SYNC_COPY}</p>

          <div className={`sr-review-load sr-review-load-${reviewLoad.tone}`}>
            <div>
              <span className="sr-review-load-kicker">Review rhythm</span>
              <p className="sr-review-load-title">{reviewLoad.title}</p>
              <p className="sr-review-load-detail">{reviewLoad.detail}</p>
            </div>
            {reviewLoad.scheduledLater > 0 && (
              <span className="sr-review-load-pill">
                {reviewLoad.scheduledLater} later
              </span>
            )}
          </div>

          <form className="sr-generate" onSubmit={handleGenerate}>
            <div className="sr-generate-head">
              <span className="sr-generate-title">🤖 Generate a practice card</span>
              <span className="sr-generate-sub">
                Enter one concept to drill. The generated card appears in this
                queue immediately.
              </span>
            </div>
            <div className="sr-generate-row">
              <select
                className="sr-generate-topic"
                value={genTopic}
                onChange={(event) => setGenTopic(event.target.value)}
                disabled={genLoading}
                aria-label="Topic"
              >
                {TOPICS.map((topic) => (
                  <option key={topic.id} value={topic.id}>
                    {topic.label}
                  </option>
                ))}
              </select>
              <input
                id="sr-generate-concept"
                type="text"
                className="sr-generate-concept"
                placeholder="e.g. flexbox gap vs margin, async/await errors, useEffect deps..."
                value={genConcept}
                onChange={(event) => setGenConcept(event.target.value)}
                disabled={genLoading}
                maxLength={200}
                aria-label="Concept to practice"
                aria-invalid={Boolean(genError)}
                aria-describedby="sr-generate-help sr-generate-status"
              />
              <button type="submit" className="sr-generate-btn" disabled={genLoading}>
                {genLoading ? "Generating…" : "Generate"}
              </button>
            </div>
            <div id="sr-generate-help" className="sr-only">
              Enter one concept, then generate a focused practice card.
            </div>
            <div
              id="sr-generate-status"
              role={genError ? "alert" : "status"}
              aria-live={genError ? "assertive" : "polite"}
              aria-atomic="true"
            >
              {genError && <div className="sr-generate-error">{genError}</div>}
              {genSuccess && <div className="sr-generate-success">{genSuccess}</div>}
            </div>
          </form>

          {due.length === 0 ? (
            <div className="sr-empty">
              <span className="sr-empty-icon" aria-hidden="true">✓</span>
              <p><strong>All caught up.</strong></p>
              <p className="empty-state-msg">
                {queue.length > 0
                  ? `${queue.length} card${queue.length > 1 ? "s are" : " is"} scheduled for later. Nothing needs attention right now.`
                  : "No review cards are due yet. Complete quizzes or use the form above to create one focused card."}
              </p>
              <button type="button" className="empty-state-action" onClick={onClose}>
                Back to lesson
              </button>
            </div>
          ) : currentIdx >= due.length ? (
            <>
              <div className="sr-empty">
                <span className="sr-empty-icon" aria-hidden="true">✓</span>
                <p><strong>Session complete.</strong></p>
                <p className="empty-state-msg">
                  Nice work. You cleared today&apos;s due cards and can jump back in
                  for another round anytime.
                </p>
              </div>

              <div className="sr-score-bar">
                <span>Results:</span>
                <span className="sr-right-count">Correct {sessionRight}</span>
                <span className="sr-wrong-count">Wrong {sessionWrong}</span>
              </div>

              <button type="button" className="quiz-retry retry-btn-mt" onClick={resetSession}>
                Review Again
              </button>
            </>
          ) : (
            <>
              <div className="sr-card">
                <div className="sr-q">{currentCard?.question}</div>
                <div className="sr-from">{currentCard?.source}</div>
                {currentCard?.code && <code>{currentCard.code}</code>}

                <div className="sr-opts" role="group" aria-label="Answer choices">
                  {(currentCard?.options || []).map((option, optionIndex) => {
                    let className = "sr-opt";
                    const isSelected = answered === optionIndex;

                    if (answered !== null) {
                      if (optionIndex === currentCard?.correct) className += " correct";
                      if (optionIndex === answered && optionIndex !== currentCard?.correct) className += " wrong";
                    }

                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        className={className}
                        onClick={() => handleAnswer(optionIndex)}
                        disabled={answered !== null}
                        aria-pressed={isSelected}
                      >
                        <span className="sr-letter">{String.fromCharCode(65 + optionIndex)}</span>
                        {option}
                      </button>
                    );
                  })}
                </div>

                {answered !== null && (
                  <>
                    <div
                      className={`sr-result ${answered === currentCard?.correct ? "right" : "wrong"}`}
                      role="status"
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      {answered === currentCard?.correct
                        ? "Correct. Strong recall."
                        : "Not quite. Review this explanation:"} {currentCard?.explanation}
                    </div>
                    <button
                      type="button"
                      className="quiz-retry retry-btn-mt"
                      onClick={handleNextCard}
                    >
                      Next card
                    </button>
                  </>
                )}
              </div>

              <p className="sr-progress-label">
                Card {currentIdx + 1} of {due.length}
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
