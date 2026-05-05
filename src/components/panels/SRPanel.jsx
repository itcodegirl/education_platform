import { useRef, useState } from "react";
import { useSR } from "../../providers";
import { generatePracticeCard } from "../../services/practiceService";
import { useFocusTrap } from "../../hooks/useFocusTrap";

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

  useFocusTrap(modalRef, { enabled: isOpen, onEscape: onClose });

  const queue = Array.isArray(srCards) ? srCards : [];
  const due = typeof getDueSRCards === "function" ? getDueSRCards() || [] : [];
  const currentCard = due[currentIdx] || null;

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

    setTimeout(() => {
      setAnswered(null);
      setCurrentIdx((idx) => idx + 1);
    }, 1200);
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
        aria-label={`Review queue (${due.length} cards due)`}
        tabIndex={-1}
      >
        <div className="cheatsheet-head">
          <div className="panel-title-group">
            <p className="panel-kicker">Spaced repetition</p>
            <h2>🔄 Review ({due.length} due)</h2>
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
          <p className="panel-meta">
            Keep tough concepts warm with short review bursts and AI-generated
            practice cards.
          </p>

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
                type="text"
                className="sr-generate-concept"
                placeholder="e.g. flexbox gap vs margin, async/await errors, useEffect deps..."
                value={genConcept}
                onChange={(event) => setGenConcept(event.target.value)}
                disabled={genLoading}
                maxLength={200}
                aria-label="Concept to practice"
              />
              <button type="submit" className="sr-generate-btn" disabled={genLoading}>
                {genLoading ? "Generating…" : "Generate"}
              </button>
            </div>
            {genError && <div className="sr-generate-error">{genError}</div>}
            {genSuccess && <div className="sr-generate-success">{genSuccess}</div>}
          </form>

          {due.length === 0 ? (
            <div className="sr-empty">
              <span className="sr-empty-icon" aria-hidden="true">✓</span>
              <p><strong>All caught up.</strong></p>
              <p className="empty-state-msg">
                {queue.length > 0
                  ? `${queue.length} card${queue.length > 1 ? "s are" : " is"} scheduled for later.`
                  : "Complete quizzes or generate a fresh card to start building your review habit."}
              </p>
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

                <div className="sr-opts">
                  {(currentCard?.options || []).map((option, optionIndex) => {
                    let className = "sr-opt";

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
                      >
                        <span className="sr-letter">{String.fromCharCode(65 + optionIndex)}</span>
                        {option}
                      </button>
                    );
                  })}
                </div>

                {answered !== null && (
                  <div className={`sr-result ${answered === currentCard?.correct ? "right" : "wrong"}`}>
                    {answered === currentCard?.correct
                      ? "Correct. Strong recall."
                      : "Not quite. Review this explanation:"} {currentCard?.explanation}
                  </div>
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
