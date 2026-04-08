// ═══════════════════════════════════════════════
// LESSON VIEW — Renders old + new lesson formats
// New format: concepts[], tasks[], devFession, difficulty, duration
// ═══════════════════════════════════════════════

import { useState, useEffect, useRef, memo } from 'react';
import { renderMarkdown } from '../../utils/markdown';
import { CodePreview } from './CodePreview';
import { useProgress } from '../../providers';
import { AITutor } from './AITutor';

export const LessonView = memo(function LessonView({ lesson, emoji, lang, lessonKey, courseId, moduleTitle }) {
  const { toggleBookmark, isBookmarked, saveNote, getNote } = useProgress();
  const [noteText, setNoteText] = useState('');
  const [showNotes, setShowNotes] = useState(false);
  const [checkedTasks, setCheckedTasks] = useState(new Set());
  const [showDevFession, setShowDevFession] = useState(false);
  const saveTimer = useRef(null);
  const bookmarked = isBookmarked(lessonKey);

  const isRichFormat = !!(lesson.concepts || lesson.tasks || lesson.devFession);

  // Reset on lesson change
  useEffect(() => {
    setNoteText(getNote(lessonKey));
    setShowNotes(false);
    setCheckedTasks(new Set());
    setShowDevFession(false);
  }, [lessonKey, getNote]);

  const handleNoteChange = (e) => {
    const val = e.target.value;
    setNoteText(val);
    clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveNote(lessonKey, val);
    }, 800);
  };

  const toggleTask = (idx) => {
    setCheckedTasks((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  return (
    <div className="lv">
      <div className="lv-head">
        <span className="lv-emoji">{emoji}</span>
        <div className="lv-head-text">
          <h2 className="lv-title">{lesson.title}</h2>
          {isRichFormat && lesson.difficulty && (
            <div className="lv-meta">
              <span className={`lv-diff lv-diff-${lesson.difficulty}`}>{lesson.difficulty}</span>
              {lesson.duration && <span className="lv-dur">⏱ {lesson.duration}</span>}
            </div>
          )}
        </div>
        <div className="lv-actions">
          <button
            className={`lv-action-btn ${bookmarked ? 'active' : ''}`}
            onClick={() => toggleBookmark(lessonKey, courseId, moduleTitle, lesson.title)}
            title={bookmarked ? 'Remove bookmark' : 'Bookmark this lesson'}
          >
            {bookmarked ? '★' : '☆'}
          </button>
          <button
            className={`lv-action-btn ${showNotes ? 'active' : ''}`}
            onClick={() => setShowNotes(!showNotes)}
            title="Notes"
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
            <span className="notes-saved">{noteText !== getNote(lessonKey) ? 'Saving...' : noteText ? '✓ Saved' : ''}</span>
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

      {/* ─── Content + Concepts ─── */}
      <div className="lv-body">
        {lesson.content && renderMarkdown(lesson.content)}
        {isRichFormat && lesson.concepts && (
          <div className="concept-list">
            {lesson.concepts.map((c, i) => (
              <div key={i} className="concept-item">
                <span className="concept-bullet">→</span>
                <span>{c}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <CodePreview code={lesson.code} lang={lang} />

      {/* ─── Rich format: Output ─── */}
      {isRichFormat && lesson.output && (
        <div className="box output-box">
          <div className="box-label">▶ Output</div>
          <p>{lesson.output}</p>
        </div>
      )}

      {/* ─── Rich format: Tasks checklist ─── */}
      {isRichFormat && lesson.tasks && lesson.tasks.length > 0 && (
        <div className="box tasks-box">
          <div className="box-label">✅ Try It</div>
          <div className="tasks-list">
            {lesson.tasks.map((task, i) => (
              <label key={i} className={`task-item ${checkedTasks.has(i) ? 'done' : ''}`}>
                <input
                  type="checkbox"
                  checked={checkedTasks.has(i)}
                  onChange={() => toggleTask(i)}
                />
                <span className="task-check">{checkedTasks.has(i) ? '✓' : ''}</span>
                <span className="task-text">{task}</span>
              </label>
            ))}
          </div>
          <div className="tasks-progress">
            {checkedTasks.size}/{lesson.tasks.length} completed
          </div>
        </div>
      )}

      {/* ─── Tip (both formats) ─── */}
      {lesson.tip && (
        <div className="box tip">
          <div className="box-label">💡 Pro Tip</div>
          <p>{lesson.tip}</p>
        </div>
      )}

      {/* ─── Challenge ─── */}
      {lesson.challenge && (
        <div className="box chal">
          <div className="box-label">🔥 Challenge</div>
          <p>{lesson.challenge}</p>
        </div>
      )}

      {/* ─── DevFession ─── */}
      {isRichFormat && lesson.devFession && (
        <div className="devfession">
          <button
            className={`devfession-toggle ${showDevFession ? 'open' : ''}`}
            onClick={() => setShowDevFession(!showDevFession)}
          >
            <span className="devfession-icon">🤫</span>
            <span>Dev_Fession</span>
            <span className="devfession-arrow">{showDevFession ? '▾' : '▸'}</span>
          </button>
          {showDevFession && (
            <div className="devfession-content">
              <p>"{lesson.devFession}"</p>
            </div>
          )}
        </div>
      )}

      {/* ─── AI Tutor ─── */}
      <AITutor lesson={lesson} moduleTitle={moduleTitle} courseId={courseId} />
    </div>
  );
});
