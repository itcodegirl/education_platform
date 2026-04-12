// ===============================================
// LESSON VIEW - Renders three lesson formats:
//   1. Legacy markdown (lesson.content)
//   2. Rich format (concepts[], tasks[], devFession)
//   3. Structured format (hook/do/understand/build/
//      challenge/summary/bridge)
// ===============================================

import { useState, useEffect, useRef, memo } from "react";
import { renderMarkdown } from "../../utils/markdown";
import { CodePreview } from "./CodePreview";
import { useProgress } from "../../providers";
import { AITutor } from "./AITutor";
import { LessonFeedback } from "./LessonFeedback";

export const LessonView = memo(function LessonView({
  lesson,
  emoji,
  lang,
  lessonKey,
  courseId,
  moduleTitle,
}) {
  const { toggleBookmark, isBookmarked, saveNote, getNote } = useProgress();
  const [noteText, setNoteText] = useState("");
  const [showNotes, setShowNotes] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("chw-tasks") || "{}");
      return new Set(saved[lessonKey] || []);
    } catch { return new Set(); }
  });
  const [showDevFession, setShowDevFession] = useState(false);
  const saveTimer = useRef(null);
  const bookmarked = isBookmarked(lessonKey);

  const isStructured = !!(lesson.hook || lesson.do || lesson.understand);
  const isRichFormat = !isStructured && !!(lesson.concepts || lesson.tasks || lesson.devFession);

  // Derived counts for metadata
  const conceptCount = isStructured
    ? (lesson.understand?.concepts?.length || 0)
    : (lesson.concepts?.length || 0);
  const taskCount = isStructured
    ? (lesson.challenge?.requirements?.length || 0)
    : (lesson.tasks?.length || 0);
  const difficulty = lesson.difficulty || lesson.metadata?.difficulty;
  const duration = lesson.duration || (lesson.metadata?.estimatedTime ? `${lesson.metadata.estimatedTime} min` : '');

  // Code for CodePreview — pick from the right place
  const codeForPreview = lesson.code || lesson.do?.code || '';
  const scaffolding = lesson.scaffolding
    || (lesson.challenge?.starterCode ? 'starter' : undefined);

  useEffect(() => {
    setNoteText(getNote(lessonKey));
    setShowNotes(false);
    // Restore persisted task state for this lesson
    try {
      const saved = JSON.parse(localStorage.getItem("chw-tasks") || "{}");
      setCheckedTasks(new Set(saved[lessonKey] || []));
    } catch { setCheckedTasks(new Set()); }
    setShowDevFession(false);
  }, [lessonKey, getNote]);

  const handleNoteChange = (event) => {
    const value = event.target.value;
    setNoteText(value);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveNote(lessonKey, value);
    }, 800);
  };

  const toggleTask = (index) => {
    setCheckedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      // Persist to localStorage
      try {
        const all = JSON.parse(localStorage.getItem("chw-tasks") || "{}");
        all[lessonKey] = [...next];
        localStorage.setItem("chw-tasks", JSON.stringify(all));
      } catch { /* silent */ }
      return next;
    });
  };

  // ─── Shared header + notes + footer ────────
  return (
    <div className="lv">
      {/* ─── Header ─── */}
      <div className="lv-head">
        <span className="lv-emoji">{emoji}</span>
        <div className="lv-head-text">
          {moduleTitle && (
            <div className="lv-kicker">
              <span className="lv-kicker-label">Module</span>
              <span className="lv-kicker-value">{moduleTitle}</span>
            </div>
          )}
          <h2 className="lv-title">{lesson.title}</h2>
          {difficulty && (
            <div className="lv-meta">
              <span className={`lv-diff lv-diff-${difficulty}`}>
                {difficulty}
              </span>
              {duration && <span className="lv-dur">⏱ {duration}</span>}
              {conceptCount > 0 && <span className="lv-chip">{conceptCount} concepts</span>}
              {taskCount > 0 && <span className="lv-chip">{taskCount} tasks</span>}
              {scaffolding && scaffolding !== 'full' && (
                <span className={`lv-scaffolding lv-scaffolding-${scaffolding}`}>
                  {scaffolding === 'partial' && '🔧 Partial template'}
                  {scaffolding === 'starter' && '🚀 Starter code'}
                  {scaffolding === 'requirements' && '📋 Write from scratch'}
                </span>
              )}
            </div>
          )}
        </div>

        <div className="lv-actions">
          <button
            type="button"
            className={`lv-action-btn ${bookmarked ? "active" : ""}`}
            onClick={() => toggleBookmark(lessonKey, courseId, lesson.title)}
            title={bookmarked ? "Remove bookmark" : "Bookmark this lesson"}
            aria-pressed={bookmarked}
            aria-label={bookmarked ? "Remove bookmark" : "Bookmark this lesson"}
            data-label={bookmarked ? "Saved" : "Save"}
          >
            {bookmarked ? "★" : "☆"}
          </button>
          <button
            type="button"
            className={`lv-action-btn ${showNotes ? "active" : ""}`}
            onClick={() => setShowNotes(!showNotes)}
            title="Notes"
            aria-expanded={showNotes}
            aria-label="Toggle lesson notes"
            data-label="Notes"
          >
            ✎
          </button>
        </div>
      </div>

      {/* ─── Notes panel ─── */}
      {showNotes && (
        <div className="notes-panel">
          <div className="notes-head">
            <span className="notes-icon">✎</span>
            <span>Your Notes</span>
            <span className="notes-saved" aria-live="polite">
              {noteText !== getNote(lessonKey) ? "Saving..." : noteText ? "✓ Saved" : ""}
            </span>
          </div>
          <textarea
            className="notes-input"
            value={noteText}
            onChange={handleNoteChange}
            placeholder="Type your notes for this lesson..."
            rows={4}
          />
        </div>
      )}

      {/* ═══ STRUCTURED FORMAT ═══ */}
      {isStructured && (
        <div className="lv-body">
          {/* Hook — what you'll accomplish */}
          {lesson.hook?.accomplishments && (
            <div className="box sl-hook">
              <div className="box-label">🎯 In this lesson you will</div>
              <ul className="sl-hook-list">
                {lesson.hook.accomplishments.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Do — step-by-step instructions */}
          {lesson.do && (
            <>
              {lesson.do.title && (
                <h3 className="sl-section-title">🛠️ {lesson.do.title}</h3>
              )}
              {lesson.do.steps && (
                <ol className="sl-steps">
                  {lesson.do.steps.map((step, i) => (
                    <li key={i} className="sl-step">
                      <span className="sl-step-num">{i + 1}</span>
                      <span>{step}</span>
                    </li>
                  ))}
                </ol>
              )}
            </>
          )}

          {/* Code preview */}
          {codeForPreview && (
            <CodePreview code={codeForPreview} lang={lang} scaffolding={scaffolding} />
          )}

          {/* Do — result + proof */}
          {lesson.do?.result && (
            <div className="box output-box">
              <div className="box-label">▶ Result</div>
              <p>{lesson.do.result}</p>
            </div>
          )}
          {lesson.do?.proofRequired && (
            <div className="sl-proof">
              <span className="sl-proof-icon">📸</span>
              <span><strong>Show your work:</strong> {lesson.do.proofRequired}</span>
            </div>
          )}

          {/* Understand — concepts with definitions + analogies */}
          {lesson.understand?.concepts && (
            <>
              <h3 className="sl-section-title">💡 Understand</h3>
              <div className="sl-concepts">
                {lesson.understand.concepts.map((c, i) => (
                  <div key={i} className="sl-concept-card">
                    <div className="sl-concept-name">{c.name}</div>
                    <p className="sl-concept-def">{c.definition}</p>
                    {c.analogy && (
                      <div className="sl-concept-analogy">
                        <span className="sl-analogy-icon">🔗</span>
                        <span><strong>Think of it like:</strong> {c.analogy}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {lesson.understand.keyTakeaway && (
                <div className="box tip">
                  <div className="box-label">🔑 Key Takeaway</div>
                  <p>{lesson.understand.keyTakeaway}</p>
                </div>
              )}
            </>
          )}

          {/* Build — extend the code */}
          {lesson.build && (
            <>
              <h3 className="sl-section-title">🔨 Build on it</h3>
              {lesson.build.goal && <p className="lp">{lesson.build.goal}</p>}
              {lesson.build.codeComparison && (
                <div className="sl-comparison">
                  <div className="sl-comparison-pane">
                    <div className="sl-comparison-label">Before</div>
                    <pre className="sl-comparison-code">{lesson.build.codeComparison.old}</pre>
                  </div>
                  <div className="sl-comparison-pane sl-comparison-new">
                    <div className="sl-comparison-label">After</div>
                    <pre className="sl-comparison-code">{lesson.build.codeComparison.new}</pre>
                  </div>
                </div>
              )}
              {lesson.build.hint && (
                <div className="box tip">
                  <div className="box-label">💡 Hint</div>
                  <p>{lesson.build.hint}</p>
                </div>
              )}
            </>
          )}

          {/* Challenge */}
          {lesson.challenge && typeof lesson.challenge === 'object' && lesson.challenge.mission && (
            <>
              <h3 className="sl-section-title">🔥 Challenge: {lesson.challenge.title}</h3>
              <p className="lp">{lesson.challenge.mission}</p>
              {lesson.challenge.requirements && (
                <div className="box tasks-box">
                  <div className="box-label">✅ Requirements</div>
                  <div className="tasks-list">
                    {lesson.challenge.requirements.map((req, i) => (
                      <label
                        key={i}
                        className={`task-item ${checkedTasks.has(`ch-${i}`) ? "done" : ""}`}
                      >
                        <input
                          type="checkbox"
                          checked={checkedTasks.has(`ch-${i}`)}
                          onChange={() => toggleTask(`ch-${i}`)}
                          aria-label={req}
                        />
                        <span className="task-check">
                          {checkedTasks.has(`ch-${i}`) ? "✓" : ""}
                        </span>
                        <span className="task-text">{req}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {lesson.challenge.starterCode && (
                <CodePreview
                  code={lesson.challenge.starterCode}
                  lang={lang}
                  scaffolding="starter"
                />
              )}
              {lesson.challenge.bonusChallenge && (
                <div className="box chal">
                  <div className="box-label">⭐ Bonus</div>
                  <p>{lesson.challenge.bonusChallenge}</p>
                </div>
              )}
            </>
          )}

          {/* Summary — what you can now do */}
          {lesson.summary?.capabilities && (
            <div className="sl-summary">
              <div className="sl-summary-title">🏁 You can now</div>
              <ul className="sl-summary-list">
                {lesson.summary.capabilities.map((cap, i) => (
                  <li key={i}>
                    <span className="sl-summary-check">✓</span>
                    <span>{cap}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Bridge — teaser for next lesson */}
          {lesson.bridge?.preview && (
            <div className="sl-bridge">
              <div className="sl-bridge-label">Coming up next</div>
              <p>{lesson.bridge.preview}</p>
            </div>
          )}
        </div>
      )}

      {/* ═══ RICH FORMAT (existing) ═══ */}
      {!isStructured && (
        <>
          <div className="lv-body">
            {lesson.content && renderMarkdown(lesson.content)}
            {isRichFormat && lesson.concepts && (
              <div className="concept-list">
                {lesson.concepts.map((concept, index) => (
                  <div key={index} className="concept-item">
                    <span className="concept-bullet">→</span>
                    <span>{concept}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {codeForPreview && (
            <CodePreview code={codeForPreview} lang={lang} scaffolding={scaffolding} />
          )}

          {isRichFormat && lesson.output && (
            <div className="box output-box">
              <div className="box-label">▶ Output</div>
              <p>{lesson.output}</p>
            </div>
          )}

          {isRichFormat && lesson.tasks && lesson.tasks.length > 0 && (
            <div className="box tasks-box">
              <div className="box-label">✅ Try It</div>
              <div className="tasks-list">
                {lesson.tasks.map((task, index) => (
                  <label
                    key={index}
                    className={`task-item ${checkedTasks.has(index) ? "done" : ""}`}
                  >
                    <input
                      type="checkbox"
                      checked={checkedTasks.has(index)}
                      onChange={() => toggleTask(index)}
                      aria-label={task}
                    />
                    <span className="task-check">
                      {checkedTasks.has(index) ? "✓" : ""}
                    </span>
                    <span className="task-text">{task}</span>
                  </label>
                ))}
              </div>
              <div className="tasks-progress">
                {checkedTasks.size}/{lesson.tasks.length} completed
              </div>
            </div>
          )}

          {lesson.tip && (
            <div className="box tip">
              <div className="box-label">💡 Pro Tip</div>
              <p>{lesson.tip}</p>
            </div>
          )}

          {lesson.challenge && typeof lesson.challenge === 'string' && (
            <div className="box chal">
              <div className="box-label">🔥 Challenge</div>
              <p>{lesson.challenge}</p>
            </div>
          )}

          {isRichFormat && lesson.devFession && (
            <div className="devfession">
              <button
                type="button"
                className={`devfession-toggle ${showDevFession ? "open" : ""}`}
                onClick={() => setShowDevFession(!showDevFession)}
                aria-expanded={showDevFession}
                aria-label="Toggle Dev_Fession — a real developer confession"
              >
                <span className="devfession-icon" aria-hidden="true">🤫</span>
                <span>Dev_Fession</span>
                <span className="devfession-arrow" aria-hidden="true">
                  {showDevFession ? "▾" : "▸"}
                </span>
              </button>
              {showDevFession && (
                <div className="devfession-content">
                  <p>"{lesson.devFession}"</p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      <LessonFeedback lessonKey={lessonKey} />
      <AITutor lesson={lesson} moduleTitle={moduleTitle} courseId={courseId} />
    </div>
  );
});
