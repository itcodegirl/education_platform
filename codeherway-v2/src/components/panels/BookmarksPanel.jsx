// ═══════════════════════════════════════════════
// BOOKMARKS PANEL — Saved lessons
// ═══════════════════════════════════════════════

import { useProgress } from '../../providers';
import { COURSES } from '../../data';

export function BookmarksPanel({ isOpen, onClose, onNavigate }) {
  const { bookmarks, toggleBookmark } = useProgress();
  if (!isOpen) return null;

  const handleClick = (bk) => {
    // Find course/module/lesson indices
    const ci = COURSES.findIndex((c) => c.id === bk.course_id);
    if (ci === -1) return;
    const course = COURSES[ci];
    const mi = course.modules.findIndex((m) => m.title === bk.module_title);
    if (mi === -1) return;
    const li = course.modules[mi].lessons.findIndex((l) => l.title === bk.lesson_title);
    if (li === -1) return;
    onNavigate(ci, mi, li);
    onClose();
  };

  return (
    <div className="search-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="search-modal">
        <div className="cheatsheet-head">
          <h2>★ Bookmarks ({bookmarks.length})</h2>
          <button className="cheatsheet-close" onClick={onClose}>✕</button>
        </div>
        <div className="cheatsheet-body">
          {bookmarks.length === 0 ? (
            <div className="sr-empty">
              <span className="sr-empty-icon">☆</span>
              <p><strong>No bookmarks yet</strong></p>
              <p className="empty-state-msg">
                Click the ☆ icon on any lesson to save it here.
              </p>
            </div>
          ) : (
            bookmarks.map((bk) => (
              <div key={bk.id} className="bookmark-item" onClick={() => handleClick(bk)}>
                <div className="bk-info">
                  <div className="bk-title">{bk.lesson_title}</div>
                  <div className="bk-path">{bk.course_id.toUpperCase()} › {bk.module_title}</div>
                </div>
                <button
                  className="bk-remove"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark(bk.lesson_key, bk.course_id, bk.module_title, bk.lesson_title);
                  }}
                  title="Remove bookmark"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
