// ===============================================
// LESSON VIEW - Renders old + new lesson formats
// New format: concepts[], tasks[], devFession...
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
  const [checkedTasks, setCheckedTasks] = useState(new Set());
  const [showDevFession, setShowDevFession] = useState(false);
  const saveTimer = useRef(null);
  const bookmarked = isBookmarked(lessonKey);

  const isRichFormat = !!(lesson.concepts || lesson.tasks || lesson.devFession);
  const conceptCount = lesson.concepts?.length || 0;
  const taskCount = lesson.tasks?.length || 0;

  useEffect(() => {
    setNoteText(getNote(lessonKey));
    setShowNotes(false);
    setCheckedTasks(new Set());
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
      return next;
    });
  };

  return (
    <div className="lv">
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
          {isRichFormat && lesson.difficulty && (
            <div className="lv-meta">
              <span className={`lv-diff lv-diff-${lesson.difficulty}`}>
                {lesson.difficulty}
              </span>
              {lesson.duration && (
                <span className="lv-dur">⏱ {lesson.duration}</span>
              )}
              {conceptCount > 0 && (
                <span className="lv-chip">{conceptCount} concepts</span>
              )}
              {taskCount > 0 && (
                <span className="lv-chip">{taskCount} tasks</span>
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

      {showNotes && (
        <div className="notes-panel">
          <div className="notes-head">
            <span className="notes-icon">✎</span>
            <span>Your Notes</span>
            <span className="notes-saved" aria-live="polite">
              {noteText !== getNote(lessonKey)
                ? "Saving..."
                : noteText
                  ? "✓ Saved"
                  : ""}
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

      <CodePreview code={lesson.code} lang={lang} />

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

      {lesson.challenge && (
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
          >
            <span className="devfession-icon">🤫</span>
            <span>Dev_Fession</span>
            <span className="devfession-arrow">
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

      <LessonFeedback lessonKey={lessonKey} />
      <AITutor lesson={lesson} moduleTitle={moduleTitle} courseId={courseId} />
    </div>
  );
});
