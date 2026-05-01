// ═══════════════════════════════════════════════
// QUIZ QUESTION RENDERERS
//
// Extracted from QuizView so each type lives near
// its own logic, and the parent reduces to a small
// registry lookup instead of a JSX type-switch.
//
// Adding a new type = add a renderer + register it
// in QUESTION_RENDERERS at the bottom. The shape the
// renderer receives is always:
//
//   { q, answer, onAnswer(value), submitted }
//
// `q` is the question object from the quiz data.
// `answer` is whatever onAnswer last produced.
// `submitted` freezes the UI into the post-grade state.
// ═══════════════════════════════════════════════

// ─── Correctness check (also exported for the session hook) ──
export function isAnswerCorrect(q, answer) {
  if (answer === undefined || answer === null) return false;

  switch (q.type) {
    case 'mc':
    case 'code':
    case 'bug':
      return answer === q.correct;

    case 'fill': {
      if (!answer) return false;
      const student = answer.toString().trim().toLowerCase().replace(/['"`;{}()]/g, '');
      const accepts = Array.isArray(q.correct) ? q.correct : [q.correct];
      return accepts.some(a => student === a.toString().trim().toLowerCase().replace(/['"`;{}()]/g, ''));
    }

    case 'order':
      if (!Array.isArray(answer)) return false;
      return JSON.stringify(answer) === JSON.stringify(q.correct);

    default:
      return answer === q.correct;
  }
}

function MCQuestion({ q, answer, onAnswer, submitted }) {
  const isCorrect = isAnswerCorrect(q, answer);
  return (
    <>
      <p className="qq-text">{q.question}</p>
      {q.code && <pre className="qq-code"><code>{q.code}</code></pre>}
      <div className="qq-opts">
        {q.options.map((opt, oi) => {
          let cls = 'qq-opt';
          if (answer === oi) cls += ' picked';
          if (submitted && oi === q.correct) cls += ' is-correct';
          if (submitted && answer === oi && !isCorrect) cls += ' is-wrong';
          return (
            <button key={oi} type="button" className={cls} onClick={() => onAnswer(oi)} disabled={submitted}>
              <span className="qq-opt-letter">{String.fromCharCode(65 + oi)}</span>
              <span>{opt}</span>
            </button>
          );
        })}
      </div>
    </>
  );
}

function CodeQuestion({ q, answer, onAnswer, submitted }) {
  const isCorrect = isAnswerCorrect(q, answer);
  return (
    <>
      <p className="qq-text">What does this code output?</p>
      <pre className="qq-code"><code>{q.code}</code></pre>
      <div className="qq-opts">
        {q.options.map((opt, oi) => {
          let cls = 'qq-opt';
          if (answer === oi) cls += ' picked';
          if (submitted && oi === q.correct) cls += ' is-correct';
          if (submitted && answer === oi && !isCorrect) cls += ' is-wrong';
          return (
            <button key={oi} type="button" className={cls} onClick={() => onAnswer(oi)} disabled={submitted}>
              <span className="qq-opt-letter">{String.fromCharCode(65 + oi)}</span>
              <code className="qq-opt-code">{opt}</code>
            </button>
          );
        })}
      </div>
    </>
  );
}

function BugQuestion({ q, answer, onAnswer, submitted }) {
  const isCorrect = isAnswerCorrect(q, answer);
  return (
    <>
      <p className="qq-text">{q.question || 'Which line has the bug?'}</p>
      <div className="qq-bug-lines">
        {q.lines.map((line, li) => {
          let cls = 'qq-bug-line';
          if (answer === li) cls += ' picked';
          if (submitted && li === q.correct) cls += ' is-correct';
          if (submitted && answer === li && !isCorrect) cls += ' is-wrong';
          return (
            <button key={li} type="button" className={cls} onClick={() => onAnswer(li)} disabled={submitted}>
              <span className="qq-line-num">{li + 1}</span>
              <code>{line}</code>
            </button>
          );
        })}
      </div>
    </>
  );
}

function FillQuestion({ q, answer, onAnswer, submitted }) {
  const isCorrect = isAnswerCorrect(q, answer);
  const promptId = `qq-fill-prompt-${q.id}`;
  return (
    <>
      <p id={promptId} className="qq-text">{q.question}</p>
      {q.code && <pre className="qq-code"><code>{q.code}</code></pre>}
      <div className="qq-fill-wrap">
        <input
          className={`qq-fill-input ${submitted ? (isCorrect ? 'is-correct' : 'is-wrong') : ''}`}
          type="text"
          value={answer || ''}
          onChange={(e) => onAnswer(e.target.value)}
          disabled={submitted}
          placeholder="Type your answer..."
          autoComplete="off"
          spellCheck={false}
          aria-label={`Answer for: ${q.question}`}
          aria-describedby={promptId}
        />
        {submitted && !isCorrect && (
          <div className="qq-fill-answer">
            Answer: <code>{Array.isArray(q.correct) ? q.correct[0] : q.correct}</code>
          </div>
        )}
      </div>
    </>
  );
}

function OrderQuestion({ q, answer, onAnswer, submitted }) {
  const items = answer || q.items.map((_, i) => i);
  const isCorrect = isAnswerCorrect(q, answer);

  const moveUp = (idx) => {
    if (submitted || idx === 0) return;
    const next = [...items];
    [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
    onAnswer(next);
  };

  const moveDown = (idx) => {
    if (submitted || idx === items.length - 1) return;
    const next = [...items];
    [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
    onAnswer(next);
  };

  return (
    <>
      <p className="qq-text">{q.question || 'Put these in the correct order:'}</p>
      <div className="qq-order-list">
        {items.map((itemIdx, pos) => {
          let cls = 'qq-order-item';
          if (submitted) {
            cls += q.correct[pos] === itemIdx ? ' is-correct' : ' is-wrong';
          }
          return (
            <div key={itemIdx} className={cls}>
              <span className="qq-order-num">{pos + 1}</span>
              <span className="qq-order-text">{q.items[itemIdx]}</span>
              {!submitted && (
                <span className="qq-order-btns">
                  <button
                    type="button"
                    className="qq-order-btn"
                    onClick={() => moveUp(pos)}
                    disabled={pos === 0}
                    aria-label={`Move item ${pos + 1} up`}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="qq-order-btn"
                    onClick={() => moveDown(pos)}
                    disabled={pos === items.length - 1}
                    aria-label={`Move item ${pos + 1} down`}
                  >
                    ↓
                  </button>
                </span>
              )}
            </div>
          );
        })}
      </div>
      {submitted && !isCorrect && (
        <div className="qq-order-answer">
          Correct order: {q.correct.map(i => q.items[i]).join(' → ')}
        </div>
      )}
    </>
  );
}

// ─── Registry: question type → renderer ─────────
// Used in QuizView via QUESTION_RENDERERS[q.type] — the
// `mc` entry doubles as the default for older quiz items
// that omit `type` entirely.
export const QUESTION_RENDERERS = {
  mc: MCQuestion,
  code: CodeQuestion,
  bug: BugQuestion,
  fill: FillQuestion,
  order: OrderQuestion,
};

// ─── Type label badges (null = no badge) ────────
export const QUESTION_TYPE_LABELS = {
  mc: null,
  code: '💻 Output',
  bug: '🐛 Find the Bug',
  fill: '✏️ Fill In',
  order: '🔢 Order',
};
