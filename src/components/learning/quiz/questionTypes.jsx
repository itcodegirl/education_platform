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

function getChoiceStateLabel({ isSelected, submitted, isCorrectChoice, isWrongSelected }) {
  const states = [];
  if (isSelected) states.push('selected');
  if (submitted && isCorrectChoice) states.push('correct answer');
  if (submitted && isWrongSelected) states.push('incorrect answer');
  return states.join(', ');
}

function getChoiceAriaLabel({ prefix, text, stateLabel }) {
  const label = prefix ? `${prefix}: ${text}` : text;
  return stateLabel ? `${label}, ${stateLabel}` : label;
}

function ChoiceRadioGroup({
  q,
  answer,
  onAnswer,
  submitted,
  prompt,
  code = null,
  renderOption,
}) {
  const isCorrect = isAnswerCorrect(q, answer);
  const groupName = `qq-${q.id || prompt.replace(/\W+/g, '-').toLowerCase()}`;
  const promptId = `${groupName}-prompt`;

  return (
    <>
      <p id={promptId} className="qq-text">{prompt}</p>
      {code && <pre className="qq-code"><code>{code}</code></pre>}
      <fieldset className="qq-opts" aria-describedby={promptId}>
        <legend className="sr-only">{prompt}</legend>
        {q.options.map((opt, oi) => {
          let cls = 'qq-opt';
          const isSelected = answer === oi;
          const isCorrectChoice = submitted && oi === q.correct;
          const isWrongSelected = submitted && isSelected && !isCorrect;
          if (isSelected) cls += ' picked';
          if (submitted && oi === q.correct) cls += ' is-correct';
          if (isWrongSelected) cls += ' is-wrong';
          if (submitted) cls += ' disabled';
          const stateLabel = getChoiceStateLabel({
            isSelected,
            submitted,
            isCorrectChoice,
            isWrongSelected,
          });
          return (
            <label
              key={oi}
              className={cls}
            >
              <input
                className="qq-radio-native"
                type="radio"
                name={groupName}
                value={oi}
                checked={isSelected}
                onChange={() => onAnswer(oi)}
                disabled={submitted}
                aria-label={getChoiceAriaLabel({
                  prefix: String.fromCharCode(65 + oi),
                  text: opt,
                  stateLabel,
                })}
              />
              <span className="qq-opt-letter">{String.fromCharCode(65 + oi)}</span>
              {renderOption(opt)}
            </label>
          );
        })}
      </fieldset>
    </>
  );
}

function MCQuestion({ q, answer, onAnswer, submitted }) {
  return (
    <ChoiceRadioGroup
      q={q}
      answer={answer}
      onAnswer={onAnswer}
      submitted={submitted}
      prompt={q.question}
      code={q.code}
      renderOption={(opt) => <span>{opt}</span>}
    />
  );
}

function CodeQuestion({ q, answer, onAnswer, submitted }) {
  return (
    <ChoiceRadioGroup
      q={q}
      answer={answer}
      onAnswer={onAnswer}
      submitted={submitted}
      prompt="What does this code output?"
      code={q.code}
      renderOption={(opt) => <code className="qq-opt-code">{opt}</code>}
    />
  );
}

function BugQuestion({ q, answer, onAnswer, submitted }) {
  const isCorrect = isAnswerCorrect(q, answer);
  const prompt = q.question || 'Which line has the bug?';
  const groupName = `qq-bug-${q.id || prompt.replace(/\W+/g, '-').toLowerCase()}`;
  const promptId = `${groupName}-prompt`;

  return (
    <>
      <p id={promptId} className="qq-text">{prompt}</p>
      <fieldset className="qq-bug-lines" aria-describedby={promptId}>
        <legend className="sr-only">{prompt}</legend>
        {q.lines.map((line, li) => {
          let cls = 'qq-bug-line';
          const isSelected = answer === li;
          const isCorrectChoice = submitted && li === q.correct;
          const isWrongSelected = submitted && isSelected && !isCorrect;
          if (isSelected) cls += ' picked';
          if (submitted && li === q.correct) cls += ' is-correct';
          if (isWrongSelected) cls += ' is-wrong';
          if (submitted) cls += ' disabled';
          const stateLabel = getChoiceStateLabel({
            isSelected,
            submitted,
            isCorrectChoice,
            isWrongSelected,
          });
          return (
            <label
              key={li}
              className={cls}
            >
              <input
                className="qq-radio-native"
                type="radio"
                name={groupName}
                value={li}
                checked={isSelected}
                onChange={() => onAnswer(li)}
                disabled={submitted}
                aria-label={getChoiceAriaLabel({
                  prefix: `Line ${li + 1}`,
                  text: line,
                  stateLabel,
                })}
              />
              <span className="qq-line-num">{li + 1}</span>
              <code>{line}</code>
            </label>
          );
        })}
      </fieldset>
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
